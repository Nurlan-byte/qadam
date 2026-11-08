import { STORAGE, readStorage, writeStorage } from "./shared.js";

const TEXT_SIZE_KEY = "qadam-text-size";
const TEXT_SIZES = [100, 112, 125];

function updateThemeButton(button, theme) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    button.textContent = `${nextTheme === "light" ? "☀ Light" : "☾ Dark"} theme`;
    button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
    button.setAttribute("aria-pressed", String(theme === "light"));
}

function readTextSize() {
    return readStorage(TEXT_SIZE_KEY, 100, (value) => TEXT_SIZES.includes(value));
}

function setupTextSize(themeButton) {
    const controls = document.createElement("div");
    controls.className = "appearance-controls";
    const sidebarMenu = themeButton.closest(".sidebar")?.querySelector(".navbar-collapse");
    if (sidebarMenu) {
        sidebarMenu.append(controls);
    } else {
        themeButton.before(controls);
    }
    controls.append(themeButton);

    const field = document.createElement("div");
    field.className = "text-size-control";
    const label = document.createElement("label");
    label.htmlFor = "text-size";
    label.textContent = "Text size";
    const select = document.createElement("select");
    select.id = "text-size";
    for (const size of TEXT_SIZES) {
        select.add(new Option(`${size}%`, String(size)));
    }
    field.append(label, select);
    controls.append(field);

    function applyTextSize(size) {
        document.documentElement.style.fontSize = `${size}%`;
        select.value = String(size);
    }

    applyTextSize(readTextSize());
    select.addEventListener("change", () => {
        const size = Number(select.value);
        if (!TEXT_SIZES.includes(size)) return;
        applyTextSize(size);
        writeStorage(TEXT_SIZE_KEY, size);
    });
    window.addEventListener("storage", (event) => {
        if (event.key === TEXT_SIZE_KEY || event.key === null) applyTextSize(readTextSize());
    });
}

function setupTheme() {
    const root = document.documentElement;
    const button = document.querySelector("#theme-toggle");

    function applyTheme() {
        const saved = readStorage(STORAGE.theme, "dark");
        const theme = saved === "light" ? "light" : "dark";
        root.setAttribute("data-bs-theme", theme);
        if (button) updateThemeButton(button, theme);
    }

    applyTheme();
    if (!button) return;
    button.addEventListener("click", () => {
        const nextTheme = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-bs-theme", nextTheme);
        updateThemeButton(button, nextTheme);
        writeStorage(STORAGE.theme, nextTheme);
    });
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE.theme || event.key === null) applyTheme();
    });
    setupTextSize(button);
}

export { setupTheme };
