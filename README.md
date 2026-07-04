# 📐 Markulator — Tolerance Calculator

<div align="center">
  <img src="https://img.shields.io/badge/React-Web_App-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Web-v1.0-14B8A6?style=for-the-badge" alt="Web v1.0" />
  <img src="https://img.shields.io/badge/Hebrew_%2F_English-UI-0F172A?style=for-the-badge" alt="Hebrew and English UI" />
  <img src="https://img.shields.io/badge/PWA-ready-0EA5E9?style=for-the-badge" alt="PWA ready" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-4B5563?style=for-the-badge" alt="GPL-3.0 License" />
</div>

<div align="center">
  <p><strong>A clean, bilingual tolerance calculator for converting measurements between inches and millimeters.</strong></p>
  <p>
    <a href="https://markulator-zeta.vercel.app/"><strong>Live Web App</strong></a>
    ·
    <a href="https://github.com/Dovshmi/Markulator"><strong>Repository</strong></a>
  </p>
</div>

---

## Overview

**Markulator** is a practical tolerance calculator for machining, inspection, workshop, and engineering workflows. It converts values between **inch** and **millimeter** units and presents the result in a clear visual interface.

**Web v1.0** is the current stable web release. It includes two visual calculator workflows, bidirectional unit conversion, bilingual Hebrew/English UI, local calculation history, theme support, copy/share actions, and PWA install support.

The repository also keeps the original **Python CustomTkinter desktop app** for the earlier desktop version.

---

## Current Web Features

- **Two calculator modes:** `Tolerance ±` and `Maximum / Minimum`.
- **Two unit directions:** `inch → mm` and `mm → inch`.
- **Interactive tolerance bridge:** side-by-side source and target fields for positive tolerance, nominal value, and negative tolerance.
- **Interactive maximum/minimum bridge:** dedicated source and target layout for upper and lower limits.
- **Centered unit swap control:** switches the active conversion direction while preserving the current workflow.
- **Animated unit conversion:** smooth bridge animation when switching direction.
- **Bilingual interface:** Hebrew RTL and English LTR layouts.
- **Local calculation history:** history is stored in the browser and separated by calculator mode.
- **Restore from history:** saved calculations can restore their original inputs and conversion direction.
- **Localized history output:** history text follows the active interface language.
- **Timestamps:** each saved calculation shows when it was created.
- **Theme support:** automatic, light, and dark modes.
- **Persistent preferences:** language, theme, unit direction, precision, and history are saved locally.
- **Copy/share actions:** short copy, full copy, save, clear, and native share where supported.
- **Mobile-first responsive layout:** optimized for phone use, with a sticky action bar after calculation.
- **PWA-ready setup:** manifest and service worker are included for app-like installation.

---

## Tech Stack

| Area | Technology |
| :--- | :--- |
| Web Frontend | React |
| Web Build Tool | Vite |
| Web Styling | CSS |
| Web Deploy | Vercel |
| PWA | Web Manifest + Service Worker |
| Desktop App | Python + CustomTkinter |
| License | GPL-3.0 |

---

## Project Structure

```text
Markulator/
├── web/
│   ├── src/
│   │   ├── assets/                         # Logo and web assets
│   │   ├── components/                     # React UI components
│   │   │   ├── EnhancedApp.jsx             # Main web app shell, state, history, settings, and UI logic
│   │   │   ├── LimitBridge.jsx             # Maximum/minimum visual calculator
│   │   │   ├── ToleranceBridge.jsx         # Tolerance ± visual calculator
│   │   │   └── calcTools.js                # Version, validation, unit helpers, and copy formatting
│   │   ├── App.jsx                         # Web app wrapper and CSS behavior imports
│   │   ├── main.jsx                        # React entry point and service-worker registration
│   │   ├── markulator.js                   # Core tolerance calculation logic
│   │   ├── styles.css                      # Base styling
│   │   ├── v09.css                         # Main modern app styling
│   │   ├── theme.css                       # Light/dark theme styling
│   │   ├── measurement-bridge.css          # Tolerance bridge layout
│   │   ├── limit-bridge.css                # Maximum/minimum bridge layout
│   │   ├── manus-test-style.css            # Polished visual style layer
│   │   └── *.css / *.js                    # Mobile, precision, settings, footer, and behavior overrides
│   ├── public/
│   │   ├── manifest.webmanifest            # PWA manifest
│   │   ├── sw.js                           # Service worker
│   │   └── markulator-icon.svg             # App icon
│   ├── package.json
│   └── vite.config.js
├── Screenshots/                            # Desktop screenshots/examples
├── pictures/                               # Desktop icon/image assets
├── Markulator.py                           # Console/prototype calculator
├── Marlulator_app.py                       # Python desktop app
├── vercel.json                             # Vercel branch deployment configuration
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
| `main` | Production branch for the live web app | Auto-deploys to production: https://markulator-zeta.vercel.app/ |
| `Alpha` | Version 1.0 alpha/release mirror branch | Available as a separate branch for v1.0 work and review |
| `manus-test` | Working branch for UI/code changes before syncing to main | Automatic Vercel deployments are disabled |
| `test` | Legacy/test branch | Automatic Vercel deployments are disabled |

Production deployment should happen from `main`. Experimental or review work should happen on a non-production branch first, then be merged or synced when ready.

The Vercel branch deployment rule is stored in [`vercel.json`](vercel.json).

---

## Version History

| Version | Type | Main update |
| :--- | :--- | :--- |
| Web v1.0 | Web | Stable v1.0 release with polished visual bridge calculators, bilingual UI, bidirectional inch/mm conversion, mode-specific history, restore-from-history, timestamps, themes, copy/share actions, PWA support, and mobile-first layout refinements. |
| Web v0.9.9 | Web | Pre-v1.0 polish branch with refined light-mode handling, quick settings behavior, logo fit, and visual cleanup. |
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
