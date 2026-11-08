import { STORAGE, getLocalDate, readStorage, writeStorage } from "./shared.js";

const SESSION_MINUTES = 25;
const DAILY_GOAL = 6;

function readFocusSessions() {
    const saved = readStorage(STORAGE.focusSessions, []);
    if (!Array.isArray(saved)) return [];

    return saved.filter((session) => {
        if (!session || typeof session !== "object") return false;
        if (typeof session.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(session.date)) return false;
        const date = new Date(`${session.date}T12:00:00`);
        return getLocalDate(date) === session.date
            && Number.isFinite(session.minutes)
            && session.minutes > 0
            && session.minutes <= 180;
    });
}

function updateFocusStats() {
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
    if (!display) return;

    const startButton = document.querySelector("#focus-start");
    const pauseButton = document.querySelector("#focus-pause");
    const resetButton = document.querySelector("#focus-reset");
    const status = document.querySelector("#focus-timer-status");
    let remainingSeconds = SESSION_MINUTES * 60;
    let intervalId = null;
    let deadline = 0;

    function render() {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function stopTimer() {
        window.clearInterval(intervalId);
        intervalId = null;
        startButton.disabled = false;
        pauseButton.disabled = true;
    }

    function finishSession() {
        stopTimer();
        const endedAt = new Date(deadline);
        const sessions = readFocusSessions();
        sessions.push({ date: getLocalDate(endedAt), endedAt: endedAt.toISOString(), minutes: SESSION_MINUTES });
        const saved = writeStorage(STORAGE.focusSessions, sessions);
        updateFocusStats();
        status.textContent = saved === false
            ? "Session complete, but this browser could not save it. Take a short break."
            : "Session complete and saved. Take a short break.";
        startButton.textContent = "Start another session";
    }

    function tick() {
        if (intervalId === null) return;
        // Compare with a deadline so a background tab does not slow the timer down.
        remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        render();
        if (remainingSeconds === 0) finishSession();
    }

    startButton.addEventListener("click", () => {
        if (intervalId !== null) return;
        if (remainingSeconds === 0) remainingSeconds = SESSION_MINUTES * 60;
        deadline = Date.now() + remainingSeconds * 1000;
        startButton.disabled = true;
        startButton.textContent = "Start focus";
        pauseButton.disabled = false;
        status.textContent = "Focus session running. Keep this page open.";
        intervalId = window.setInterval(tick, 250);
        render();
    });

    pauseButton.addEventListener("click", () => {
        tick();
        if (remainingSeconds === 0) return;
        stopTimer();
        startButton.textContent = "Resume focus";
        status.textContent = "Session paused.";
    });

    resetButton.addEventListener("click", () => {
        stopTimer();
        remainingSeconds = SESSION_MINUTES * 60;
        render();
        startButton.textContent = "Start focus";
        status.textContent = "Timer reset to 25 minutes.";
    });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            tick();
            updateFocusStats();
        }
    });
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE.focusSessions || event.key === null) updateFocusStats();
    });

    updateFocusStats();
    render();
    pauseButton.disabled = true;
}

export { readFocusSessions, setupFocusTimer };
