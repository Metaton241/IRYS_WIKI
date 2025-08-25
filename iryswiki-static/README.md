# IRYSWIKI - Decentralized Wiki on Irys Blockchain

IRYSWIKI is a decentralized wiki platform on the Irys blockchain with a hybrid storage system.

## Features

- 🔗 **Blockchain Verification** - All actions are verified on the Irys blockchain
- 💨 **Fast Loading** - Local storage for instant access to content
- 👤 **User Profiles** - Create and manage your profile
- 💬 **Thread System** - Create threads and reply to them
- 🔍 **Categories & Search** - Easy navigation through content

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- MetaMask or other compatible Web3 wallet
- Access to the Irys network (testnet)

## Installation & Running

### Local Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/iryswiki-static.git
   ```

2. Navigate to the project directory:
   ```
   cd iryswiki-static
   ```

3. Start a simple HTTP server (using Python for example):
   ```
   # Python 3
   python -m http.server

   # Python 2
   python -m SimpleHTTPServer
   ```

4. Open your browser and visit:
   ```
   http://localhost:8000
   ```

### GitHub Pages

1. Fork this repository

2. Go to your repository settings and enable GitHub Pages for the main branch

3. Your site will be available at:
   ```
   https://yourusername.github.io/iryswiki-static/
   ```

## Usage

1. Open the application in your browser

2. Connect your MetaMask wallet

3. Switch to the Irys network (Chain ID: 1270)

4. Browse existing threads or create a new one

## Technologies

- HTML5, CSS3, JavaScript (vanilla)
- Ethers.js for blockchain interaction
- Marked.js for Markdown rendering
- LocalStorage for local data storage

## Design

The design is inspired by the official [Irys.xyz](https://irys.xyz/) website, featuring:
- Modern, clean interface
- Bold typography
- Gradient accents
- Card-based layout

## License

MIT