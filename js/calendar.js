import { getLocalDate, addDays, escapeHTML } from "./shared.js";
import { loadTasks } from "./tasks.js";

let selectedDate = getLocalDate();
// The month on screen as "YYYY-MM".
let visibleMonth = selectedDate.slice(0, 7);
let calendarTasks = [];

// All dates shown in the month grid: full weeks, Monday first,
// including a few days of the previous and the next month.
function getMonthDays(month) {
    const firstDay = new Date(`${month}-01T12:00:00`);
    const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
    const daysBeforeFirst = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((daysBeforeFirst + daysInMonth) / 7) * 7;
    const startDate = addDays(`${month}-01`, -daysBeforeFirst);

    const days = [];
    for (let index = 0; index < totalCells; index += 1) {
        days.push(addDays(startDate, index));
    }
    return days;
}

function formatCalendarDate(date, options) {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en", options);
}

function renderDayCell(date, today) {
    const count = calendarTasks.filter((task) => task.date === date).length;
    const taskWord = count === 1 ? "task" : "tasks";
    const label = formatCalendarDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const outsideMonth = date.slice(0, 7) !== visibleMonth;
    return `<td><button type="button" class="calendar-day${outsideMonth ? " calendar-day-muted" : ""}"
        data-date="${date}" aria-label="${label}, ${count} ${taskWord}"
        aria-pressed="${date === selectedDate}" ${date === today ? 'aria-current="date"' : ""}
        tabindex="${date === selectedDate ? "0" : "-1"}">
        <span class="calendar-day-number">${Number(date.slice(8))}</span>
        <span class="calendar-count" ${count > 0 ? "" : "hidden"} aria-hidden="true">${count}<span class="calendar-count-word"> ${taskWord}</span></span>
    </button></td>`;
}

function renderMonth() {
    const today = getLocalDate();
    const days = getMonthDays(visibleMonth);
    let rows = "";
    // Every seven days make one table row.
    for (let index = 0; index < days.length; index += 7) {
        const week = days.slice(index, index + 7);
        rows += `<tr>${week.map((date) => renderDayCell(date, today)).join("")}</tr>`;
    }
    document.querySelector("#calendar-month-title").textContent = formatCalendarDate(`${visibleMonth}-01`, { month: "long", year: "numeric" });
    document.querySelector("#calendar-days").innerHTML = rows;
}

function compareByTime(first, second) {
    // Tasks without a time go to the end of the day.
    return (first.time || "99:99").localeCompare(second.time || "99:99") || first.title.localeCompare(second.title);
}

function renderSelectedDay() {
    const tasks = calendarTasks.filter((task) => task.date === selectedDate).sort(compareByTime);
    const completed = tasks.filter((task) => task.completed).length;

    document.querySelector("#calendar-day-title").textContent = formatCalendarDate(selectedDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    document.querySelector("#calendar-day-summary").textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} · ${completed} completed`;
    document.querySelector("#calendar-day-empty").hidden = tasks.length > 0;
    document.querySelector("#calendar-day-tasks").innerHTML = tasks.map((task) => `<li class="calendar-task${task.completed ? " calendar-task-completed" : ""}">
        <span class="calendar-task-time">${task.time ? `<time datetime="${task.date}T${task.time}">${task.time}</time>` : "Any time"}</span>
        <div class="calendar-task-content">
            <h3>${escapeHTML(task.title)}</h3>
            <p>${task.getCategoryLabel()} · ${task.completed ? "Completed" : "Open"}</p>
        </div>
        <a class="calendar-task-link" href="today.html" aria-label="Manage ${escapeHTML(task.title)} on Today">Open Today</a>
    </li>`).join("");
}

function renderCalendar() {
    renderMonth();
    renderSelectedDay();
}

function selectDate(date, focusDate) {
    selectedDate = date;
    visibleMonth = date.slice(0, 7);
    renderCalendar();
    if (focusDate) document.querySelector(`[data-date="${selectedDate}"]`).focus();
}

// Moves one month back (-1) or forward (+1) and keeps the same day number.
// A day that does not exist, such as 31 February, becomes the last day of the month.
function changeMonth(amount, focusDate) {
    const firstDay = new Date(`${visibleMonth}-01T12:00:00`);
    firstDay.setMonth(firstDay.getMonth() + amount);
    const nextMonth = getLocalDate(firstDay).slice(0, 7);
    const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
    const day = Math.min(Number(selectedDate.slice(8)), daysInMonth);
    selectDate(`${nextMonth}-${String(day).padStart(2, "0")}`, focusDate);
}

// Keyboard navigation: arrows move by day or week, PageUp/PageDown by month.
function handleCalendarKey(event) {
    const button = event.target.closest("button[data-date]");
    if (!button) return;
    const date = button.dataset.date;

    if (event.key === "ArrowLeft") selectDate(addDays(date, -1), true);
    else if (event.key === "ArrowRight") selectDate(addDays(date, 1), true);
    else if (event.key === "ArrowUp") selectDate(addDays(date, -7), true);
    else if (event.key === "ArrowDown") selectDate(addDays(date, 7), true);
    else if (event.key === "PageUp") changeMonth(-1, true);
    else if (event.key === "PageDown") changeMonth(1, true);
    else return;

    // Stop the page from scrolling when a key was used for the calendar.
    event.preventDefault();
}

function setupCalendar() {
    const grid = document.querySelector("#calendar-days");
    if (!grid) return;

    calendarTasks = loadTasks();
    renderCalendar();

    document.querySelector("#calendar-previous").addEventListener("click", () => changeMonth(-1, false));
    document.querySelector("#calendar-next").addEventListener("click", () => changeMonth(1, false));
    document.querySelector("#calendar-today").addEventListener("click", () => selectDate(getLocalDate(), true));
    grid.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-date]");
        if (button) selectDate(button.dataset.date, true);
    });
    grid.addEventListener("keydown", handleCalendarKey);
}

export { setupCalendar };
