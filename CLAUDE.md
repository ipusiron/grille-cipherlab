# CLAUDE.md

This file provides development guidance for Grille CipherLab, an educational rotating-grille cipher tool in the Day 024 series.

## Commands

- Run tests with `npm test` on Node.js 22 or newer.
- Serve locally with `python -m http.server 8000` when HTTP behavior is needed.
- The application also runs by opening `index.html` through `file://`.
- There are no npm dependencies, build steps, frameworks, or external runtime resources.

## Files

- `index.html`: four ARIA tab panels, the help dialog, and print-only grille markup.
- `style.css`: theme variables, responsive layout, the paper, rotating card, and print sheet.
- `js/grille-cipher-logic.js`: pure key, normalization, cipher, sample-view, and formatting functions.
- `js/grille-solver-logic.js`: pure workbench, equivalence-class, scoring, and brute-force functions.
- `js/ngram-models.js`: generated English and French trigram data; do not edit or regenerate it.
- `js/share.js`: pure URL-hash parsing and formatting.
- `js/messages.js`: Japanese and English dictionaries. Add every new key to both languages.
- `js/samples.js`: book, Sandorf, and short-text samples.
- `js/ui-controller.js`: UI state and rendering derived from the pure logic.
- `js/main-refactored.js`: initialization and event registration.
- `js/notification-system.js`: persistent status messages.
- `js/keyboard-shortcuts.js`: shortcuts that defer to focused controls.
- `js/theme-manager.js`: light, dark, and automatic theme selection.
- `test/`: 13 dependency-free `node:test` files, including all keys, known answers, solving, sharing, and i18n.

Classic scripts load in the order declared at the end of `index.html`. Do not convert them to ES modules because direct `file://` use is supported.

## Cipher convention

- The grid is 6 by 6, with nine holes and four orientations.
- The initial placement is used first; clockwise rotation is the default.
- A nine-digit key lists the 3 by 3 quadrants in row order.
- Digits 1, 2, 3, and 4 mean upper-left, upper-right, lower-right, and lower-left.
- Encryption fills holes in row order and reads the fixed paper in row order.
- Text longer than 36 letters continues on the next paper with the same key.
- Short input is padded with X or random A-Z letters from `crypto.getRandomValues`.

Do not add alternative reading orders, keyword-derived keys, or variable grille sizes in this release.

## Solver and phase 2 features

- Brute force groups 262,144 keys into 65,536 classes of four rotated keys.
- English and French trigram scores use rounded `log10(probability) * 100` values and language-specific floors.
- The browser processes 4,096 keys per event-loop slice and remains cancellable without a Web Worker.
- Print output uses 18 mm cells. Shared URLs contain only `#k=...&d=...`.
- The Day009 link is inert until the user opens it; no background request is allowed.

## State and rendering

Each encryption or decryption run keeps one progress value, `done`. `GrilleLogic.encryptionView` and `GrilleLogic.decryptionView` derive the complete visible state from it. Moving backward and forward must not mutate the cipher result.

The paper stays fixed. Only the card receives a CSS `transform`. The same key drives the 3 by 3 selectors, the 6 by 6 punch board, the nine-digit field, and the X/dot pattern.

JavaScript may write only `element.style.transform` for the card and `element.style.width` for progress bars. Use classes and the `hidden` attribute for everything else. Build DOM with `createElement`, `replaceChildren`, and `textContent`; do not use `innerHTML`.

## Messages and privacy

Every string emitted by JavaScript must go through `GrilleMessages.t(key, values)`. Keep Japanese out of other JavaScript source except comments. New keys must be added to both `ja` and `en`; tests require identical key sets and no Japanese characters in English values.

The application makes no external requests. Do not store plaintext, ciphertext, or keys in localStorage or URLs. Only theme and language are stored, and storage failures must not stop initialization.

## Tests

Keep tests aligned with README tables and browser behavior. In particular, preserve:

- the book ciphertext `TDHOAA PYHPEH UNFYAS MFNROH OLTIII NLMGYT`;
- the short-text round trip with 24 X padding letters;
- all 262,144 valid keys;
- the 18 Sandorf words and the 108-letter reverse reading;
- static checks for CSP, ARIA, classic scripts, allowed style writes, and contrast.
- the model hash, reference brute-force ranks, URL sharing, and matching Japanese/English dictionaries.
