import { STORAGE, getLocalDate, addDays, escapeHTML } from "./shared.js";
import { getTasks, getCategoryLabel } from "./tasks.js";

let selectedDate = getLocalDate();
let visibleMonth = selectedDate.slice(0, 7);
let calendarTasks = [];

function getMonthDays(month) {
    const firstDay = new Date(`${month}-01T12:00:00`);
    const lastDay = new Date(firstDay);
    lastDay.setMonth(lastDay.getMonth() + 1, 0);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((mondayOffset + lastDay.getDate()) / 7) * 7;
    const startDate = addDays(`${month}-01`, -mondayOffset);
    const days = [];
    for (let index = 0; index < totalCells; index += 1) {
        days.push(addDays(startDate, index));
    }
    return days;
}

function formatCalendarDate(date, options) {
    return new Intl.DateTimeFormat("en", options).format(new Date(`${date}T12:00:00`));
}

function renderMonth() {
    const today = getLocalDate();
    const counts = new Map();
    for (const task of calendarTasks) {
        counts.set(task.date, (counts.get(task.date) || 0) + 1);
    }
    const days = getMonthDays(visibleMonth);
    const rows = [];
    for (let index = 0; index < days.length; index += 7) {
        const cells = days.slice(index, index + 7).map((date) => {
            const count = counts.get(date) || 0;
            const label = formatCalendarDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            const outsideMonth = date.slice(0, 7) !== visibleMonth;
            return `<td><button type="button" class="calendar-day${outsideMonth ? " calendar-day-muted" : ""}"
                data-date="${date}" aria-label="${escapeHTML(label)}, ${count} ${count === 1 ? "task" : "tasks"}"
                aria-pressed="${date === selectedDate}" ${date === today ? 'aria-current="date"' : ""}
                tabindex="${date === selectedDate ? "0" : "-1"}">
                <span class="calendar-day-number">${Number(date.slice(8))}</span>
                <span class="calendar-count" ${count ? "" : "hidden"} aria-hidden="true">${count}<span class="calendar-count-word"> ${count === 1 ? "task" : "tasks"}</span></span>
            </button></td>`;
        });
        rows.push(`<tr>${cells.join("")}</tr>`);
    }
    document.querySelector("#calendar-month-title").textContent = formatCalendarDate(`${visibleMonth}-01`, { month: "long", year: "numeric" });
    document.querySelector("#calendar-days").innerHTML = rows.join("");
    document.querySelector("#calendar-previous").disabled = visibleMonth === "0001-01";
    document.querySelector("#calendar-next").disabled = visibleMonth === "9999-12";
}

function renderSelectedDay() {
    const tasks = calendarTasks.filter((task) => task.date === selectedDate)
        .sort((first, second) => (first.time || "99:99").localeCompare(second.time || "99:99") || first.title.localeCompare(second.title));
    document.querySelector("#calendar-day-title").textContent = formatCalendarDate(selectedDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const completed = tasks.filter((task) => task.completed).length;
    document.querySelector("#calendar-day-summary").textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} · ${completed} completed`;
    document.querySelector("#calendar-day-empty").hidden = tasks.length > 0;
    document.querySelector("#calendar-day-tasks").innerHTML = tasks.map((task) => `<li class="calendar-task${task.completed ? " calendar-task-completed" : ""}">
        <span class="calendar-task-time">${task.time ? `<time datetime="${task.date}T${task.time}">${task.time}</time>` : "Any time"}</span>
        <div class="calendar-task-content">
            <h3>${escapeHTML(task.title)}</h3>
            <p>${escapeHTML(getCategoryLabel(task.list))} · ${task.completed ? "Completed" : "Open"}</p>
        </div>
        <a class="calendar-task-link" href="today.html" aria-label="Manage ${escapeHTML(task.title)} on Today">Open Today</a>
    </li>`).join("");
}

function renderCalendar(reload = false) {
    calendarTasks = getTasks({ reload });
    renderMonth();
    renderSelectedDay();
}

function selectDate(date, focusDate = false) {
    const year = Number(date.slice(0, 4));
    if (year < 1 || year > 9999) return;
    selectedDate = date;
    visibleMonth = date.slice(0, 7);
    renderCalendar();
    if (focusDate) document.querySelector(`[data-date="${selectedDate}"]`)?.focus();
}

function changeMonth(amount, focusDate = false) {
    const firstDay = new Date(`${visibleMonth}-01T12:00:00`);
    firstDay.setMonth(firstDay.getMonth() + amount);
    if (firstDay.getFullYear() < 1 || firstDay.getFullYear() > 9999) return;
    const nextMonth = getLocalDate(firstDay).slice(0, 7);
    const lastDay = new Date(firstDay);
    lastDay.setMonth(lastDay.getMonth() + 1, 0);
    const day = Math.min(Number(selectedDate.slice(8)), lastDay.getDate());
    selectDate(`${nextMonth}-${String(day).padStart(2, "0")}`, focusDate);
}

function handleCalendarKey(event) {
    const button = event.target.closest("button[data-date]");
    if (!button) return;
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const weekday = (new Date(`${button.dataset.date}T12:00:00`).getDay() + 6) % 7;
    if (event.key in offsets) {
        event.preventDefault();
        selectDate(addDays(button.dataset.date, offsets[event.key]), true);
    } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        selectDate(addDays(button.dataset.date, event.key === "Home" ? -weekday : 6 - weekday), true);
    } else if (event.key === "PageUp" || event.key === "PageDown") {
        event.preventDefault();
        changeMonth(event.key === "PageUp" ? -1 : 1, true);
    }
}

function setupCalendar() {
    const grid = document.querySelector("#calendar-days");
    if (!grid) return;
    renderCalendar(true);
    document.querySelector("#calendar-previous").addEventListener("click", () => changeMonth(-1));
    document.querySelector("#calendar-next").addEventListener("click", () => changeMonth(1));
    document.querySelector("#calendar-today").addEventListener("click", () => selectDate(getLocalDate(), true));
    grid.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-date]");
        if (button) selectDate(button.dataset.date, true);
    });
    grid.addEventListener("keydown", handleCalendarKey);
    document.addEventListener("qadam:data-changed", (event) => {
        if (event.detail?.key === STORAGE.tasks) renderCalendar();
    });
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE.tasks || event.key === null) renderCalendar(true);
    });
    window.addEventListener("focus", () => renderCalendar(true));
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) renderCalendar(true);
    });
}

export { getMonthDays, setupCalendar };
