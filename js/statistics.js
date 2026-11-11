import { getLocalDate, addDays, escapeHTML } from "./shared.js";
import { categories } from "./data.js";
import { loadHabits } from "./habits.js";
import { loadTasks } from "./tasks.js";
import { readFocusSessions } from "./focus.js";

// Focus minutes for each of the last seven days, today last.
function getFocusWeek(today) {
    const sessions = readFocusSessions();
    const days = [];
    for (let offset = -6; offset <= 0; offset += 1) {
        const date = addDays(today, offset);
        let minutes = 0;
        for (const session of sessions) {
            if (session.date === date) minutes += session.minutes;
        }
        const label = new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" });
        days.push({ label: label, value: minutes, detail: `${minutes} min` });
    }
    return days;
}

// Draws a horizontal bar chart: the longest bar is 100% wide.
function renderChart(container, rows) {
    let maximum = 1;
    for (const row of rows) {
        if (row.value > maximum) maximum = row.value;
    }
    container.innerHTML = rows.map((row) => {
        const width = Math.round(row.value / maximum * 100);
        return `<li class="stats-chart-row">
            <div class="stats-chart-label"><span>${escapeHTML(row.label)}</span><span>${escapeHTML(row.detail)}</span></div>
            <div class="stats-bar-track" aria-hidden="true"><div class="stats-bar-fill" style="width: ${width}%"></div></div>
        </li>`;
    }).join("");
}

function renderStatistics() {
    const tasks = loadTasks();
    const habits = loadHabits();
    const today = getLocalDate();

    const completed = tasks.filter((task) => task.completed).length;
    const overdue = tasks.filter((task) => task.isOverdue(today)).length;
    const completionRate = tasks.length > 0 ? Math.round(completed / tasks.length * 100) : 0;
    const habitsDone = habits.filter((habit) => habit.isDoneOn(today)).length;

    document.querySelector("#stats-open").textContent = tasks.length - completed;
    document.querySelector("#stats-open-detail").textContent = `${overdue} overdue`;
    document.querySelector("#stats-completed").textContent = completed;
    document.querySelector("#stats-completed-detail").textContent = `of ${tasks.length} total tasks`;
    document.querySelector("#stats-completion-rate").textContent = `${completionRate}%`;
    document.querySelector("#stats-habits").textContent = `${habitsDone} / ${habits.length}`;
    document.querySelector("#stats-task-empty").hidden = tasks.length > 0;

    const categoryRows = categories.map((category) => {
        const records = tasks.filter((task) => task.list === category.id);
        const done = records.filter((task) => task.completed).length;
        return { label: category.label, value: records.length, detail: `${records.length} total · ${done} completed` };
    });
    renderChart(document.querySelector("#stats-category-chart"), categoryRows);

    const week = getFocusWeek(today);
    let totalMinutes = 0;
    for (const day of week) {
        totalMinutes += day.value;
    }
    document.querySelector("#stats-focus-total").textContent = `${totalMinutes} min`;
    document.querySelector("#stats-focus-empty").hidden = totalMinutes > 0;
    renderChart(document.querySelector("#stats-focus-chart"), week);

    const time = new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
    document.querySelector("#stats-updated").textContent = `Updated ${time}`;
}

function setupStatistics() {
    if (!document.querySelector("#statistics-dashboard")) return;
    renderStatistics();
    document.querySelector("#stats-refresh").addEventListener("click", renderStatistics);
}

export { setupStatistics, renderStatistics };
