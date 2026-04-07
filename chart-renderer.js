// ChartJS Render Enhancer for Stream Extension
// Bundled Chart.js (loaded via manifest content_scripts, bypasses CSP)
// Targets code blocks with header <span>chartjs</span>
// On click: parses JSON, renders chart via bundled Chart.js, replaces code section with <canvas>
// MutationObserver on body (childList + attributes, subtree) with rAF debounce + 5s idle disconnect
// Idempotent via .boost-chartjs-enhanced class + button check
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
	 * Checks if a code block is a Chart.js block by looking for the "chartjs" label.
	 * @param {HTMLElement} block - The code block container element.
	 * @returns {boolean} True if the block is a Chart.js block.
	 */
	function isChartJSBlock(block) {
		const label = block.querySelector('span.font-mono.text-xs.select-none');
		return label && label.textContent.trim() === 'chartjs';
	}

	/**
	 * Renders a Chart.js chart inside the given code block.
	 * Parses JSON from the code element, replaces the code section with a canvas,
	 * and creates a new Chart instance using the bundled Chart.js library.
	 * @param {HTMLElement} block - The code block container element.
	 */
	function renderChartInBlock(block) {
		const contentDiv = block.querySelector('div[style*="border-radius: 0px 0px 12px 12px"]');
		if (!contentDiv) {
			console.error('[Stream ChartJS] Content div not found in block');
			return;
		}

		const codeEl = contentDiv.querySelector('code');
		if (!codeEl) {
			console.error('[Stream ChartJS] Code element not found in content div');
			return;
		}

		let config;
		try {
			config = JSON.parse(codeEl.textContent.trim());
		} catch (err) {
			console.error('[Stream ChartJS] Invalid JSON config:', err);
			return;
		}

		// Replace code section with rendered chart canvas
		contentDiv.innerHTML = '';
		const canvas = document.createElement('canvas');
		canvas.style.cssText = 'width:100%; height:400px; display:block;';
		contentDiv.appendChild(canvas);

		// Chart.js is bundled and loaded via manifest — use it directly
		if (typeof window.Chart === 'undefined') {
			console.error('[Stream ChartJS] Chart.js not available — check manifest content_scripts order');
			return;
		}

		const ctx = canvas.getContext('2d');
		if (!config.options) config.options = {};
		config.options.responsive = true;
		config.options.maintainAspectRatio = false;
		new window.Chart(ctx, config);
		console.log('[Stream ChartJS] Chart rendered successfully');
	}

	/**
	 * Scans the DOM for unenhanced Chart.js code blocks and adds render buttons.
	 * Idempotent — skips blocks already marked with .boost-chartjs-enhanced.
	 */
	function processAdds() {
		document.querySelectorAll('div.border.rounded-xl:not(.boost-chartjs-enhanced)').forEach((block) => {
			if (!isChartJSBlock(block)) return;

			block.classList.add('boost-chartjs-enhanced');

			// Anchor on the existing Collapse button (most reliable selector)
			const collapseBtn = block.querySelector('button[aria-label="Collapse"]');
			if (!collapseBtn) return;

			const collapseGroup = collapseBtn.parentElement;
			if (!collapseGroup) return;

			// Avoid duplicate render buttons
			if (collapseGroup.querySelector('.boost-render-btn')) return;

			const renderBtn = document.createElement('button');
			renderBtn.type = 'button';
			renderBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-100 [&_svg]:shrink-0 select-none text-fg-secondary hover:text-fg-primary disabled:hover:text-fg-secondary hover:bg-surface-l2 disabled:hover:bg-surface-l1 h-8 rounded-xl px-3 text-xs bg-transparent boost-render-btn';
			renderBtn.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-3 size-4">
					<path d="M3 3v18h18"></path>
					<path d="M18 17V9"></path>
					<path d="M13 17V5"></path>
					<path d="M8 17v-3"></path>
				</svg>
				<span class="hidden @sm/code-block:block">Render</span>
			`;

			renderBtn.addEventListener('click', (e) => {
				e.stopImmediatePropagation();
				renderChartInBlock(block);
			});

			collapseGroup.appendChild(renderBtn);
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
				processAdds();
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
		processAdds();
		console.log('[Stream ChartJS] Observer initialized, scanning for chart blocks');
	}

	/**
	 * Handles SPA URL changes — re-scans DOM and restarts observer if disconnected.
	 */
	function handleUrlChange() {
		const newUrl = window.location.href;
		if (newUrl !== currentUrl) {
			currentUrl = newUrl;
			console.log('[Stream ChartJS] URL changed, re-scanning for chart blocks');
			processAdds();
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
