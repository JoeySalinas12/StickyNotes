# Calming Sticky Notes

A beautiful, calming, and intuitive note-taking application designed for thinkers, dreamers, and doers who need a space to capture thoughts without friction.

## Features

### Ultra-Minimalist UX
- Clean, distraction-free interface
- Quick keyboard shortcuts for common actions
- Toggle ultra-minimal mode to hide all interface elements until needed
- Focus mode for a zen-like writing experience

### Gorgeous Design
- Soft, calming color palettes
- Beautiful typography optimized for readability
- Premium themes including "Morning Light," "Twilight Focus," and "Forest Calm"
- Subtle animations and transitions for a pleasant experience

### Lightweight Syncing
- Optional account-free cloud syncing
- End-to-end encryption for privacy
- Works fully offline by default
- Simple sharing via secure links

### Smart Organization
- Automatic tagging with the #hashtag system
- Smart date-based organization
- Search across all your notes
- Intuitive sidebar for quick note browsing

### Calm Tech Philosophy
- Gentle reminders to review your thoughts
- No addictive gamification elements
- Emphasis on mindfulness and focus
- Respectful of your attention and privacy

### Subtle Collaboration
- Share individual notes with collaborators
- No account required for viewing shared notes
- Optional edit permissions
- Real-time updates (when online)

### Offline-First
- Works fully offline
- Automatically syncs when connection is available
- No dependencies on external services
- Export/import functionality for backup

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/calming-sticky-notes.git
cd calming-sticky-notes
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

- **⌘/Ctrl + N**: New note
- **⌘/Ctrl + S**: Save note
- **⌘/Ctrl + B**: Bold text
- **⌘/Ctrl + I**: Italic text
- **⌘/Ctrl + U**: Underline text
- **⌘/Ctrl + Shift + F**: Toggle focus mode
- **⌘/Ctrl + \\**: Toggle sidebar
- **⌘/Ctrl + F**: Search notes
- **Tab/Shift+Tab**: Indent/outdent in lists
- **#text + space**: Create tag
- **# + space**: Create heading

## Directory Structure

```
calming-sticky-notes/
├── package.json         # Project configuration
├── main.js              # Electron main process
├── preload.js           # Secure bridge between renderer and main
├── index.html           # Application HTML layout
├── src/
│   ├── renderer.js      # Main renderer process script
│   ├── note-manager.js  # Note management functionality
│   ├── settings-manager.js # Settings management
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

---

Built with ❤️ for mindful productivity.