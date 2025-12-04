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

	// Button IDs
	PROMPT_LIST_BUTTON_ID: 'prompt-list-button',
	SECTION_TOGGLE_BUTTON_ID: 'section-toggle-button',

	// Dropdown
	DROPDOWN_ID: 'prompt-list-dropdown',
	DROPDOWN_CLASSES: 'z-50 rounded-2xl bg-surface-l4 border border-border-l1 text-primary backdrop-blur-md p-1 shadow-sm shadow-black/5 max-h-[80vh] overflow-auto min-w-36 space-y-0.5',
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
	COLLAPSE_TOOLTIP: 'Collapse code block'
};

/**
 * Utility functions.
 */

/**
 * Generates a preview of the text, limited to the specified word count.
 * @param {string} text - The input text.
 * @param {number} [wordCount=10] - Maximum number of words to include.
 * @returns {string} The preview text.
 */
function getPreview(text, wordCount = 10) {
	const cleanedText = text.replace(/\s+/g, ' ').trim();
	if (!cleanedText) return '[Empty message]';
	const words = cleanedText.split(' ');
	return words.length > wordCount
		? words.slice(0, wordCount).join(' ') + '...'
		: cleanedText;
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
		const preview = getPreview(msg.textContent, 5);
		const item = document.createElement('div');
		item.className = CONSTANTS.DROPDOWN_ITEM_CLASSES;
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

// Initial setup
addButtons();

// Utility functions (required by Boost)
function removeElementsByClass(classes) {
  classes.forEach(cls => {
    document.querySelectorAll(`.${cls}`).forEach(el => el.remove());
  });
}

function removeElementById(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

// Global paste handler (single instance)
let pasteHandler = null;

// Function to attach the paste handler to the current tiptap instance
function attachPasteHandler() {
  // Remove any previous listener to avoid duplicates
  if (pasteHandler) {
    document.removeEventListener('paste', pasteHandler, true);
    pasteHandler = null;
  }

  // Find the current tiptap editor element (most SPAs have only one)
  const tiptapElement = document.querySelector('.tiptap');
  if (!tiptapElement) return;

  // Only proceed if the editor instance is available on the element
  if (!tiptapElement.editor) {
    // Editor might not be initialized yet – wait a bit and retry once
    setTimeout(attachPasteHandler, 200);
    return;
  }

  // Define the handler
  pasteHandler = function (event) {
    const target = event.target;
    event.preventDefault();

    const plainText = event.clipboardData.getData('text/plain');

    // 1. INPUT / TEXTAREA
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      target.value = target.value.substring(0, start) + plainText + target.value.substring(end);
      target.selectionStart = target.selectionEnd = start + plainText.length;

      setTimeout(() => {
        target.focus();
        const endPos = target.value.length;
        target.setSelectionRange(endPos, endPos);
        document.execCommand('insertText', false, ' ');
        target.setSelectionRange(target.value.length, target.value.length);
      }, 10);

      return;
    }

    // 2. TIPTAP editor (including code blocks)
    if (target.closest('.tiptap')) {
      const editor = tiptapElement.editor;
      if (!editor) return;

      // Normalize line endings and tabs
      const normalizedText = plainText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '  ');

      // Detect if cursor is inside a code block
      const { from } = editor.state.selection;
      const $pos = editor.state.doc.resolve(from);
      const isInCodeBlock = $pos.parent.type.name === 'codeBlock';

      let contentToInsert;
      if (isInCodeBlock) {
        contentToInsert = normalizedText;
      } else {
        const lines = normalizedText.split('\n');
        const temp = document.createElement('div');
        lines.forEach(line => {
          const p = document.createElement('p');
          p.innerText = line;
          temp.appendChild(p);
        });
        contentToInsert = temp.innerHTML;
      }

      editor.commands.insertContent(contentToInsert);

      // Add trailing space after paste (mimics typing)
      setTimeout(() => {
        editor.commands.insertText(' ');
      }, 10);

      return;
    }

    // 3. Fallback for other contenteditable elements
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(plainText));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      target.appendChild(document.createTextNode(plainText));
    }

    // Add trailing space
    setTimeout(() => {
      target.focus();
      const sel = window.getSelection();
      const r = document.createRange();
      r.selectNodeContents(target);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
      document.execCommand('insertText', false, ' ');
    }, 10);
  };

  // Attach the new handler
  document.addEventListener('paste', pasteHandler, true);
}

// Initial attach
attachPasteHandler();

// Re-attach on SPA navigation (most common patterns)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Small delay to allow new page content and tiptap init to settle
    setTimeout(attachPasteHandler, 300);
  }
}).observe(document, { subtree: true, childList: true });

// Additional safety nets for frameworks that replace parts of the DOM
document.addEventListener('DOMContentLoaded', attachPasteHandler);
window.addEventListener('load', attachPasteHandler);