# cipher.gen

A terminal-styled, client-side password generator. Everything runs in the browser — nothing is ever transmitted anywhere.

![no backend](https://img.shields.io/badge/backend-none-brightgreen) ![typescript](https://img.shields.io/badge/TypeScript-strict-blue)

## Features

- **Cryptographically secure** — passwords are generated with `crypto.getRandomValues`, not `Math.random`
- **Configurable length** — 6 to 64 characters
- **Toggleable character sets** — lowercase, uppercase, digits, and symbols
- **Guaranteed coverage** — at least one character from every selected set is included, then the result is shuffled (Fisher–Yates) so guaranteed characters don't cluster at the start
- **Exclude look-alikes** — optionally strip ambiguous characters like `I`, `l`, `1`, `O`, `0`
- **Live entropy meter** — bits of entropy and a strength rating (Weak / Fair / Strong / Very Strong) update as you tweak settings
- **Retro terminal UI** — CRT scanline overlay and a "decrypting" scramble animation when a password is revealed (skipped automatically if the OS-level reduced-motion preference is on)
- **Copy to clipboard** — one click, with on-screen confirmation
- **Keyboard shortcut** — press `space` to regenerate
- **Zero dependencies, zero network calls** — a password never leaves the tab

## Demo

Open `index.html` in any modern browser — no build step, no server, no install required.

## Getting Started

### Run it locally

```bash
git clone https://github.com/<your-username>/Password-Generator.git
cd Password-Generator
open index.html   # or just double-click the file
```

### Project structure

```
.
├── index.html        # markup and structure
├── style.css          # CRT/terminal theme
├── src/
│   └── app.ts         # TypeScript source (generation logic, UI wiring)
├── dist/
│   └── app.js          # compiled output, loaded by index.html
└── tsconfig.json       # TypeScript compiler config
```

### Building from source

`index.html` loads the compiled `dist/app.js` directly, so you only need to rebuild if you change `src/app.ts`.

```bash
npm install -g typescript
tsc
```

This compiles `src/app.ts` → `dist/app.js` per the settings in `tsconfig.json` (ES2020, strict mode).

## How it works

- Random values come from `crypto.getRandomValues`, sampled with rejection sampling to avoid modulo bias.
- Entropy is estimated as `length * log2(pool size)`, where pool size depends on the active character sets (minus excluded look-alikes).
- The character sets can be found and adjusted in `src/app.ts`:

  | Set | Characters |
  |---|---|
  | lower | `a–z` |
  | upper | `A–Z` |
  | digits | `0–9` |
  | symbols | `` !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ `` |

## Browser support

Requires the Web Crypto API (`crypto.getRandomValues`) and the Clipboard API (`navigator.clipboard`), both available in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT — free to use, modify, and distribute.
