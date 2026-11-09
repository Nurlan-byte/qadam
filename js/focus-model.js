import { getLocalDate, isValidDate } from "./shared.js";

const SESSION_MINUTES = 25;
const SESSION_SECONDS = SESSION_MINUTES * 60;

function isValidFocusSession(session) {
    return Boolean(session && isValidDate(session.date)
        && Number.isFinite(session.minutes) && session.minutes > 0 && session.minutes <= 180
        && (session.id === undefined || (typeof session.id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(session.id)))
        && (session.endedAt === undefined || (typeof session.endedAt === "string"
            && Number.isFinite(Date.parse(session.endedAt)))));
}

function isValidFocusTimer(timer) {
    if (timer === null) return true;
    if (!timer || typeof timer.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(timer.id)) return false;
    if (!["running", "paused", "completed"].includes(timer.status)) return false;
    if (!Number.isInteger(timer.remainingSeconds) || timer.remainingSeconds < 0 || timer.remainingSeconds > SESSION_SECONDS) return false;
    if (timer.status === "paused") return timer.deadline === 0 && timer.remainingSeconds > 0;
    return Number.isSafeInteger(timer.deadline) && timer.deadline > 0 && timer.deadline <= 8640000000000000
        && (timer.status === "completed" ? timer.remainingSeconds === 0 : timer.remainingSeconds > 0);
}

function getRemainingSeconds(timer, now = Date.now()) {
    if (!timer) return SESSION_SECONDS;
    if (timer.status !== "running") return timer.remainingSeconds;
    return Math.max(0, Math.min(timer.remainingSeconds, Math.ceil((timer.deadline - now) / 1000)));
}

function addCompletedSession(sessions, timer) {
    if (sessions.some((session) => session.id === timer.id)) return sessions;
    const endedAt = new Date(timer.deadline);
    return [...sessions, { id: timer.id, date: getLocalDate(endedAt), endedAt: endedAt.toISOString(), minutes: SESSION_MINUTES }];
}

export { SESSION_MINUTES, SESSION_SECONDS, isValidFocusSession, isValidFocusTimer, getRemainingSeconds, addCompletedSession };
