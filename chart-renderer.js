// ChartJS Render Enhancer for Stream Extension
// Bundled Chart.js (loaded via manifest content_scripts, bypasses CSP)
// Targets code blocks with header <span>chartjs</span>
// Auto-renders when valid JSON detected, re-renders on streaming content changes
// Adds "Show Code" button after render to toggle code visibility
// MutationObserver on body (childList + attributes, subtree) with rAF debounce + 5s idle disconnect
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
	 * @type {WeakMap<HTMLElement, {lastJson: string, chartInstance: Chart|null, canvas: HTMLCanvasElement|null, codeEl: HTMLElement|null, preEl: HTMLElement|null, showCodeBtn: HTMLElement|null}>}
	 */
	const trackedBlocks = new WeakMap();

	/**
	 * Checks if a code block is a Chart.js block by looking for the "chartjs" label.
	 * @param {HTMLElement} block - The code block container element.
	 * @returns {boolean} True if the block is a Chart.js block.
	 */
	function isChartJSBlock(block) {
		const label = block.querySelector('span.font-mono.text-xs.select-none');
		return label && label.textContent.trim() === 'chartjs';
	}

	/**
	 * Renders or re-renders a Chart.js chart inside the given code block.
	 * Handles streaming: keeps code element hidden but in DOM for content monitoring.
	 * Injects "Show Code" button after first successful render.
	 * @param {HTMLElement} block - The code block container element.
	 * @param {Object} tracked - The tracked state object from WeakMap.
	 * @param {string} jsonText - The current JSON text content.
	 * @param {Object} config - The parsed Chart.js config object.
	 */
	function renderOrUpdateChart(block, tracked, jsonText, config) {
		const contentDiv = block.querySelector('div[style*="border-radius: 0px 0px 12px 12px"]');
		if (!contentDiv) return;

		// Get or create canvas
		let canvas = tracked.canvas;
		let isFirstRender = false;

		if (!canvas) {
			isFirstRender = true;
			canvas = document.createElement('canvas');
			canvas.style.cssText = 'width:100%; height:400px; display:block;';
			tracked.canvas = canvas;
		}

		// Destroy existing chart instance if re-rendering
		if (tracked.chartInstance) {
			tracked.chartInstance.destroy();
			tracked.chartInstance = null;
		}

		// First render: hide code elements, insert canvas
		if (isFirstRender) {
			const codeEl = contentDiv.querySelector('code');
			const preEl = codeEl?.closest('pre');

			if (codeEl) {
				codeEl.style.display = 'none';
				tracked.codeEl = codeEl;
			}
			if (preEl) {
				preEl.style.display = 'none';
				tracked.preEl = preEl;
			}

			contentDiv.appendChild(canvas);

			// Inject "Show Code" button
			injectShowCodeButton(block, tracked);
		}

		// Create new chart
		if (typeof window.Chart === 'undefined') {
			console.error('[Stream ChartJS] Chart.js not available — check manifest content_scripts order');
			return;
		}

		const ctx = canvas.getContext('2d');
		if (!config.options) config.options = {};
		config.options.responsive = true;
		config.options.maintainAspectRatio = false;

		tracked.chartInstance = new window.Chart(ctx, config);
		tracked.lastJson = jsonText;

		console.log('[Stream ChartJS] Chart rendered successfully');
	}

	/**
	 * Injects "Show Code" button next to the Collapse button.
	 * Toggles code visibility on click.
	 * @param {HTMLElement} block - The code block container element.
	 * @param {Object} tracked - The tracked state object from WeakMap.
	 */
	function injectShowCodeButton(block, tracked) {
		const collapseBtn = block.querySelector('button[aria-label="Collapse"]');
		if (!collapseBtn) return;

		const collapseGroup = collapseBtn.parentElement;
		if (!collapseGroup) return;

		// Avoid duplicate buttons
		if (collapseGroup.querySelector('.boost-show-code-btn')) return;

		const showCodeBtn = document.createElement('button');
		showCodeBtn.type = 'button';
		showCodeBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-100 [&_svg]:shrink-0 select-none text-fg-secondary hover:text-fg-primary disabled:hover:text-fg-secondary hover:bg-surface-l2 disabled:hover:bg-surface-l1 h-8 rounded-xl px-3 text-xs bg-transparent boost-show-code-btn';
		showCodeBtn.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code size-4">
				<polyline points="16 18 22 12 16 6"></polyline>
				<polyline points="8 6 2 12 8 18"></polyline>
			</svg>
			<span class="hidden @sm/code-block:block">Show Code</span>
		`;

		showCodeBtn.addEventListener('click', (e) => {
			e.stopImmediatePropagation();
			toggleCodeVisibility(tracked, showCodeBtn);
		});

		collapseGroup.appendChild(showCodeBtn);
		tracked.showCodeBtn = showCodeBtn;
	}

	/**
	 * Toggles code visibility and updates button text.
	 * @param {Object} tracked - The tracked state object from WeakMap.
	 * @param {HTMLElement} btn - The Show Code button element.
	 */
	function toggleCodeVisibility(tracked, btn) {
		const { codeEl, preEl, canvas } = tracked;
		if (!codeEl) return;

		const isHidden = codeEl.style.display === 'none';
		const spanEl = btn.querySelector('span');

		if (isHidden) {
			// Show code → hide chart
			if (preEl) preEl.style.display = '';
			codeEl.style.display = '';
			if (canvas) canvas.style.display = 'none';
			if (spanEl) spanEl.textContent = 'Hide Code';
		} else {
			// Hide code → show chart
			if (preEl) preEl.style.display = 'none';
			codeEl.style.display = 'none';
			if (canvas) canvas.style.display = '';
			if (spanEl) spanEl.textContent = 'Show Code';
		}
	}

	/**
	 * Processes all chartjs blocks: finds new ones, starts tracking,
	 * and re-renders if streaming content has changed with valid JSON.
	 */
	function processBlocks() {
		// Find and track new chartjs blocks
		document.querySelectorAll('div.border.rounded-xl:not(.boost-chartjs-tracked)').forEach((block) => {
			if (!isChartJSBlock(block)) return;

			block.classList.add('boost-chartjs-tracked');
			trackedBlocks.set(block, {
				lastJson: '',
				chartInstance: null,
				canvas: null,
				codeEl: null,
				preEl: null,
				showCodeBtn: null
			});
		});

		// Process all tracked blocks for streaming updates
		document.querySelectorAll('div.border.rounded-xl.boost-chartjs-tracked').forEach((block) => {
			const tracked = trackedBlocks.get(block);
			if (!tracked) return;

			const contentDiv = block.querySelector('div[style*="border-radius: 0px 0px 12px 12px"]');
			if (!contentDiv) return;

			const codeEl = contentDiv.querySelector('code');
			if (!codeEl) return;

			const jsonText = codeEl.textContent.trim();

			// Skip if content hasn't changed
			if (jsonText === tracked.lastJson) return;

			// Try to parse JSON (may be invalid during streaming)
			let config;
			try {
				config = JSON.parse(jsonText);
			} catch {
				// Still streaming, not valid JSON yet — silently wait
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
			const shouldProcess = mutations.some(m => m.type === 'childList' || m.type === 'attributes');
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
			attributeFilter: ['class', 'data-updated']
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
})();