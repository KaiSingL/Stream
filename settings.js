// Shared settings bridge for Stream extension MAIN-world scripts.
// The extension popup writes toggles to chrome.storage.local; settings-relay.js
// (isolated world) mirrors them into localStorage and dispatches a
// StreamSettingsChanged event. This module exposes the latest snapshot to any
// MAIN-world feature module (buttons.js, chart-renderer.js).
//
// Cross-world note: CustomEvents dispatched from the isolated world are not
// reliably delivered to MAIN-world window listeners, so the authoritative
// update path is a lightweight localStorage poll; the event is still listened
// for as a fast path when it does arrive.

(function () {
	'use strict';

	// Prevent duplicate execution on re-injection (SPA / dynamic pages)
	if (window.__streamSettings) return;

	const STORAGE_KEY = 'stream.settings';
	const EVENT_NAME = 'StreamSettingsChanged';
	const POLL_INTERVAL_MS = 400;

	// All features default to enabled; unknown keys are ignored by consumers.
	const DEFAULTS = { promptList: true, collapse: true, chartjs: true };

	/**
	 * Reads the current settings snapshot from localStorage.
	 * @returns {Object} Settings object merged over the defaults.
	 */
	function read() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			const parsed = raw ? JSON.parse(raw) : {};
			return Object.assign({}, DEFAULTS, parsed);
		} catch (e) {
			return Object.assign({}, DEFAULTS);
		}
	}

	const callbacks = [];
	let lastSnapshot = null;

	/**
	 * Notifies all registered callbacks when the settings snapshot changed.
	 */
	function notifyIfChanged() {
		const settings = read();
		const serialized = JSON.stringify(settings);
		if (serialized === lastSnapshot) return;
		// First observation only establishes the baseline; consumers have
		// already applied their initial state via get().
		const isBaseline = lastSnapshot === null;
		lastSnapshot = serialized;
		if (isBaseline) return;
		callbacks.forEach((callback) => {
			try {
				callback(settings);
			} catch (e) {
				// One broken consumer must not block the others.
			}
		});
	}

	/**
	 * Registers a callback fired whenever the popup changes settings.
	 * @param {Function} callback - Called with the fresh settings snapshot.
	 */
	function listen(callback) {
		callbacks.push(callback);
		window.addEventListener(EVENT_NAME, () => {
			const settings = read();
			lastSnapshot = JSON.stringify(settings);
			try {
				callback(settings);
			} catch (e) {
				// Ignore consumer errors on the fast path.
			}
		});
	}

	setInterval(notifyIfChanged, POLL_INTERVAL_MS);

	window.__streamSettings = { get: read, listen };
})();
