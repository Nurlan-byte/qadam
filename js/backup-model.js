import { STORAGE } from "./shared.js";
import { isValidTask } from "./tasks.js";
import { isValidHabit } from "./habits.js";
import { isValidEvent } from "./events-model.js";
import { isValidFocusSession } from "./focus-model.js";

const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const collections = [
    ["tasks", STORAGE.tasks, isValidTask],
    ["habits", STORAGE.habits, isValidHabit],
    ["events", STORAGE.events, isValidEvent],
    ["focusSessions", STORAGE.focusSessions, isValidFocusSession]
];

function validateBackup(backup) {
    if (!backup || backup.app !== "qadam" || backup.version !== BACKUP_VERSION) {
        throw new Error("Choose a Qadam backup with version 1.");
    }
    if (typeof backup.exportedAt !== "string" || !Number.isFinite(Date.parse(backup.exportedAt)) || !backup.data) {
        throw new Error("The backup is missing its date or data.");
    }
    for (const [name, , validate] of collections) {
        const records = backup.data[name];
        if (!Array.isArray(records) || records.length > 10000 || !records.every(validate)) {
            throw new Error(`The backup contains invalid ${name}. Nothing was imported.`);
        }
        const ids = records.map((record) => record.id).filter((id) => id !== undefined);
        if (new Set(ids).size !== ids.length) throw new Error(`The backup contains duplicate IDs in ${name}.`);
    }
    return Object.fromEntries(collections.map(([name]) => [name, structuredClone(backup.data[name])]));
}

function restoreBackup(backup, storage = localStorage) {
    // Validate the complete file before reading or replacing any saved collections.
    const data = validateBackup(backup);
    const replacements = collections.map(([name, key]) => [key, JSON.stringify(data[name])]);
    replacements.push([STORAGE.focusTimer, "null"]);
    const previous = replacements.map(([key]) => [key, storage.getItem(key)]);
    const changed = [];
    try {
        for (const [key, value] of replacements) {
            storage.setItem(key, value);
            changed.push(key);
        }
    } catch (error) {
        try {
            // Free the replaced entries first, so restoring them does not need extra quota.
            for (const key of changed) storage.removeItem(key);
            for (const [key, value] of previous) {
                if (changed.includes(key) && value !== null) storage.setItem(key, value);
            }
        } catch (restoreError) {
            throw new Error("Import failed and this browser blocked restoring some previous data. Keep your backup file.");
        }
        throw new Error("Import could not be saved. Your previous data was restored.");
    }
    return data;
}

export { BACKUP_VERSION, MAX_BACKUP_BYTES, validateBackup, restoreBackup };
