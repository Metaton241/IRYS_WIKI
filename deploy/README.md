# IRYSWIKI - Decentralized Wiki on the Blockchain

Welcome to IRYSWIKI - a decentralized wiki platform built with blockchain technology that enables users to create, store, and share content with permanent storage and true ownership.

## Features

- **Blockchain Verification**: All content is verified on the Irys blockchain
- **Local Storage**: Fast content loading via hybrid storage system
- **Wallet Integration**: Connect with MetaMask, WalletConnect, or Coinbase Wallet
- **Thread Creation**: Create discussion threads on various topics
- **User Profiles**: Customize your user profile
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

1. Clone this repository
2. Open `index.html` in your browser
3. Connect your wallet to start using the application

## Deploying on GitHub Pages

### Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the "+" button in the top right corner and select "New repository"
3. Name your repository (e.g., "iryswiki")
4. Add a description (optional)
5. Make it public
6. Click "Create repository"

### Step 2: Upload Files to GitHub

#### Option 1: Upload through the GitHub Web Interface

1. In your new repository, click "Add file" > "Upload files"
2. Drag and drop all files from this project or use the file selector
3. Click "Commit changes"

#### Option 2: Upload Using Git

```bash
# Initialize Git repository
git init

# Add all files to Git
git add .

# Commit changes
git commit -m "Initial commit"

# Add remote repository
git remote add origin https://github.com/your-username/your-repo-name.git

# Push to GitHub
git push -u origin main
```

### Step 3: Configure GitHub Pages

1. Go to your repository's "Settings" tab
2. In the left sidebar, click on "Pages"
3. Under "Source", select "Deploy from a branch"
4. Select your branch (usually "main" or "master")
5. Select "/ (root)" as the folder
6. Click "Save"

### Step 4: Access Your Site

Wait a few minutes for GitHub to build your site. Once done, you'll see a message saying "Your site is published at https://your-username.github.io/your-repo-name/".

## Important Files

- `.nojekyll`: Ensures GitHub Pages doesn't process the site with Jekyll
- `js/base-path.js`: Handles the correct base path for GitHub Pages
- `404.html`: Custom 404 error page
- `robots.txt` & `sitemap.xml`: For search engines
- `CNAME`: For custom domain (optional)

## Troubleshooting

- If your pages are not loading, ensure the `.nojekyll` file exists in the repository root
- Check browser console for errors
- If images or styles don't load, verify that paths are being correctly resolved using `resolveUrl()` function

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using HTML, CSS, and vanilla JavaScript.