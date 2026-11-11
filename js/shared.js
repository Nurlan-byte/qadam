const STORAGE = {
    theme: "qadam-theme",
    tasks: "qadam-tasks",
    habits: "qadam-habits",
    focusSessions: "qadam-focus-sessions",
    focusTimer: "qadam-focus-timer",
    events: "qadam-events"
};

function getLocalDate(date = new Date()) {
    const year = String(date.getFullYear()).padStart(4, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(dateString, amount) {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return getLocalDate(date);
}

function isValidDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    if (value.startsWith("0000")) return false;
    const date = new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime()) && getLocalDate(date) === value;
}

function showStorageWarning(message) {
    let warning = document.querySelector("#storage-warning");
    if (!warning) {
        warning = document.createElement("p");
        warning.id = "storage-warning";
        warning.className = "alert alert-warning";
        warning.setAttribute("role", "status");
        const container = document.querySelector("main") || document.body;
        container.prepend(warning);
    }
    warning.textContent = message;
}

function readStorage(key, fallback, validate = () => true) {
    try {
        const value = localStorage.getItem(key);
        if (value === null) return structuredClone(fallback);
        const parsed = JSON.parse(value);
        if (!validate(parsed)) throw new Error("Invalid saved data");
        return parsed;
    } catch (error) {
        showStorageWarning("Some saved data could not be loaded. Default values are shown for this visit.");
        return structuredClone(fallback);
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        document.dispatchEvent(new CustomEvent("qadam:data-changed", { detail: { key } }));
        return true;
    } catch (error) {
        showStorageWarning("Changes could not be saved in this browser. They will last only while this page stays open.");
        return false;
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
}

function announce(message) {
    const status = document.querySelector("#app-status");
    if (status) status.textContent = message;
}

function formatDate(dateString) {
    if (!isValidDate(dateString)) return "No date";
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(`${dateString}T12:00:00`));
}

export { STORAGE, getLocalDate, addDays, isValidDate, readStorage, writeStorage, escapeHTML, announce, formatDate };
