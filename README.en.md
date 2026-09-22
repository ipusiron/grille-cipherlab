English · [Japanese](README.md)

# Grille CipherLab - Turning Grille Cipher Tool

[![GitHub stars](https://img.shields.io/github/stars/ipusiron/grille-cipherlab)](https://github.com/ipusiron/grille-cipherlab/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ipusiron/grille-cipherlab)](https://github.com/ipusiron/grille-cipherlab/network/members)
[![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/grille-cipherlab)](https://github.com/ipusiron/grille-cipherlab/commits/main)
[![GitHub license](https://img.shields.io/github/license/ipusiron/grille-cipherlab)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://ipusiron.github.io/grille-cipherlab/)

**Day024 - 100 Security Tools Built with Generative AI**

Grille CipherLab is a client-side learning tool for the 6×6 turning grille cipher. It creates a grille, demonstrates encryption and decryption, and provides a workbench and brute-force solver.

## 🌐 Demo

<https://ipusiron.github.io/grille-cipherlab/>

## 📸 Screenshots

![Create grille](assets/screenshot.png)

> *A nine-digit key and its 6×6 hole pattern.*

![Encrypt](assets/screenshot2.png)

> *The second turn of the book example.*

![Decrypt](assets/screenshot3.png)

> *The Mathias Sandorf example after reversing the recovered text.*

![Dark mode](assets/screenshot4.png)

> *Encryption in dark mode.*

![Mathias Sandorf brute force](assets/screenshot5.png)

> *French scoring with both directions and reverse scoring ranks the correct class first.*

![Solving workbench](assets/screenshot6.png)

> *The book ciphertext with readings for all four turns.*

![English UI](assets/screenshot7.png)

> *The English Encrypt tab on the second turn of the book example.*

## ✨ Features

- Four equivalent ways to define a grille
- Animated multi-block encryption and decryption
- Manual solving workbench and trigram-scored brute force
- Printable 18 mm grille, key-sharing URL, and Day009 frequency-analysis link
- Japanese and English UI
- Interactive workbench with four-turn readings
- Brute force over 65,536 equivalent grille classes
- Printable 18 mm grille, sharing URL, and Day009 handoff

## 📖 Usage

Create or load a grille, choose the turning direction, and use the Encrypt, Decrypt, or Solve tab. In Solve, load ciphertext into the workbench to move holes manually, or select a language and run brute force. The same key and direction are required for decryption.

## 🔑 Key notation

A key contains nine digits from 1 to 4. Each digit chooses one cell from a rotational orbit in the 3×3 base matrix.

## 🧩 Verify with examples

The bundled book, short-text, and Mathias Sandorf examples provide known outputs for checking the algorithm.

## 🔓 Try solving

Four keys related by a 90° rotation represent the same grille class. Brute force groups 262,144 keys into 65,536 classes and reports the highest-scoring member of each class. Mathias Sandorf reverses the reading, so it requires reverse scoring.

| Ciphertext | Language | First canonical / best key | Score | Reversed |
|---|---|---|---:|---|
| TDHOAA PYHPEH UNFYAS MFNROH OLTIII NLMGYT | English | 134432211 / 312214433 | -11694 | No |
| XAAXWT TNXAXX XXXCXX XXXXXK ATXDXX XXXXXX | English | 134432211 / 241143322 | -16400 | No |
| IHNALZ…ARTUEE (108 letters) | French | 142213124 / 213324231 | -34782 | Yes |

The English model derives from 5,141,270 letters in ten Project Gutenberg works used by Day018 Cipher Climb. The French model derives from 3,228,303 letters in six Project Gutenberg works. Scores rank candidates; the tool does not claim that no answer exists below a threshold.

## ⌨️ Keyboard shortcuts

When focus is outside an input or control, Enter starts the active operation, Space advances, arrow keys step, Home returns to the start, and Ctrl+C copies completed ciphertext.

## 🎨 Theme and help

The header controls switch the language and theme and open the help dialog. Theme and language preferences are stored when storage is available.

## 🌀 About the turning grille cipher

A turning grille is a transposition cipher. Nine holes in a 6×6 stencil expose every one of the 36 cells exactly once over four rotations.

## 🔍 Turning grille vs. Cardan grille

A turning grille repeatedly rotates one stencil. A Cardan grille usually exposes selected positions once and then fills the remaining text separately.

## 📘 Related book

The book example follows *Codes, Ciphers & Other Cryptic & Clandestine Communication*.

## 🔬 Technical details

The application uses classic scripts and no dependencies, so it also works from `file://`. Pure cipher and solver modules are shared with the Node test suite. Brute force scores trigrams with rounded `log10(probability) × 100` values and a language-specific floor for unseen trigrams. The browser processes 4,096 keys per slice to keep progress and cancellation responsive.

## 🖨️ Print and use on paper

Print grille produces only a 6×6 grille and blank sheet with 18 mm cells. Cut out the nine black cells, keep the triangle at the top, and use 100% print scale.

## 🔗 Share keys and use Day009

A sharing URL such as `#k=241143322&d=cw` contains only the key and direction. It never includes plaintext or ciphertext.

A turning grille is a transposition cipher, so ciphertext has the same letter frequencies as plaintext. Open the ciphertext in the Day009 Frequency Analyzer to compare it with common English frequencies such as E, T, and A. No external request occurs until the link is opened.

## 🔒 Security

All processing is local. A restrictive CSP blocks network connections, and generated UI content is inserted with DOM APIs and `textContent`.

## 🧪 Tests

Run `npm test` with Node.js 22 or later. The dependency-free suite checks cipher logic, samples, views, security properties, layout, contrast, n-gram data, solving ranks, sharing, i18n, and both README files.

## 📁 Directory structure

```text
grille-cipherlab/                      # Web tool for exploring the turning grille cipher
├── .github/                           # GitHub configuration
│   └── workflows/                     # GitHub Actions workflows
│       └── test.yml                   # Runs npm test on push and pull requests
├── .gitignore                         # Git ignore rules
├── .nojekyll                          # Disables Jekyll processing on Pages
├── assets/                            # Favicon and README images
│   ├── favicon.svg                    # Favicon showing a grille and three holes
│   ├── screenshot.png                 # Create-grille tab
│   ├── screenshot2.png                # Encrypt tab on the second turn
│   ├── screenshot3.png                # Decrypt tab with reversed Sandorf text
│   ├── screenshot4.png                # Encrypt tab in dark mode
│   ├── screenshot5.png                # Sandorf brute-force result
│   ├── screenshot6.png                # Book-example solving workbench
│   └── screenshot7.png                # Encrypt tab in English
├── CLAUDE.md                          # Development guidance for AI agents
├── index.html                         # Markup for four tabs, help, and the print sheet
├── js/                                # Classic JavaScript loaded in document order
│   ├── config.js                      # UI constants and element identifiers
│   ├── grille-cipher-logic.js         # Pure key, hole, encryption, decryption, and view logic
│   ├── grille-solver-logic.js         # Equivalence classes, scoring, workbench, and brute force
│   ├── ngram-models.js                # Generated English and French trigram statistics
│   ├── share.js                       # Key and direction in the URL hash
│   ├── keyboard-shortcuts.js          # Shortcuts active outside interactive controls
│   ├── main-refactored.js             # Initialization, sharing, and language switching
│   ├── messages.js                    # Japanese and English dictionaries and formatter
│   ├── notification-system.js         # Status messages rendered with textContent
│   ├── samples.js                     # Three bundled examples
│   ├── theme-manager.js               # Theme switching and persistence
│   └── ui-controller.js               # UI state, workbench, and result rendering
├── LICENSE                            # MIT License
├── package.json                       # Dependency-free npm test command
├── README.md                          # Japanese documentation
├── README.en.md                       # English documentation
├── style.css                          # Theme, responsive, and print styles
├── technical_info.md                  # Detailed implementation notes
└── test/                              # Dependency-free node --test suite
    ├── contrast.test.js               # Color contrast checks
    ├── format.test.js                 # Line length and readability checks
    ├── html.test.js                   # CSP, ARIA, IDs, and inline-attribute checks
    ├── i18n.test.js                   # Dictionaries and English README checks
    ├── logic.test.js                  # Cipher logic and all 262,144 keys
    ├── messages.test.js               # Message keys and formatting
    ├── ngram.test.js                  # Trigram values, sources, and model hash
    ├── readme.test.js                 # Tables, images, tree, and metadata
    ├── samples.test.js                # Bundled examples and known answer
    ├── share.test.js                  # URL hash parsing and formatting
    ├── solver.test.js                 # Equivalence, scores, ranks, and workbench
    ├── static.test.js                 # Purity, prohibited APIs, and CI settings
    └── views.test.js                  # Derived encryption and decryption views
```

## 💻 Requirements

Use a current desktop or mobile browser. Open `index.html` directly or serve the directory with `python -m http.server`.

## 📄 License

This project is released under the [MIT License](LICENSE).

## 🛠️ About this tool

This is Day024 of [100 Security Tools Built with Generative AI](https://akademeia.info/?page_id=42163), a project that builds one security tool per day with generative AI over 100 days.
