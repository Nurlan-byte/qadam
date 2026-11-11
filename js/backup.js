import { getLocalDate } from "./shared.js";
import { loadTasks } from "./tasks.js";
import { loadHabits } from "./habits.js";
import { loadEvents } from "./countdown.js";
import { readFocusSessions } from "./focus.js";
import { renderStatistics } from "./statistics.js";
import { BACKUP_VERSION, MAX_BACKUP_BYTES, validateBackup, restoreBackup } from "./backup-model.js";

function createBackup() {
    return {
        app: "qadam",
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
            tasks: loadTasks(),
            habits: loadHabits(),
            events: loadEvents(),
            focusSessions: readFocusSessions()
        }
    };
}

// Offers the text as a file download through a temporary link.
function downloadFile(fileName, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

function setupBackup() {
    const panel = document.querySelector("#backup-panel");
    if (!panel) return;
    const fileInput = panel.querySelector("#backup-file");
    const importButton = panel.querySelector("#backup-import");
    const cancelButton = panel.querySelector("#backup-cancel");
    const preview = panel.querySelector("#backup-preview");
    const status = panel.querySelector("#backup-status");
    // A backup that passed the check and waits for the user's confirmation.
    let pendingBackup = null;

    function clearPreview() {
        pendingBackup = null;
        fileInput.value = "";
        preview.hidden = true;
        importButton.disabled = true;
        cancelButton.hidden = true;
    }

    panel.querySelector("#backup-export").addEventListener("click", () => {
        const text = JSON.stringify(createBackup(), null, 2);
        downloadFile(`qadam-backup-${getLocalDate()}.json`, text);
        status.textContent = "Backup download started. Keep the file to restore your data later.";
    });

    // Step 1: read the chosen file, check it and show what it contains.
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        try {
            if (file.size > MAX_BACKUP_BYTES) throw new Error("Choose a JSON file smaller than 2 MB.");
            const backup = JSON.parse(await file.text());
            validateBackup(backup);
            pendingBackup = backup;
            const data = backup.data;
            preview.textContent = `${data.tasks.length} tasks · ${data.habits.length} habits · ${data.events.length} events · ${data.focusSessions.length} completed focus sessions`;
            preview.hidden = false;
            importButton.disabled = false;
            cancelButton.hidden = false;
            status.textContent = "Backup checked. Review the counts before replacing your saved data.";
        } catch (error) {
            clearPreview();
            // JSON.parse throws a SyntaxError; validateBackup throws an Error with its own message.
            status.textContent = error instanceof SyntaxError
                ? "This file is not valid JSON. Nothing was imported."
                : error.message;
        }
    });

    cancelButton.addEventListener("click", () => {
        clearPreview();
        status.textContent = "Import cancelled. Your data was not changed.";
    });

    // Step 2: replace the saved data after the user confirms.
    importButton.addEventListener("click", () => {
        if (!pendingBackup) return;
        if (!window.confirm("Replace your tasks, habits, events and focus history with this backup? Any active focus timer will be reset.")) return;
        try {
            restoreBackup(pendingBackup);
            clearPreview();
            renderStatistics();
            status.textContent = "Backup restored. Your statistics are up to date. The focus timer was reset.";
        } catch (error) {
            status.textContent = "The backup could not be saved in this browser.";
        }
    });
}

export { setupBackup };
