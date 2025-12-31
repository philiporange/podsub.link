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
    buttonsPageUrl.searchParams.set("feed", inputUrl);
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
