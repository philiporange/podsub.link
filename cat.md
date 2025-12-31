### podsub.link

# Project Directory Structure
```
./
│   app.zip
│   README.md
│   package-lock.json
│   package.json
│   LICENSE
├── scripts/
├── │   serve.js
├── │   build.js
├── src/
├── │   buttons.html
├── │   index.html
├── │   app.js
├── │   styles.css
├── │   buttons.js
├── public/```

# README.md

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


# scripts/serve.js
#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'text/plain';
}

function serveFile(res, filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    const mimeType = getMimeType(fullPath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Parse URL to separate path from query string
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let filePath = url.pathname === '/' ? 'src/index.html' : url.pathname.slice(1);

  // Default to index.html for directory requests
  if (filePath.endsWith('/')) {
    filePath += 'index.html';
  }

  // If file doesn't start with 'src/', check if it exists in src/ first
  if (!filePath.startsWith('src/')) {
    const srcPath = 'src/' + filePath;
    try {
      // Try to read from src/ first
      if (fs.existsSync(path.join(__dirname, '..', srcPath))) {
        filePath = srcPath;
      }
    } catch (err) {
      // If src/ doesn't exist, try the original path
    }
  }

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}`);
  console.log('Serving files from src/ directory');
});

# scripts/build.js
const fs = require("fs");
const path = require("path");
const { minify: htmlMinify } = require("html-minifier-terser");
const { minify: jsMinify } = require("terser");
const CleanCSS = require("clean-css");
const archiver = require("archiver");

// Source directory and files
const SRC_DIR = path.join(__dirname, "..", "src");
const files = [
  "buttons.html",
  "index.html",
  "app.js",
  "styles.css",
  "buttons.js",
];

// Output directories/files
const BUILD_DIR = path.join(__dirname, "..", "build");
const ZIP_FILE = path.join(__dirname, "..", "app.zip");

// Ensure the build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR);
}

// Function to minify HTML content
async function processHTML(content) {
  return await htmlMinify(content, {
    collapseWhitespace: true,
    removeComments: true,
    minifyJS: true,
    minifyCSS: true,
  });
}

// Function to minify JavaScript content
async function processJS(content) {
  const result = await jsMinify(content);
  return result.code;
}

// Function to minify CSS content
function processCSS(content) {
  return new CleanCSS().minify(content).styles;
}

// Function to process a single file based on its extension
async function processFile(file) {
  const ext = path.extname(file);
  const filePath = path.join(SRC_DIR, file);
  const destPath = path.join(BUILD_DIR, file);

  let content = fs.readFileSync(filePath, "utf8");
  let minifiedContent = content;

  try {
    if (ext === ".html") {
      minifiedContent = await processHTML(content);
    } else if (ext === ".js") {
      minifiedContent = await processJS(content);
    } else if (ext === ".css") {
      minifiedContent = processCSS(content);
    }
    fs.writeFileSync(destPath, minifiedContent, "utf8");
    console.log(`Minified ${file} -> build/${file}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

// Function to zip the dist directory
function zipDirectory(sourceDir, outPath) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on("error", (err) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
}

// Main build process
async function build() {
  console.log("Starting build process...");
  // Process each file
  for (const file of files) {
    await processFile(file);
  }

  // Create the zip archive
  try {
    await zipDirectory(BUILD_DIR, ZIP_FILE);
    console.log(`Packaged distribution into ${path.basename(ZIP_FILE)}`);
  } catch (error) {
    console.error("Error creating zip archive:", error);
  }
}

build();


# src/buttons.html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Podcast Subscription Links</title>
        <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link rel="stylesheet" href="styles.css" />
        <!-- Add QRCode.js library -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    </head>
    <body>
        <button
            id="themeToggle"
            class="theme-toggle"
            aria-label="Toggle dark/light mode"
        >
            <i class="fas fa-moon"></i>
        </button>

        <div id="buttons-page-app">
            <header>
                <h1>Listen in your podcast app</h1>
            </header>

            <p class="loading-message" id="loadingMessage">Loading links...</p>

            <div
                class="buttons-container"
                id="buttonsContainer"
                style="display: none"
            >
                <!-- Generated app buttons will appear here -->
            </div>

            <!-- Custom URL Scheme Configuration -->
            <div
                class="custom-config-container"
                id="customConfigContainer"
                style="display: none"
            >
                <h2><i class="fas fa-cog"></i> Custom App Configuration</h2>
                <p class="config-description">
                    Configure a custom URL scheme for apps that aren't pre-configured.
                    Use <code>{URL}</code> as a placeholder for the RSS feed URL.
                </p>
                <div class="config-form">
                    <div class="input-group">
                        <label for="customSchemeInput">URL Scheme:</label>
                        <input
                            type="text"
                            id="customSchemeInput"
                            placeholder="myapp://subscribe?url={URL}"
                            aria-label="Custom URL scheme"
                        />
                        <button id="saveCustomScheme" title="Save custom scheme">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                    <div class="config-examples">
                        <p><strong>Examples:</strong></p>
                        <ul>
                            <li><code>myapp://subscribe?url={URL}</code></li>
                            <li><code>myapp://feed/{URL}</code></li>
                            <li><code>myapp://add?feed={URL}</code></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div
                class="feed-link-container"
                id="feedLinkContainer"
                style="display: none"
            >
                <h2><i class="fas fa-rss"></i> Feed URL</h2>
                <div class="feed-url-display">
                    <code id="feedLinkDisplay">Feed URL will appear here</code>
                    <button id="copyFeedLinkButton" title="Copy RSS Feed URL">
                        <i class="fas fa-copy"></i> Copy Feed
                    </button>
                </div>
                <!-- QR Code placeholder for the feed link -->
                <div id="qrCodeFeedLink" class="qr-code-wrapper">
                    <!-- QR code will be rendered here by JavaScript -->
                </div>
                <p class="link-instructions">
                    Use this link for apps not listed above or for manual entry.
                </p>
            </div>

            <footer>
                <p>
                    Generated by
                    <a href="/">PodSub</a>.
                </p>
            </footer>
        </div>

        <div id="toast">
            <i class="fas fa-check-circle"></i>
            <span id="toastMessage"></span>
        </div>

        <script src="buttons.js"></script>
    </body>
</html>


# src/index.html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PodSub Links Generator</title>
        <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link rel="stylesheet" href="styles.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    </head>
    <body>
        <button
            id="themeToggle"
            class="theme-toggle"
            aria-label="Toggle dark/light mode"
        >
            <i class="fas fa-moon"></i>
        </button>

        <div id="app">
            <header>
                <h1>Podcast Links Generator</h1>
                <p class="app-description">
                    Enter a podcast feed URL to create a shareable page with
                    subscription links for all major platforms.
                </p>
            </header>

            <div class="input-container">
                <input
                    type="text"
                    id="podcastUrl"
                    placeholder="Enter podcast RSS feed URL..."
                    aria-label="Podcast feed URL"
                />
                <span id="validation-message"
                    >Please enter a valid podcast feed URL</span
                >
            </div>

            <div class="action-buttons">
                <button id="generate" disabled>
                    <i class="fas fa-link"></i>
                    Generate Links
                </button>
                <button id="clear">
                    <i class="fas fa-times"></i>
                    Clear
                </button>
            </div>

            <!-- Area to display the generated link -->
            <div
                class="generated-link-container"
                id="generatedLinkContainer"
                style="display: none"
            >
                <h2>Your Shareable Link:</h2>
                <div class="link-display">
                    <a href="#" id="generatedLink" target="_blank"></a>
                    <button id="copyGeneratedLink" title="Copy shareable link">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <!-- QR Code placeholder for the shareable link -->
                <div id="qrCodeShareLink" class="qr-code-wrapper">
                    <!-- QR code will be rendered here by JavaScript -->
                </div>
                <p class="link-instructions">
                    Share this link with your audience!
                </p>
            </div>

            <div class="placeholder-message" id="initialPlaceholder">
                Enter a podcast feed URL and click "Generate Page Link" above.
            </div>

            <div class="attribution">
                Generates a page with links compatible with various podcast
                apps.
            </div>
        </div>

        <div id="toast">
            <i class="fas fa-check-circle"></i>
            <span id="toastMessage"></span>
        </div>

        <script src="app.js"></script>
    </body>
</html>


# src/app.js
// DOM Elements for index.html
const podcastUrlInput = document.getElementById("podcastUrl");
const generateBtn = document.getElementById("generate");
const clearBtn = document.getElementById("clear");
const validationMessage = document.getElementById("validation-message");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector("i");
const generatedLinkContainer = document.getElementById(
    "generatedLinkContainer",
);
const generatedLink = document.getElementById("generatedLink");
const copyGeneratedLinkBtn = document.getElementById("copyGeneratedLink");
const initialPlaceholder = document.getElementById("initialPlaceholder");
const qrCodeShareLinkDiv = document.getElementById("qrCodeShareLink"); // QR Code div for shareable link

// --- Utility Functions ---

// Function to validate URL (basic check)
function isValidUrl(url) {
    try {
        const parsedUrl = new URL(url);
        if (!["http:", "https:", "feed:"].includes(parsedUrl.protocol)) {
            if (parsedUrl.protocol !== "feed:") return false;
        }
        const path = parsedUrl.pathname.toLowerCase();
        return (
            url.includes("rss") ||
            url.includes("feed") ||
            path.endsWith(".xml") ||
            path.endsWith(".rss") ||
            url.includes("podcast") ||
            url.includes("anchor.fm/s/") ||
            url.includes("feeds.megaphone.fm") ||
            url.includes("simplecast.com") ||
            url.includes("omnycontent.com") ||
            url.includes("transistor.fm") ||
            url.includes("acast.com") ||
            url.includes("spreaker.com") ||
            url.includes("libsyn.com")
        );
    } catch (e) {
        return false;
    }
}

// Function to show toast message
function showToast(message, isError = false) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.className = "show";
    if (isError) {
        toast.classList.add("error");
    } else {
        toast.classList.remove("error");
    }
    const icon = toast.querySelector("i");
    if (icon) {
        icon.className = isError
            ? "fas fa-times-circle"
            : "fas fa-check-circle";
    }
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 2500);
}

// Function to copy to clipboard
function copyToClipboard(text, successMessage = "Copied to clipboard!") {
    if (!navigator.clipboard) {
        // Fallback for browsers that don't support Clipboard API
        fallbackCopyTextToClipboard(text, successMessage);
        return;
    }
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast(successMessage);
        })
        .catch(err => {
            showToast("Failed to copy link", true);
            console.error("Failed to copy: ", err);
        });
}

// Fallback function for older browsers
function fallbackCopyTextToClipboard(text, successMessage) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast(successMessage);
        } else {
            showToast("Failed to copy link", true);
        }
    } catch (err) {
        showToast("Failed to copy link", true);
        console.error("Failed to copy: ", err);
    }
    
    document.body.removeChild(textArea);
}

// --- Event Listeners ---

podcastUrlInput.addEventListener("input", () => {
    const inputUrl = podcastUrlInput.value.trim();
    if (inputUrl === "") {
        generateBtn.disabled = true;
        validationMessage.style.display = "none";
        return;
    }
    if (!isValidUrl(inputUrl)) {
        generateBtn.disabled = true;
        validationMessage.style.display = "block";
    } else {
        generateBtn.disabled = false;
        validationMessage.style.display = "none";
    }
});

generateBtn.addEventListener("click", () => {
    let inputUrl = podcastUrlInput.value.trim();
    if (!inputUrl) {
        showToast("Please enter a podcast link first", true);
        return;
    }

    // Ensure URL has proper protocol format (https:// not https/)
    if (inputUrl.match(/^https?:\/[^\/]/)) {
        inputUrl = inputUrl.replace(/^(https?):\//, '$1://');
    }

    // Add protocol if missing
    if (!inputUrl.match(/^https?:\/\//)) {
        inputUrl = 'https://' + inputUrl;
    }

    if (!isValidUrl(inputUrl)) {
        showToast("Please enter a valid podcast feed URL", true);
        return;
    }

    const buttonsPageUrl = new URL("buttons.html", window.location.href);
    buttonsPageUrl.searchParams.set("feed", encodeURIComponent(inputUrl));
    const finalUrl = buttonsPageUrl.toString();

    if (
        generatedLink &&
        generatedLinkContainer &&
        initialPlaceholder &&
        qrCodeShareLinkDiv
    ) {
        generatedLink.href = finalUrl;
        generatedLink.textContent = finalUrl;
        generatedLinkContainer.style.display = "block";
        initialPlaceholder.style.display = "none";
        showToast("Shareable link generated!");

        // Generate QR Code for the shareable link
        qrCodeShareLinkDiv.innerHTML = ""; // Clear previous QR code
        if (typeof QRCode !== "undefined") {
            new QRCode(qrCodeShareLinkDiv, {
                text: finalUrl,
                width: 400,
                height: 400,
                colorDark:
                    document.documentElement.getAttribute("data-theme") ===
                    "dark"
                        ? "#e0e0e0"
                        : "#000000",
                colorLight:
                    document.documentElement.getAttribute("data-theme") ===
                    "dark"
                        ? "#1e1e1e"
                        : "#ffffff",
            });
        } else {
            qrCodeShareLinkDiv.innerHTML =
                "<p style='font-size:0.8em; color:var(--text-secondary);'>QR code generation failed (library not loaded).</p>";
            console.warn("QRCode.js library not loaded.");
        }

        if (copyGeneratedLinkBtn) {
            copyGeneratedLinkBtn.onclick = function() {
                copyToClipboard(finalUrl, "Shareable link copied!");
            };
        }
    } else {
        console.error(
            "Required elements for displaying the link or QR code are missing.",
        );
        showToast("Error displaying the generated link", true);
    }
});

clearBtn.addEventListener("click", () => {
    podcastUrlInput.value = "";
    generateBtn.disabled = true;
    validationMessage.style.display = "none";

    if (generatedLinkContainer && initialPlaceholder && qrCodeShareLinkDiv) {
        generatedLinkContainer.style.display = "none";
        if (generatedLink) {
            generatedLink.href = "#";
            generatedLink.textContent = "";
        }
        qrCodeShareLinkDiv.innerHTML = ""; // Clear QR code
        initialPlaceholder.style.display = "block";
    }
});

// --- Theme Toggle Logic ---
function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        if (themeIcon) themeIcon.className = "fas fa-sun";
    } else {
        document.documentElement.removeAttribute("data-theme");
        if (themeIcon) themeIcon.className = "fas fa-moon";
    }
    localStorage.setItem("theme", theme);

    // Re-generate QR code with new theme colors if it is visible
    if (
        typeof QRCode !== "undefined" &&
        generatedLinkContainer.style.display === "block" &&
        qrCodeShareLinkDiv
    ) {
        const currentUrl = generatedLink.href;
        // Ensure currentUrl is a valid generated link, not the initial placeholder href
        if (
            currentUrl &&
            currentUrl !== "#" &&
            currentUrl !==
                window.location.origin + window.location.pathname + "#"
        ) {
            qrCodeShareLinkDiv.innerHTML = "";
            new QRCode(qrCodeShareLinkDiv, {
                text: currentUrl,
                width: 400,
                height: 400,
                colorDark: theme === "dark" ? "#e0e0e0" : "#000000",
                colorLight: theme === "dark" ? "#1e1e1e" : "#ffffff",
            });
        }
    } else if (
        generatedLinkContainer.style.display === "block" &&
        qrCodeShareLinkDiv
    ) {
        // If container is visible but QRCode lib is not loaded
        console.warn(
            "QRCode.js library not loaded, cannot update QR on theme change.",
        );
        // Optionally update the message in qrCodeShareLinkDiv if it was showing an error
        if (
            !qrCodeShareLinkDiv.querySelector("canvas") &&
            !qrCodeShareLinkDiv.querySelector("img")
        ) {
            qrCodeShareLinkDiv.innerHTML =
                "<p style='font-size:0.8em; color:var(--text-secondary);'>QR code generation failed (library not loaded).</p>";
        }
    }
}

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(newTheme);
    });
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);

    const urlParams = new URLSearchParams(window.location.search);
    const feedUrlParam = urlParams.get("feed");
    if (feedUrlParam) {
        try {
            const decodedFeedUrl = decodeURIComponent(feedUrlParam);
            if (isValidUrl(decodedFeedUrl)) {
                podcastUrlInput.value = decodedFeedUrl;
                // Trigger input event to enable button and validate
                podcastUrlInput.dispatchEvent(new Event("input"));
            } else {
                showToast("The feed URL in the link is invalid", true);
            }
        } catch (e) {
            showToast("Could not process the feed URL from the link", true);
        }
    }
});


# src/styles.css
:root {
    --primary-color: #4a6cf7;
    --primary-hover: #3a5ce6;
    --text-color: #333;
    --text-secondary: #666;
    --bg-color: #fff;
    --card-bg: #f8f9fa;
    --border-color: #e0e0e0;
    --success-color: #2ecc71;
    --error-color: #e74c3c;
    --radius: 8px;
    --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    --transition: all 0.3s ease;
    --font-main:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
        Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

[data-theme="dark"] {
    --text-color: #e0e0e0;
    --text-secondary: #aaa;
    --bg-color: #121212;
    --card-bg: #1e1e1e;
    --border-color: #333;
    --shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: var(--font-main);
    background-color: var(--bg-color);
    color: var(--text-color);
    line-height: 1.6;
    transition:
        background-color 0.3s ease,
        color 0.3s ease; /* Smoother theme transition */
    min-height: 100vh;
    display: flex; /* Helps footer stick to bottom if content is short */
    flex-direction: column; /* Helps footer stick to bottom */
}

#app,
#buttons-page-app {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
    width: 100%;
    flex-grow: 1; /* Allow content to grow */
}

header {
    text-align: center;
    margin-bottom: 2rem;
}

h1 {
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
    color: var(--primary-color);
}

h2 {
    margin-bottom: 0.75rem;
    color: var(--text-color);
}

.app-description,
.page-description {
    color: var(--text-secondary);
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
}

code {
    background-color: var(--card-bg);
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.9em;
    border: 1px solid var(--border-color);
    color: var(--text-color); /* Ensure code color respects theme */
}

.input-container {
    position: relative;
    margin-bottom: 1.5rem;
}

input[type="text"] {
    width: 100%;
    padding: 1rem 1rem;
    font-size: 1rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius);
    background-color: var(--bg-color);
    color: var(--text-color);
    transition: var(--transition);
}

input[type="text"]:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.2);
}

#validation-message {
    /* position: absolute; */ /* Removed absolute positioning */
    /* left: 0; */
    display: block; /* Use block instead of absolute */
    font-size: 0.85rem;
    margin-top: 0.35rem; /* Adjusted margin */
    color: var(--error-color);
    display: none; /* Hide initially */
    min-height: 1.2em; /* Reserve space to prevent layout shift */
}

.action-buttons {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 2rem;
}

button {
    cursor: pointer;
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: var(--radius);
    transition: var(--transition);
    display: inline-flex; /* Use inline-flex for better alignment with text */
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    vertical-align: middle; /* Align button vertically if needed */
}

button i {
    line-height: 1; /* Prevent icon from affecting button height */
}

button#generate {
    background-color: var(--primary-color);
    color: white;
    flex: 1; /* Allow generate button to take more space */
}

button#generate:hover {
    background-color: var(--primary-hover);
}

button#generate:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(
        --primary-color
    ); /* Keep color consistent when disabled */
}

button#clear {
    background-color: var(--card-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    white-space: nowrap; /* Prevent clear button text wrapping */
}

button#clear:hover {
    background-color: var(--border-color);
}

.theme-toggle {
    position: fixed; /* Fixed position relative to viewport */
    top: 1rem;
    right: 1rem;
    background: var(--card-bg); /* Give it a slight background */
    border: 1px solid var(--border-color); /* Add subtle border */
    font-size: 1.1rem; /* Slightly smaller */
    color: var(--text-secondary); /* Use secondary text color */
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    width: 40px; /* Fixed size */
    height: 40px; /* Fixed size */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001; /* Ensure it's above toast */
    box-shadow: var(--shadow);
}

.theme-toggle:hover {
    background-color: var(--border-color);
    color: var(--text-color);
}

/* Styles for buttons.html button container */
.buttons-container {
    display: grid;
    grid-template-columns: repeat(
        auto-fill,
        minmax(180px, 1fr)
    ); /* Slightly wider min */
    gap: 1rem;
    margin-top: 1.5rem;
}

/* Placeholder/Loading Messages */
.placeholder-message,
.loading-message {
    text-align: center;
    padding: 2rem;
    background-color: var(--card-bg);
    border-radius: var(--radius);
    color: var(--text-secondary);
    border: 1px dashed var(--border-color);
    margin-top: 1rem;
    grid-column: 1 / -1; /* Span full width if grid is active */
}

.loading-message {
    border-style: solid; /* Solid border for loading */
}

/* Generated Link Display on index.html */
.generated-link-container {
    background-color: var(--card-bg);
    padding: 1.5rem;
    border-radius: var(--radius);
    margin-top: 2rem;
    border: 1px solid var(--border-color);
}

.generated-link-container h2 {
    font-size: 1.2rem;
    text-align: center;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.link-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--bg-color);
    padding: 0.75rem;
    border-radius: var(--radius);
    border: 1px solid var(--border-color);
    margin-bottom: 1rem;
    word-break: break-all; /* Prevent long URLs from overflowing */
}

.link-display a {
    flex-grow: 1;
    color: var(--primary-color);
    text-decoration: none;
    font-family: monospace; /* Use monospace for URL */
    font-size: 0.9rem;
}
.link-display a:hover {
    text-decoration: underline;
}

.link-display button {
    padding: 0.5rem; /* Smaller padding for copy icon button */
    font-size: 0.9rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    min-width: 36px; /* Ensure button has decent size */
}
.link-display button:hover {
    background-color: var(--primary-hover);
}

.link-instructions {
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

/* App Button Styling (buttons.html) */
.app-button {
    text-decoration: none;
    padding: 0.8rem 1rem; /* Adjusted padding */
    display: flex; /* Use flexbox */
    align-items: center; /* Vertical centering */
    justify-content: center; /* Horizontal centering */
    text-align: center; /* Center text */
    gap: 0.6rem; /* Slightly reduced gap */
    border-radius: var(--radius);
    font-weight: 600;
    color: white !important; /* Ensure text is white */
    background: #333; /* Default background */
    transition: var(--transition);
    box-shadow: var(--shadow);
    position: relative;
    /* overflow: hidden; /* Hide overflow */
    min-height: 3.5rem; /* Ensure consistent height */
    width: 100%; /* Make button fill its grid cell */
}

.app-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12); /* Slightly enhanced shadow */
    opacity: 0.9; /* Slight opacity change on hover */
}

.app-button:active {
    transform: translateY(0);
    box-shadow: var(--shadow); /* Reset shadow on click */
}

.app-button .platform-icon {
    font-size: 1.2rem;
    flex-shrink: 0; /* Prevent icon from shrinking */
    line-height: 1; /* Ensure icon aligns well */
}

.app-button .platform-name {
    font-size: 0.9rem; /* Slightly smaller name */
    line-height: 1.2; /* Improve readability if text wraps */
    flex-grow: 0; /* Do not allow name to grow */
    position: relative; /* For web indicator positioning */
    /* text-align: center; -- Already handled by justify-content */
}

.web-indicator {
    font-size: 0.7rem;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 0.3rem;
    font-weight: normal;
    opacity: 0.8;
}

.app-button.web-link {
    opacity: 0.85;
    border: 1px dashed rgba(255, 255, 255, 0.3);
}

.app-button.web-link:hover {
    opacity: 0.95;
    border: 1px solid rgba(255, 255, 255, 0.5);
}

.custom-indicator {
    font-size: 0.7rem;
    background-color: rgba(255, 255, 255, 0.3);
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 0.3rem;
    font-weight: normal;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
}

.app-button.configure-button {
    background: linear-gradient(135deg, #666666, #888888);
    border: 2px dashed rgba(255, 255, 255, 0.4);
}

.app-button.configure-button:hover {
    background: linear-gradient(135deg, #777777, #999999);
    border: 2px solid rgba(255, 255, 255, 0.6);
    transform: translateY(-1px);
}

/* Custom button wrapper with edit functionality */
.custom-button-wrapper {
    display: flex;
    align-items: stretch;
    width: 100%;
    min-height: 3.5rem;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    transition: var(--transition);
    position: relative;
    background: linear-gradient(45deg,
        #ff0080, #ff00ff, #8000ff, #0080ff, #00ffff,
        #00ff80, #80ff00, #ffff00, #ff8000, #ff0080);
    background-size: 400% 400%;
    animation: rainbow-gradient 3s ease infinite;
}

@keyframes rainbow-gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

.custom-button-wrapper:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12);
}

.button-inner {
    flex: 1;
    display: flex;
}

.custom-button-wrapper .app-button {
    border-radius: 0;
    box-shadow: none;
    min-height: 100%;
    margin: 0;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.edit-custom-btn {
    width: 3.5rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-top-right-radius: var(--radius);
    border-bottom-right-radius: var(--radius);
    color: white;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.4);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.edit-custom-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-left-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
}

.edit-custom-btn:active {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(1px);
}

.edit-custom-btn i {
    line-height: 1;
    opacity: 0.9;
}

.edit-custom-btn:hover i {
    opacity: 1;
}

/* --- Styles for the Feed Link Box on buttons.html --- */
.feed-link-container {
    background-color: var(--card-bg);
    padding: 1.5rem;
    border-radius: var(--radius);
    margin-top: 2rem; /* Space above the box */
    border: 1px solid var(--border-color);
    text-align: center; /* Center the heading */
}

.feed-link-container h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: var(--text-color); /* Use normal text color or --primary-color */
    display: flex; /* Align icon and text */
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.feed-link-container h2 i {
    /* Style the RSS icon */
    color: #f26522; /* RSS orange */
}

.feed-url-display {
    display: flex;
    align-items: center;
    gap: 0.75rem; /* Increased gap slightly */
    background-color: var(--bg-color);
    padding: 0.75rem 1rem; /* Adjusted padding */
    border-radius: var(--radius);
    border: 1px solid var(--border-color);
    margin-bottom: 1rem;
}

/* --- Styles for the Custom Configuration Section --- */
.custom-config-container {
    background-color: var(--card-bg);
    padding: 1.5rem;
    border-radius: var(--radius);
    margin-top: 2rem;
    border: 1px solid var(--border-color);
    text-align: center;
}

.custom-config-container h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: var(--text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.custom-config-container h2 i {
    color: #666666;
}

.config-description {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.5;
}

.config-form {
    text-align: left;
    max-width: 500px;
    margin: 0 auto;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.input-group label {
    font-weight: 600;
    color: var(--text-color);
    font-size: 0.9rem;
}

.input-group input {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.9rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius);
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: monospace;
    transition: var(--transition);
}

.input-group input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.2);
}

.input-group button {
    align-self: flex-start;
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 600;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.input-group button:hover {
    background-color: var(--primary-hover);
}

.config-examples {
    background-color: var(--bg-color);
    padding: 1rem;
    border-radius: var(--radius);
    border: 1px solid var(--border-color);
    margin-top: 1rem;
}

.config-examples p {
    margin-bottom: 0.5rem;
    color: var(--text-color);
    font-weight: 600;
    font-size: 0.9rem;
}

.config-examples ul {
    margin: 0;
    padding-left: 1.5rem;
}

.config-examples li {
    margin-bottom: 0.3rem;
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

/* Style for the code element holding the URL */
.feed-url-display code {
    flex-grow: 1;
    font-family: monospace; /* Use monospace for URL */
    font-size: 0.9rem;
    word-break: break-all; /* Prevent long URLs from overflowing */
    text-align: left; /* Align URL text to the left */
    background-color: transparent; /* Override default code background */
    border: none; /* Override default code border */
    padding: 0; /* Override default code padding */
    color: var(--text-color); /* Ensure code color respects theme */
}

/* Style for the copy button next to the feed URL */
.feed-url-display button {
    padding: 0.6rem 0.9rem; /* Slightly adjust padding */
    font-size: 0.9rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    white-space: nowrap; /* Prevent button text wrapping */
    flex-shrink: 0; /* Prevent button from shrinking */
}

.feed-url-display button:hover {
    background-color: var(--primary-hover);
}

.feed-url-display button i {
    margin-right: 0.4rem; /* Space between icon and text */
}

.feed-link-container .link-instructions {
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 0.5rem; /* Add margin if needed */
}

/* --- End Styles for Feed Link Box --- */

/* Toast notification */
#toast {
    visibility: hidden;
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--success-color);
    color: white;
    text-align: center;
    border-radius: var(--radius);
    padding: 12px 24px;
    z-index: 1000;
    box-shadow: var(--shadow);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0; /* Start hidden */
    transition:
        opacity 0.5s ease,
        visibility 0.5s ease,
        bottom 0.5s ease; /* Smooth transition */
}

#toast.show {
    visibility: visible;
    opacity: 1;
    bottom: 30px; /* Move up slightly when shown */
    /* animation: fadein 0.5s forwards; */ /* Use transition instead */
}

/* Hide after delay handled by JS */
/* @keyframes fadeout { ... } */

#toast.error {
    background-color: var(--error-color);
}

#toast i {
    font-size: 1.1rem;
}

/* Platform-specific colors (apply to .app-button) */
.app-button.apple {
    background-color: #7d50f7;
}
.app-button.spotify {
    background-color: #1db954;
}
.app-button.google {
    background-color: #ea4335;
}
.app-button.overcast {
    background-color: #fc7e0f;
}
.app-button.pocket-casts {
    background-color: #f43e37;
}
.app-button.castro {
    background-color: #00b265;
}
.app-button.stitcher {
    background-color: #2a9fd8;
} /* Keep if needed */
.app-button.amazon {
    background-color: #ff9900;
}
.app-button.rss {
    background-color: #f26522;
}

/* QR Code Styling */
.qr-code-wrapper {
    margin-top: 20px; /* Space above the QR code block */
    margin-bottom: 15px; /* Space below the QR code block */
    display: flex; /* Use flex to easily center the QR code image */
    justify-content: center; /* Horizontally center the QR code image */
    padding: 15px; /* Padding within the wrapper, around the QR code image */
    background-color: var(--card-bg); /* Background for the wrapper area */
    border-radius: var(--radius); /* Consistent rounded corners */
    box-shadow: var(--shadow); /* Consistent shadow */
}

.qr-code-wrapper canvas,
.qr-code-wrapper img {
    /* qrcode.js generates either a canvas or an img */
    display: block; /* Ensure it's a block element */
    max-width: min(80vw, 600px) !important; /* Set maximum width to smaller of 80vw or 600px */
    max-height: min(80vw, 600px) !important; /* Set maximum height to match width for square QR */
    width: auto !important; /* Allow QR code to grow up to the max width */
    height: auto !important; /* Maintain aspect ratio */
    border: 1px solid var(--border-color);
    border-radius: 4px; /* Slightly rounded corners for the QR image itself */
}

/* Footer styling */
footer {
    text-align: center;
    margin-top: 3rem;
    padding: 1rem 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
    border-top: 1px solid var(--border-color);
    width: 100%; /* Ensure footer spans width */
}

footer a {
    color: var(--primary-color);
    text-decoration: none;
}
footer a:hover {
    text-decoration: underline;
}

/* Attribution (index.html specific) */
.attribution {
    text-align: center;
    margin-top: 2rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
}

/* Responsive design */
@media (max-width: 768px) {
    .buttons-container {
        grid-template-columns: repeat(
            auto-fill,
            minmax(160px, 1fr)
        ); /* Adjust min size */
    }
    h1 {
        font-size: 2rem;
    }
}

@media (max-width: 480px) {
    #app,
    #buttons-page-app {
        padding: 1.5rem 0.75rem; /* Reduce padding on small screens */
    }

    h1 {
        font-size: 1.8rem;
    }

    .app-description,
    .page-description {
        font-size: 1rem;
    }

    .buttons-container {
        /* Stack buttons vertically on very small screens */
        grid-template-columns: 1fr;
    }

    .action-buttons {
        flex-direction: column; /* Stack generate/clear buttons */
    }

    button {
        padding: 0.9rem 1rem; /* Adjust padding */
        font-size: 0.95rem;
    }

    .theme-toggle {
        top: 0.5rem;
        right: 0.5rem;
        width: 36px;
        height: 36px;
        font-size: 1rem;
    }

    /* Styles for the Feed Link Box on small screens */
    .feed-url-display {
        flex-direction: column;
        align-items: stretch;
    }
    .feed-url-display code {
        margin-bottom: 0.75rem; /* Space below URL when stacked */
        text-align: center; /* Center URL text when stacked */
    }
    .feed-url-display button {
        width: 100%; /* Make button full width */
        justify-content: center; /* Center button content */
    }

    .feed-link-container h2 {
        font-size: 1.1rem; /* Slightly smaller heading */
    }

    .link-display {
        flex-direction: column;
        align-items: stretch; /* Stretch items */
    }
    .link-display a {
        text-align: center;
        margin-bottom: 0.5rem;
    }
    .link-display button {
        width: 100%; /* Make copy button full width */
    }

    #toast {
        width: 90%; /* Make toast wider on small screens */
        bottom: 10px;
        padding: 10px 15px;
    }
    #toast.show {
        bottom: 15px;
    }
}


# src/buttons.js
// Data needed for button generation
// Only includes platforms with RSS feed deep link support
const platformData = {
    apple: {
        name: "Apple Podcasts",
        icon: "fab fa-apple",
        deepLink: (feedUrl) => {
            console.log('Apple Podcasts feedUrl:', feedUrl);
            const link = `podcast:${feedUrl}`;
            console.log('Apple Podcasts link:', link);
            return link;
        },
        webLink: (feedUrl) =>
            `https://podcasts.apple.com/podcast?itsct=${encodeURIComponent(feedUrl)}`,
        color: "#7D50F7",
        supported: true,
    },
    overcast: {
        name: "Overcast",
        icon: "fas fa-broadcast-tower",
        deepLink: (feedUrl) =>
            `overcast://x-callback-url/add?url=${encodeURIComponent(feedUrl)}`,
        webLink: (feedUrl) =>
            `https://overcast.fm/itunes${encodeURIComponent(feedUrl)}`,
        color: "#FC7E0F",
        supported: true,
    },
    pocketCasts: {
        name: "Pocket Casts",
        icon: "fas fa-podcast",
        deepLink: (feedUrl) => {
            const cleanUrl = feedUrl.replace(/^https?:\/\//, '');
            return `pktc://subscribe/${encodeURIComponent(cleanUrl)}`;
        },
        webLink: (feedUrl) =>
            `https://pca.st/itunes/${encodeURIComponent(feedUrl)}`,
        color: "#F43E37",
        supported: true,
    },
    downcast: {
        name: "Downcast",
        icon: "fas fa-download",
        deepLink: (feedUrl) => {
            const cleanUrl = feedUrl.replace(/^https?:\/\//, '');
            return `downcast://${cleanUrl}`;
        },
        webLink: (feedUrl) =>
            `https://downcastapp.com/`,
        color: "#5E5E5E",
        supported: true,
    },
    custom: {
        name: "Custom",
        icon: "fas fa-cog",
        deepLink: (feedUrl) => {
            const customScheme = localStorage.getItem('customUrlScheme') || '{URL}';
            return customScheme.replace('{URL}', encodeURIComponent(feedUrl));
        },
        webLink: (feedUrl) => '#',
        color: "#666666",
        supported: true,
        isCustom: true,
    },
};

// DOM Elements for buttons.html
const buttonsContainer = document.getElementById("buttonsContainer");
const loadingMessage = document.getElementById("loadingMessage");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector("i");
const feedLinkContainer = document.getElementById("feedLinkContainer");
const feedLinkDisplay = document.getElementById("feedLinkDisplay");
const copyFeedLinkButton = document.getElementById("copyFeedLinkButton");
const qrCodeFeedLinkDiv = document.getElementById("qrCodeFeedLink"); // QR Code div for feed link

// Custom configuration elements
const customConfigContainer = document.getElementById("customConfigContainer");
const customSchemeInput = document.getElementById("customSchemeInput");
const saveCustomScheme = document.getElementById("saveCustomScheme");

// --- localStorage Functions ---
function getLastUsedPlatform() {
    return localStorage.getItem('lastUsedPlatform') || 'apple';
}

function setLastUsedPlatform(platform) {
    localStorage.setItem('lastUsedPlatform', platform);
}

function getCustomUrlScheme() {
    return localStorage.getItem('customUrlScheme') || '';
}

function setCustomUrlScheme(scheme) {
    localStorage.setItem('customUrlScheme', scheme);
}

function getPlatformOrder() {
    const lastUsed = getLastUsedPlatform();
    const platforms = Object.keys(platformData).filter(p => p !== 'custom');

    // Move last used platform to the front
    const lastUsedIndex = platforms.indexOf(lastUsed);
    if (lastUsedIndex > -1) {
        platforms.splice(lastUsedIndex, 1);
        platforms.unshift(lastUsed);
    }

    // Add custom at the end
    platforms.push('custom');

    return platforms;
}

// --- Utility Functions ---
function isValidUrl(url) {
    try {
        const parsedUrl = new URL(url);
        if (!["http:", "https:", "feed:"].includes(parsedUrl.protocol)) {
            if (parsedUrl.protocol !== "feed:") return false;
        }
        const path = parsedUrl.pathname.toLowerCase();
        return (
            url.includes("rss") ||
            url.includes("feed") ||
            path.endsWith(".xml") ||
            path.endsWith(".rss") ||
            url.includes("podcast") ||
            url.includes("anchor.fm/s/") ||
            url.includes("feeds.megaphone.fm") ||
            url.includes("simplecast.com") ||
            url.includes("omnycontent.com") ||
            url.includes("transistor.fm") ||
            url.includes("acast.com") ||
            url.includes("spreaker.com") ||
            url.includes("libsyn.com")
        );
    } catch (e) {
        return false;
    }
}

function showToast(message, isError = false) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.className = "show";
    if (isError) toast.classList.add("error");
    else toast.classList.remove("error");
    const icon = toast.querySelector("i");
    if (icon)
        icon.className = isError
            ? "fas fa-times-circle"
            : "fas fa-check-circle";
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 2500);
}

function copyToClipboard(text, successMessage = "Link copied to clipboard!") {
    if (!navigator.clipboard) {
        // Fallback for browsers that don't support Clipboard API
        fallbackCopyTextToClipboard(text, successMessage);
        return;
    }
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast(successMessage);
        })
        .catch(err => {
            showToast("Failed to copy link", true);
            console.error("Failed to copy: ", err);
        });
}

// Fallback function for older browsers
function fallbackCopyTextToClipboard(text, successMessage) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast(successMessage);
        } else {
            showToast("Failed to copy link", true);
        }
    } catch (err) {
        showToast("Failed to copy link", true);
        console.error("Failed to copy: ", err);
    }
    
    document.body.removeChild(textArea);
}

// --- Logic ---
function generatePlatformButtons(feedUrl) {
    if (!buttonsContainer) return;
    buttonsContainer.innerHTML = "";

    // Get platform order with last used first
    const orderedPlatforms = getPlatformOrder();

    orderedPlatforms.forEach(platform => {
        const data = platformData[platform];
        if (!data) return;

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-wrapper");

        // Handle custom platform differently
        if (platform === 'custom') {
            const customScheme = getCustomUrlScheme();
            if (!customScheme) {
                // Show configuration button
                const btn = document.createElement("a");
                btn.href = '#';
                btn.onclick = (e) => {
                    e.preventDefault();
                    showCustomConfig();
                };
                btn.title = "Configure custom app";
                btn.classList.add("app-button", "custom", "configure-button");
                btn.style.backgroundColor = data.color;

                const iconEl = document.createElement("i");
                iconEl.className = data.icon + " platform-icon";
                iconEl.setAttribute("aria-hidden", "true");
                const nameEl = document.createElement("span");
                nameEl.className = "platform-name";
                nameEl.textContent = data.name;

                const indicator = document.createElement("span");
                indicator.className = "custom-indicator";
                indicator.textContent = "Configure";
                nameEl.appendChild(indicator);

                btn.appendChild(iconEl);
                btn.appendChild(nameEl);
                buttonContainer.appendChild(btn);
            } else {
                // Show custom button with edit functionality
                const link = data.deepLink(feedUrl);

                // Create main button
                const btn = document.createElement("a");
                btn.href = link;
                btn.target = "_blank";
                btn.title = `Subscribe on ${data.name} (${customScheme})`;
                btn.classList.add("app-button", "custom");
                btn.style.backgroundColor = data.color;
                btn.onclick = (e) => {
                    e.preventDefault();
                    setLastUsedPlatform(platform);
                    window.open(link, '_blank');
                };

                const iconEl = document.createElement("i");
                iconEl.className = data.icon + " platform-icon";
                iconEl.setAttribute("aria-hidden", "true");
                const nameEl = document.createElement("span");
                nameEl.className = "platform-name";
                nameEl.textContent = data.name;

                btn.appendChild(iconEl);
                btn.appendChild(nameEl);

                // Add edit button
                const editBtn = document.createElement("button");
                editBtn.className = "edit-custom-btn";
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = "Edit custom URL scheme";
                editBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showCustomConfig();
                };

                // Create wrapper
                const wrapper = document.createElement("div");
                wrapper.className = "custom-button-wrapper";

                const buttonInner = document.createElement("div");
                buttonInner.className = "button-inner";
                buttonInner.appendChild(btn);

                wrapper.appendChild(buttonInner);
                wrapper.appendChild(editBtn);
                buttonContainer.appendChild(wrapper);
            }
        } else {
            // Regular platform button
            const link = data.deepLink(feedUrl);
            const btn = document.createElement("a");
            btn.href = link;
            btn.target = "_blank";
            btn.title = `Subscribe on ${data.name}`;
            btn.onclick = () => setLastUsedPlatform(platform);
            btn.classList.add(
                "app-button",
                platform.replace(/([A-Z])/g, "-$1").toLowerCase(),
            );
            btn.style.backgroundColor = data.color;

            // Add special note for Apple Podcasts (unofficial/best-effort)
            if (platform === 'apple') {
                btn.title += " (may not work on all devices)";
            }

            const iconEl = document.createElement("i");
            iconEl.className = data.icon + " platform-icon";
            iconEl.setAttribute("aria-hidden", "true");
            const nameEl = document.createElement("span");
            nameEl.className = "platform-name";
            nameEl.textContent = data.name;

            btn.appendChild(iconEl);
            btn.appendChild(nameEl);
            buttonContainer.appendChild(btn);
        }

        buttonsContainer.appendChild(buttonContainer);
    });

    buttonsContainer.style.display = "grid";
    if (loadingMessage) loadingMessage.style.display = "none";
}

function showCustomConfig() {
    if (!customConfigContainer) return;

    // Load existing scheme
    const existingScheme = getCustomUrlScheme();
    if (customSchemeInput) {
        customSchemeInput.value = existingScheme;
    }

    // Show config container
    customConfigContainer.style.display = "block";

    // Scroll to config
    customConfigContainer.scrollIntoView({ behavior: 'smooth' });
}

function hideCustomConfig() {
    if (customConfigContainer) {
        customConfigContainer.style.display = "none";
    }
}

function displayFeedLinkAndQrCode(feedUrl) {
    if (
        feedLinkContainer &&
        feedLinkDisplay &&
        copyFeedLinkButton &&
        qrCodeFeedLinkDiv
    ) {
        feedLinkDisplay.textContent = feedUrl;
        copyFeedLinkButton.onclick = function() {
            copyToClipboard(feedUrl, "RSS Feed URL copied!");
        };

        qrCodeFeedLinkDiv.innerHTML = ""; // Clear previous QR code
        if (typeof QRCode !== "undefined") {
            new QRCode(qrCodeFeedLinkDiv, {
                text: feedUrl,
                width: 400,
                height: 400,
                colorDark:
                    document.documentElement.getAttribute("data-theme") ===
                    "dark"
                        ? "#e0e0e0"
                        : "#000000",
                colorLight:
                    document.documentElement.getAttribute("data-theme") ===
                    "dark"
                        ? "#1e1e1e"
                        : "#ffffff",
            });
        } else {
            qrCodeFeedLinkDiv.innerHTML =
                "<p style='font-size:0.8em; color:var(--text-secondary);'>QR code generation failed (library not loaded).</p>";
            console.warn("QRCode.js library not loaded.");
        }
        feedLinkContainer.style.display = "block";
    } else {
        console.error("Feed link container or QR code elements not found.");
    }
}

function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        if (themeIcon) themeIcon.className = "fas fa-sun";
    } else {
        document.documentElement.removeAttribute("data-theme");
        if (themeIcon) themeIcon.className = "fas fa-moon";
    }
    localStorage.setItem("theme", theme);

    // Re-generate QR code for feed link with new theme colors if it is visible
    if (
        typeof QRCode !== "undefined" &&
        feedLinkContainer.style.display === "block" &&
        qrCodeFeedLinkDiv
    ) {
        const currentFeedUrl = feedLinkDisplay.textContent;
        if (currentFeedUrl && currentFeedUrl !== "Feed URL will appear here") {
            qrCodeFeedLinkDiv.innerHTML = "";
            new QRCode(qrCodeFeedLinkDiv, {
                text: currentFeedUrl,
                width: 400,
                height: 400,
                colorDark: theme === "dark" ? "#e0e0e0" : "#000000",
                colorLight: theme === "dark" ? "#1e1e1e" : "#ffffff",
            });
        }
    } else if (
        feedLinkContainer.style.display === "block" &&
        qrCodeFeedLinkDiv
    ) {
        console.warn(
            "QRCode.js library not loaded, cannot update QR on theme change.",
        );
        if (
            !qrCodeFeedLinkDiv.querySelector("canvas") &&
            !qrCodeFeedLinkDiv.querySelector("img")
        ) {
            qrCodeFeedLinkDiv.innerHTML =
                "<p style='font-size:0.8em; color:var(--text-secondary);'>QR code generation failed (library not loaded).</p>";
        }
    }
}

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(newTheme);
    });
}

// --- Custom Scheme Event Listeners ---
if (saveCustomScheme) {
    saveCustomScheme.addEventListener("click", () => {
        if (!customSchemeInput) return;

        const scheme = customSchemeInput.value.trim();
        if (!scheme) {
            showToast("Please enter a URL scheme", true);
            return;
        }

        if (!scheme.includes('{URL}')) {
            showToast("URL scheme must include {URL} placeholder", true);
            return;
        }

        setCustomUrlScheme(scheme);
        showToast("Custom URL scheme saved successfully!");

        // Hide config and regenerate buttons
        hideCustomConfig();

        // Regenerate buttons to show the new custom button
        const urlParams = new URLSearchParams(window.location.search);
        const feedUrlParam = urlParams.get("feed");
        if (feedUrlParam) {
            try {
                const decodedFeedUrl = decodeURIComponent(feedUrlParam);
                if (isValidUrl(decodedFeedUrl)) {
                    generatePlatformButtons(decodedFeedUrl);
                }
            } catch (e) {
                console.error("Error regenerating buttons:", e);
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme); // Apply theme first for correct initial QR colors

    const urlParams = new URLSearchParams(window.location.search);
    const feedUrlParam = urlParams.get("feed");
    let validDecodedFeedUrl = null;

    if (feedUrlParam) {
        try {
            let decodedFeedUrl = decodeURIComponent(feedUrlParam);

            // Ensure URL has proper protocol format (https:// not https/)
            if (decodedFeedUrl.match(/^https?:\/[^\/]/)) {
                decodedFeedUrl = decodedFeedUrl.replace(/^(https?):\//, '$1://');
            }

            // Add protocol if missing
            if (!decodedFeedUrl.match(/^https?:\/\//)) {
                decodedFeedUrl = 'https://' + decodedFeedUrl;
            }

            if (isValidUrl(decodedFeedUrl)) {
                validDecodedFeedUrl = decodedFeedUrl;
            } else {
                throw new Error("Decoded URL is invalid.");
            }
        } catch (e) {
            console.error("Error processing feed URL:", e);
            if (loadingMessage) {
                loadingMessage.textContent =
                    "Error: Invalid feed URL format provided.";
                loadingMessage.style.color = "var(--error-color)";
                loadingMessage.style.display = "block";
            }
            if (feedLinkContainer) feedLinkContainer.style.display = "none";
            if (qrCodeFeedLinkDiv) qrCodeFeedLinkDiv.innerHTML = "";
        }
    } else {
        if (loadingMessage) {
            loadingMessage.textContent =
                "Error: No podcast feed URL provided. Please generate a link from the main page.";
            loadingMessage.style.color = "var(--error-color)";
            loadingMessage.style.display = "block";
        }
        if (feedLinkContainer) feedLinkContainer.style.display = "none";
        if (qrCodeFeedLinkDiv) qrCodeFeedLinkDiv.innerHTML = "";
    }

    if (validDecodedFeedUrl) {
        generatePlatformButtons(validDecodedFeedUrl);
        displayFeedLinkAndQrCode(validDecodedFeedUrl);
    } else {
        if (buttonsContainer) {
            buttonsContainer.innerHTML = "";
            buttonsContainer.style.display = "none";
        }
        // Ensure feed container (and thus QR) is hidden if no valid URL
        if (feedLinkContainer) feedLinkContainer.style.display = "none";
        if (qrCodeFeedLinkDiv) qrCodeFeedLinkDiv.innerHTML = "";
    }
});


