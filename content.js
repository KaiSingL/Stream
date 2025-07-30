// PromptList Extension for grok.com
// This script adds a "PromptList" button to the chat and project interfaces on https://grok.com/chat/* and https://grok.com/project/*
// When clicked, it shows a dropdown with previews of user messages, allowing navigation to each message.

// console.log('PromptList extension loaded');

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

// Add PromptList button
function addPromptListButton() {
	// Check if the current URL starts with /chat/ or /project/
	const isChat =
		window.location.pathname.startsWith('/chat/') ||
		window.location.pathname.startsWith('/project/');

	// If not on /chat/ or /project/, hide the button if it exists and return
	const existingButton = document.querySelector('#prompt-list-button');
	if (!isChat) {
		if (existingButton) {
			existingButton.style.display = 'none';
			console.log('Hiding button for URL:', window.location.pathname); // Debug
		}
		return;
	}

	// If button should be shown, ensure it's visible or create it
	const buttonContainer = document.querySelector(
		'.absolute.flex.flex-row.items-center.gap-0\\.5.ms-auto.end-3'
	);
	if (buttonContainer && !existingButton) {
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
			'ml-2',
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
	} else if (existingButton) {
		// Ensure the button is visible if it exists and should be shown
		existingButton.style.display = '';
	}
}

// Set up MutationObserver to watch for changes and add the button when the container appears
const observer = new MutationObserver(() => {
	addPromptListButton();
});
observer.observe(document.body, { childList: true, subtree: true });

// Also try adding the button immediately in case the container is already present
addPromptListButton();