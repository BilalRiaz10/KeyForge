# KeyForge 🛡️ (Version 2)

> **Secure • Client-Side • Professional Password Utility**  
> Cryptographically secure password generator & utility powered by the Web Crypto API. Passwords are generated locally and never leave your browser.

![KeyForge Screenshot](https://img.shields.io/badge/Security-Client--Side-brightgreen) ![JavaScript](https://img.shields.io/badge/Language-Vanilla%20JS-blue) ![Version](https://img.shields.io/badge/Version-2.0-indigo) ![Dependencies](https://img.shields.io/badge/Dependencies-Zero-success)

---

## ✨ Version 2 Features

- 🔒 **100% Client-Side Cryptographic Security**: Utilizes `window.crypto.getRandomValues()` with rejection sampling for true cryptographic randomness. `Math.random()` is never used.
- ⚡ **Quick Password Presets**: One-click configuration presets:
  - **Basic**: Length 12, Uppercase, Lowercase, Numbers.
  - **Strong**: Length 16, Uppercase, Lowercase, Numbers, Symbols.
  - **Maximum**: Length 32, Uppercase, Lowercase, Numbers, Symbols.
  - **Custom**: Automatically active when adjusting any slider or checkbox.
- 👁️ **Password Visibility Toggle**: Show or hide password with bullet masking (`••••••••`) without modifying the actual password string.
- 📊 **Real-time Entropy & Analysis Checklist**:
  - Live entropy calculation in bits ($E = L \times \log_2 R$).
  - Password strength rating bar (Weak, Medium, Strong, Very Strong).
  - Password analysis checklist evaluating length, uppercase, lowercase, numbers, symbols, and character variety.
- 🔢 **Minimum Character Requirements**: Specify exact required minimum counts for uppercase, lowercase, numbers, or symbols with built-in validation.
- 🔀 **Secure Shuffling**: Guarantees required character counts and applies Web Crypto Fisher-Yates array shuffling to avoid predictable positions.
- 📜 **Opt-in Password History**:
  - Disabled by default for maximum privacy.
  - Saves up to 10 recent passwords in `localStorage`.
  - Individual copy/delete buttons & custom accessible modal confirmation dialog for clearing history.
- 💾 **Settings Persistence**: Saves generator settings, active preset, theme, and history preferences in `localStorage`.
- ⌨️ **Keyboard Shortcuts**: Press `Ctrl + Enter` (or `Cmd + Enter`) to generate a new password instantly; press `Escape` to close modals.
- 🌓 **Dark & Light Mode**: Modern glassmorphic theme system with smooth CSS variable transitions.
- 🛡️ **Privacy Accordion**: Collapsible "How does this work?" section explaining local browser security without exaggerated claims.

---

## 🚀 Quick Start

Because **KeyForge** runs 100% client-side in the browser, no installation or build step is required!

```bash
# Clone the repository
git clone https://github.com/your-username/KeyForge.git

# Navigate to project directory
cd KeyForge

# Start a simple local HTTP server
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

---

## 📁 Project Structure

```text
KeyForge/
├── index.html     # Semantic HTML5 structure with Presets, Requirements, & History
├── style.css      # CSS custom properties, glassmorphism, responsive grid & themes
├── script.js     # Cryptographic RNG, Fisher-Yates shuffle, presets & state management
└── README.md      # V2 Documentation
```

---

## 🔐 Security Specifications

- **Randomness Source**: `window.crypto.getRandomValues()` exclusively.
- **Modulo Bias Mitigation**: Rejection sampling algorithm ensures uniform integer selection across arbitrary pool sizes.
- **Privacy Standard**: Zero HTTP requests, zero network calls, zero tracking analytics, zero telemetry.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
