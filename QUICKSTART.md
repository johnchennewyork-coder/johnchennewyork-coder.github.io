# Quick Start Guide

## First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   The site will open at `http://localhost:3000`

## Development

- **Dev server:** `npm run dev` - Hot module replacement enabled
- **Build:** `npm run build` - Creates production build in `dist/`
- **Preview:** `npm run preview` - Preview production build locally

## What's New

### Modern Stack
- ✅ Vite for fast development and building
- ✅ TypeScript for type safety
- ✅ Bootstrap 5 (upgraded from 4)
- ✅ Font Awesome 6 (upgraded from 4)
- ✅ Modern ES modules
- ✅ No jQuery dependency

### Removed
- ❌ jQuery (replaced with vanilla TypeScript)
- ❌ Bootstrap 4 (upgraded to 5)
- ❌ Font Awesome 4 (upgraded to 6)
- ❌ Deprecated Universal Analytics (kept GA4)

### Key Files
- `src/main.ts` - Application entry point
- `src/scripts/` - All JavaScript/TypeScript modules
- `src/styles/main.css` - Main stylesheet
- `vite.config.ts` - Vite configuration
- `index.html` - Main page (modernized)

## Troubleshooting

### Resources not loading?
- During dev: Resources are served via Vite middleware
- After build: Resources are copied to `dist/resources/`

### TypeScript errors?
- Run `npm install` to ensure all dependencies are installed
- Check that `node_modules/typescript` exists

### Build fails?
- Ensure all dependencies are installed: `npm install`
- Check that `resources/` directory exists at project root

