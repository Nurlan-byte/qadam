import { STORAGE, readStorage, writeStorage } from "./shared.js";

const TEXT_SIZES = [100, 112, 125];

// The button names the theme the user will switch to.
function updateThemeButton(button, theme) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    button.textContent = nextTheme === "light" ? "☀ Light theme" : "☾ Dark theme";
    button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
    button.setAttribute("aria-pressed", String(theme === "light"));
}

// Adds a "Text size" select next to the theme button and restores the saved size.
function setupTextSize(themeButton) {
    const controls = document.createElement("div");
    controls.className = "appearance-controls";
    const sidebarMenu = document.querySelector(".sidebar .navbar-collapse");
    if (sidebarMenu) sidebarMenu.append(controls);
    else themeButton.before(controls);
    controls.append(themeButton);

    const field = document.createElement("div");
    field.className = "text-size-control";
    const label = document.createElement("label");
    label.htmlFor = "text-size";
    label.textContent = "Text size";
    const select = document.createElement("select");
    select.id = "text-size";
    for (const size of TEXT_SIZES) {
        select.add(new Option(`${size}%`, size));
    }
    field.append(label, select);
    controls.append(field);

    let savedSize = readStorage(STORAGE.textSize, 100);
    if (!TEXT_SIZES.includes(savedSize)) savedSize = 100;
    document.documentElement.style.fontSize = `${savedSize}%`;
    select.value = savedSize;

    select.addEventListener("change", () => {
        const size = Number(select.value);
        document.documentElement.style.fontSize = `${size}%`;
        writeStorage(STORAGE.textSize, size);
    });
}

function setupTheme() {
    const root = document.documentElement;
    const button = document.querySelector("#theme-toggle");

    // Restore the saved theme; dark is the default.
    const theme = readStorage(STORAGE.theme, "dark") === "light" ? "light" : "dark";
    root.setAttribute("data-bs-theme", theme);
    if (!button) return;
    updateThemeButton(button, theme);

    button.addEventListener("click", () => {
        const nextTheme = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-bs-theme", nextTheme);
        updateThemeButton(button, nextTheme);
        writeStorage(STORAGE.theme, nextTheme);
    });
    setupTextSize(button);
}

export { setupTheme };
