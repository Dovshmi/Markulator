# Markulator

**Markulator** is a compact tolerance calculator for converting inch measurements into millimeter results. It supports a modern Hebrew RTL web app and the original Python desktop version.

## What it does

- Converts inches to millimeters using `1 in = 25.4 mm`.
- Supports two workflows:
  - **Tol+ / Nominal / Tol-** — positive tolerance, nominal value, negative tolerance.
  - **Max / Min** — direct maximum and minimum values.
- Displays results rounded to two decimal places.
- Keeps tolerance output clear for workshop, machining, inspection, and engineering use.

## Web App

The current web version is built with **React + Vite** and lives inside the `web/` folder.

```bash
cd web
npm install
npm run dev
```

For Vercel deployment:

```text
Root Directory: web
Build Command: npm run build
Output Directory: dist
```

## Desktop App

The original desktop version is built with **Python + CustomTkinter**.

```bash
pip install customtkinter pillow darkdetect
python Marlulator_app.py
```

Optional Windows build:

```bash
pip install pyinstaller
pyinstaller --onefile --noconsole --icon=pictures/calc.ico .\Marlulator_app.py
```

> Note: the current desktop entry file is named `Marlulator_app.py`.

## Project Structure

```text
Markulator/
├── web/                 # React/Vite web app
├── Screenshots/         # Desktop screenshots
├── pictures/            # Desktop app assets
├── dist/                # Built desktop artifacts
├── Markulator.py        # Console/prototype version
├── Marlulator_app.py    # Main desktop app
├── LICENSE
└── README.md
```

## Version History

| Version | Status | Notes |
|---|---|---|
| Web v0.4 | Current | Hebrew RTL React/Vite web app, Vercel-ready, ordered Tol+ → Nominal → Tol- workflow. |
| Web v0.3 | Previous | Simplified web layout, clearer input/result sections, removed history. |
| Web v0.2 | Previous | Modern dark UI prototype with result cards. |
| Web v0.1 | Initial web build | First React/Vite implementation. |
| Desktop v1.2 | Stable desktop release | Python CustomTkinter desktop calculator. |

## Tech Stack

| Area | Technology |
|---|---|
| Web | React, Vite, CSS |
| Desktop | Python, CustomTkinter |
| Image handling | Pillow |
| Theme detection | darkdetect |
| Desktop packaging | PyInstaller |
| License | GPL-3.0 |

## License

This project is licensed under the **GNU General Public License v3.0**. See [`LICENSE`](LICENSE) for details.

---

Built by **Rony Shmidov**.
