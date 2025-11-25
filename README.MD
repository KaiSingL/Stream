# Stream: Grok Prompt Navigator (Browser Extension)

## Overview
Stream is a Manifest V3 browser extension designed to enhance the user experience on grok.com's chat and project pages (`https://grok.com/chat/*` and `https://grok.com/project/*`). It injects a content script that adds two buttons to the UI: a "My Prompts" button and a "Code Block Expand/Collapse Toggle" button. The "My Prompts" button displays a dropdown list of previews for the user's previous messages in the conversation, while the "Section Toggle" button allows collapsing or expanding all sections in the conversation. The extension is built using vanilla JavaScript for DOM manipulation, event handling, and dynamic UI updates, with no external library dependencies.

<p align="center">
  <img src="./images/ButtonShowcase.png" alt="Button Showcase" />
</p>

## Features
<p align="center">
  <img src="./images/PromptListDemo.png" alt="Prompt List Demo" />
</p>

- **My Prompts Button**: Adds a button to the grok.com chat and project pages for quick access to user message previews.
- **Dropdown List**: Displays a scrollable dropdown with previews of user messages, limited to 5 words per preview for brevity.
- **Smooth Scrolling**: Clicking a preview scrolls smoothly to the corresponding message in the conversation.
- **Code Block Expand/Collapse Button**: Adds a button to collapse or expand all code blocks in the conversation with a single click.
- **Dynamic UI Handling**: Uses a `MutationObserver` to ensure buttons persist across dynamic UI updates.
- **Lightweight Design**: No background scripts, external resources, or additional permissions required.

## Installation
1. Clone or download the repository.
2. Open your browser's extension management page (e.g., `chrome://extensions/` in Chrome).
3. Enable "Developer mode".
4. Click "Load unpacked" and select the folder containing the extension files (`manifest.json`, `content.js`, and icon files).
5. Navigate to `https://grok.com/chat/*` or `https://grok.com/c/*` or `https://grok.com/project/*` to see the "My Prompts" button in action.

## Usage
- On grok.com chat or project pages, locate the "My Prompts" and "Code Block Expand/Collapse" buttons in the UI.
- **My Prompts Button**: Click to open a dropdown showing previews of your previous messages (up to 5 words each). Click a preview to scroll smoothly to the corresponding message in the conversation. Click outside the dropdown to close it.
- **Code Block Expand/Collapse Button**: Click to toggle between collapse and expand modes:
  - In collapse mode (icon pointing down), clicking will collapse all open code blocks in the conversation.
  - In expand mode (icon pointing up), clicking will expand all collapsed code blocks in the conversation.
  - The button title and icon change to indicate the current mode.

## Development Notes
- The extension avoids external libraries to keep it lightweight and maintainable.
- Although thorough test was performed on grok.com, future changes to the site's UI or structure may affect compatibility. No guarantee of continued functionality is provided.