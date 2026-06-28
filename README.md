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

| Version | Type | Main update |
| :--- | :--- | :--- |
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
