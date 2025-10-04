// Data needed for button generation
// Only includes platforms with RSS feed deep link support
const platformData = {
    apple: {
        name: "Apple Podcasts",
        icon: "fab fa-apple",
        deepLink: (feedUrl) => `podcast://${feedUrl}`,
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
        deepLink: (feedUrl) => `downcast://${feedUrl}`,
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
            const decodedFeedUrl = decodeURIComponent(feedUrlParam);
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
