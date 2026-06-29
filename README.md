# 📐 Markulator — Tolerance Calculator

<div align="center">
  <img src="https://img.shields.io/badge/React-Web_App-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Web-v0.9.9-14B8A6?style=for-the-badge" alt="Web v0.9.9" />
  <img src="https://img.shields.io/badge/Hebrew_%2F_English-UI-0F172A?style=for-the-badge" alt="Hebrew and English UI" />
  <img src="https://img.shields.io/badge/PWA-ready-0EA5E9?style=for-the-badge" alt="PWA ready" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-4B5563?style=for-the-badge" alt="GPL-3.0 License" />
</div>

<div align="center">
  <p><strong>A clean web tolerance calculator for converting measurements between inches and millimeters.</strong></p>
  <p>
    <a href="https://markulator-zeta.vercel.app/"><strong>Live Web App</strong></a>
    ·
    <a href="https://markulator-git-test-sushiteimushi.vercel.app/"><strong>Test Web App</strong></a>
    ·
    <a href="https://github.com/Dovshmi/Markulator"><strong>Repository</strong></a>
  </p>
</div>

---

## Overview

**Markulator** is a practical tolerance calculator for machining, inspection, workshop, and engineering workflows. It converts tolerance values between **inch** and **millimeter** units and presents the result in a clear visual interface.

The current web app is built with **React + Vite** and includes a responsive mobile-first interface, bilingual Hebrew/English support, local calculation history, a PWA-ready setup, dedicated visual calculators for both tolerance workflows, a compact quick-settings control, and a refined light/dark theme system.

The repository also keeps the original **Python CustomTkinter desktop app**.

---

## Current Web Features

- **Two calculation modes:** `Tolerance ±` and `Maximum / Minimum`.
- **Two unit directions:** `inch → mm` and `mm → inch`.
- **Tolerance bridge calculator:** visual layout for positive tolerance, nominal value, and negative tolerance.
- **Maximum / minimum bridge calculator:** dedicated visual layout for max/min input and output values.
- **Animated unit conversion:** unit switching includes smooth bridge animations while keeping the center content stable.
- **Centered swap control:** compact swap button between unit labels for direct conversion-direction switching.
- **Compact quick settings menu:** the gear button opens small horizontal controls for precision, theme, and language.
- **Fast precision control:** short press cycles precision, long press opens a mini precision picker.
- **Refined theme picker:** automatic, light, and dark modes are represented inside one compact pyramid-style button.
- **Softer light mode:** reduced glare, softer cards, more readable input fields, and improved max/min labels.
- **Updated app icon:** the site icon, PWA install icon, and in-app symbol use the unified Markulator symbol.
- **Localized history:** calculation history follows the active language: Hebrew history in Hebrew, English history in English.
- **History separated by calculator mode:** each calculator shows only its own saved calculations.
- **Restore from history:** clicking a saved history item restores the original input values and conversion direction back into the calculator.
- **History timestamps:** each saved calculation displays the date and time it was created.
- **Input and output in history:** saved items show both the original input and the calculated output.
- **Hebrew and English UI:** Hebrew uses RTL layout, English uses LTR layout.
- **Persistent preferences:** language, theme, and history are stored locally in the browser.
- **Copy/share actions:** localized short copy, full copy, save, clear, and native share where supported.
- **PWA-ready service worker:** suitable for installing the web app on mobile devices.
- **Responsive mobile-first design** with a dark professional UI and polished light-mode support.

---

## Tech Stack

| Area | Technology |
| :--- | :--- |
| Web Frontend | React |
| Web Build Tool | Vite |
| Web Styling | CSS |
| Web Deploy | Vercel |
| Desktop App | Python + CustomTkinter |
| License | GPL-3.0 |

---

## Project Structure

```text
Markulator/
├── web/
│   ├── src/
│   │   ├── assets/                    # Logo and web assets
│   │   ├── components/                # React UI components
│   │   │   ├── EnhancedApp.jsx        # Main web app shell, state, history, and UI logic
│   │   │   ├── InputField.jsx         # Generic input field component
│   │   │   ├── LimitBridge.jsx        # Maximum/minimum bridge calculator UI
│   │   │   ├── ToleranceBridge.jsx    # Tolerance ± bridge calculator UI
│   │   │   └── calcTools.js           # Formatting, validation, unit helpers, copy text
│   │   ├── App.jsx                    # Web app wrapper and CSS imports
│   │   ├── markulator.js              # Core calculation logic
│   │   ├── main.jsx                   # React entry point
│   │   ├── limit-bridge.css           # Maximum/minimum bridge styling
│   │   ├── measurement-bridge.css     # Tolerance bridge layout and mobile styling
│   │   ├── tolerance-swap.css         # Center swap button styling
│   │   ├── mobile-clean-layout.css    # Mobile/settings layout overrides
│   │   ├── performance.css            # Animation and performance-oriented CSS
│   │   ├── manus-test-style.css       # Current polished visual style layer
│   │   ├── logo-mobile-fit.css        # Hero/app logo sizing overrides
│   │   ├── quick-settings-popover.css # Compact quick-settings menu styling
│   │   ├── quick-settings-behavior.js # Compact quick-settings interaction behavior
│   │   ├── quick-theme-pyramid-fix.css # Theme picker pyramid icon styling
│   │   ├── light-mode-soft-polish.css # Softer light-mode overrides
│   │   ├── light-mode-limit-label-fix.css # Light-mode max/min center label fix
│   │   ├── styles.css                 # Base styling
│   │   ├── v09.css                    # Modern web UI styling
│   │   ├── theme.css                  # Light/dark theme styling
│   │   └── language-layout.css        # Hebrew/English layout fixes
│   ├── public/                        # Manifest, icons, service worker files
│   ├── package.json
│   └── vite.config.js
├── Screenshots/                       # Desktop screenshots/examples
├── pictures/                          # Desktop icon/image assets
├── Markulator.py                      # Console/prototype calculator
├── Marlulator_app.py                  # Python desktop app
├── vercel.json                        # Vercel branch deployment configuration
├── LICENSE
└── README.md
```

> Note: the desktop entry file is currently named `Marlulator_app.py`.

---

## Getting Started

### Web App

```bash
git clone https://github.com/Dovshmi/Markulator.git
cd Markulator/web
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Recommended Vercel settings:

```text
Root Directory: web
Build Command: npm run build
Output Directory: dist
```

### Desktop App

```bash
git clone https://github.com/Dovshmi/Markulator.git
cd Markulator
pip install customtkinter pillow darkdetect
python Marlulator_app.py
```

Build Windows executable:

```bash
pip install pyinstaller
pyinstaller --onefile --noconsole --icon=pictures/calc.ico .\Marlulator_app.py
```

---

## Branches and Deployments

| Branch | Purpose | Vercel behavior |
| :--- | :--- | :--- |
| `main` | Production branch | Auto-deploys to production: https://markulator-zeta.vercel.app/ |
| `manus-test` | Working branch for UI/code changes before syncing to main | Automatic Vercel deployments are disabled |
| `test` | Legacy/test branch | Automatic Vercel deployments are disabled |

Production deployment should happen only from `main`. Work should be done on `manus-test`, reviewed there in code, and then merged into `main` when ready.

The Vercel branch deployment rule is stored in [`vercel.json`](vercel.json).

---

## Version History

| Version | Type | Main update |
| :--- | :--- | :--- |
| Web v0.9.9 | Web | Unified app icon, compact quick settings, refined theme picker, softer light mode, and production-ready visual polish. |
| Web v0.9.8 | Web | Added maximum/minimum bridge calculator, mode-specific bilingual history, restore-from-history, timestamps, and main-only Vercel deployment workflow. |
| Web v0.9.7 | Web | Compact app-style settings drawer, centered unit-swap button, cleaner mobile layout, and refined tolerance bridge controls. |
| Web v0.9.6 | Web | Bidirectional tolerance bridge, mobile Enter/Next navigation, refined sticky action bar, and performance fix for label updates. |
| Web v0.9.5 | Web | Mobile tolerance bridge refinement with larger readable fields and clearer placeholders. |
| Web v0.9.4 | Web | Visual tolerance bridge layout with centered nominal value and upper/lower side boxes. |
| Web v0.9.2 | Web | Hebrew/English language switch, RTL/LTR layout polish, and bilingual UI fixes. |
| Web v0.9.1 | Web | Smart mobile sticky bar that changes from result summary to quick actions near the result section. |
| Web v0.9.0 | Web | App-style upgrade with settings drawer, local history, save/copy/share actions, PWA support, and reverse conversion. |
| Web v0.8.0 | Web | Mobile UX refinement and preparation for the app-style layout. |
| Web v0.7.0 | Web | Responsive layout improvements and cleaner result presentation. |
| Web v0.6.0 | Web | Deployment cleanup, asset organization, and visual polish after the first Vercel version. |
| Web v0.5.0 | Web | Updated symbol/logo handling for the deployed web app. |
| Web v0.4.0 | Web | Hebrew RTL React/Vite version with ordered `Tol+ → Nominal → Tol-` workflow. |
| Web v0.3.0 | Web | Simplified layout, clearer input/result sections, and removed older experimental history UI. |
| Web v0.2.0 | Web | Modern dark UI prototype with result cards. |
| Web v0.1.0 | Web | First React/Vite web implementation. |
| Desktop v1.2 | Desktop | Stable Python CustomTkinter desktop calculator with tolerance ± and max/min modes. |

---

## Precision Notes

Markulator is a convenience calculator. For production-critical engineering, machining, inspection, or safety-sensitive work, verify results against the approved drawing, measurement standard, or certified calculation process.

---

## License

This project is licensed under the **GNU General Public License v3.0**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
  Built by <strong>Rony Shmidov</strong><br />
  Practical tolerance conversion for web and desktop.
</div>
