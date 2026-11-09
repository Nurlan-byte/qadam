import { STORAGE, getLocalDate, addDays, escapeHTML } from "./shared.js";
import { categories } from "./data.js";
import { getHabits } from "./habits.js";
import { getTasks } from "./tasks.js";
import { readFocusSessions } from "./focus.js";

function getHabitSummary(today) {
    const habits = getHabits();
    return { total: habits.length, done: habits.filter((habit) => habit.lastDoneDate === today).length };
}

function getFocusWeek(today) {
    const sessions = readFocusSessions();
    const days = [];
    for (let offset = -6; offset <= 0; offset += 1) {
        const date = addDays(today, offset);
        const value = sessions.filter((session) => session.date === date)
            .reduce((total, session) => total + session.minutes, 0);
        const label = new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short" })
            .format(new Date(`${date}T12:00:00`));
        days.push({ date, label, value, detail: `${value} min` });
    }
    return days;
}

function renderChart(container, rows) {
    const maximum = Math.max(1, ...rows.map((row) => row.value));
    container.innerHTML = rows.map((row) => {
        const width = Math.round(row.value / maximum * 100);
        return `<li class="stats-chart-row" data-label="${escapeHTML(row.label)}" data-date="${row.date || ""}">
            <div class="stats-chart-label"><span>${escapeHTML(row.label)}</span><span>${escapeHTML(row.detail)}</span></div>
            <div class="stats-bar-track" aria-hidden="true"><div class="stats-bar-fill" style="width: ${width}%"></div></div>
        </li>`;
    }).join("");
}

function renderStatistics(reloadTasks = false) {
    const tasks = getTasks({ reload: reloadTasks });
    const today = getLocalDate();
    const completed = tasks.filter((task) => task.completed).length;
    const overdue = tasks.filter((task) => !task.completed && task.date < today).length;
    const completionRate = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
    const habits = getHabitSummary(today);

    document.querySelector("#stats-open").textContent = String(tasks.length - completed);
    document.querySelector("#stats-open-detail").textContent = `${overdue} overdue`;
    document.querySelector("#stats-completed").textContent = String(completed);
    document.querySelector("#stats-completed-detail").textContent = `of ${tasks.length} total tasks`;
    document.querySelector("#stats-completion-rate").textContent = `${completionRate}%`;
    document.querySelector("#stats-habits").textContent = `${habits.done} / ${habits.total}`;
    document.querySelector("#stats-task-empty").hidden = tasks.length > 0;

    const categoryRows = categories.map((category) => {
        const records = tasks.filter((task) => task.list === category.id);
        const done = records.filter((task) => task.completed).length;
        return { label: category.label, value: records.length, detail: `${records.length} total · ${done} completed` };
    });
    renderChart(document.querySelector("#stats-category-chart"), categoryRows);

    const week = getFocusWeek(today);
    const totalMinutes = week.reduce((total, day) => total + day.value, 0);
    document.querySelector("#stats-focus-total").textContent = `${totalMinutes} min`;
    document.querySelector("#stats-focus-empty").hidden = totalMinutes > 0;
    renderChart(document.querySelector("#stats-focus-chart"), week);
    document.querySelector("#stats-updated").textContent = `Updated ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
}

function setupStatistics() {
    if (!document.querySelector("#statistics-dashboard")) return;
    renderStatistics(true);
    document.querySelector("#stats-refresh").addEventListener("click", () => renderStatistics(true));
    document.addEventListener("qadam:data-changed", () => renderStatistics());
    window.addEventListener("storage", (event) => {
        if (event.key === null || [STORAGE.tasks, STORAGE.habits, STORAGE.focusSessions].includes(event.key)) {
            renderStatistics(true);
        }
    });
    window.addEventListener("focus", () => renderStatistics(true));
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) renderStatistics(true);
    });
}

export { setupStatistics };
