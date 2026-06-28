# 📐 Markulator — Tolerance Calculator

<div align="center">
  <img src="https://img.shields.io/badge/React-Web_App-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Web-v0.9.2-14B8A6?style=for-the-badge" alt="Web v0.9.2" />
  <img src="https://img.shields.io/badge/Hebrew_%2F_English-UI-0F172A?style=for-the-badge" alt="Hebrew and English UI" />
  <img src="https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-4B5563?style=for-the-badge" alt="GPL-3.0 License" />
</div>

<div align="center">
  <p><strong>A clean tolerance calculator for converting between inches and millimeters.</strong></p>
  <p>
    <a href="https://markulator-zeta.vercel.app/"><strong>Live Web App</strong></a>
    ·
    <a href="https://github.com/Dovshmi/Markulator"><strong>Repository</strong></a>
    ·
    <a href="https://github.com/Dovshmi/Markulator/releases/latest"><strong>Latest Release</strong></a>
  </p>
</div>

---

## Overview

**Markulator** is a practical tolerance calculator for converting between **inch** and **mm** measurements. It is built for machining, inspection, workshop, and engineering workflows where clear upper/lower tolerance results matter.

The project includes a modern **React/Vite web app** and the original **Python CustomTkinter desktop app**.

---

## Current Web Features

- **Two calculation modes:** `Tolerance ±` and `Maximum / Minimum`.
- **Two conversion directions:** `inch → mm` and `mm → inch`.
- **Hebrew and English UI:** Hebrew uses RTL layout, English uses LTR layout.
- **Side settings drawer:** language, conversion direction, and result precision.
- **Persistent preferences:** selected language is saved in `localStorage`.
- **Calculation history:** saved locally in the browser.
- **Smart mobile sticky bar:** shows result summary while editing and switches to quick actions near the result section.
- **Copy/share actions:** short copy, full copy, and native share where supported.
- **PWA-ready service worker:** cache refreshes per version.
- **Responsive mobile-first design** with a dark professional UI.

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
│   │   ├── components/          # React UI components
│   │   ├── App.jsx              # Web app wrapper
│   │   ├── markulator.js        # Calculation logic
│   │   ├── main.jsx             # React entry point
│   │   ├── styles.css           # Base styling
│   │   ├── v09.css              # Modern web UI styling
│   │   └── language-layout.css  # Hebrew/English layout fixes
│   ├── public/                  # Manifest, icon, service worker
│   ├── package.json
│   └── vite.config.js
├── Screenshots/                 # Desktop screenshots/examples
├── pictures/                    # Desktop icon/image assets
├── Markulator.py                # Console/prototype calculator
├── Marlulator_app.py            # Python desktop app
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

## Version History

### Web v0.9.2 — Language and layout polish

- Added a complete **Hebrew / English language setting** in the side settings drawer.
- Set **Hebrew as the default language**.
- Added `localStorage` persistence for the selected interface language.
- Added Hebrew RTL behavior and English LTR behavior.
- Fixed English layout so the hero area, guide cards, headings, and app sections align naturally to the left.
- Fixed Hebrew mode text so the tolerance button no longer shows English-only helper text.
- Kept technical units in English: `inch`, `mm`, `inch → mm`, and `mm → inch`.
- Kept the Markulator title on the left and the app symbol on the right in both languages.
- Added `language-layout.css` for language-specific layout overrides.
- Bumped the web package version to `0.9.2`.
- Updated service worker cache naming for the v0.9.2 deploy.

### Web v0.9.1 — Smart mobile sticky bar

- Added a smarter mobile sticky bar.
- While editing values, the sticky bar shows a compact result summary.
- When the full result section is visible, the sticky bar switches to quick actions:
  - Save
  - Clear
  - Edit values
- Added scroll-back behavior from the sticky bar to the input section.
- Added result-section visibility detection with `IntersectionObserver`.
- Updated the service worker cache for the new mobile behavior.
- Bumped the web package version to `0.9.1`.

### Web v0.9 — App-style web upgrade

- Added a side settings drawer with a prominent gear button.
- Moved conversion direction controls into settings.
- Added support for both `inch → mm` and `mm → inch` conversion directions.
- Added result precision settings: 2, 3, or 4 decimals.
- Added local calculation history using browser `localStorage`.
- Added a save button next to the clear button.
- Added short copy, full copy, and share actions.
- Added a mobile result bar for quick access to calculated values.
- Added PWA-ready service worker registration.
- Refreshed the interface with a more mobile-app-like design.

### Web v0.5 — Deployment polish

- Updated symbol/logo handling for the deployed web app.
- Improved asset loading for the hosted Vercel version.
- Stabilized the visual identity around the Markulator icon.

### Web v0.4 — First Hebrew RTL web workflow

- Added the React/Vite Hebrew RTL web version.
- Implemented the ordered tolerance workflow: `Tol+ → Nominal → Tol-`.
- Added a clean calculator layout for tolerance inputs and result output.
- Focused the web version around practical inch-to-mm conversion.

### Earlier web prototypes

- Built the first modern dark UI prototypes.
- Tested result cards, simplified input sections, and early responsive layouts.
- Removed older experimental history/UI ideas before rebuilding the app flow in v0.9.

### Desktop v1.2 — Python desktop app

- Stable Python CustomTkinter desktop calculator.
- Supports tolerance ± and max/min calculation modes.
- Includes dark/light theme behavior through `darkdetect`.
- Supports previous-calculation memory navigation.
- Can be packaged as a Windows executable using PyInstaller.

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
