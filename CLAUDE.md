# CLAUDE.md

This file provides development guidance for Grille CipherLab, an educational rotating-grille cipher tool in the Day 024 series.

## Commands

- Run tests with `npm test` on Node.js 22 or newer.
- Serve locally with `python -m http.server 8000` when HTTP behavior is needed.
- The application also runs by opening `index.html` through `file://`.
- There are no npm dependencies, build steps, frameworks, or external runtime resources.

## Files

- `index.html`: the three ARIA tab panels and the help dialog.
- `style.css`: theme variables, the responsive layout, the paper, and the rotating card.
- `js/grille-cipher-logic.js`: pure key, normalization, cipher, sample-view, and formatting functions.
- `js/messages.js`: all strings emitted by JavaScript. Add future languages here.
- `js/samples.js`: book, Sandorf, and short-text samples.
- `js/ui-controller.js`: UI state and rendering derived from the pure logic.
- `js/main-refactored.js`: initialization and event registration.
- `js/notification-system.js`: persistent status messages.
- `js/keyboard-shortcuts.js`: shortcuts that defer to focused controls.
- `js/theme-manager.js`: light, dark, and automatic theme selection.
- `test/`: dependency-free `node:test` coverage, including all 262,144 keys and the Sandorf known answer.

Classic scripts load in the order declared at the end of `index.html`. Do not convert them to ES modules because direct `file://` use is supported.

## Cipher convention

- The grid is 6 by 6, with nine holes and four orientations.
- The initial placement is used first; clockwise rotation is the default.
- A nine-digit key lists the 3 by 3 quadrants in row order.
- Digits 1, 2, 3, and 4 mean upper-left, upper-right, lower-right, and lower-left.
- Encryption fills holes in row order and reads the fixed paper in row order.
- Text longer than 36 letters continues on the next paper with the same key.
- Short input is padded with X or random A-Z letters from `crypto.getRandomValues`.

Do not add alternative reading orders, keyword-derived keys, URL sharing, brute force, printable cards, or variable grille sizes in this release.

## State and rendering

Each encryption or decryption run keeps one progress value, `done`. `GrilleLogic.encryptionView` and `GrilleLogic.decryptionView` derive the complete visible state from it. Moving backward and forward must not mutate the cipher result.

The paper stays fixed. Only the card receives a CSS `transform`. The same key drives the 3 by 3 selectors, the 6 by 6 punch board, the nine-digit field, and the X/dot pattern.

JavaScript may write only `element.style.transform` for the card and `element.style.width` for progress bars. Use classes and the `hidden` attribute for everything else. Build DOM with `createElement`, `replaceChildren`, and `textContent`; do not use `innerHTML`.

## Messages and privacy

Every string emitted by JavaScript must go through `GrilleMessages.t(key, values)`. Keep Japanese out of other JavaScript source except comments. This leaves a clean path for a later English dictionary.

The application makes no external requests. Do not store plaintext, ciphertext, or keys in localStorage or URLs. Theme is the only stored value, and storage failures must not stop initialization.

## Tests

Keep tests aligned with README tables and browser behavior. In particular, preserve:

- the book ciphertext `TDHOAA PYHPEH UNFYAS MFNROH OLTIII NLMGYT`;
- the short-text round trip with 24 X padding letters;
- all 262,144 valid keys;
- the 18 Sandorf words and the 108-letter reverse reading;
- static checks for CSP, ARIA, classic scripts, allowed style writes, and contrast.
