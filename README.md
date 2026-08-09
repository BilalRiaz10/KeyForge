# KeyForge 🛡️

> **Secure • Client-Side • Free**  
> Cryptographically secure password generator powered by the Web Crypto API. Passwords are generated locally and never leave your browser.

![KeyForge Screenshot](https://img.shields.io/badge/Security-Client--Side-brightgreen) ![JavaScript](https://img.shields.io/badge/Language-Vanilla%20JS-blue) ![License](https://img.shields.io/badge/License-MIT-orange) ![Dependencies](https://img.shields.io/badge/Dependencies-Zero-success)

---

## ✨ Features

- 🔒 **100% Client-Side Security**: Utilizes `window.crypto.getRandomValues()` with rejection sampling for true cryptographic randomness. `Math.random()` is never used.
- 📊 **Real-time Entropy Calculation**: Calculates password entropy in bits ($E = L \times \log_2 R$) and displays dynamic strength ratings (Weak, Medium, Strong, Very Strong).
- 🎛️ **Full Customization**:
  - Length range slider from 8 to 64 characters (default: 16).
  - Uppercase Letters (`A-Z`)
  - Lowercase Letters (`a-z`)
  - Numbers (`0-9`)
  - Symbols (`!@#$%^&*()_+-=[]{}|;:,.<>?`)
  - Option to **Exclude Ambiguous Characters** (`0, O, 1, l, I`).
- 🌓 **Dark & Light Mode**: Modern glassmorphic theme system, dark mode by default, persisted in `localStorage` and responsive to system `prefers-color-scheme`.
- 📋 **One-Click Copy Feedback**: Clipboard integration with animated visual checkmark and toast notifications.
- 📱 **Fully Responsive**: Optimized for desktop, tablet, and touch-friendly mobile navigation.
- ⚡ **Zero Dependencies**: Pure HTML5, CSS3, and modern ES6 JavaScript. No frameworks or third-party libraries.

---

## 🚀 Quick Start / How to Run

Because **KeyForge** runs 100% client-side in the browser, no installation or build step is required!

### Option 1: Direct File Open
1. Clone or download this repository.
2. Open `index.html` directly in any web browser.

### Option 2: Run via Local Server (e.g. VS Code Live Server or Python)
```bash
# Clone the repository
git clone https://github.com/your-username/keyforge.git

# Navigate to project directory
cd keyforge

# Start a simple local HTTP server (Python 3)
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

---

## 📁 Project Structure

```text
KeyForge/
├── index.html     # Semantic HTML5 layout & ARIA accessibility tags
├── style.css      # CSS custom properties, glassmorphism card, themes & animations
├── script.js     # Cryptographic RNG, Fisher-Yates shuffle, entropy & UI state engine
└── README.md      # Project documentation
```

---

## 🔐 Technical & Security Details

- **Randomness Algorithm**: Uses Web Crypto API's `crypto.getRandomValues()` combined with rejection sampling to guarantee uniform distribution without modulo bias.
- **Character Diversity**: Guarantees that at least one character from every active character pool is included in the output password before executing a cryptographically secure Fisher-Yates shuffle.
- **Entropy Formula**:
  $$\text{Entropy (bits)} = \text{Length} \times \log_2(\text{Pool Size})$$

---

## 📜 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it!
