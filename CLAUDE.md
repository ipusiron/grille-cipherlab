# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Rotating Grille Cipher visualization tool** - an educational web application that demonstrates the historical rotating grille cipher technique. It's part of the "100 Security Tools Created with Generative AI" project (Day 024).

## Tech Stack

- **Pure vanilla JavaScript** - No frameworks or build tools
- **Static HTML/CSS/JS** - Can be served directly without compilation
- **No package manager** - No npm, yarn, or other dependency management
- **No external JavaScript dependencies** - Only uses Google Fonts for styling

## Development Commands

Since this is a static site with no build process:

- **Run locally**: `python -m http.server 8000` or `npx serve .`
- **Deploy**: Upload the files to any static hosting service
- **No build/test/lint commands** - The project has no build pipeline or test suite

## Architecture

The application uses a modular JavaScript architecture with global scope classes:

```
js/
├── config.js              # Central configuration (CONFIG object, frozen with Object.freeze)
├── grille-cipher-logic.js # Pure cipher logic (GrilleCipher class)
├── notification-system.js # User notifications (NotificationSystem, ValidationHelper, ErrorMessages)
├── ui-controller.js       # UI state & rendering (UIController class)
├── keyboard-shortcuts.js  # Keyboard handling (KeyboardShortcutManager class)
├── theme-manager.js       # Dark mode support (ThemeManager class)
└── main-refactored.js     # App initialization and event binding
```

**Load Order**: Scripts must load in this order (defined in index.html) since later scripts depend on earlier ones.

### Key Classes

- **`GrilleCipher`**: Pure cipher logic - grille generation, rotation, encrypt/decrypt operations
- **`UIController`**: Manages all UI state in `this.state` object, renders grids, handles step-by-step visualization
- **`NotificationSystem`**: Static methods for displaying error/warning/success/info messages
- **`ValidationHelper`**: Input validation for matrix values and text input

### Configuration

All configurable values are centralized in `CONFIG` object (`config.js`):
- `GRILLE_SIZE` (6), `BASE_SIZE` (3), `ROTATION_COUNT` (4)
- `DOM_IDS` - All element IDs as constants
- `CSS_CLASSES` - All CSS class names
- `KEYBOARD_SHORTCUTS` - Key bindings
- `DEFAULT_BASE_MATRIX` - Initial 3×3 matrix values

## Key Implementation Details

1. **Grille Generation**: `GrilleCipher.generateGrille()` creates 6×6 grille from 3×3 base matrix. Each value (1-4) indicates which rotation step that cell becomes a hole.

2. **Rotation Logic**: `rotateMatrix()` uses transposition + reversal for 90° rotations

3. **Step-by-step Visualization**: `encryptStep()` and `decryptStep()` process one rotation at a time, returning positions for UI animation

4. **State Management**: `UIController.state` tracks encryption/decryption progress, grids, and current grille

## Important Notes

- This is an **educational tool** for demonstrating cryptographic concepts, not for actual security use
- Default example text: "HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY"
- Documentation is primarily in Japanese (README.md)
- Licensed under MIT License (Copyright 2025 ipusiron)