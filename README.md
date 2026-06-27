# 📐 Markulator — Tolerance Calculator

<div align="center">
  <img src="https://img.shields.io/badge/React-Web_App-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/RTL-Hebrew-0F172A?style=for-the-badge" alt="RTL Hebrew" />
  <img src="https://img.shields.io/badge/Vercel-Deployable-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Python-Desktop_App-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/CustomTkinter-GUI-1F2937?style=for-the-badge" alt="CustomTkinter" />
  <img src="https://img.shields.io/badge/Precision-2_Decimals-10B981?style=for-the-badge" alt="Precision" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-4B5563?style=for-the-badge" alt="GPL-3.0 License" />
</div>

<div align="center">
  <p><strong>A clean tolerance calculator for converting inch-based measurements into millimeter results.</strong></p>
  <p>
    <a href="https://github.com/Dovshmi/Markulator"><strong>GitHub Repository</strong></a>
    ·
    <a href="https://github.com/Dovshmi/Markulator/releases/latest"><strong>Latest Release</strong></a>
  </p>
</div>

---

## Overview

**Markulator** is a tolerance calculator built for fast inch-to-millimeter conversion. It supports practical measurement workflows used in machining, inspection, manufacturing, engineering, and workshop environments.

The project now includes two versions: a modern **React/Vite Hebrew RTL web app** and the original **Python CustomTkinter desktop app**.

---

## Product Goals

- Convert inch measurements into millimeter results quickly.
- Keep tolerance input and output clear and readable.
- Support the workflow: **Tol+ → Nominal → Tol-**.
- Provide both a web version and a desktop version.
- Keep deployment simple through Vercel and GitHub.

---

## Core Features

### Web App

- **Hebrew RTL interface** for right-to-left layout and Hebrew labels.
- **Tol+ / Nominal / Tol- workflow** for tolerance-based calculations.
- **Max / Min mode** for direct upper/lower limit conversion.
- **Live result display** with rounded millimeter values.
- **Modern responsive UI** for desktop and mobile.
- **Vercel-ready structure** inside the `web/` directory.

### Desktop App

- **Python CustomTkinter GUI** for Windows desktop usage.
- **Two calculation modes**: tolerance ± and max/min.
- **Light/dark theme support** using `darkdetect`.
- **Memory navigation** for previous calculations.
- **PyInstaller support** for building a standalone executable.

---

## Tech Stack

| Area | Technology |
| :--- | :--- |
| Web Frontend | React |
| Web Build Tool | Vite |
| Web Styling | CSS |
| Web Deployment | Vercel |
| Desktop Language | Python |
| Desktop GUI | CustomTkinter |
| Image Handling | Pillow |
| Theme Detection | darkdetect |
| Desktop Packaging | PyInstaller |
| License | GPL-3.0 |

---

## Project Structure

```text
Markulator/
├── web/                     # React/Vite Hebrew RTL web app
│   ├── src/
│   │   ├── App.jsx          # Main web calculator UI
│   │   ├── markulator.js    # Web calculation logic
│   │   ├── main.jsx         # React entry point
│   │   └── styles.css       # Main responsive styling
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── Screenshots/             # Desktop screenshots and examples
├── pictures/                # Desktop icon/image assets
├── dist/                    # Desktop build artifacts
├── Markulator.py            # Console/prototype calculator
├── Marlulator_app.py        # Main Python desktop app
├── LICENSE
└── README.md
```

> Note: the current desktop entry file is named `Marlulator_app.py`.

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

| Version | Type | Notes |
| :--- | :--- | :--- |
| Web v0.5 | Web | Updated symbol/logo handling for the deployed web app. |
| Web v0.4 | Web | Hebrew RTL React/Vite version with ordered **Tol+ → Nominal → Tol-** workflow. |
| Web v0.3 | Web | Simplified layout, clearer input/result sections, removed history. |
| Web v0.2 | Web | Modern dark UI prototype with result cards. |
| Web v0.1 | Web | First React/Vite web implementation. |
| Desktop v1.2 | Desktop | Stable Python CustomTkinter desktop calculator. |

---

## Precision Notes

Markulator displays millimeter results with two decimal places. The calculation logic also includes rounding/deviation handling to reduce tolerance-edge drift after conversion.

For production-critical engineering, machining, inspection, or safety-sensitive use, verify results against the approved drawing, measurement standard, or certified calculation process.

---

## License

This project is licensed under the **GNU General Public License v3.0**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
  Built by <strong>Rony Shmidov</strong><br />
  A focused tool for practical tolerance conversion.
</div>
