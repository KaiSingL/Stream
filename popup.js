// Stream extension popup.
// Three feature toggles persisted to chrome.storage.local (mirrored into the
// page by settings-relay.js), the extension version, and an extension reload
// button that re-reads the unpacked files from disk.

const STORAGE_KEY = 'stream.settings';
const DEFAULTS = { promptList: true, collapse: true, chartjs: true };

/**
 * Reads the current settings from storage, merged over the defaults.
 * @returns {Promise<Object>} Complete settings object.
 */
async function loadSettings() {
	try {
		const result = await chrome.storage.local.get(STORAGE_KEY);
		return Object.assign({}, DEFAULTS, result[STORAGE_KEY] || {});
	} catch (e) {
		return Object.assign({}, DEFAULTS);
	}
}

/**
 * Persists the given settings object.
 * @param {Object} settings - Complete settings object.
 * @returns {Promise<void>}
 */
function saveSettings(settings) {
	return chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

/**
 * Reflects a settings object into the toggle checkboxes.
 * @param {Object} settings - Complete settings object.
 */
function renderToggles(settings) {
	document.querySelectorAll('input[data-setting]').forEach((input) => {
		const key = input.getAttribute('data-setting');
		input.checked = settings[key] !== false;
	});
}

/**
 * Collects toggle states into a settings object.
 * @returns {Object} Complete settings object from the checkboxes.
 */
function collectToggles() {
	const settings = Object.assign({}, DEFAULTS);
	document.querySelectorAll('input[data-setting]').forEach((input) => {
		settings[input.getAttribute('data-setting')] = input.checked;
	});
	return settings;
}

/**
 * Initializes version label, toggle state, change persistence, and reload.
 */
async function init() {
	const versionEl = document.getElementById('version');
	if (versionEl) versionEl.textContent = 'v' + chrome.runtime.getManifest().version;

	renderToggles(await loadSettings());

	document.querySelectorAll('input[data-setting]').forEach((input) => {
		input.addEventListener('change', () => {
			saveSettings(collectToggles());
		});
	});

	const reloadButton = document.getElementById('reload-button');
	if (reloadButton) {
		reloadButton.addEventListener('click', () => {
			chrome.runtime.reload();
		});
	}
}

document.addEventListener('DOMContentLoaded', init);
