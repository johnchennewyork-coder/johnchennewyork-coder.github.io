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

This repository is configured for GitHub Pages deployment. Here are the steps:

#### Option 1: Automatic Deployment (GitHub Actions)

1. **Create a GitHub Actions workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. **Configure GitHub Pages settings:**
   - Go to your repository → Settings → Pages
   - Under "Source", select "GitHub Actions"
   - Save the settings

3. **Push to main branch:**
   ```bash
   git push origin main
   ```
   The workflow will automatically build and deploy your site.

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
- Build output directory (`dist/`)
- Multiple HTML entry points
- Custom plugin to copy `resources/` directory
- Development server configuration

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

**Last Updated:** January 2025

