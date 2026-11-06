import { STORAGE, readStorage, writeStorage } from "./shared.js";

function setupTheme() {
    const savedTheme = readStorage(STORAGE.theme, "dark");
    const root = document.documentElement;
    const button = document.querySelector("#theme-toggle");
    root.setAttribute("data-bs-theme", savedTheme === "light" ? "light" : "dark");

    if (!button) return;
    updateThemeButton(button, root.getAttribute("data-bs-theme"));
    button.addEventListener("click", () => {
        const nextTheme = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-bs-theme", nextTheme);
        writeStorage(STORAGE.theme, nextTheme);
        updateThemeButton(button, nextTheme);
    });
}

function updateThemeButton(button, theme) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    button.textContent = `${nextTheme === "light" ? "☀" : "☾"} ${nextTheme === "light" ? "Light" : "Dark"} theme`;
    button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
    button.setAttribute("aria-pressed", String(theme === "light"));
}

export { setupTheme };
