// Settings relay for the Stream extension.
// Runs in the isolated world (default) where chrome.storage is available, and
// mirrors popup-managed settings into the page for MAIN-world scripts
// (settings.js): localStorage for initial reads, CustomEvent for live updates.

(function () {
	'use strict';

	const STORAGE_KEY = 'stream.settings';
	const EVENT_NAME = 'StreamSettingsChanged';
	const DEFAULTS = { promptList: true, collapse: true, chartjs: true };

	/**
	 * Normalizes a stored settings object over the defaults.
	 * @param {Object} [stored] - Raw stored settings, possibly partial.
	 * @returns {Object} Complete settings object.
	 */
	function normalize(stored) {
		return Object.assign({}, DEFAULTS, stored || {});
	}

	/**
	 * Mirrors settings into the page: localStorage (for scripts that load
	 * before this relay) plus a CustomEvent (for live updates).
	 * @param {Object} settings - Complete settings object.
	 */
	function mirror(settings) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		} catch (e) {
			// localStorage unavailable (privacy mode); event still fires.
		}
		window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: settings }));
	}

	if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
		chrome.storage.local.get(STORAGE_KEY).then((result) => {
			mirror(normalize(result[STORAGE_KEY]));
		}).catch(() => {});

		chrome.storage.onChanged.addListener((changes, area) => {
			if (area === 'local' && changes[STORAGE_KEY]) {
				mirror(normalize(changes[STORAGE_KEY].newValue));
			}
		});
	}
})();
