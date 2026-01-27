# AGENTS.md - Development Guidelines

## Project Overview
Browser extension (Manifest V3) for grok.com that adds navigation buttons to chat interface. Vanilla JavaScript content script with no external dependencies.

## Build/Lint/Test Commands

**No Build System**: This project uses vanilla JavaScript with no build step.

**Manual Testing Required**:
1. Load extension: Open `chrome://extensions/`, enable Developer Mode, click "Load unpacked", select this directory
2. Test on grok.com: Navigate to `https://grok.com/chat/`, `https://grok.com/c/`, or `https://grok.com/project/`
3. Verify functionality: Click "My Prompts" button and "Code Block Collapse" button

**No Automated Tests**: All testing is manual. Test across different grok.com pages and verify SPA navigation works correctly.

## Code Style Guidelines

### Formatting
- Use **tabs** for indentation (existing code uses 4-space width tabs)
- Flexible line length - no strict limits
- Trailing commas in objects/arrays when multiline
- One blank line between sections and functions

### Naming Conventions
- **Constants**: UPPER_SNAKE_CASE, grouped in `CONSTANTS` object at top of file
- **Functions/Variables**: camelCase
- **Event Handlers**: Descriptive names like `showTooltip`, `handleUrlChange`
- **Selectors**: Descriptive names ending with `_SELECTOR`
- **Classes**: PascalCase (rare, mostly using camelCase in this codebase)

### Comments & Documentation
- Use **JSDoc** style for all function definitions with `@param` and `@returns`
- Inline comments only for complex logic or non-obvious behavior
- Section headers with `/** Section Title */` for code organization

### Code Organization
1. Constants (selectors, classes, styles, icons, tooltips)
2. Utility functions (text processing, scrolling, DOM helpers)
3. Feature-specific functions (dropdown management, button creation)
4. Event listeners and initialization

### DOM Best Practices
- Use `document.querySelector()` and `document.querySelectorAll()` for element selection
- Prefer `classList.add/remove` over className manipulation
- Use `addEventListener` for event handling, never inline onclick
- Use `MutationObserver` for dynamic UI updates and SPA navigation
- Always clean up event listeners when elements are removed

### Accessibility Standards
- Include `aria-label` or `aria-describedby` on interactive elements
- Add `role="tooltip"` for tooltip elements
- Use semantic HTML elements
- Ensure keyboard navigation support
- Add `title` attribute as fallback for tooltips

### Error Handling
- Check for null/undefined before DOM operations: `if (!container) return;`
- Provide fallback behavior when selectors fail: `element.scrollIntoView({ behavior: 'smooth' })` as fallback
- Log important state changes: `console.log('PromptList extension loaded')`

### SPA Navigation
- Use `popstate` event listener for back/forward navigation
- Override `history.pushState` and `history.replaceState` to detect navigation
- Implement fallback polling (1s interval) for reliable detection
- Reset UI state on URL changes

## Git Commit Style

**Follow Conventional Commits with scope**:

Format: `type(scope): description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring without behavior change
- `docs`: Documentation changes
- `build`: Build system or dependency changes
- `style`: Code style changes (formatting, missing semicolons)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Scopes**: Relevant module or area, e.g., `button`, `dropdown`, `tooltip`, `navigation`, `manifest`

**Examples**:
- `feat(button): add scroll offset to avoid toolbar overlap`
- `fix(dropdown): correct position calculation on window resize`
- `refactor(navigation): consolidate URL change detection logic`
- `docs(readme): update installation instructions`
- `build(manifest): bump version to 1.9.2`

**Subject**: Keep concise, use imperative mood ("add" not "added", "fix" not "fixed")

**Body**: Optional, add context if change is complex. Wrap lines at flexible length, no strict limits.

## Development Notes

- This extension targets grok.com's DOM which may change without notice
- UI selectors may need updates if grok.com changes their class names
- All CSS classes and IDs used are from grok.com's Tailwind CSS setup
- Icons are inline SVG strings to avoid external dependencies
- Extension runs in MAIN world for direct DOM access
- Runs at `document_end` to ensure DOM is ready