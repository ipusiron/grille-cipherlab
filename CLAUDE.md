# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Rotating Grille Cipher visualization tool** - a simple, educational web application that demonstrates the historical rotating grille cipher technique. It's part of the "100 Security Tools Created with Generative AI" project (Day 024).

## Tech Stack

- **Pure vanilla JavaScript** - No frameworks or build tools
- **Static HTML/CSS/JS** - Can be served directly without compilation
- **No package manager** - No npm, yarn, or other dependency management
- **No external JavaScript dependencies** - Only uses Google Fonts for styling

## Architecture

The application uses a simple, monolithic structure:

- `index.html` - Contains all UI elements with a tab-based interface
- `main.js` - All JavaScript logic in a single file using global scope
- `style.css` - All styling in one file
- No module system or component architecture

Key architectural patterns:
- **Global state management** through variables like `plainChars`, `encryptionStep`, etc.
- **Event-driven UI** with event listeners on tabs and buttons
- **Matrix operations** for rotating the grille pattern
- **Step-by-step visualization** for encryption/decryption process

## Development Commands

Since this is a static site with no build process:

- **Run locally**: Open `index.html` directly in a browser or use a simple HTTP server (e.g., `python -m http.server`)
- **Deploy**: Upload the files to any static hosting service
- **No build/test/lint commands** - The project has no build pipeline or test suite

## Key Implementation Details

1. **Grille Pattern Generation**: The `generateGrillePattern()` function creates a 6×6 grille from a 3×3 base matrix with specific bit patterns

2. **Rotation Logic**: Uses matrix transposition and reversal to achieve 90° rotations in `rotateMatrix90()`

3. **Cipher Operations**: 
   - Encryption places characters through grille holes across 4 rotations
   - Decryption reads characters through the grille pattern

4. **UI State Management**: Tab switching is handled by `showTab()` which manages display states

## Important Notes

- This is an **educational tool** for demonstrating cryptographic concepts, not for actual security use
- The default example text is "HAPPY HOLIDAYS FROM THE HUNTINGTON FAMILY"
- Documentation is primarily in Japanese (README.md)
- Licensed under MIT License (Copyright 2025 ipusiron)