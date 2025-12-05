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
        contentToInsert = temp.innerText;
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
    document.addEventListener('DOMContentLoaded', attachPasteHandler);
	window.addEventListener('load', attachPasteHandler);
  }
}).observe(document, { subtree: true, childList: true });

// Additional safety nets for frameworks that replace parts of the DOM
document.addEventListener('DOMContentLoaded', attachPasteHandler);
window.addEventListener('load', attachPasteHandler);