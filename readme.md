# Minimal Sticky Notes

A beautiful, minimal sticky notes application with real-time Markdown support for distraction-free note-taking.

## Features

### Minimalist Design
- Clean, distraction-free interface
- Beautiful typography optimized for readability
- Multiple elegant themes
- Subtle animations for a pleasant experience

### Real-time Markdown Syntax
- Type `- ` or `* ` to create a bullet point
- Type `1. ` to create a numbered list
- Type `# ` through `######` for headings
- Type `> ` for blockquotes
- Type `- [ ] ` for unchecked task items
- Type `- [x] ` for checked task items
- Type `---` or `***` for horizontal rules
- Type triple backticks for code blocks

### Core Features
- Real-time saving
- Local storage
- Basic formatting toolbar (bold, italic, underline)
- Theme customization
- Font selection and size adjustment
- Window opacity control
- "Pin to top" functionality
- System tray integration

## Keyboard Shortcuts

- **⌘/Ctrl + B**: Bold text
- **⌘/Ctrl + I**: Italic text
- **⌘/Ctrl + U**: Underline text
- **Tab/Shift+Tab**: Indent/outdent in lists
- **Esc**: Close settings panel

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/minimal-sticky-notes.git
cd minimal-sticky-notes
```

2. Install dependencies:
```
npm install
```

3. Run the application in development mode:
```
npm start
```

4. Build the application for production:
```
npm run build
```

## Directory Structure

```
minimal-sticky-notes/
├── package.json         # Project configuration
├── main.js              # Electron main process
├── preload.js           # Secure bridge between renderer and main
├── index.html           # Application HTML layout
├── src/
│   ├── renderer.js      # Main renderer process script
│   ├── note-manager.js  # Note management functionality
│   ├── settings-manager.js # Settings management
│   ├── markdown-handler.js # Markdown syntax processing
│   └── styles/
│       ├── main.css     # Main application styles
│       ├── themes.css   # Theme definitions
│       ├── animations.css # Animation definitions
│       └── utilities.css # Utility classes
├── assets/
│   └── icons/
│       ├── app-icon.svg # Application icon
│       └── tray-icon.svg # Tray icon
└── README.md            # This file
```

## License

MIT

---

Built with ❤️ for minimalist note-taking.