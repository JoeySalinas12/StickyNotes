# Sticky Notes

A sleek, professional, modern note-taking application for Mac that functions like a sticky note with rich text capabilities.

## Features

- Rich text editing (bold, italic, underline)
- Automatic bulleted and numbered lists with indentation
- Multiple themes (Light, Dark, Sepia, Nord, Solarized)
- Customizable font and font size
- Automatic saving
- Minimalist design
- System tray integration
- Lightweight performance

## Tech Stack

This application is built with:
- Electron
- JavaScript
- HTML/CSS

## Installation

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/sticky-notes.git
cd sticky-notes
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

## Keyboard Shortcuts

- **Cmd/Ctrl + B**: Bold text
- **Cmd/Ctrl + I**: Italic text
- **Cmd/Ctrl + U**: Underline text
- **Tab**: Indent list item
- **Shift + Tab**: Outdent list item

## Directory Structure

```
sticky-notes-app/
├── package.json         # Project configuration and dependencies
├── main.js              # Electron main process
├── preload.js           # Secure bridge between renderer and main process
├── index.html           # Application HTML layout
├── src/
│   ├── renderer.js      # Main renderer process script
│   ├── noteManager.js   # Handles note content loading/saving
│   ├── settingsManager.js # Handles application settings
│   └── styles/
│       ├── main.css     # Main application styles
│       └── themes.css   # Theme definitions
├── assets/
│   └── icons/
│       ├── app-icon.png # Application icon
│       └── tray-icon.png # Tray icon
└── README.md            # This file
```

## License

MIT