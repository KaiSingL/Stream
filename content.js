// PromptList Extension for grok.com
// This script adds a "PromptList" button to the chat interface on https://grok.com/chat/*
// When clicked, it shows a dropdown with previews of user messages, allowing navigation to each message.

console.log('PromptList extension loaded');

// Function to generate message preview
function getPreview(text, wordCount = 10) {
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  if (!cleanedText) return '[Empty message]';
  const words = cleanedText.split(' ');
  return words.length > wordCount ? words.slice(0, wordCount).join(' ') + '...' : cleanedText;
}

// Create dropdown element
const dropdown = document.createElement('div');
dropdown.id = 'prompt-list-dropdown';
dropdown.className = 'z-50 rounded-2xl bg-surface-l4 border border-border-l1 text-primary backdrop-blur-md p-1 shadow-sm shadow-black/5 max-h-[80vh] overflow-auto min-w-36 space-y-0.5';
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
  const userMessages = document.querySelectorAll('.flex.flex-col.items-end .message-bubble');
  dropdown.innerHTML = '';
  userMessages.forEach((msg) => {
    const preview = getPreview(msg.textContent);
    const item = document.createElement('div');
    item.className = 'relative flex select-none items-center cursor-pointer px-3 py-2 rounded-xl text-sm outline-none focus:bg-button-ghost-hover';
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
  const buttonContainer = document.querySelector('.absolute.flex.flex-row.items-center.gap-0\\.5.ml-auto.end-3');
  if (buttonContainer && !document.querySelector('#prompt-list-button')) {
    console.log('Adding PromptList button');
    const promptListButton = document.createElement('button');
    promptListButton.id = 'prompt-list-button';
    promptListButton.textContent = 'PromptList';
    promptListButton.classList.add(
      'inline-flex', 'items-center', 'justify-center', 'gap-2', 'whitespace-nowrap',
      'text-sm', 'font-medium', 'leading-[normal]', 'cursor-pointer', 'focus-visible:outline-none',
      'focus-visible:ring-1', 'focus-visible:ring-ring', 'disabled:opacity-60', 'disabled:cursor-not-allowed',
      'transition-colors', 'duration-100', '[&_svg]:pointer-events-none', '[&_svg]:shrink-0',
      '[&_svg]:-mx-0.5', 'select-none', 'text-fg-primary', 'hover:bg-button-ghost-hover',
      '[&_svg]:hover:text-fg-primary', 'disabled:hover:bg-transparent', 'border', 'border-transparent',
      'rounded-full'
    );
    promptListButton.style.width = 'auto';
    promptListButton.style.padding = '0 1rem';
    promptListButton.style.height = '40px';
    buttonContainer.insertBefore(promptListButton, buttonContainer.firstChild);
    promptListButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(e.currentTarget);
    });
  }
}

// Set up MutationObserver to watch for changes and add the button when the container appears
const observer = new MutationObserver(() => {
  addPromptListButton();
});
observer.observe(document.body, { childList: true, subtree: true });

// Also try adding the button immediately in case the container is already present
addPromptListButton();