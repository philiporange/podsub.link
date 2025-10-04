# PodSub Links Generator

A zero-backend tool to generate shareable podcast subscription links for all major platforms.

## Overview

PodSub Links Generator creates clean, shareable pages with subscription links for podcast RSS feeds. Enter any podcast feed URL and get a mobile-friendly page with platform-specific deep links for Apple Podcasts, Overcast, Pocket Casts, and more.

## Features

- **Zero backend** - pure HTML/CSS/JavaScript static site
- **Dual page architecture**
  - Generator page - input RSS feed to create shareable URL
  - Subscription page - displays platform buttons and feed details
- **Mobile-responsive design** with dark/light theme support
- **QR code generation** for easy mobile sharing
- **Custom URL scheme configuration** for unlisted apps
- **Production build** - minifies all assets and creates deployment zip

## Supported Platforms

- Apple Podcasts
- Overcast
- Pocket Casts
- Castro
- Podcast Addict
- Downcast
- And many more via custom URL schemes

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Create production build
npm run build
```

## Project Structure

```
.
├── src/
│   ├── index.html        # generator UI
│   ├── buttons.html      # subscription landing page
│   ├── app.js            # generator logic
│   ├── buttons.js        # subscription page logic
│   └── styles.css        # shared styles and themes
├── scripts/
│   ├── serve.js          # development server
│   └── build.js          # production build script
├── build/                # output directory (generated)
└── package.json
```

## How It Works

1. **Generator Page** (`index.html`)
   - User enters podcast RSS feed URL
   - URL validation checks for valid feed formats
   - Generates shareable link to subscription page
   - Creates QR code for mobile sharing

2. **Subscription Page** (`buttons.html`)
   - Receives feed URL as query parameter
   - Displays platform-specific subscription buttons
   - Shows raw RSS feed URL for manual entry
   - Supports custom URL scheme configuration

## Development

The development server (`npm run dev`) serves files from the `src/` directory on port 3000.

## Building for Production

```bash
npm run build
```

This creates:
- Minified HTML, CSS, and JavaScript in `build/`
- A `app.zip` file containing all production assets

## Deployment

Deploy the contents of `build/` or extract `app.zip` to any static hosting service (GitHub Pages, Netlify, Vercel, S3, etc.).

## License

CC0 - No rights reserved
