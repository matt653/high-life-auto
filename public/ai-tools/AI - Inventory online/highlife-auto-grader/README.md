# HighLife Auto Grader - Deployment Instructions

## For the Antigravity Team
This is a React application built with Vite, designed to be embedded into an existing website page.

### 1. Installation
Ensure Node.js is installed.
```bash
npm install
```

### 2. Configuration (API Key)
You must provide a Google Gemini API Key.
- Create a `.env` file in the root directory.
- Add: `API_KEY=your_google_ai_studio_key_here`
- Alternatively, you can hardcode the key in `index.html` inside the `window.process` shim if you cannot use server-side build variables.

### 3. Building for Production
This will compile the app into static files.
```bash
npm run build
```
The output will be in the `dist/` folder.

### 4. Embedding / Placement
The `vite.config.ts` is already configured with `base: './'`, allowing the app to run from any subdirectory.
1. Upload the contents of the `dist/` folder to the desired folder on your web server (e.g., `/inventory-grader/`).
2. If embedding via iframe, point the iframe `src` to `index.html`.
3. If embedding directly into a page div, ensure the `<div id="root"></div>` exists and the scripts/CSS from `dist/index.html` are included in your page head/body.

### Key Features
- **YouTube Analysis**: The app uses the Gemini 1.5 Flash model to "watch" linked YouTube videos via the Google Search grounding tool to verify vehicle condition against the dealer notes.
- **Responsive**: Works on Mobile and Desktop.
