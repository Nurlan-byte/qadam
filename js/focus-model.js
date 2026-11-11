import { isValidDate, makeId } from "./shared.js";

const SESSION_MINUTES = 25;
const SESSION_SECONDS = SESSION_MINUTES * 60;

// Older sessions have only a date and minutes; new sessions also keep their timer ID.
function isValidFocusSession(session) {
    if (!session || typeof session !== "object") return false;
    return isValidDate(session.date) && Number.isFinite(session.minutes) && session.minutes > 0 && session.minutes <= 180
        && (session.id === undefined || (typeof session.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(session.id)))
        && (session.endedAt === undefined || (typeof session.endedAt === "string" && Number.isFinite(Date.parse(session.endedAt))));
}

// The timer saves a deadline instead of counting in the background,
// so it shows the right time after a reload or a visit to another page.
class FocusTimer {
    constructor(saved) {
        this.status = "ready";
        this.id = "";
        this.remainingSeconds = SESSION_SECONDS;
        this.deadline = 0;

        const usable = saved && (saved.status === "running" || saved.status === "paused")
            && Number.isInteger(saved.remainingSeconds) && saved.remainingSeconds > 0
            && saved.remainingSeconds <= SESSION_SECONDS
            && (saved.status === "paused" ? saved.deadline === 0
                : Number.isSafeInteger(saved.deadline) && saved.deadline > 0 && saved.deadline <= 8640000000000000);
        if (usable) {
            this.status = saved.status;
            this.remainingSeconds = saved.remainingSeconds;
            this.deadline = saved.deadline;
            // Derive the same ID when an older timer without an ID is loaded again.
            this.id = typeof saved.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(saved.id)
                ? saved.id : `focus-${saved.deadline}-${saved.remainingSeconds}`;
        }
    }

    isRunning() {
        return this.status === "running";
    }

    isPaused() {
        return this.status === "paused";
    }

    start() {
        if (!this.isPaused()) this.id = makeId("focus");
        this.status = "running";
        this.deadline = Date.now() + this.remainingSeconds * 1000;
    }

    pause() {
        this.remainingSeconds = this.getRemainingSeconds();
        this.status = "paused";
        this.deadline = 0;
    }

    reset() {
        this.status = "ready";
        this.id = "";
        this.remainingSeconds = SESSION_SECONDS;
        this.deadline = 0;
    }

    getRemainingSeconds() {
        if (!this.isRunning()) return this.remainingSeconds;
        const seconds = Math.ceil((this.deadline - Date.now()) / 1000);
        return Math.max(0, Math.min(this.remainingSeconds, seconds));
    }

    isFinished() {
        return this.isRunning() && this.getRemainingSeconds() === 0;
    }

    // Text for the display, for example "24:59".
    getDisplayTime() {
        const seconds = this.getRemainingSeconds();
        const minutesText = String(Math.floor(seconds / 60)).padStart(2, "0");
        const secondsText = String(seconds % 60).padStart(2, "0");
        return `${minutesText}:${secondsText}`;
    }
}

export { SESSION_MINUTES, SESSION_SECONDS, FocusTimer, isValidFocusSession };
