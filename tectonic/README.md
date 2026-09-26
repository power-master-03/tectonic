# Suguru / Kemaru / Tectonic Puzzle Generator & Solver

An interactive web application to generate, play, solve, batch-print, and export Suguru (Kemaru / Tectonic) number puzzles with guaranteed unique solutions.

## Features
- **Procedural Generator**: 5x5, 6x6, 8x6, and 10x10 grids with 4 difficulty levels (Easy, Medium, Hard, Expert).
- **Exact Logical Solver**: Verifies single unique solution and provides step-by-step logical hints.
- **Batch Print & PDF Worksheets**: Generate 2 to 12 puzzles per batch with 1, 2, or 4 puzzles per page and answer keys.
- **Profile & Progress Tracking**: Solved count, streak, best times, and game history with JSON backup.

---

## Deploying to GitHub Pages

This repository is pre-configured with `base: './'` in `vite.config.ts` and an automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).

### Option A: Using the Automated GitHub Action (Recommended)

1. Push this project to your GitHub repository:
   ```bash
   git add .
   git commit -m "Initial commit of Suguru puzzle generator"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. On GitHub, go to your repository:
   - Click **Settings** (tab at the top).
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
   - That's it! GitHub Actions will automatically run `.github/workflows/deploy.yml` and publish your site at `https://<your-username>.github.io/<your-repo-name>/`.

---

### Option B: Export Directly from AI Studio

1. In the top-right corner of Google AI Studio, open the **Settings** or project options menu.
2. Select **Export to GitHub** (or download the ZIP and push it to your repository).
3. In your GitHub repository settings, set **Pages** source to **GitHub Actions**.

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build
```
