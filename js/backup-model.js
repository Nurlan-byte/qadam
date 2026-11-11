import { STORAGE } from "./shared.js";
import { isValidTask } from "./task-model.js";
import { isValidHabit } from "./habit-model.js";
import { isValidEvent } from "./events-model.js";
import { isValidFocusSession } from "./focus-model.js";

const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

// Every part of a backup: its name in the file, its localStorage key and its record check.
const collections = [
    { name: "tasks", key: STORAGE.tasks, isValid: isValidTask },
    { name: "habits", key: STORAGE.habits, isValid: isValidHabit },
    { name: "events", key: STORAGE.events, isValid: isValidEvent },
    { name: "focusSessions", key: STORAGE.focusSessions, isValid: isValidFocusSession }
];

// Throws an Error with a readable message when the file is not a usable Qadam backup.
function validateBackup(backup) {
    if (!backup || backup.app !== "qadam" || backup.version !== BACKUP_VERSION) {
        throw new Error("Choose a Qadam backup with version 1.");
    }
    if (!backup.data) {
        throw new Error("The backup is missing its data.");
    }
    for (const collection of collections) {
        const records = backup.data[collection.name];
        if (!Array.isArray(records) || !records.every(collection.isValid)) {
            throw new Error(`The backup contains invalid ${collection.name}. Nothing was imported.`);
        }
    }
}

// Replaces the saved collections with the ones from the backup.
// The whole file is checked first, so a bad file changes nothing.
function restoreBackup(backup) {
    validateBackup(backup);
    for (const collection of collections) {
        localStorage.setItem(collection.key, JSON.stringify(backup.data[collection.name]));
    }
    localStorage.removeItem(STORAGE.focusTimer);
}

export { BACKUP_VERSION, MAX_BACKUP_BYTES, validateBackup, restoreBackup };
