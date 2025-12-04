# John Chen - Personal Portfolio Website

A modern, responsive personal portfolio website built with Vite, TypeScript, and Bootstrap 5. Features a clean design with dark/light theme toggle, smooth animations, and optimized performance.

🌐 **Live Site:** [https://johnchennewyork-coder.github.io/](https://johnchennewyork-coder.github.io/)

## ✨ Features

- 🎨 **Modern UI/UX** - Glassmorphism design with smooth animations
- 🌓 **Theme Toggle** - Dark and light mode support
- 📱 **Fully Responsive** - Mobile-first design with Bootstrap 5
- ⚡ **Fast Performance** - Built with Vite for optimal build times
- 🔒 **Type Safe** - TypeScript for better code quality
- 🎯 **SEO Optimized** - Proper meta tags and semantic HTML
- 📊 **Analytics** - Google Analytics 4 integration

## 🛠️ Tech Stack

- **Build Tool:** [Vite](https://vitejs.dev/) 5.0.8
- **Language:** [TypeScript](https://www.typescriptlang.org/) 5.3.3
- **CSS Framework:** [Bootstrap](https://getbootstrap.com/) 5.3.2
- **Icons:** [Font Awesome](https://fontawesome.com/) 6.5.1
- **Typewriter Effect:** [Typed.js](https://github.com/mattboldt/typed.js/) 2.0.7
- **Fonts:** Inter & Poppins (Google Fonts)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js) or **yarn**

You can check your versions:
```bash
node --version
npm --version
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/johnchennewyork-coder/johnchennewyork-coder.github.io.git
cd johnchennewyork-coder.github.io
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The development server will start at `http://localhost:3000` and automatically open in your browser.

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot module replacement |
| `npm run build` | Build production-ready files to `dist/` directory |
| `npm run preview` | Preview the production build locally |

## 🏗️ Project Structure

```
johnchennewyork-coder.github.io/
├── src/
│   ├── main.ts              # Application entry point
│   ├── scripts/             # TypeScript modules
│   │   ├── logo-positioning.ts
│   │   ├── nav-active.ts
│   │   ├── scroll-animations.ts
│   │   ├── theme-toggle.ts
│   │   └── typewriter.ts
│   └── styles/
│       └── main.css         # Main stylesheet
├── resources/               # Static assets (images, PDFs, etc.)
│   ├── img/                 # Images
│   ├── pdf/                 # PDF documents
│   └── publications/        # Research publications
├── prev/                    # Archived old website files
├── index.html               # Main HTML page
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## 🏭 Building for Production

To create an optimized production build:

```bash
npm run build
```

This will:
1. Compile TypeScript to JavaScript
2. Bundle and minify assets
3. Copy the `resources/` directory to `dist/resources/`
4. Output everything to the `dist/` directory

The build output will be in the `dist/` folder, ready for deployment.

## 🚢 Deployment

### GitHub Pages (Recommended)

This repository is **already configured** with GitHub Actions for automatic deployment. The workflow file (`.github/workflows/deploy.yml`) is set up and ready to use.

#### ⚠️ Important: Configure GitHub Pages Source

**Before your site will work correctly, you MUST configure GitHub Pages to use GitHub Actions:**

1. **Go to repository settings:**
   - Navigate to: `Settings` → `Pages` in your GitHub repository
   - Or visit: `https://github.com/johnchennewyork-coder/johnchennewyork-coder.github.io/settings/pages`

2. **Change the source:**
   - Under "Source", select **"GitHub Actions"** (NOT "Deploy from a branch")
   - Save the settings

3. **Why this matters:**
   - If GitHub Pages is set to "Deploy from a branch", it will serve your raw source files
   - This causes CSS/JS to break because it tries to load `/src/main.ts` instead of the built assets
   - With "GitHub Actions" selected, it serves the built `dist/` folder with properly bundled assets

#### How It Works

1. **Automatic deployment:**
   - Every push to the `main` branch automatically triggers the workflow
   - The workflow builds your site and deploys it to GitHub Pages

2. **Manual deployment:**
   - You can also trigger deployments manually from the Actions tab
   - Click "Run workflow" on the "Deploy to GitHub Pages" workflow

3. **Monitor deployments:**
   - Check the [Actions tab](https://github.com/johnchennewyork-coder/johnchennewyork-coder.github.io/actions) to see build and deployment status
   - The site will be live at `https://johnchennewyork-coder.github.io/` after successful deployment

#### Option 2: Manual Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder:**
   
   **Option A: Using gh-pages branch**
   ```bash
   npm install --save-dev gh-pages
   ```
   
   Add to `package.json` scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
   
   Then run:
   ```bash
   npm run deploy
   ```

   **Option B: Manual push to gh-pages branch**
   ```bash
   npm run build
   git subtree push --prefix dist origin gh-pages
   ```

3. **Configure GitHub Pages:**
   - Go to repository Settings → Pages
   - Select source branch: `gh-pages` (or `main` if using root)
   - Select folder: `/ (root)` or `/dist` depending on your setup
   - Save

### Other Hosting Options

The `dist/` folder can be deployed to any static hosting service:

- **Netlify:** Drag and drop the `dist/` folder or connect your Git repository
- **Vercel:** Connect your repository and set build command to `npm run build` and output directory to `dist`
- **Cloudflare Pages:** Connect repository and set build command to `npm run build` and output directory to `dist`

## 🔧 Configuration

### Vite Configuration

The `vite.config.ts` file contains:
- **Base path:** Set to `/` for GitHub Pages (correct for `username.github.io` repos)
- Build output directory (`dist/`)
- Custom plugin to copy `resources/` directory to `dist/resources/`
- Development server configuration (port 3000)

### TypeScript Configuration

TypeScript settings are in `tsconfig.json` and `tsconfig.node.json`. The project uses:
- ES modules
- Strict type checking
- Path aliases (`@/` for `src/`)

## 🐛 Troubleshooting

### Resources not loading during development?

Resources are served via Vite middleware during development. Ensure the `resources/` directory exists at the project root.

### Resources not loading after build?

The build process automatically copies the `resources/` directory to `dist/resources/`. If files are missing, check:
1. The `resources/` directory exists
2. The Vite plugin in `vite.config.ts` is working
3. File paths in HTML are correct (should start with `/resources/`)

### TypeScript errors?

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build fails?

- Ensure all dependencies are installed: `npm install`
- Check that `resources/` directory exists
- Verify Node.js version is 18+ (check with `node --version`)

### CSS/JS not loading on GitHub Pages?

**This is the most common issue!** If your site loads but CSS/JS is broken:

1. **Check GitHub Pages source:**
   - Go to repository `Settings` → `Pages`
   - Ensure "Source" is set to **"GitHub Actions"** (NOT "Deploy from a branch")
   - If it's set to a branch, change it to "GitHub Actions" and save

2. **Verify the workflow ran:**
   - Check the [Actions tab](https://github.com/johnchennewyork-coder/johnchennewyork-coder.github.io/actions)
   - Ensure both "build" and "deploy" jobs completed successfully

3. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or open in an incognito/private window

4. **Wait for propagation:**
   - GitHub Pages can take 1-2 minutes to update after deployment
   - Check the deployment status in the Actions tab

### Port 3000 already in use?

Vite will automatically try the next available port. You can also specify a port in `vite.config.ts`:

```typescript
server: {
  port: 3001, // Change to your preferred port
}
```

## 📝 Development Notes

- **Hot Module Replacement (HMR):** Enabled during development for instant updates
- **Type Safety:** All JavaScript has been migrated to TypeScript
- **Modern ES Modules:** No CommonJS dependencies
- **CDN Assets:** Bootstrap and Font Awesome are loaded from CDN for better performance

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**John Chen**
- Website: [https://johnchennewyork-coder.github.io/](https://johnchennewyork-coder.github.io/)
- GitHub: [@johnchennewyork-coder](https://github.com/johnchennewyork-coder)

## 🙏 Acknowledgments

- Bootstrap team for the excellent CSS framework
- Vite team for the amazing build tool
- Font Awesome for the icon library
- All contributors to the open-source libraries used in this project

---

**Last Updated:** December 2025

