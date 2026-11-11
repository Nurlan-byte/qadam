import { isValidDate } from "./shared.js";

const SESSION_MINUTES = 25;
const SESSION_SECONDS = SESSION_MINUTES * 60;

// A completed session is saved as { date: "YYYY-MM-DD", minutes: 25 }.
function isValidFocusSession(session) {
    if (!session || typeof session !== "object") return false;
    return isValidDate(session.date) && Number.isFinite(session.minutes) && session.minutes > 0 && session.minutes <= 180;
}

// The timer saves a deadline instead of counting in the background,
// so it shows the right time after a reload or a visit to another page.
class FocusTimer {
    constructor(saved) {
        this.status = "ready";
        this.remainingSeconds = SESSION_SECONDS;
        this.deadline = 0;

        const usable = saved && (saved.status === "running" || saved.status === "paused")
            && Number.isFinite(saved.remainingSeconds) && saved.remainingSeconds > 0
            && saved.remainingSeconds <= SESSION_SECONDS && Number.isFinite(saved.deadline);
        if (usable) {
            this.status = saved.status;
            this.remainingSeconds = saved.remainingSeconds;
            this.deadline = saved.deadline;
        }
    }

    isRunning() {
        return this.status === "running";
    }

    isPaused() {
        return this.status === "paused";
    }

    start() {
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
        this.remainingSeconds = SESSION_SECONDS;
        this.deadline = 0;
    }

    getRemainingSeconds() {
        if (!this.isRunning()) return this.remainingSeconds;
        const seconds = Math.ceil((this.deadline - Date.now()) / 1000);
        return Math.max(0, seconds);
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
