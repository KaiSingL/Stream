# Stream: Browser Extension for Grok

This browser extension adds a **"My Prompts"** button to the chat interface on [grok.com/chat](https://grok.com/chat). Clicking the button displays a dropdown list of your previous user messages, allowing you to quickly navigate to any message in the conversation.

## Features

- **My Prompts Button:**  
  Adds a visually consistent button to the chat UI for easy access.

- **Dropdown Navigation:**  
  Clicking the button shows a dropdown with previews (first 5 words) of your previous user messages. If a message is longer than 5 words, it is truncated with `...`.

- **Quick Scroll:**  
  Click any item in the dropdown to smoothly scroll to that message in the chat.

- **Automatic UI Integration:**  
  Uses a MutationObserver to ensure the button appears even if the chat UI reloads or updates.

## Installation

1. Clone or download this repository.
2. Load the extension in your browser:
   - For Chrome/Edge:
     1. Go to `chrome://extensions/`
     2. Enable "Developer mode"
     3. Click "Load unpacked" and select this project folder
   - For Firefox:
     1. Go to `about:debugging#/runtime/this-firefox`
     2. Click "Load Temporary Add-on" and select the `content.js` file

## Usage

1. Go to [https://grok.com/chat](https://grok.com/chat)
2. You will see a **"My Prompts"** button in the chat controls.
3. Click the button to open a dropdown of your previous user messages.
4. Click any message preview to scroll to that message in the chat.

## Development

- All logic is contained in `content.js`.
- The extension uses vanilla JavaScript and injects UI elements directly into the page.
- Styling is applied using Tailwind CSS utility classes (as used by Grok).

## Customization

- To change the number of preview words, edit the `getPreview` function in `content.js`.
- To adjust styling, modify the class lists in the relevant DOM creation code.

## Building the Extension for Safari

To build and run the extension in Safari, follow these steps:

1. **Enable Safari Extension Developer Mode**

   - Open Safari.
   - Go to `Safari` > `Settings` (or `Preferences`) > `Advanced`.
   - At the bottom, check **"Show Develop menu in menu bar"**.
   - In the menu bar, go to `Develop` > **"Allow Unsigned Extensions"** and enable it.

2. **Convert the Extension for Safari**

   - Open Terminal and navigate to your project directory:
     ```sh
     cd /path/to/your/project
     ```
   - Run the Safari Web Extension Converter:
     ```sh
     xcrun safari-web-extension-converter /path/to/this/extension --bundle-identifier com.example.myextension --swift --macos-only
     ```
   - This will generate a new Xcode project for your extension.

3. **Build and Run in Xcode**
   - Open the generated Xcode project.
   - Select your target and click **Run** to build and load the extension in Safari.

**Note:** You may need to sign the extension for distribution. For development, enabling unsigned extensions is sufficient.

## License

This project is licensed under the [MIT License](./LICENSE.txt).

---

**Note:** This extension is not affiliated with or endorsed by Grok or its parent companies.
