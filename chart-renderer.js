// ChartJS Render Enhancer for Stream Extension
// Bundled Chart.js (loaded via manifest content_scripts, bypasses CSP)
// Targets code blocks with header <span>chartjs</span>
// Auto-renders when valid JSON detected, re-renders on streaming content changes
// Adds "Raw" / "Render" toggle button after render to switch between chart and code views
// MutationObserver (childList + attributes + characterData) with rAF debounce + 5s idle disconnect
// Polling fallback (1s interval) catches missed updates after observer disconnects
// Idempotent via WeakMap tracking + .boost-chartjs-tracked class
// Vanilla ES6+, CSP-safe, no external dependencies

(function () {
	'use strict';

	// Prevent duplicate execution on re-injection (SPA / dynamic pages)
	if (window.__boostChartJSInitialized) return;
	window.__boostChartJSInitialized = true;

	let observer = null;
	let idleTimeout = null;
	let currentUrl = window.location.href;

	/**
	 * WeakMap to track block state for streaming updates and re-rendering.
	 * @type {WeakMap<HTMLElement, {lastJson: string, chartInstance: Chart|null, canvas: HTMLCanvasElement|null, contentDiv: HTMLElement|null, chartWrapper: HTMLElement|null, showingChart: boolean, showCodeBtn: HTMLElement|null}>}
	 */
	const trackedBlocks = new WeakMap();

	/**
	 * Checks if a code block is a Chart.js block by looking for the "chartjs" label.
	 * Requires a <pre> element to distinguish code blocks from header bars.
	 * @param {HTMLElement} block - The code block container element.
	 * @returns {boolean} True if the block is a Chart.js block.
	 */
	function isChartJSBlock(block) {
		if (!block.querySelector('pre')) return false;
		const label = block.querySelector('span.font-mono');
		return label && label.textContent.trim() === 'chartjs';
	}

	const LIGHT_TEXT = 'rgba(255,255,255,0.8)';
	const GRID_LINE = 'rgba(255,255,255,0.1)';

	/**
	 * Applies dark mode color defaults for axes, legend, and gridlines.
	 * Only sets values that aren't already specified in the config.
	 * @param {Object} config - The Chart.js config object (mutated in place).
	 */
	function applyDarkModeDefaults(config) {
		const opts = config.options;
		if (!opts) return;

		if (!opts.plugins) opts.plugins = {};
		if (!opts.plugins.legend) opts.plugins.legend = {};
		if (!opts.plugins.legend.labels) opts.plugins.legend.labels = {};
		if (!opts.plugins.legend.labels.color) opts.plugins.legend.labels.color = LIGHT_TEXT;

		if (opts.scales) {
			Object.values(opts.scales).forEach((scale) => {
				if (!scale.ticks) scale.ticks = {};
				if (!scale.ticks.color) scale.ticks.color = LIGHT_TEXT;
				if (!scale.grid) scale.grid = {};
				if (!scale.grid.color) scale.grid.color = GRID_LINE;
				if (scale.title && !scale.title.color) scale.title.color = LIGHT_TEXT;
			});
		}
	}

	/**
	 * Renders or re-renders a Chart.js chart inside the given code block.
	 * Canvas is appended to the outer block container (not the React-managed
	 * content div) to survive framework re-renders.
	 * @param {HTMLElement} block - The code block container element.
	 * @param {Object} tracked - The tracked state object from WeakMap.
	 * @param {string} jsonText - The current JSON text content.
	 * @param {Object} config - The parsed Chart.js config object.
	 */
	function renderOrUpdateChart(block, tracked, jsonText, config) {
		const contentDiv = block.querySelector('pre')?.parentElement;
		if (!contentDiv) {
			console.warn('[Stream ChartJS] contentDiv not found for block', block);
			return;
		}

		let canvas = tracked.canvas;
		const needInsert = !canvas || !tracked.chartWrapper || !tracked.chartWrapper.parentElement || !block.contains(tracked.chartWrapper);

		if (needInsert) {
			if (canvas && tracked.chartInstance) {
				tracked.chartInstance.destroy();
				tracked.chartInstance = null;
			}

			canvas = document.createElement('canvas');
			canvas.className = 'boost-chart-canvas';
			tracked.canvas = canvas;
			tracked.contentDiv = contentDiv;

			const chartWrapper = document.createElement('div');
			chartWrapper.className = 'boost-chart-wrapper';
			chartWrapper.style.cssText = 'position:relative; width:100%; height:400px; overflow:hidden;';
			chartWrapper.appendChild(canvas);
			tracked.chartWrapper = chartWrapper;

			contentDiv.style.display = 'none';
			block.appendChild(chartWrapper);

			injectShowCodeButton(block, tracked);
		}

		if (tracked.chartInstance) {
			tracked.chartInstance.destroy();
			tracked.chartInstance = null;
		}

		if (typeof window.Chart === 'undefined') {
			console.error('[Stream ChartJS] Chart.js not available — check manifest content_scripts order');
			return;
		}

		if (!config.options) config.options = {};
		config.options.responsive = true;
		config.options.maintainAspectRatio = false;

		applyDarkModeDefaults(config);

		tracked.lastJson = jsonText;

		requestAnimationFrame(() => {
			if (!canvas.parentElement) return;
			const ctx = canvas.getContext('2d');
			tracked.chartInstance = new window.Chart(ctx, config);
			console.log('[Stream ChartJS] Chart rendered successfully');
		});
	}

	const RAW_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code size-4">
				<polyline points="16 18 22 12 16 6"></polyline>
				<polyline points="8 6 2 12 8 18"></polyline>
			</svg>`;
	const RENDER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-3 size-4">
				<path d="M3 3v18h18"></path>
				<path d="M18 17V9"></path>
				<path d="M13 17V5"></path>
				<path d="M8 17v-3"></path>
			</svg>`;

	/**
	 * Injects "Raw" / "Render" toggle button next to the Collapse button.
	 * Defaults to "Raw" (chart visible, clicking shows code).
	 * @param {HTMLElement} block - The code block container element.
	 * @param {Object} tracked - The tracked state object from WeakMap.
	 */
	function injectShowCodeButton(block, tracked) {
		const collapseBtn = block.querySelector('button[aria-label="Collapse"]');
		if (!collapseBtn) return;

		const collapseGroup = collapseBtn.parentElement;
		if (!collapseGroup) return;

		if (collapseGroup.querySelector('.boost-show-code-btn')) return;

		const showCodeBtn = document.createElement('button');
		showCodeBtn.type = 'button';
		showCodeBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-100 [&_svg]:shrink-0 select-none text-fg-secondary hover:text-fg-primary disabled:hover:text-fg-secondary hover:bg-surface-l2 disabled:hover:bg-surface-l1 h-8 rounded-xl px-3 text-xs bg-transparent boost-show-code-btn';
		showCodeBtn.innerHTML = `${RAW_ICON_SVG}<span class="hidden @sm/code-block:block">Raw</span>`;

		showCodeBtn.addEventListener('click', (e) => {
			e.stopImmediatePropagation();
			toggleCodeVisibility(tracked, showCodeBtn);
		});

		collapseGroup.appendChild(showCodeBtn);
		tracked.showCodeBtn = showCodeBtn;
	}

	/**
	 * Enforces the correct visibility of contentDiv and chartWrapper based on
	 * the tracked showingChart flag. Called on each poll to correct React re-renders.
	 * @param {Object} tracked - The tracked state object from WeakMap.
	 */
	function enforceVisibility(tracked) {
		const { contentDiv, chartWrapper, showingChart } = tracked;
		if (!contentDiv) return;
		if (showingChart) {
			if (contentDiv.style.display !== 'none') contentDiv.style.display = 'none';
			if (chartWrapper && chartWrapper.style.display === 'none') chartWrapper.style.display = '';
		} else {
			if (contentDiv.style.display === 'none') contentDiv.style.display = '';
			if (chartWrapper && chartWrapper.style.display !== 'none') chartWrapper.style.display = 'none';
		}
	}

	/**
	 * Toggles between chart view and raw code view.
	 * Uses tracked.showingChart flag for state (not DOM) to stay reliable
	 * across React re-renders.
	 * @param {Object} tracked - The tracked state object from WeakMap.
	 * @param {HTMLElement} btn - The toggle button element.
	 */
	function toggleCodeVisibility(tracked, btn) {
		tracked.showingChart = !tracked.showingChart;

		if (tracked.showingChart) {
			btn.innerHTML = `${RAW_ICON_SVG}<span class="hidden @sm/code-block:block">Raw</span>`;
		} else {
			btn.innerHTML = `${RENDER_ICON_SVG}<span class="hidden @sm/code-block:block">Render</span>`;
		}

		enforceVisibility(tracked);
	}

	/**
	 * Processes all chartjs blocks: finds new ones, starts tracking,
	 * and re-renders if streaming content has changed with valid JSON.
	 */
	function processBlocks() {
		// Find and track new chartjs blocks
		document.querySelectorAll('[class*="rounded-xl"]:not(.boost-chartjs-tracked)').forEach((block) => {
			if (!isChartJSBlock(block)) return;

			block.classList.add('boost-chartjs-tracked');
			trackedBlocks.set(block, {
				lastJson: '',
				chartInstance: null,
				canvas: null,
				contentDiv: null,
				chartWrapper: null,
				showingChart: true,
				showCodeBtn: null
			});
		});

		// Process all tracked blocks for streaming updates
		document.querySelectorAll('.boost-chartjs-tracked').forEach((block) => {
			const tracked = trackedBlocks.get(block);
			if (!tracked) return;

			const contentDiv = block.querySelector('pre')?.parentElement;
			if (!contentDiv) {
				console.warn('[Stream ChartJS] contentDiv not found for tracked block');
				return;
			}

			const codeEl = contentDiv.querySelector('code');
			if (!codeEl) return;

			const jsonText = codeEl.textContent.trim();

			tracked.contentDiv = contentDiv;

			const canvasAttached = tracked.chartWrapper && tracked.chartWrapper.parentElement && block.contains(tracked.chartWrapper);

			if (jsonText === tracked.lastJson && canvasAttached) {
				enforceVisibility(tracked);
				return;
			}

			// Try to parse JSON (may be invalid during streaming)
			let config;
			try {
				config = JSON.parse(jsonText);
			} catch (e) {
				console.warn('[Stream ChartJS] JSON parse failed:', e.message, jsonText.slice(0, 80));
				return;
			}

			// Valid JSON — render or re-render
			renderOrUpdateChart(block, tracked, jsonText, config);
		});
	}

	/**
	 * Initializes a MutationObserver to watch for dynamic DOM changes.
	 * Debounces processing with requestAnimationFrame.
	 * Disconnects after 5 seconds of no mutations to save resources.
	 */
	function initObserver() {
		if (observer) return;

		observer = new MutationObserver((mutations) => {
			const shouldProcess = mutations.some(m => m.type === 'childList' || m.type === 'attributes' || m.type === 'characterData');
			if (!shouldProcess) return;

			// Debounce with rAF
			requestAnimationFrame(() => {
				processBlocks();
			});

			// Reset idle timeout (disconnect after 5s of no mutations)
			if (idleTimeout) clearTimeout(idleTimeout);
			idleTimeout = setTimeout(() => {
				if (observer) {
					observer.disconnect();
					observer = null;
				}
			}, 5000);
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class', 'data-updated'],
			characterData: true,
			characterDataOldValue: true
		});

		// Initial scan for existing elements
		processBlocks();
		console.log('[Stream ChartJS] Observer initialized, auto-rendering chart blocks');
	}

	/**
	 * Handles SPA URL changes — re-scans DOM and restarts observer if disconnected.
	 */
	function handleUrlChange() {
		const newUrl = window.location.href;
		if (newUrl !== currentUrl) {
			currentUrl = newUrl;
			console.log('[Stream ChartJS] URL changed, re-scanning for chart blocks');
			processBlocks();
			// Restart observer if it was disconnected by idle timeout
			if (!observer) {
				initObserver();
			}
		}
	}

	// Listen for SPA navigation events
	window.addEventListener('popstate', handleUrlChange);

	const originalPushState = history.pushState;
	const originalReplaceState = history.replaceState;
	history.pushState = function (...args) {
		originalPushState.apply(history, args);
		handleUrlChange();
	};
	history.replaceState = function (...args) {
		originalReplaceState.apply(history, args);
		handleUrlChange();
	};

	// Start the enhancer
	initObserver();

	// Polling fallback (catches missed updates after observer disconnects)
	setInterval(processBlocks, 1000);
})();