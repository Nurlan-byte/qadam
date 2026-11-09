import { STORAGE, getLocalDate, readStorage, writeStorage } from "./shared.js";
import { SESSION_MINUTES, SESSION_SECONDS, isValidFocusSession, isValidFocusTimer, getRemainingSeconds, addCompletedSession } from "./focus-model.js";

const DAILY_GOAL = 6;

function readFocusSessions() {
    return readStorage(STORAGE.focusSessions, [], Array.isArray).filter(isValidFocusSession);
}

function withFocusLock(action) {
    return navigator.locks
        ? navigator.locks.request("qadam-focus", action)
        : Promise.resolve().then(action);
}

function updateFocusStats() {
    if (!document.querySelector("#focus-today-value")) return;
    const sessions = readFocusSessions();
    const currentDate = getLocalDate();
    const todaySessions = sessions.filter((session) => session.date === currentDate);
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const weekSessions = sessions.filter((session) => session.date >= getLocalDate(monday) && session.date <= currentDate);
    const minutesToday = todaySessions.reduce((total, session) => total + session.minutes, 0);
    const totalToday = todaySessions.length;

    document.querySelector("#focus-today-value").textContent = `${minutesToday} min`;
    document.querySelector("#focus-today-detail").textContent = `${totalToday} ${totalToday === 1 ? "session" : "sessions"} completed today`;
    document.querySelector("#focus-week-value").textContent = `${weekSessions.length} ${weekSessions.length === 1 ? "session" : "sessions"}`;
    document.querySelector("#focus-goal-value").textContent = `${totalToday} / ${DAILY_GOAL}`;
    document.querySelector("#focus-goal-detail").textContent = totalToday >= DAILY_GOAL
        ? "Daily goal reached. Well done!"
        : `${DAILY_GOAL - totalToday} sessions to go`;
}

function setupFocusTimer() {
    const display = document.querySelector("#focus-time-display");
    const startButton = document.querySelector("#focus-start");
    const pauseButton = document.querySelector("#focus-pause");
    const resetButton = document.querySelector("#focus-reset");
    const status = document.querySelector("#focus-timer-status");
    const readTimer = () => readStorage(STORAGE.focusTimer, null, isValidFocusTimer);
    let timer = readTimer();
    let unsaved = false;
    let finishing = false;
    let retryOnReturn = false;

    function render(message) {
        if (!display) return;
        const seconds = getRemainingSeconds(timer);
        display.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
        const running = timer?.status === "running";
        startButton.disabled = running;
        pauseButton.disabled = !running;
        startButton.textContent = timer?.status === "paused" ? "Resume focus"
            : timer?.status === "completed" ? "Start another session" : "Start focus";
        if (message) status.textContent = message;
    }

    function describeTimer() {
        if (timer?.status === "running") return "Focus session running. You can visit other pages and return here.";
        if (timer?.status === "paused") return "Session paused. Resume whenever you are ready.";
        if (timer?.status === "completed") return "Session complete. Take a short break.";
        return "Ready for a 25-minute focus session.";
    }

    function saveTimer(next, message) {
        timer = next;
        unsaved = !writeStorage(STORAGE.focusTimer, timer);
        render(unsaved ? `${message} This timer could not be saved; keep this page open.` : message);
    }

    function finishIfDue() {
        if (finishing || retryOnReturn || timer?.status !== "running" || getRemainingSeconds(timer) > 0) return;
        finishing = true;
        withFocusLock(() => {
            if (!unsaved) timer = readTimer();
            if (timer?.status !== "running" || getRemainingSeconds(timer) > 0) return;
            const sessions = readFocusSessions();
            const next = addCompletedSession(sessions, timer);
            const saved = next === sessions || writeStorage(STORAGE.focusSessions, next);
            if (!saved) {
                // Keep the expired timer so a later visit can retry saving this session.
                retryOnReturn = true;
                render("Session complete, but it could not be saved. Return to this page to retry.");
                return;
            }
            saveTimer({ ...timer, status: "completed", remainingSeconds: 0 }, "Session complete and saved. Take a short break.");
            updateFocusStats();
        }).finally(() => { finishing = false; });
    }

    function tick() {
        render();
        finishIfDue();
    }

    function refresh() {
        retryOnReturn = false;
        if (!unsaved) timer = readTimer();
        render(describeTimer());
        updateFocusStats();
        tick();
    }

    startButton?.addEventListener("click", () => withFocusLock(() => {
        if (!unsaved) timer = readTimer();
        if (timer?.status === "running") return refresh();
        const remainingSeconds = timer?.status === "paused" ? timer.remainingSeconds : SESSION_SECONDS;
        const id = timer?.status === "paused" ? timer.id : `focus-${crypto.randomUUID()}`;
        saveTimer({ id, status: "running", remainingSeconds, deadline: Date.now() + remainingSeconds * 1000 },
            "Focus session running. You can visit other pages and return here.");
    }));

    pauseButton?.addEventListener("click", () => withFocusLock(() => {
        if (!unsaved) timer = readTimer();
        if (timer?.status !== "running") return refresh();
        const remainingSeconds = getRemainingSeconds(timer);
        if (remainingSeconds === 0) return tick();
        saveTimer({ ...timer, status: "paused", deadline: 0, remainingSeconds }, "Session paused and saved.");
    }));

    resetButton?.addEventListener("click", () => withFocusLock(() => {
        saveTimer(null, "Timer reset to 25 minutes.");
    }));

    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE.focusTimer || event.key === null) {
            unsaved = false;
            refresh();
        } else if (event.key === STORAGE.focusSessions) updateFocusStats();
    });
    document.addEventListener("qadam:data-restored", () => {
        unsaved = false;
        refresh();
    });
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) refresh();
    });
    window.setInterval(tick, 1000);
    refresh();
}

export { readFocusSessions, setupFocusTimer, withFocusLock };
