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
