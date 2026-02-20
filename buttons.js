// PromptList Extension for grok.com
// This script adds a "PromptList" button and a "Section Toggle" button to the chat and project interfaces on https://grok.com/chat/* and https://grok.com/project/*
// When clicked, the PromptList button shows a dropdown with previews of user messages, allowing navigation to each message.
// The Section Toggle button collapses all sections in the conversation.

console.log('PromptList extension loaded');

/**
 * Constants for selectors, classes, and styles.
 */
const CONSTANTS = {
	// URL checks
	CHAT_PATHS: ['/chat/', '/c/', '/project/'],

	// Selectors
	BUTTON_CONTAINER_SELECTOR: '.absolute.flex.flex-row.items-center.gap-0\\.5.ms-auto.end-3',
	USER_MESSAGES_SELECTOR: '.flex.flex-col.items-end .message-bubble',
	COLLAPSE_BUTTON_SELECTOR: 'button[aria-label="Collapse"]',
	CHAT_CONTAINER_SELECTOR: '.w-full.h-full.overflow-y-auto.overflow-x-hidden.scrollbar-gutter-stable.flex.flex-col.items-center.px-gutter',

	// Button IDs
	PROMPT_LIST_BUTTON_ID: 'prompt-list-button',
	SECTION_TOGGLE_BUTTON_ID: 'section-toggle-button',

	// Dropdown
	DROPDOWN_ID: 'prompt-list-dropdown',
	DROPDOWN_CLASSES: 'z-50 rounded-2xl bg-surface-l4 border border-border-l1 text-primary backdrop-blur-md p-1 shadow-sm shadow-black/5 max-h-[80vh] overflow-auto max-w-[calc(100vw-32px)] space-y-0.5',
	DROPDOWN_ITEM_CLASSES: 'relative flex select-none items-center cursor-pointer px-3 py-2 rounded-xl text-sm outline-none hover:bg-button-ghost-hover',

	// Button common classes
	BUTTON_COMMON_CLASSES: [
		'border', 'border-transparent', 'p-0', 'rounded-full', 'text-sm',
		'flex', 'flex-row', 'items-center', 'justify-center', 'gap-1',
		'hover:bg-button-ghost-hover'
	],

	// Button styles
	BUTTON_STYLES: { opacity: '1', width: '40px', height: '40px' },

	// Tooltip common classes
	TOOLTIP_CLASSES: 'z-50 overflow-hidden rounded-md bg-popover shadow-sm dark:shadow-none px-3 py-1.5 text-xs text-popover-foreground pointer-events-none max-w-80 text-wrap animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',

	// Icons
	PROMPT_LIST_ICON_SVG: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="stroke-[2]" stroke-width="2">
      <path d="M21.5 13v4.2c0 1.68-1.26 3.255-2.94 3.57a4.83 4.83 90 01-.945.105h-10.5a3.78 3.78 90 01-3.78-3.57V6.825c0-1.68 1.365-3.255 3.045-3.57a5.46 5.46 90 01.84-.105h10.395a3.78 3.78 90 013.78 3.675zM12.984 6.008C8.411 6.818 5.443 10.887 8.967 12.959M14.952 12.062C19.648 14.156 15.988 17.817 11.168 18.122M12.003 15.379V14.783M12.005 12.453V11.716M11.959 9.322V8.793" stroke="currentColor" stroke-linecap="round"/>
    </svg>
`,
	COLLAPSE_ICON_SVG: `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 5h8"/>
      <path d="M3 12h8"/>
      <path d="M3 19h8"/>
      <path d="m15 5 3 3 3-3"/>
      <path d="m15 19 3-3 3 3"/>
    </svg>
`,

// Tooltip contents
	PROMPT_LIST_TOOLTIP: 'View your prompts',
	COLLAPSE_TOOLTIP: 'Collapse code block',
	ANSWER_TOOLTIP: 'Jump to answer',

// Answer icon SVG
	ANSWER_ICON_SVG: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0" stroke-linecap="square" stroke-linejoin="square">
  		<path d="m9.7459 15.7641h-.9979l.0499-1.4719-.0249-.1497v-1.9709l0-.3493q0-.7484-.3742-1.0977-.3742-.3493-1.1975-.3493-.6486 0-1.1975.1996-.5489.1996-.973.4491l.0998-.8482q.2245-.1497.5738-.2744.3243-.1497.7484-.2245.4241-.0998.9231-.0998.6486 0 1.1227.1497.4491.1497.7484.4491.2744.2994.4241.7235.1247.4241.1247.948v3.9418m-3.1434.0998q-.8981 0-1.3971-.4491-.474-.4241-.474-1.2474v-.1746q0-.8482.5239-1.2474.5239-.4241 1.6466-.5738l1.921-.2744.0499.7484-1.8462.2744q-.6985.0998-.9979.3493-.2994.2495-.2994.6985v.0998q0 .474.2994.7484.2994.2495.8981.2495.5239 0 .8981-.1746.3742-.1746.5988-.474.2245-.2994.3243-.6736l.1497.6985h-.1996q-.0748.3992-.3243.7484-.2495.3493-.6736.5489-.4241.1996-1.0977.1996zm9.7297-.1247h-.9979v-3.7921q0-.499-.1247-.8482-.1247-.3493-.4491-.5489-.2994-.1996-.8233-.1996-.474 0-.8233.1746-.3493.1746-.5738.499-.2245.2994-.2994.6985l-.1746-.7235h.2245q.0998-.4241.3493-.7484t.6736-.5489q.4241-.1996 1.0229-.1996.7235 0 1.1726.2744.4491.2744.6486.7983.1996.5239.1996 1.2723v3.8919m-4.0665 0h-1.0478v-6.0873h1.0229l-.0499 1.4719.0499.0499v4.5655zm7.5343.1247q-.7235 0-1.2723-.1497-.5489-.1497-.8981-.3493l-.0998-.948q.4491.2495.9979.3992.5489.1746 1.2474.1746.6985 0 1.0728-.2245.3493-.2245.3493-.6736v-.0748q0-.2744-.1247-.474-.1247-.1996-.474-.3243-.3493-.1497-.9979-.2744-.7734-.1746-1.2225-.3992-.4491-.2245-.6237-.5738-.1996-.3243-.1996-.8233v-.0249q0-.7983.5489-1.1975.5489-.4241 1.6715-.4241.7235 0 1.2474.1746.5239.1497.8732.3493l.0998.8482q-.3992-.2495-.9231-.3992-.5239-.1497-1.1726-.1497-.474 0-.7734.0998-.2994.0998-.4241.2744-.1247.1746-.1247.4241v.0499q0 .2744.1247.474.1247.1996.474.3243.3493.1497.948.2744.7734.1497 1.2474.3742.4491.2245.6486.5489.1996.3243.1996.8482v.0998q0 .8482-.5988 1.2973-.5988.4491-1.7713.4491zm4.0665-.0249q-.3243 0-.474-.1746-.1497-.1746-.1497-.499v-.0748q0-.3243.1497-.499.1497-.1746.474-.1746.3243 0 .474.1746.1497.1746.1497.499v.0748q0 .3243-.1497.499-.1497.1746-.474.1746z"/>
	</svg>
  `
};

/**
 * Utility functions.
 */

/**
 * Generates a preview of the text, limited to the specified character count.
 * @param {string} text - The input text.
 * @param {number} [charCount=100] - Maximum number of characters to include.
 * @returns {string} The preview text.
 */
function getPreview(text, charCount = 100) {
	const cleanedText = text.replace(/\s+/g, ' ').trim();
	if (!cleanedText) return '[Empty message]';
	return cleanedText.slice(0, charCount);
}

/**
 * Scrolls to an element within its scrollable container with an offset.
 * Falls back to scrollIntoView if the container selector fails (e.g., due to class changes).
 * @param {HTMLElement} element - The element to scroll to.
 * @param {number} offset - The offset in pixels from the top.
 */
function scrollToElementWithOffset(element, offset = 50) {
	const container = document.querySelector(CONSTANTS.CHAT_CONTAINER_SELECTOR);
	if (container) {
		// Scroll within the container with offset
		const rect = element.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();
		const targetY = rect.top - containerRect.top + container.scrollTop - offset;
		container.scrollTo({
			top: targetY,
			behavior: 'smooth'
		});
	} else {
		// Fallback to scrollIntoView (handles nearest scrollable ancestor or window)
		element.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
}

/**
 * Finds the corresponding response element for a given user message.
 * @param {HTMLElement} userMessage - The user message element.
 * @returns {HTMLElement|null} The response element or null if not found.
 */
function findCorrespondingResponse(userMessage) {
	const userWrapper = userMessage.closest('.flex.flex-col.items-end');
	if (!userWrapper) return null;

	const outerWrapper = userWrapper.parentElement;
	if (!outerWrapper) return null;

	let nextElement = userWrapper.nextElementSibling;
	while (nextElement && nextElement.parentElement === outerWrapper) {
		if (nextElement.classList.contains('items-start')) {
			return nextElement;
		}
		nextElement = nextElement.nextElementSibling;
	}

	let nextOuterWrapper = outerWrapper.nextElementSibling;
	while (nextOuterWrapper) {
		const responseWrapper = nextOuterWrapper.querySelector(':scope > .items-start');
		if (responseWrapper) {
			return responseWrapper;
		}
		nextOuterWrapper = nextOuterWrapper.nextElementSibling;
	}
	return null;
}


/**
 * Creates a generic tooltip setup for a button.
 * @param {HTMLElement} button - The button element.
 * @param {string} content - Initial tooltip content.
 * @param {string} [wrapperId] - Optional ID for the popper wrapper.
 * @returns {Object} Object containing tooltip elements and update function.
 */
function createTooltip(button, content, wrapperId = null) {
	const tooltipId = 'radix-' + Math.random().toString(36).substr(2, 9);
	const ariaSpan = document.createElement('span');
	ariaSpan.id = tooltipId;
	ariaSpan.role = 'tooltip';
	Object.assign(ariaSpan.style, {
		position: 'absolute', border: '0px', width: '1px', height: '1px',
		padding: '0px', margin: '-1px', overflow: 'hidden',
		clip: 'rect(0px, 0px, 0px, 0px)', whiteSpace: 'nowrap', overflowWrap: 'normal'
	});
	ariaSpan.innerHTML = `<p>${content}</p>`;

	const tooltipDiv = document.createElement('div');
	tooltipDiv.setAttribute('data-side', 'bottom');
	tooltipDiv.setAttribute('data-align', 'center');
	tooltipDiv.setAttribute('data-state', 'closed');
	tooltipDiv.className = CONSTANTS.TOOLTIP_CLASSES;
	tooltipDiv.innerHTML = `<p>${content}</p>`;
	tooltipDiv.appendChild(ariaSpan);

	const popperWrapper = document.createElement('div');
	if (wrapperId) popperWrapper.id = wrapperId;
	popperWrapper.setAttribute('data-radix-popper-content-wrapper', '');
	Object.assign(popperWrapper.style, {
		position: 'fixed', left: '0px', top: '0px', minWidth: 'max-content',
		zIndex: '50', '--radix-popper-transform-origin': '50% 0px'
	});
	popperWrapper.appendChild(tooltipDiv);
	document.body.appendChild(popperWrapper);
	popperWrapper.style.display = 'none';

	// Set CSS variables on tooltipDiv
	['--radix-tooltip-content-transform-origin', '--radix-tooltip-content-available-width',
		'--radix-tooltip-content-available-height', '--radix-tooltip-trigger-width',
		'--radix-tooltip-trigger-height'].forEach(varName => {
			tooltipDiv.style.setProperty(varName, `var(${varName.replace('--radix-tooltip-', '--radix-popper-')})`);
		});

	// Accessibility
	button.setAttribute('aria-describedby', tooltipId);
	button.title = content;

	// Hover events
	const showTooltip = () => {
		popperWrapper.style.display = 'block';
		popperWrapper.style.visibility = 'hidden';
		const buttonRect = button.getBoundingClientRect();
		const tooltipRect = tooltipDiv.getBoundingClientRect();
		const translateX = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;
		const translateY = buttonRect.bottom + 4;
		popperWrapper.style.transform = `translate(${translateX}px, ${translateY}px)`;
		popperWrapper.style.setProperty('--radix-popper-available-width', `${window.innerWidth}px`);
		popperWrapper.style.setProperty('--radix-popper-available-height', `${window.innerHeight}px`);
		popperWrapper.style.setProperty('--radix-popper-anchor-width', `${buttonRect.width}px`);
		popperWrapper.style.setProperty('--radix-popper-anchor-height', `${buttonRect.height}px`);
		popperWrapper.style.visibility = '';
		tooltipDiv.setAttribute('data-state', 'active-open');
	};

	button.addEventListener('mouseenter', showTooltip);
	button.addEventListener('mouseleave', () => tooltipDiv.setAttribute('data-state', 'closed'));

	tooltipDiv.addEventListener('animationend', () => {
		if (tooltipDiv.getAttribute('data-state') === 'closed') {
			popperWrapper.style.display = 'none';
		}
	});

	/**
	 * Updates the tooltip content.
	 * @param {string} newContent - New tooltip content.
	 */
	const updateContent = (newContent) => {
		const pElement = tooltipDiv.querySelector('p');
		if (pElement) pElement.textContent = newContent;
		ariaSpan.innerHTML = `<p>${newContent}</p>`;
		button.title = newContent;
	};

	return { tooltipDiv, popperWrapper, updateContent, showTooltip };
}

/**
 * Dropdown management.
 */
const dropdown = document.createElement('div');
dropdown.id = CONSTANTS.DROPDOWN_ID;
dropdown.className = CONSTANTS.DROPDOWN_CLASSES;
dropdown.style.position = 'absolute';
dropdown.style.display = 'none';
document.body.appendChild(dropdown);

// Stop propagation on dropdown clicks
dropdown.addEventListener('click', (e) => e.stopPropagation());

// Document click listener to close dropdown
document.addEventListener('click', (e) => {
	if (dropdown.style.display === 'block' && !dropdown.contains(e.target)) {
		dropdown.style.display = 'none';
	}
});

/**
 * Toggles the dropdown visibility and populates with user message previews.
 * @param {HTMLElement} button - The button that triggered the toggle.
 */
function toggleDropdown(button) {
	if (dropdown.style.display === 'block') {
		dropdown.style.display = 'none';
		return;
	}

	const userMessages = document.querySelectorAll(CONSTANTS.USER_MESSAGES_SELECTOR);
	dropdown.innerHTML = '';

	userMessages.forEach((msg) => {
		const preview = getPreview(msg.textContent);
		const response = findCorrespondingResponse(msg);

		const item = document.createElement('div');
		item.className = CONSTANTS.DROPDOWN_ITEM_CLASSES;
		item.style.display = 'flex';
		item.style.justifyContent = 'space-between';
		item.style.alignItems = 'center';

		const previewSpan = document.createElement('span');
		previewSpan.textContent = preview;
		previewSpan.style.width = '190px';
		previewSpan.style.whiteSpace = 'nowrap';
		previewSpan.style.overflow = 'hidden';
		previewSpan.style.WebkitMaskImage = 'linear-gradient(to right, black 170px, transparent 190px)';
		previewSpan.style.maskImage = 'linear-gradient(to right, black 170px, transparent 190px)';

		if (response) {
			const answerButton = document.createElement('button');
			answerButton.innerHTML = CONSTANTS.ANSWER_ICON_SVG;
			answerButton.style.background = 'none';
			answerButton.style.border = 'none';
			answerButton.style.cursor = 'pointer';
			answerButton.style.padding = '0';
			answerButton.style.marginLeft = '8px';
			answerButton.style.display = 'flex';
			answerButton.style.alignItems = 'center';
			answerButton.style.opacity = '0.6';
			answerButton.setAttribute('aria-label', CONSTANTS.ANSWER_TOOLTIP);
			answerButton.setAttribute('title', CONSTANTS.ANSWER_TOOLTIP);
			answerButton.type = 'button';

			answerButton.addEventListener('mouseenter', () => {
				answerButton.style.opacity = '1';
			});
			answerButton.addEventListener('mouseleave', () => {
				answerButton.style.opacity = '0.6';
			});

			answerButton.addEventListener('click', (e) => {
				e.stopPropagation();
				const offset = Math.round(window.innerHeight * 0.05);
				scrollToElementWithOffset(response, offset);
				dropdown.style.display = 'none';
			});

			item.appendChild(previewSpan);
			item.appendChild(answerButton);
		} else {
			item.appendChild(previewSpan);
		}

		item.addEventListener('click', () => {
			const offset = Math.round(window.innerHeight * 0.05);
			scrollToElementWithOffset(msg, offset);
			dropdown.style.display = 'none';
		});

		dropdown.appendChild(item);
	});

	const buttonRect = button.getBoundingClientRect();
	dropdown.style.top = `${buttonRect.bottom + window.scrollY}px`;
	dropdown.style.left = `${buttonRect.left + window.scrollX}px`;
dropdown.style.display = 'block';
	
	const dropdownRect = dropdown.getBoundingClientRect();
	
	const isMobile = window.innerWidth < 640 || 'ontouchstart' in window;

	if (isMobile) {
		dropdown.style.left = `${(window.innerWidth - dropdownRect.width) / 2}px`;
	} else {
		const spaceRight = window.innerWidth - buttonRect.left;
		if (dropdownRect.width > spaceRight - 16) {
			dropdown.style.left = `${buttonRect.right + window.scrollX - dropdownRect.width}px`;
		}
	}
}

/**
 * Button creation functions.
 */

/**
 * Creates and configures the PromptList button.
 * @param {HTMLElement} container - The container to insert the button into.
 * @returns {HTMLElement} The created button.
 */
function createPromptListButton(container) {
	const button = document.createElement('button');
	button.id = CONSTANTS.PROMPT_LIST_BUTTON_ID;
	button.innerHTML = `<span style="opacity: 1; transform: none;">${CONSTANTS.PROMPT_LIST_ICON_SVG}</span>`;
	button.classList.add(...CONSTANTS.BUTTON_COMMON_CLASSES, 'focus:bg-button-ghost-hover');
	button.type = 'button';
	Object.assign(button.style, CONSTANTS.BUTTON_STYLES);

	const { popperWrapper, tooltipDiv } = createTooltip(button, CONSTANTS.PROMPT_LIST_TOOLTIP);

	button.addEventListener('click', (e) => {
		e.stopPropagation();
		tooltipDiv.setAttribute('data-state', 'closed');
		popperWrapper.style.display = 'none';
		toggleDropdown(button);
	});

	container.insertBefore(button, container.firstChild);
	return button;
}

/**
 * Creates and configures the Section Collapse button.
 * @param {HTMLElement} container - The container to insert the button into.
 * @returns {HTMLElement} The created button.
 */
function createSectionToggleButton(container) {
	const button = document.createElement('button');
	button.id = CONSTANTS.SECTION_TOGGLE_BUTTON_ID;
	button.innerHTML = `<span style="opacity: 1; transform: none;">${CONSTANTS.COLLAPSE_ICON_SVG}</span>`;
	button.classList.add(...CONSTANTS.BUTTON_COMMON_CLASSES);
	button.type = 'button';
	Object.assign(button.style, CONSTANTS.BUTTON_STYLES);

	const { tooltipDiv, popperWrapper } = createTooltip(
		button,
		CONSTANTS.COLLAPSE_TOOLTIP,
		'section-toggle-tooltip-wrapper'
	);

	button.addEventListener('click', (e) => {
		e.stopPropagation();
		tooltipDiv.setAttribute('data-state', 'closed');
		popperWrapper.style.display = 'none';

		// Always collapse all open sections
		document.querySelectorAll(CONSTANTS.COLLAPSE_BUTTON_SELECTOR).forEach(btn => {
			if (btn.offsetParent !== null) btn.click();
		});
	});

	// Insert after PromptList button or at end
	const promptButton = document.querySelector(`#${CONSTANTS.PROMPT_LIST_BUTTON_ID}`);
	if (promptButton && promptButton.parentNode) {
		container.insertBefore(button, promptButton.nextSibling);
	} else {
		container.appendChild(button);
	}

	return button;
}

/**
 * Resets the Section Toggle button to collapse state.
 */
function resetSectionToggleToCollapse() {
	const button = document.querySelector(`#${CONSTANTS.SECTION_TOGGLE_BUTTON_ID}`);
	if (button) {
		const iconSvg = CONSTANTS.COLLAPSE_ICON_SVG;
		const tooltipText = CONSTANTS.COLLAPSE_TOOLTIP;
		button.innerHTML = `<span style="opacity: 1; transform: none;">${iconSvg}</span>`;
		button.title = tooltipText;

		// Update tooltip content
		const tooltipWrapper = document.getElementById('section-toggle-tooltip-wrapper');
		if (tooltipWrapper) {
			const tooltipDiv = tooltipWrapper.firstChild;
			const pElement = tooltipDiv.querySelector('p');
			if (pElement) pElement.textContent = tooltipText;
			const ariaSpan = tooltipDiv.querySelector('span[role="tooltip"]');
			if (ariaSpan) ariaSpan.innerHTML = `<p>${tooltipText}</p>`;
		}

		console.log('Section toggle reset to collapse state');
	}
}

/**
 * Adds or updates buttons in the UI based on current URL.
 */
function addButtons() {
	const isChatPage = CONSTANTS.CHAT_PATHS.some(path => window.location.pathname.startsWith(path));
	const promptButton = document.querySelector(`#${CONSTANTS.PROMPT_LIST_BUTTON_ID}`);
	const toggleButton = document.querySelector(`#${CONSTANTS.SECTION_TOGGLE_BUTTON_ID}`);
	const container = document.querySelector(CONSTANTS.BUTTON_CONTAINER_SELECTOR);

	if (!isChatPage) {
		if (promptButton) promptButton.style.display = 'none';
		if (toggleButton) toggleButton.style.display = 'none';
		console.log('Hiding buttons for URL:', window.location.pathname);
		return;
	}

	if (promptButton) promptButton.style.display = '';
	if (toggleButton) toggleButton.style.display = '';

	if (!container) return;

	if (!promptButton) createPromptListButton(container);
	if (!toggleButton) createSectionToggleButton(container);
}

/**
 * URL change handler for SPA navigation.
 */
let currentUrl = window.location.href;
function handleUrlChange() {
	const newUrl = window.location.href;
	if (newUrl !== currentUrl) {
		console.log('URL changed from', currentUrl, 'to', newUrl);
		currentUrl = newUrl;
		addButtons();
		resetSectionToggleToCollapse();
	}
}

// Event listeners for URL changes
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

// Fallback polling (every 1s)
setInterval(handleUrlChange, 1000);

// MutationObserver for dynamic UI updates
const observer = new MutationObserver(addButtons);
observer.observe(document.body, { childList: true, subtree: true });

// Initial run
addButtons();