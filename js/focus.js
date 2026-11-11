import { STORAGE, getLocalDate, addDays, readStorage, writeStorage } from "./shared.js";
import { SESSION_MINUTES, FocusTimer, isValidFocusSession } from "./focus-model.js";

const DAILY_GOAL = 6;

function readFocusSessions() {
    const saved = readStorage(STORAGE.focusSessions, []);
    return Array.isArray(saved) ? saved.filter(isValidFocusSession) : [];
}

function updateFocusStats() {
    const sessions = readFocusSessions();
    const today = getLocalDate();
    const weekday = new Date(`${today}T12:00:00`).getDay();
    const monday = addDays(today, -((weekday + 6) % 7));

    const todaySessions = sessions.filter((session) => session.date === today);
    const weekSessions = sessions.filter((session) => session.date >= monday && session.date <= today);
    let minutesToday = 0;
    for (const session of todaySessions) {
        minutesToday += session.minutes;
    }
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

    // The saved timer is restored, so a session continues after a reload.
    const timer = new FocusTimer(readStorage(STORAGE.focusTimer, null));

    function render() {
        display.textContent = timer.getDisplayTime();
        startButton.disabled = timer.isRunning();
        pauseButton.disabled = !timer.isRunning();
        startButton.textContent = timer.isPaused() ? "Resume focus" : "Start focus";
    }

    function saveTimer(message) {
        const saved = writeStorage(STORAGE.focusTimer, timer);
        status.textContent = saved ? message : `${message} This timer could not be saved; keep this page open.`;
        render();
    }

    // Records the completed session once and returns the timer to 25:00.
    function finishSession() {
        const sessions = readFocusSessions();
        sessions.push({ date: getLocalDate(new Date(timer.deadline)), minutes: SESSION_MINUTES });
        writeStorage(STORAGE.focusSessions, sessions);
        timer.reset();
        saveTimer("Session complete and saved. Take a short break.");
        updateFocusStats();
    }

    function tick() {
        if (timer.isFinished()) finishSession();
        else render();
    }

    startButton.addEventListener("click", () => {
        timer.start();
        saveTimer("Focus session running. You can visit other pages and return here.");
    });

    pauseButton.addEventListener("click", () => {
        timer.pause();
        saveTimer("Session paused and saved.");
    });

    resetButton.addEventListener("click", () => {
        timer.reset();
        saveTimer("Timer reset to 25 minutes.");
    });

    if (timer.isRunning()) status.textContent = "Focus session running. You can visit other pages and return here.";
    else if (timer.isPaused()) status.textContent = "Session paused. Resume whenever you are ready.";
    else status.textContent = "Ready for a 25-minute focus session.";

    updateFocusStats();
    tick();
    window.setInterval(tick, 1000);
}

export { readFocusSessions, setupFocusTimer };
