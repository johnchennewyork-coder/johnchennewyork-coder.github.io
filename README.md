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
│   └── blog/                # Hugo-generated blog (copied to dist/blog/ during build)
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
4. Copy the `prev/blog/` directory to `dist/blog/`
5. Output everything to the `dist/` directory

The build output will be in the `dist/` folder, ready for deployment.

## 🚢 Deployment

### GitHub Pages (Automatic via GitHub Actions) ✅

This repository is **fully configured** with GitHub Actions for automatic deployment. The workflow automatically builds and deploys your site whenever you push to the `main` branch.

#### ⚠️ Critical: Configure GitHub Pages Source

**IMPORTANT:** Before your site will work correctly, you MUST configure GitHub Pages to use GitHub Actions:

1. **Go to repository settings:**
   - Navigate to: `Settings` → `Pages` in your GitHub repository
   - Direct link: `https://github.com/johnchennewyork-coder/johnchennewyork-coder.github.io/settings/pages`

2. **Change the source:**
   - Under "Source", select **"GitHub Actions"** (NOT "Deploy from a branch")
   - Click **Save**

3. **Why this is critical:**
   - ❌ If set to "Deploy from a branch", GitHub Pages serves raw source files
   - ❌ This breaks CSS/JS because it tries to load `/src/main.ts` instead of built assets
   - ✅ With "GitHub Actions", it serves the built `dist/` folder with properly bundled assets

#### How Automatic Deployment Works

The workflow (`.github/workflows/deploy.yml`) does the following:

1. **Builds your site:**
   - Installs dependencies (`npm ci`)
   - Compiles TypeScript to JavaScript
   - Bundles and minifies assets with Vite
   - Copies `resources/` directory to `dist/resources/`
   - Copies `prev/blog/` directory to `dist/blog/`

2. **Deploys to GitHub Pages:**
   - Uploads the `dist/` folder as a Pages artifact
   - Deploys it to `https://johnchennewyork-coder.github.io/`

3. **Triggers automatically:**
   - Every push to `main` branch
   - Can also be triggered manually from the Actions tab

4. **Monitor deployments:**
   - View status: [Actions tab](https://github.com/johnchennewyork-coder/johnchennewyork-coder.github.io/actions)
   - Both "build" and "deploy" jobs must complete successfully
   - Site updates within 1-2 minutes after deployment completes

### Alternative: Manual Deployment (Not Recommended)

If you prefer manual deployment instead of GitHub Actions:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy using gh-pages:**
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

3. **Configure GitHub Pages:**
   - Go to repository Settings → Pages
   - Select source branch: `gh-pages`
   - Select folder: `/ (root)`
   - Save

**Note:** GitHub Actions is recommended as it's automatic and ensures consistent builds.

## 📝 Blog Deployment

The blog is a Hugo-generated static site located in `prev/blog/`. It is automatically included in the build and deployment process.

### How Blog Deployment Works

1. **During Build:**
   - The Vite build process automatically copies `prev/blog/` to `dist/blog/`
   - This happens via the `copyResourcesPlugin` in `vite.config.ts`
   - The blog is served at `/blog/` on the deployed site

2. **Blog Structure:**
   - Blog source files are in `prev/blog/`
   - Blog posts are in `prev/blog/posts/`
   - The blog index is at `prev/blog/index.html`
   - All blog assets (CSS, JS, images) are included in the copy

3. **Adding New Blog Posts:**
   - Add new posts to `prev/blog/posts/[post-name]/index.html`
   - Update `prev/blog/index.html` to include the new post in the listing
   - The post will be automatically included in the next deployment

4. **Blog Navigation:**
   - The main site navbar links to `/blog/` (absolute path to prevent infinite nesting)
   - The blog has its own navigation within blog pages
   - Blog links use absolute paths starting with `/blog/` to ensure proper routing

### Blog Development

During local development (`npm run dev`), the blog is served from `prev/blog/` via Vite middleware:
- Access the blog at `http://localhost:3000/blog/`
- Changes to blog files are reflected immediately (no rebuild needed)
- The blog works independently of the main site build process

### Blog Troubleshooting

**Blog link causes infinite nesting?**
- Ensure the navbar link uses `/blog/` (absolute path) not `blog/` (relative path)
- Check that blog links within blog pages also use absolute paths starting with `/blog/`

**Blog not appearing after deployment?**
- Verify that `prev/blog/` directory exists
- Check the build logs for "✓ Copied blog directory to dist" message
- Ensure the blog was copied to `dist/blog/` in the build output
- Check that GitHub Pages is serving from the `dist/` directory (via GitHub Actions)

**Blog styles/CSS not loading?**
- Blog uses its own CSS files in `prev/blog/css/`
- Ensure all blog assets are being copied during build
- Check browser console for 404 errors on blog assets

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

### CSS/JS not loading on GitHub Pages? 🔴

**This is the #1 most common issue!** If your site loads but CSS/JS is broken:

1. **✅ Check GitHub Pages source (MOST IMPORTANT):**
   - Go to repository `Settings` → `Pages`
   - **MUST be set to "GitHub Actions"** (NOT "Deploy from a branch")
   - If it shows a branch name, change it to "GitHub Actions" and save
   - This is the root cause 99% of the time!

2. **Verify the workflow completed:**
   - Check the [Actions tab](https://github.com/johnchennewyork-coder/johnchennewyork-coder.github.io/actions)
   - Look for the latest "Deploy to GitHub Pages" workflow run
   - Both "build" and "deploy" jobs must show green checkmarks ✅
   - If either failed, click on it to see error details

3. **Check what's being served:**
   - Visit your site and view page source
   - Look for `<script type="module" src="/src/main.ts">` ❌ (wrong - raw source)
   - Should see `<script src="/assets/main-XXXXX.js">` ✅ (correct - built assets)
   - If you see `/src/main.ts`, GitHub Pages is serving raw files instead of built files

4. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or open in an incognito/private window

5. **Wait for propagation:**
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

**Deployment Status:** ✅ Configured with GitHub Actions - Automatic deployment on push to `main` branch

