import { STORAGE, getLocalDate, addDays, isValidDate, readStorage, writeStorage, escapeHTML, announce, formatDate } from "./shared.js";
import { defaultHabits } from "./data.js";

function validHabits(value) {
    return Array.isArray(value) && value.every((habit) => habit &&
        typeof habit.id === "string" && /^[a-zA-Z0-9_-]+$/.test(habit.id) &&
        typeof habit.title === "string" && habit.title.trim().length > 0 && habit.title.length <= 80 &&
        typeof habit.period === "string" && habit.period.length <= 30 &&
        Number.isInteger(habit.streak) && habit.streak >= 0 &&
        (habit.lastDoneDate === "" || isValidDate(habit.lastDoneDate)) &&
        (habit.dates === undefined || (Array.isArray(habit.dates) && habit.dates.every(isValidDate))));
}

function currentStreak(habit, today = getLocalDate()) {
    const dates = new Set(habit.dates);
    let date = dates.has(today) ? today : addDays(today, -1);
    let streak = 0;
    while (dates.has(date)) {
        if (habit.legacyStreak?.date === date) return streak + habit.legacyStreak.count;
        streak += 1;
        date = addDays(date, -1);
    }
    return streak;
}

function normalizeHabit(saved) {
    const today = getLocalDate();
    const hasHistory = Array.isArray(saved.dates);
    const knownDates = hasHistory ? saved.dates : [saved.lastDoneDate, saved.previousDoneDate];
    const dates = [...new Set(knownDates.filter((date) => isValidDate(date) && date <= today))].sort();
    // Preserve an old total without inventing the dates behind that total.
    let legacyStreak = hasHistory ? saved.legacyStreak : null;
    if (!hasHistory && dates.length) {
        const hasPrevious = dates.includes(saved.previousDoneDate) && Number.isInteger(saved.previousStreak) && saved.previousStreak > 0;
        legacyStreak = hasPrevious
            ? { date: saved.previousDoneDate, count: saved.previousStreak }
            : { date: saved.lastDoneDate, count: saved.streak };
    }
    if (!legacyStreak || !isValidDate(legacyStreak.date) || !Number.isInteger(legacyStreak.count) || legacyStreak.count < 1) {
        legacyStreak = null;
    }
    const habit = { id: saved.id, title: saved.title, period: saved.period, dates, legacyStreak };
    habit.lastDoneDate = dates.at(-1) || "";
    habit.streak = currentStreak(habit, today);
    return habit;
}

function getHabits() {
    return readStorage(STORAGE.habits, defaultHabits, validHabits).map(normalizeHabit);
}

let habits = getHabits();
let hasUnsavedChanges = false;

function daysFrom(start, count) {
    return Array.from({ length: count }, (_, index) => addDays(start, index));
}

function weekDates() {
    const date = new Date(`${getLocalDate()}T12:00:00`);
    return daysFrom(addDays(getLocalDate(), -((date.getDay() + 6) % 7)), 7);
}

function checkInsOn(date) {
    return habits.filter((habit) => habit.dates.includes(date)).length;
}

function dayName(date) {
    return new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${date}T12:00:00`));
}

function renderHabitCard(habit, fullPage) {
    const id = escapeHTML(habit.id);
    const checked = habit.dates.includes(getLocalDate());
    const checkbox = `<input class="form-check-input today-check" type="checkbox" id="${id}" data-habit-id="${id}" ${checked ? "checked" : ""}>`;
    const title = escapeHTML(habit.title);
    const period = escapeHTML(habit.period);
    const streak = currentStreak(habit);
    if (!fullPage) {
        return `<li class="today-task habit-checkin-row">${checkbox}
            <label class="today-task-title" for="${id}">${title}</label>
            <span class="today-tag">${period}</span><span class="today-streak">🔥 ${streak} day streak</span></li>`;
    }
    return `<li class="col-md-6 col-xl-4"><article class="habit-card">
        ${checkbox}<div class="habit-card-text">
            <label class="habit-name" for="${id}">${title}</label>
            <p class="habit-meta">Every day · ${period}</p>
            <p class="habit-status ${checked ? "habit-status-done" : ""}">${checked ? "Done today" : "Not checked in today"}</p>
            <p class="habit-run">${streak} day streak</p>
        </div></article></li>`;
}

function renderCheckIns() {
    const list = document.querySelector("#habit-checkin-list");
    if (!list) return;
    const count = document.querySelector("#habit-checkin-count");
    if (count) count.textContent = `${checkInsOn(getLocalDate())} of ${habits.length} done`;
    list.innerHTML = habits.map((habit) => renderHabitCard(habit, document.body.classList.contains("habits-page"))).join("");
    if (!habits.length) list.innerHTML = '<li class="text-secondary">No habits are saved in this browser.</li>';
}

function renderWeek() {
    const list = document.querySelector("#habit-week");
    if (!list) return;
    const today = getLocalDate();
    list.innerHTML = weekDates().map((date) => {
        const done = checkInsOn(date);
        const allDone = habits.length > 0 && done === habits.length;
        const status = date > today ? "Upcoming" : `${done} recorded check-ins`;
        return `<li class="habit-day ${allDone ? "habit-day-done" : ""} ${date === today ? "habit-day-today" : ""}" ${date === today ? 'aria-current="date"' : ""}>
            <span class="habit-day-name">${dayName(date)}</span><time class="habit-day-number" datetime="${date}">${Number(date.slice(-2))}</time>
            <span class="habit-day-mark" aria-label="${status}">${date > today ? "–" : done}</span></li>`;
    }).join("");
}

function longestRecordedRun() {
    let longest = 0;
    for (const habit of habits) {
        let run = 0;
        let previous = "";
        for (const date of habit.dates) {
            run = previous && date === addDays(previous, 1) ? run + 1 : 1;
            longest = Math.max(longest, run);
            previous = date;
        }
    }
    return longest;
}

function renderHistory() {
    const grid = document.querySelector("#habit-history-grid");
    if (!grid) return;
    const today = getLocalDate();
    const dates = daysFrom(addDays(today, -27), 28);
    grid.innerHTML = dates.map((date) => {
        const count = checkInsOn(date);
        const level = !count ? 0 : count === habits.length ? 3 : count / habits.length >= 0.5 ? 2 : 1;
        return `<li class="habit-history-day habit-level-${level} ${date === today ? "habit-history-today" : ""}" aria-label="${formatDate(date)}: ${count} recorded check-ins">
            <time datetime="${date}">${formatDate(date)}</time><span>${count}</span></li>`;
    }).join("");
    document.querySelector("#habit-history-range").textContent = `${formatDate(dates[0])} – ${formatDate(today)}`;
    document.querySelector("#habit-recorded-count").textContent = String(dates.reduce((total, date) => total + checkInsOn(date), 0));
    document.querySelector("#habit-recorded-run").textContent = String(longestRecordedRun());
    document.querySelector("#habit-legacy-note").hidden = !habits.some((habit) => habit.legacyStreak?.count > 1);
}

function renderWeekTable() {
    const table = document.querySelector("#habit-week-table");
    if (!table) return;
    const today = getLocalDate();
    const dates = weekDates();
    table.querySelector("caption").textContent = `Recorded check-ins, ${formatDate(dates[0])} – ${formatDate(dates[6])}`;
    table.querySelector("thead").innerHTML = `<tr><th scope="col">Habit</th>${dates.map((date) => `<th scope="col" class="${date === today ? "habit-col-today" : ""}">${dayName(date)}<span class="habit-date">${Number(date.slice(-2))}</span></th>`).join("")}<th scope="col">Total</th></tr>`;
    table.querySelector("tbody").innerHTML = habits.map((habit) => `<tr><th scope="row">${escapeHTML(habit.title)}</th>${dates.map((date) => {
        const done = habit.dates.includes(date);
        const label = date > today ? "Upcoming" : done ? "Checked in" : "No recorded check-in";
        return `<td class="${done ? "habit-mark-done" : "habit-mark-rest"}"><span aria-hidden="true">${done ? "✓" : "–"}</span><span class="visually-hidden">${label}</span></td>`;
    }).join("")}<td class="habit-total">${dates.filter((date) => habit.dates.includes(date)).length}</td></tr>`).join("");
}

function renderHabits() {
    renderCheckIns();
    renderWeek();
    renderHistory();
    renderWeekTable();
}

function setCheckIn(habit, checked) {
    const today = getLocalDate();
    habit.dates = habit.dates.filter((date) => date !== today);
    if (checked) habit.dates.push(today);
    habit.dates.sort();
    habit.lastDoneDate = habit.dates.at(-1) || "";
    habit.streak = currentStreak(habit);
}

function refreshHabits() {
    if (!hasUnsavedChanges) habits = getHabits();
    renderHabits();
}

function setupHabits() {
    const list = document.querySelector("#habit-checkin-list");
    if (!list) return;
    renderHabits();
    list.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-habit-id]");
        if (!checkbox) return;
        const habit = habits.find((item) => item.id === checkbox.dataset.habitId);
        if (!habit) return;
        setCheckIn(habit, checkbox.checked);
        const saved = writeStorage(STORAGE.habits, habits);
        hasUnsavedChanges = !saved;
        renderHabits();
        const message = `${habit.title}: ${checkbox.checked ? "checked in" : "check-in removed"}.`;
        announce(saved ? message : `${message} This change could not be saved in your browser.`);
        document.getElementById(habit.id)?.focus();
    });
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE.habits || event.key === null) refreshHabits();
    });
    window.addEventListener("focus", refreshHabits);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) refreshHabits();
    });
}

export { setupHabits, getHabits };
