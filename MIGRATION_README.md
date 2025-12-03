# 2025 Migration - Vite + TypeScript

This site has been migrated from jQuery/Bootstrap 4 to a modern Vite + TypeScript stack.

## What Changed

### Dependencies
- **Removed:** jQuery, Bootstrap 4, Font Awesome 4, Popper.js
- **Added:** Vite, TypeScript, Bootstrap 5, Font Awesome 6
- **Updated:** Google Analytics (removed deprecated UA, kept GA4)

### Modernizations
- jQuery replaced with vanilla TypeScript
- Bootstrap 4 → Bootstrap 5 (updated data attributes)
- Font Awesome 4 → Font Awesome 6 (updated icon classes)
- Modern font loading with preconnect
- ES modules instead of global scripts
- TypeScript for type safety

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
The site will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
```
Output will be in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
├── src/
│   ├── scripts/
│   │   ├── nav-active.ts      # Navigation active state (replaces jQuery)
│   │   ├── logo-positioning.ts # Logo positioning (replaces jQuery)
│   │   └── typewriter.ts      # Typewriter effect using typed.js
│   ├── styles/
│   │   └── main.css           # Main stylesheet
│   └── main.ts                # Entry point
├── index.html                 # Main page (modernized)
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Key Files

- `src/main.ts` - Entry point that imports all scripts and styles
- `src/scripts/nav-active.ts` - Handles navigation active states (replaced jQuery)
- `src/scripts/logo-positioning.ts` - Positions logo below navbar (replaced jQuery)
- `src/scripts/typewriter.ts` - Typewriter effect using typed.js npm package

## Migration Notes

### Bootstrap 5 Changes
- `data-toggle` → `data-bs-toggle`
- `data-target` → `data-bs-target`
- `mr-auto` → `me-auto` (margin-right → margin-end)
- `sr-only` → `visually-hidden`

### Font Awesome 6 Changes
- `fa fa-linkedin` → `fa-brands fa-linkedin`
- `fa fa-github` → `fa-brands fa-github`

### jQuery Removal
All jQuery functionality has been replaced with vanilla TypeScript:
- Navigation active states
- Logo positioning
- Typewriter effect (now uses typed.js npm package)

## Blog

The blog remains separate in the `/blog` directory (Hugo-generated). It is not part of this migration and continues to work independently.

## Deployment

For GitHub Pages or similar static hosting:
1. Run `npm run build`
2. Deploy the `dist/` directory
3. Ensure the `resources/` directory is accessible (it's in public, so it should be copied)

## Future Improvements

- Consider migrating blog to the same stack
- Add image optimization
- Implement lazy loading for images
- Add dark mode support
- Consider migrating to Astro for even better performance

