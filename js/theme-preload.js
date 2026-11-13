// Runs in <head> before the page is drawn, so a saved light theme or text size
// is applied at once instead of showing the defaults for a moment.
// theme.js reads the same values again and adds the controls.
try {
    const savedTheme = JSON.parse(localStorage.getItem("qadam-theme"));
    if (savedTheme === "light") document.documentElement.setAttribute("data-bs-theme", "light");

    const savedSize = JSON.parse(localStorage.getItem("qadam-text-size"));
    if ([100, 112, 125].includes(savedSize)) document.documentElement.style.fontSize = `${savedSize}%`;
} catch (error) {
    // Broken saved values are ignored here; theme.js shows the warning.
}
