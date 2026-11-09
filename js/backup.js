import { getLocalDate } from "./shared.js";
import { getTasks } from "./tasks.js";
import { getHabits } from "./habits.js";
import { getEvents } from "./countdown.js";
import { readFocusSessions, withFocusLock } from "./focus.js";
import { BACKUP_VERSION, MAX_BACKUP_BYTES, validateBackup, restoreBackup } from "./backup-model.js";

function createBackup() {
    const backup = {
        app: "qadam", version: BACKUP_VERSION, exportedAt: new Date().toISOString(),
        data: {
            tasks: getTasks({ reload: true }), habits: getHabits(),
            events: getEvents({ reload: true }), focusSessions: readFocusSessions()
        }
    };
    validateBackup(backup);
    return backup;
}

function setupBackup() {
    const panel = document.querySelector("#backup-panel");
    if (!panel) return;
    const fileInput = panel.querySelector("#backup-file");
    const importButton = panel.querySelector("#backup-import");
    const cancelButton = panel.querySelector("#backup-cancel");
    const preview = panel.querySelector("#backup-preview");
    const status = panel.querySelector("#backup-status");
    let pendingBackup = null;
    let fileVersion = 0;

    function clearPreview() {
        pendingBackup = null;
        preview.hidden = true;
        importButton.disabled = true;
        cancelButton.hidden = true;
    }

    panel.querySelector("#backup-export").addEventListener("click", () => {
        try {
            const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: "application/json" });
            if (blob.size > MAX_BACKUP_BYTES) throw new Error("Your data exceeds the 2 MB backup limit.");
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `qadam-backup-${getLocalDate()}.json`;
            document.body.append(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            status.textContent = "Backup download started. Keep the file to restore your data later.";
        } catch (error) {
            status.textContent = `Backup could not be exported. ${error.message}`;
        }
    });

    fileInput.addEventListener("change", async () => {
        const version = ++fileVersion;
        clearPreview();
        status.textContent = "";
        const file = fileInput.files[0];
        if (!file) return;
        try {
            if (file.size > MAX_BACKUP_BYTES) throw new Error("Choose a JSON file smaller than 2 MB.");
            const backup = JSON.parse(await file.text());
            if (version !== fileVersion) return;
            const data = validateBackup(backup);
            pendingBackup = backup;
            preview.textContent = `${data.tasks.length} tasks · ${data.habits.length} habits · ${data.events.length} events · ${data.focusSessions.length} completed focus sessions`;
            preview.hidden = false;
            importButton.disabled = false;
            cancelButton.hidden = false;
            status.textContent = "Backup checked. Review the counts before replacing your saved data.";
        } catch (error) {
            if (version !== fileVersion) return;
            status.textContent = error instanceof SyntaxError ? "This file is not valid JSON. Nothing was imported." : error.message;
        }
    });

    cancelButton.addEventListener("click", () => {
        fileVersion += 1;
        fileInput.value = "";
        clearPreview();
        status.textContent = "Import cancelled. Your data was not changed.";
    });

    importButton.addEventListener("click", async () => {
        if (!pendingBackup || !window.confirm("Replace your tasks, habits, events and focus history with this backup? Any active focus timer will be reset.")) return;
        importButton.disabled = true;
        fileInput.disabled = true;
        cancelButton.disabled = true;
        try {
            await withFocusLock(() => restoreBackup(pendingBackup));
            getTasks({ reload: true });
            document.dispatchEvent(new CustomEvent("qadam:data-restored"));
            document.dispatchEvent(new CustomEvent("qadam:data-changed", { detail: { key: null } }));
            clearPreview();
            fileInput.value = "";
            status.textContent = "Backup restored. Your statistics are up to date. The focus timer was reset.";
        } catch (error) {
            status.textContent = error.message;
            importButton.disabled = false;
        } finally {
            fileInput.disabled = false;
            cancelButton.disabled = false;
        }
    });
}

export { createBackup, setupBackup };
