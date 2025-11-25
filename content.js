// PromptList Extension for grok.com
// This script adds a "PromptList" button and a "Section Toggle" button to the chat and project interfaces on https://grok.com/chat/* and https://grok.com/project/*
// When clicked, the PromptList button shows a dropdown with previews of user messages, allowing navigation to each message.
// The Section Toggle button collapses or expands all sections in the conversation.

console.log('PromptList extension loaded');

// Function to generate message preview
function getPreview(text, wordCount = 10) {
	const cleanedText = text.replace(/\s+/g, ' ').trim();
	if (!cleanedText) return '[Empty message]';
	const words = cleanedText.split(' ');
	return words.length > wordCount
		? words.slice(0, wordCount).join(' ') + '...'
		: cleanedText;
}

// Create dropdown element
const dropdown = document.createElement('div');
dropdown.id = 'prompt-list-dropdown';
dropdown.className =
	'z-50 rounded-2xl bg-surface-l4 border border-border-l1 text-primary backdrop-blur-md p-1 shadow-sm shadow-black/5 max-h-[80vh] overflow-auto min-w-36 space-y-0.5';
dropdown.style.position = 'absolute';
dropdown.style.display = 'none';
document.body.appendChild(dropdown);

// Stop propagation on dropdown clicks
dropdown.addEventListener('click', (e) => {
	e.stopPropagation();
});

// Document click listener to close dropdown
document.addEventListener('click', (e) => {
	if (dropdown.style.display === 'block' && !dropdown.contains(e.target)) {
		dropdown.style.display = 'none';
	}
});

// Function to toggle the dropdown
function toggleDropdown(button) {
	if (dropdown.style.display === 'block') {
		dropdown.style.display = 'none';
		return;
	}
	const userMessages = document.querySelectorAll(
		'.flex.flex-col.items-end .message-bubble'
	);
	dropdown.innerHTML = '';
	userMessages.forEach((msg) => {
		// Show only first 5 words, add ... if more than 5
		const preview = getPreview(msg.textContent, 5);
		const item = document.createElement('div');
		item.className =
			'relative flex select-none items-center cursor-pointer px-3 py-2 rounded-xl text-sm outline-none focus:bg-button-ghost-hover hover:bg-button-ghost-hover';
		item.textContent = preview;
		item.addEventListener('click', () => {
			msg.scrollIntoView({ behavior: 'smooth' });
			dropdown.style.display = 'none';
		});
		dropdown.appendChild(item);
	});

	const buttonRect = button.getBoundingClientRect();
	dropdown.style.top = `${buttonRect.bottom + window.scrollY}px`;
	dropdown.style.left = `${buttonRect.left + window.scrollX}px`;
	dropdown.style.display = 'block';
}

// Add PromptList and Section Toggle buttons
function addPromptListButton() {
	// Check if the current URL starts with /chat/ or /project/
	const isChat =
		window.location.pathname.startsWith('/chat/') ||
		window.location.pathname.startsWith('/c/') ||
		window.location.pathname.startsWith('/project/');

	// If not on /chat/ or /project/, hide the buttons if they exist and return
	const existingPromptButton = document.querySelector('#prompt-list-button');
	const existingToggleButton = document.querySelector('#section-toggle-button');
	if (!isChat) {
		if (existingPromptButton) {
			existingPromptButton.style.display = 'none';
			console.log('Hiding PromptList button for URL:', window.location.pathname); // Debug
		}
		if (existingToggleButton) {
			existingToggleButton.style.display = 'none';
			console.log('Hiding Section Toggle button for URL:', window.location.pathname); // Debug
		}
		return;
	}

	// If buttons should be shown, ensure they're visible or create them
	const buttonContainer = document.querySelector(
		'.absolute.flex.flex-row.items-center.gap-0\\.5.ms-auto.end-3'
	);
	if (buttonContainer) {
		// PromptList Button
		if (!existingPromptButton) {
			console.log('Adding PromptList button');
			const promptListButton = document.createElement('button');
			promptListButton.id = 'prompt-list-button';
			promptListButton.innerHTML = `
				<span style="opacity: 1; transform: none;">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="stroke-[2]" stroke-width="2">
						<path d="
							M21.5 13v4.2c0 1.68-1.26 3.255-2.94 3.57a4.83 4.83 90 01-.945.105h-10.5a3.78 3.78 90 01-3.78-3.57V6.825c0-1.68 1.365-3.255 3.045-3.57a5.46 5.46 90 01.84-.105h10.395a3.78 3.78 90 013.78 3.675zM12.984 6.008C8.411 6.818 5.443 10.887 8.967 12.959M14.952 12.062C19.648 14.156 15.988 17.817 11.168 18.122M12.003 15.379V14.783M12.005 12.453V11.716M11.959 9.322V8.793
							" stroke="currentColor" stroke-linecap="round"/>
					</svg>
				</span>
			`;
			promptListButton.classList.add(
				'border',
				'border-transparent',
				'p-0',
				'rounded-full',
				'text-sm',
				'flex',
				'flex-row',
				'items-center',
				'justify-center',
				'gap-1',
				'focus:bg-button-ghost-hover',
				'hover:bg-button-ghost-hover'
			);
			promptListButton.type = 'button';
			promptListButton.style.opacity = '1';
			promptListButton.style.width = '40px';
			promptListButton.style.height = '40px';

			// Tooltip integration using Radix-like structure
			const tooltipContent = 'View your prompts';
			const tooltipId = 'radix-' + Math.random().toString(36).substr(2, 9);
			const ariaSpan = document.createElement('span');
			ariaSpan.id = tooltipId;
			ariaSpan.role = 'tooltip';
			ariaSpan.style.position = 'absolute';
			ariaSpan.style.border = '0px';
			ariaSpan.style.width = '1px';
			ariaSpan.style.height = '1px';
			ariaSpan.style.padding = '0px';
			ariaSpan.style.margin = '-1px';
			ariaSpan.style.overflow = 'hidden';
			ariaSpan.style.clip = 'rect(0px, 0px, 0px, 0px)';
			ariaSpan.style.whiteSpace = 'nowrap';
			ariaSpan.style.overflowWrap = 'normal';
			ariaSpan.innerHTML = `<p>${tooltipContent}</p>`;

			const tooltipDiv = document.createElement('div');
			tooltipDiv.setAttribute('data-side', 'bottom');
			tooltipDiv.setAttribute('data-align', 'center');
			tooltipDiv.setAttribute('data-state', 'closed');
			tooltipDiv.className =
				'z-50 overflow-hidden rounded-md bg-popover shadow-sm dark:shadow-none px-3 py-1.5 text-xs text-popover-foreground pointer-events-none max-w-80 text-wrap animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2';
			tooltipDiv.innerHTML = `<p>${tooltipContent}</p>`;
			tooltipDiv.appendChild(ariaSpan);

			const popperWrapper = document.createElement('div');
			popperWrapper.setAttribute('data-radix-popper-content-wrapper', '');
			popperWrapper.style.position = 'fixed';
			popperWrapper.style.left = '0px';
			popperWrapper.style.top = '0px';
			popperWrapper.style.minWidth = 'max-content';
			popperWrapper.style.zIndex = '50';
			popperWrapper.style.setProperty(
				'--radix-popper-transform-origin',
				'50% 0px'
			);
			popperWrapper.appendChild(tooltipDiv);
			document.body.appendChild(popperWrapper);
			popperWrapper.style.display = 'none';

			// Set CSS variables on tooltipDiv
			tooltipDiv.style.setProperty(
				'--radix-tooltip-content-transform-origin',
				'var(--radix-popper-transform-origin)'
			);
			tooltipDiv.style.setProperty(
				'--radix-tooltip-content-available-width',
				'var(--radix-popper-available-width)'
			);
			tooltipDiv.style.setProperty(
				'--radix-tooltip-content-available-height',
				'var(--radix-popper-available-height)'
			);
			tooltipDiv.style.setProperty(
				'--radix-tooltip-trigger-width',
				'var(--radix-popper-anchor-width)'
			);
			tooltipDiv.style.setProperty(
				'--radix-tooltip-trigger-height',
				'var(--radix-popper-anchor-height)'
			);

			// Accessibility
			promptListButton.setAttribute('aria-describedby', tooltipId);

			// Hover events
			promptListButton.addEventListener('mouseenter', () => {
				popperWrapper.style.display = 'block';
				popperWrapper.style.visibility = 'hidden';
				const buttonRect = promptListButton.getBoundingClientRect();
				const tooltipRect = tooltipDiv.getBoundingClientRect();
				const translateX =
					buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;
				const translateY = buttonRect.bottom + 4; // Offset for arrow/space
				popperWrapper.style.transform = `translate(${translateX}px, ${translateY}px)`;
				popperWrapper.style.setProperty(
					'--radix-popper-available-width',
					`${window.innerWidth}px`
				);
				popperWrapper.style.setProperty(
					'--radix-popper-available-height',
					`${window.innerHeight}px`
				);
				popperWrapper.style.setProperty(
					'--radix-popper-anchor-width',
					`${buttonRect.width}px`
				);
				popperWrapper.style.setProperty(
					'--radix-popper-anchor-height',
					`${buttonRect.height}px`
				);
				popperWrapper.style.visibility = '';
				tooltipDiv.setAttribute('data-state', 'active-open');
			});

			promptListButton.addEventListener('mouseleave', () => {
				tooltipDiv.setAttribute('data-state', 'closed');
			});

			// Hide after animation ends
			tooltipDiv.addEventListener('animationend', () => {
				if (tooltipDiv.getAttribute('data-state') === 'closed') {
					popperWrapper.style.display = 'none';
				}
			});

			// Click event with tooltip dismissal
			promptListButton.addEventListener('click', (e) => {
				e.stopPropagation();
				tooltipDiv.setAttribute('data-state', 'closed');
				popperWrapper.style.display = 'none';
				toggleDropdown(e.currentTarget);
			});

			buttonContainer.insertBefore(promptListButton, buttonContainer.firstChild);
		} else {
			// Ensure the PromptList button is visible if it exists and should be shown
			existingPromptButton.style.display = '';
		}

		// Section Toggle Button (added after PromptList button)
		if (!existingToggleButton) {
			console.log('Adding Section Toggle button');
			const sectionToggleButton = document.createElement('button');
			sectionToggleButton.id = 'section-toggle-button';

			// Define icons (using provided SVGs; using same for now as provided, but differentiated by rotation/CSS for visual toggle if needed)
			const collapseIcon = `
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 5h8"/>
					<path d="M3 12h8"/>
					<path d="M3 19h8"/>
					<path d="m15 5 3 3 3-3"/>
					<path d="m15 19 3-3 3 3"/>
				</svg>
			`;
			const expandIcon = `
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 5h8"/>
					<path d="M3 12h8"/>
					<path d="M3 19h8"/>
					<path d="m15 8 3-3 3 3"/>
					<path d="m15 16 3 3 3-3"/>
				</svg>
			`;

			// Initial state: collapse mode (click to collapse all open sections)
			sectionToggleButton.dataset.state = 'collapse';
			sectionToggleButton.innerHTML = `
				<span style="opacity: 1; transform: none;">
					${collapseIcon}
				</span>
			`;

			sectionToggleButton.classList.add(
				'border',
				'border-transparent',
				'p-0',
				'rounded-full',
				'text-sm',
				'flex',
				'flex-row',
				'items-center',
				'justify-center',
				'gap-1',
				'focus:bg-button-ghost-hover',
				'hover:bg-button-ghost-hover'
			);
			sectionToggleButton.type = 'button';
			sectionToggleButton.style.opacity = '1';
			sectionToggleButton.style.width = '40px';
			sectionToggleButton.style.height = '40px';

			// Tooltip integration using Radix-like structure (dynamic content)
			let currentTooltipContent = 'Collapse code block';
			const tooltipId = 'radix-' + Math.random().toString(36).substr(2, 9);
			const ariaSpan = document.createElement('span');
			ariaSpan.id = tooltipId;
			ariaSpan.role = 'tooltip';
			ariaSpan.style.position = 'absolute';
			ariaSpan.style.border = '0px';
			ariaSpan.style.width = '1px';
			ariaSpan.style.height = '1px';
			ariaSpan.style.padding = '0px';
			ariaSpan.style.margin = '-1px';
			ariaSpan.style.overflow = 'hidden';
			ariaSpan.style.clip = 'rect(0px, 0px, 0px, 0px)';
			ariaSpan.style.whiteSpace = 'nowrap';
			ariaSpan.style.overflowWrap = 'normal';
			ariaSpan.innerHTML = `<p>${currentTooltipContent}</p>`;

			const tooltipDiv = document.createElement('div');
			tooltipDiv.setAttribute('data-side', 'bottom');
			tooltipDiv.setAttribute('data-align', 'center');
			tooltipDiv.setAttribute('data-state', 'closed');
			tooltipDiv.className =
				'z-50 overflow-hidden rounded-md bg-popover shadow-sm dark:shadow-none px-3 py-1.5 text-xs text-popover-foreground pointer-events-none max-w-80 text-wrap animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2';
			tooltipDiv.innerHTML = `<p>${currentTooltipContent}</p>`;
			tooltipDiv.appendChild(ariaSpan);

			const popperWrapper = document.createElement('div');
			popperWrapper.setAttribute('data-radix-popper-content-wrapper', '');
			popperWrapper.style.position = 'fixed';
			popperWrapper.style.left = '0px';
			popperWrapper.style.top = '0px';
			popperWrapper.style.minWidth = 'max-content';
			popperWrapper.style.zIndex = '50';
			popperWrapper.style.setProperty(
				'--radix-popper-transform-origin',
				'50% 0px'
			);
			popperWrapper.appendChild(tooltipDiv);
			document.body.appendChild(popperWrapper);
			popperWrapper.style.display = 'none';

			// Set CSS variables on tooltipDiv
			tooltipDiv.style.setProperty(
				'--radix-tooltip-content-transform-origin',
				'var(--radix-popper-transform-origin)'
			);
			tooltipDiv.style.setProperty(
				'--radix-tooltip-content-available-width',
				'var(--radix-popper-available-width)'
			);
			tooltipDiv.style.setProperty(
				'--radix-tooltip-content-available-height',
				'var(--radix-popper-available-height)'
			);
			tooltipDiv.style.setProperty(
				'--radix-tooltip-trigger-width',
				'var(--radix-popper-anchor-width)'
			);
			tooltipDiv.style.setProperty(
				'--radix-tooltip-trigger-height',
				'var(--radix-popper-anchor-height)'
			);

			// Accessibility
			sectionToggleButton.setAttribute('aria-describedby', tooltipId);

			// Function to update tooltip content based on state
			function updateTooltipContent() {
				currentTooltipContent = sectionToggleButton.dataset.state === 'collapse' ? 'Collapse code block' : 'Expand code block';
				const pElement = tooltipDiv.querySelector('p');
				if (pElement) pElement.textContent = currentTooltipContent;
				ariaSpan.innerHTML = `<p>${currentTooltipContent}</p>`;
				sectionToggleButton.title = currentTooltipContent;
			}

			// Initial tooltip setup
			updateTooltipContent();

			// Hover events
			sectionToggleButton.addEventListener('mouseenter', () => {
				popperWrapper.style.display = 'block';
				popperWrapper.style.visibility = 'hidden';
				const buttonRect = sectionToggleButton.getBoundingClientRect();
				const tooltipRect = tooltipDiv.getBoundingClientRect();
				const translateX =
					buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;
				const translateY = buttonRect.bottom + 4; // Offset for arrow/space
				popperWrapper.style.transform = `translate(${translateX}px, ${translateY}px)`;
				popperWrapper.style.setProperty(
					'--radix-popper-available-width',
					`${window.innerWidth}px`
				);
				popperWrapper.style.setProperty(
					'--radix-popper-available-height',
					`${window.innerHeight}px`
				);
				popperWrapper.style.setProperty(
					'--radix-popper-anchor-width',
					`${buttonRect.width}px`
				);
				popperWrapper.style.setProperty(
					'--radix-popper-anchor-height',
					`${buttonRect.height}px`
				);
				popperWrapper.style.visibility = '';
				tooltipDiv.setAttribute('data-state', 'active-open');
			});

			sectionToggleButton.addEventListener('mouseleave', () => {
				tooltipDiv.setAttribute('data-state', 'closed');
			});

			// Hide after animation ends
			tooltipDiv.addEventListener('animationend', () => {
				if (tooltipDiv.getAttribute('data-state') === 'closed') {
					popperWrapper.style.display = 'none';
				}
			});

			// Toggle logic: collapse all open sections or expand all closed ones
			sectionToggleButton.addEventListener('click', (e) => {
				e.stopPropagation();
				tooltipDiv.setAttribute('data-state', 'closed');
				popperWrapper.style.display = 'none';
				if (sectionToggleButton.dataset.state === 'collapse') {
					// Collapse all: click buttons labeled "Collapse" (those currently open)
					document.querySelectorAll('button[aria-label="Collapse"]').forEach(btn => {
						if (btn.offsetParent !== null) { // Ensure visible/clickable
							btn.click();
						}
					});
					// Switch to expand mode
					sectionToggleButton.innerHTML = `
						<span style="opacity: 1; transform: none;">
							${expandIcon}
						</span>
					`;
					sectionToggleButton.dataset.state = 'expand';
				} else {
					// Expand all: click buttons labeled "Expand" (those currently closed)
					document.querySelectorAll('button[aria-label="Expand"]').forEach(btn => {
						if (btn.offsetParent !== null) { // Ensure visible/clickable
							btn.click();
						}
					});
					// Switch to collapse mode
					sectionToggleButton.innerHTML = `
						<span style="opacity: 1; transform: none;">
							${collapseIcon}
						</span>
					`;
					sectionToggleButton.dataset.state = 'collapse';
				}
				// Update tooltip after state change
				updateTooltipContent();
			});

			// Insert after the PromptList button (or as second child if no PromptList)
			const insertAfterPrompt = existingPromptButton || buttonContainer.firstChild;
			if (insertAfterPrompt && insertAfterPrompt.parentNode) {
				buttonContainer.insertBefore(sectionToggleButton, insertAfterPrompt.nextSibling);
			} else {
				buttonContainer.appendChild(sectionToggleButton);
			}
		} else {
			// Ensure the Section Toggle button is visible if it exists and should be shown
			existingToggleButton.style.display = '';
		}
	} else {
		// Ensure buttons are visible if container doesn't exist but buttons do (edge case)
		if (existingPromptButton) existingPromptButton.style.display = '';
		if (existingToggleButton) existingToggleButton.style.display = '';
	}
}

// Set up MutationObserver to watch for changes and add the buttons when the container appears
const observer = new MutationObserver(() => {
	addPromptListButton();
});
observer.observe(document.body, { childList: true, subtree: true });

// Also try adding the buttons immediately in case the container is already present
addPromptListButton();

// Global plain-text paste interceptor
document.addEventListener('paste', function (event) {
	const target = event.target;

	event.preventDefault();  // Block default rich/smart paste in Edge

	const plainText = event.clipboardData.getData('text/plain');  // Raw text only (e.g., URL)

	if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
		// Simple inputs: Replace selection with plain text
		const start = target.selectionStart;
		const end = target.selectionEnd;
		target.value = target.value.substring(0, start) + plainText + target.value.substring(end);
		target.selectionStart = target.selectionEnd = start + plainText.length;
	} else {
		// Contenteditable: Use Range API for precise insertion
		const selection = window.getSelection();
		if (selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			range.deleteContents();  // Clear selection

			const textNode = document.createTextNode(plainText);
			range.insertNode(textNode);  // Insert at cursor

			range.setStartAfter(textNode);
			range.setEndAfter(textNode);
			selection.removeAllRanges();
			selection.addRange(range);  // Update cursor
		} else {
			// Fallback: Append to end
			target.appendChild(document.createTextNode(plainText));
		}
	}

	target.focus();  // Maintain focus
}, true);  // Use capture phase for early interception

console.log('Global plain-text paste active');