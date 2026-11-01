// Transcript tap for the Stream extension.
// Runs at document_start (MAIN world) and taps the mgw WebSocket, which
// streams the conversation transcript as conversation.history.item events
// whenever the app attaches to a chat. Items are cached per chat id so the
// prompt list can show the full conversation without scrolling.
//
// WS item shape (observed 2026-10):
// { session_id: "<chatId>", event: { type: "conversation.history.item",
//   load_id: "<loadUuid>:<seq>", item: { id, type: "message", role,
//   content: [{ type, text }], status, x_grok: { input_chunks: [...] } } } }
// User message text lives in x_grok.input_chunks[].text.text; assistant text
// lives in content[].text.

(function () {
	'use strict';

	if (window.__streamTranscriptTap) return;
	window.__streamTranscriptTap = true;

	const CACHE_KEY = 'stream.transcripts';
	const DEBUG_KEY = 'stream.tapdebug';
	const MAX_CHATS = 5;
	const MAX_CHAT_BYTES = 400000;

	// Diagnostics persisted for remote debugging via localStorage.
	const debug = { installedAt: Date.now(), sockets: 0, framesMatched: 0, itemsRecorded: 0, blobFrames: 0, errors: [] };

	/**
	 * Persists tap diagnostics.
	 */
	function saveDebug() {
		try {
			localStorage.setItem(DEBUG_KEY, JSON.stringify(debug));
		} catch (e) {}
	}

	/**
	 * Records a tap error without throwing.
	 * @param {string} message - Error description.
	 */
	function debugError(message) {
		if (debug.errors.length < 10) debug.errors.push(message);
		saveDebug();
	}

	// chatId -> { order: [itemId], byId: { [itemId]: { id, role, text, seq } } }
	const sessions = new Map();

	/**
	 * Extracts the visible text of a transcript item across the observed
	 * content layouts (user input_chunks vs plain content text).
	 * @param {Object} item - Raw transcript item.
	 * @returns {string} The message text ('' when none found).
	 */
	function extractText(item) {
		const parts = [];
		(item.content || []).forEach((c) => {
			if (c && typeof c.text === 'string') parts.push(c.text);
		});
		let text = parts.join('\n').trim();
		if (!text && item.x_grok && Array.isArray(item.x_grok.input_chunks)) {
			const chunks = [];
			item.x_grok.input_chunks.forEach((chunk) => {
				const t = chunk && chunk.text && chunk.text.text;
				if (typeof t === 'string') chunks.push(t);
			});
			text = chunks.join('\n').trim();
		}
		return text;
	}

	/**
	 * Loads the persisted transcript cache into memory.
	 * @returns {Object} Persisted cache map { [chatId]: { order, byId, updated } }.
	 */
	function loadPersisted() {
		try {
			const raw = localStorage.getItem(CACHE_KEY);
			const parsed = raw ? JSON.parse(raw) : {};
			Object.keys(parsed).forEach((chatId) => {
				const entry = parsed[chatId];
				if (entry && Array.isArray(entry.order)) {
					sessions.set(chatId, { order: entry.order.slice(), byId: entry.byId || {}, updated: entry.updated || 0 });
				}
			});
		} catch (e) {}
	}

	/**
	 * Persists the most recent chats, bounded in count and size.
	 */
	function persist() {
		try {
			const sorted = Array.from(sessions.entries())
				.sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0))
				.slice(0, MAX_CHATS);
			const out = {};
			sorted.forEach(([chatId, entry]) => {
				let items = entry.order.map((id) => entry.byId[id]).filter(Boolean);
				let serializedItems = [];
				let size = 0;
				// Keep the newest items when a transcript exceeds the size budget.
				for (let i = items.length - 1; i >= 0; i--) {
					const blob = JSON.stringify(items[i]);
					if (size + blob.length > MAX_CHAT_BYTES) break;
					size += blob.length;
					serializedItems.unshift(items[i]);
				}
				out[chatId] = { order: serializedItems.map((i) => i.id), byId: Object.fromEntries(serializedItems.map((i) => [i.id, i])), updated: entry.updated || 0 };
			});
			localStorage.setItem(CACHE_KEY, JSON.stringify(out));
		} catch (e) {}
	}

	/**
	 * Records one transcript item for a chat, deduplicated by item id and
	 * ordered by the load sequence suffix.
	 * @param {string} chatId - The conversation id.
	 * @param {Object} event - The parsed WS event (conversation.history.item).
	 */
	function recordItem(chatId, event) {
		if (!chatId || !event || !event.item) return;
		const item = event.item;
		if (item.type !== 'message') return;
		const seq = Number(String(event.load_id || '').split(':').pop()) || 0;
		let session = sessions.get(chatId);
		if (!session) {
			session = { order: [], byId: {}, updated: 0 };
			sessions.set(chatId, session);
		}
		if (session.byId[item.id] && session.byId[item.id].seq >= seq) return;
		session.byId[item.id] = { id: item.id, role: item.role, text: extractText(item), seq };
		if (!session.order.includes(item.id)) session.order.push(item.id);
		session.order.sort((a, b) => (session.byId[a].seq || 0) - (session.byId[b].seq || 0));
		session.updated = Date.now();
		debug.itemsRecorded++;
		saveDebug();
		persist();
	}

	/**
	 * Handles one mgw WebSocket text frame.
	 * @param {string} data - Raw frame text.
	 */
	function handleFrame(data) {
		if (data.indexOf('conversation.history.item') === -1 && data.indexOf('conversation.attached') === -1) return;
		debug.framesMatched++;
		let parsed;
		try {
			parsed = JSON.parse(data);
		} catch (e) {
			debugError('json:' + e.message);
			return;
		}
		const event = parsed && parsed.event;
		if (!event) return;
		if (event.type === 'conversation.history.item') {
			recordItem(parsed.session_id, event);
		}
	}

	// Tap WebSocket connections to the realtime gateway.
	const OrigWS = window.WebSocket;
	function PatchedWS(url, protocols) {
		const ws = protocols !== undefined ? new OrigWS(url, protocols) : new OrigWS(url);
		if (/ws\/mgw/.test(String(url))) {
			debug.sockets++;
			saveDebug();
			ws.addEventListener('message', (ev) => {
				try {
					if (typeof ev.data === 'string') {
						handleFrame(ev.data);
					} else if (window.Blob && ev.data instanceof Blob) {
						debug.blobFrames++;
						ev.data.text().then(handleFrame).catch(() => {});
					} else if (ev.data instanceof ArrayBuffer) {
						handleFrame(new TextDecoder().decode(ev.data));
					}
				} catch (e) {
					debugError('frame:' + e.message);
				}
			});
		}
		return ws;
	}
	PatchedWS.prototype = OrigWS.prototype;
	PatchedWS.CONNECTING = OrigWS.CONNECTING;
	PatchedWS.OPEN = OrigWS.OPEN;
	PatchedWS.CLOSING = OrigWS.CLOSING;
	PatchedWS.CLOSED = OrigWS.CLOSED;
	window.WebSocket = PatchedWS;

	/**
	 * Returns the cached user-message items for a chat, oldest first.
	 * @param {string} chatId - The conversation id.
	 * @returns {Array<{id: string, role: string, text: string, seq: number}>} Items.
	 */
	function getCachedItems(chatId) {
		if (!chatId) return [];
		const session = sessions.get(chatId);
		if (!session) return [];
		return session.order.map((id) => session.byId[id]).filter(Boolean).filter((i) => i.role === 'user');
	}

	loadPersisted();
	saveDebug();
	window.__streamTranscriptTap = { getCachedItems };
})();
