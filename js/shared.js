// Shared helpers: storage keys, dates, localStorage and small DOM utilities.

const STORAGE = {
    theme: "qadam-theme",
    textSize: "qadam-text-size",
    weatherCity: "qadam-weather-city",
    tasks: "qadam-tasks",
    habits: "qadam-habits",
    focusSessions: "qadam-focus-sessions",
    focusTimer: "qadam-focus-timer",
    events: "qadam-events"
};

// Returns a date as "YYYY-MM-DD" in the user's own time zone.
function getLocalDate(date = new Date()) {
    const year = String(date.getFullYear()).padStart(4, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Noon is used so that a daylight-saving change never moves the date.
function addDays(dateString, amount) {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return getLocalDate(date);
}

function isValidDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.getTime()) && getLocalDate(date) === value;
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

// Reads JSON from localStorage. Missing or broken values give the fallback.
function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        if (value === null) return fallback;
        return JSON.parse(value);
    } catch (error) {
        showStorageWarning("Some saved data could not be loaded. Default values are shown for this visit.");
        return fallback;
    }
}

// Saves a value as JSON. Returns false when the browser refuses to save.
function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        showStorageWarning("Changes could not be saved in this browser. They will last only while this page stays open.");
        return false;
    }
}

// Makes user text safe to insert into an HTML string.
function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function announce(message) {
    const status = document.querySelector("#app-status");
    if (status) status.textContent = message;
}

function formatDate(dateString) {
    if (!isValidDate(dateString)) return "No date";
    return new Date(`${dateString}T12:00:00`).toLocaleDateString("en", { day: "numeric", month: "short" });
}

function makeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export { STORAGE, getLocalDate, addDays, isValidDate, readStorage, writeStorage, escapeHTML, announce, formatDate, makeId };
