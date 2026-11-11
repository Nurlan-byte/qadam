import { STORAGE, getLocalDate, addDays, readStorage, writeStorage, escapeHTML, announce, formatDate, makeId } from "./shared.js";
import { defaultHabits } from "./data.js";
import { Habit, habitPeriods, isValidHabit } from "./habit-model.js";

let habits = [];
let editingHabitId = null;

// ---------- Data ----------

// Reads saved records and turns every valid one into a Habit object.
function loadHabits() {
    const saved = readStorage(STORAGE.habits, defaultHabits);
    const records = Array.isArray(saved) ? saved : defaultHabits;
    const ids = new Set();
    return records.filter((record) => {
        if (!isValidHabit(record) || ids.has(record.id)) return false;
        ids.add(record.id);
        return true;
    }).map((record) => new Habit(record));
}

function saveHabits(message) {
    const saved = writeStorage(STORAGE.habits, habits);
    renderHabits();
    announce(saved ? message : `${message} This change could not be saved in your browser.`);
    return saved;
}

function getHabitById(habitId) {
    return habits.find((habit) => habit.id === habitId);
}

// Returns `count` dates in a row, starting from `start`.
function daysFrom(start, count) {
    const dates = [];
    for (let index = 0; index < count; index += 1) {
        dates.push(addDays(start, index));
    }
    return dates;
}

// The seven dates of the current week, Monday first.
function weekDates() {
    const today = getLocalDate();
    const weekday = new Date(`${today}T12:00:00`).getDay();
    const daysAfterMonday = (weekday + 6) % 7;
    return daysFrom(addDays(today, -daysAfterMonday), 7);
}

function checkInsOn(date) {
    return habits.filter((habit) => habit.isDoneOn(date)).length;
}

function dayName(date) {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "short" });
}

// ---------- Rendering ----------

function renderHabitRow(habit, today) {
    const id = escapeHTML(habit.id);
    return `<li class="today-task habit-checkin-row">
        <input class="form-check-input today-check" type="checkbox" id="${id}" data-habit-id="${id}" ${habit.isDoneOn(today) ? "checked" : ""}>
        <label class="today-task-title" for="${id}">${escapeHTML(habit.title)}</label>
        <span class="today-tag">${habit.period}</span>
        <span class="today-streak">🔥 ${habit.getStreak(today)} day streak</span>
    </li>`;
}

function renderHabitCard(habit, today) {
    const id = escapeHTML(habit.id);
    const title = escapeHTML(habit.title);
    const done = habit.isDoneOn(today);
    return `<li class="col-md-6 col-xl-4"><article class="habit-card" data-habit-card="${id}">
        <input class="form-check-input today-check" type="checkbox" id="${id}" data-habit-id="${id}" ${done ? "checked" : ""}>
        <div class="habit-card-text">
            <label class="habit-name" for="${id}">${title}</label>
            <p class="habit-meta">Every day · ${habit.period}</p>
            <p class="habit-status ${done ? "habit-status-done" : ""}">${done ? "Done today" : "Not checked in today"}</p>
            <p class="habit-run">${habit.getStreak(today)} day streak</p>
            <div class="habit-actions">
                <button class="habit-edit btn btn-sm btn-outline-light" type="button" aria-label="Edit habit: ${title}">Edit</button>
                <button class="habit-delete btn btn-sm btn-outline-light" type="button" aria-label="Delete habit: ${title}">Delete</button>
            </div>
        </div></article></li>`;
}

// The same list is shown as simple rows on Today and as cards on the Habits page.
function renderCheckIns() {
    const list = document.querySelector("#habit-checkin-list");
    const today = getLocalDate();
    const fullPage = document.body.classList.contains("habits-page");
    const count = document.querySelector("#habit-checkin-count");
    if (count) count.textContent = `${checkInsOn(today)} of ${habits.length} done`;

    if (habits.length === 0) {
        list.innerHTML = '<li class="text-secondary">No habits are saved in this browser.</li>';
    } else if (fullPage) {
        list.innerHTML = habits.map((habit) => renderHabitCard(habit, today)).join("");
    } else {
        list.innerHTML = habits.map((habit) => renderHabitRow(habit, today)).join("");
    }
}

function renderWeek() {
    const list = document.querySelector("#habit-week");
    if (!list) return;
    const today = getLocalDate();
    list.innerHTML = weekDates().map((date) => {
        const done = checkInsOn(date);
        const allDone = habits.length > 0 && done === habits.length;
        const isFuture = date > today;
        return `<li class="habit-day ${allDone ? "habit-day-done" : ""} ${date === today ? "habit-day-today" : ""}">
            <span class="habit-day-name">${dayName(date)}</span>
            <time class="habit-day-number" datetime="${date}">${Number(date.slice(8))}</time>
            <span class="habit-day-mark" aria-label="${isFuture ? "Upcoming" : `${done} recorded check-ins`}">${isFuture ? "–" : done}</span>
        </li>`;
    }).join("");
}

// Colour level of a history day: 0 = nothing, 3 = every habit done.
function getHistoryLevel(count) {
    if (count === 0) return 0;
    if (count === habits.length) return 3;
    return count / habits.length >= 0.5 ? 2 : 1;
}

function renderHistory() {
    const grid = document.querySelector("#habit-history-grid");
    if (!grid) return;
    const today = getLocalDate();
    const dates = daysFrom(addDays(today, -27), 28);
    let total = 0;

    grid.innerHTML = dates.map((date) => {
        const count = checkInsOn(date);
        total += count;
        return `<li class="habit-history-day habit-level-${getHistoryLevel(count)} ${date === today ? "habit-history-today" : ""}" aria-label="${formatDate(date)}: ${count} recorded check-ins">
            <time datetime="${date}">${formatDate(date)}</time><span>${count}</span></li>`;
    }).join("");

    let longestRun = 0;
    for (const habit of habits) {
        longestRun = Math.max(longestRun, habit.getLongestRun());
    }
    document.querySelector("#habit-history-range").textContent = `${formatDate(dates[0])} – ${formatDate(today)}`;
    document.querySelector("#habit-recorded-count").textContent = total;
    document.querySelector("#habit-recorded-run").textContent = longestRun;
}

function renderWeekTable() {
    const table = document.querySelector("#habit-week-table");
    if (!table) return;
    const today = getLocalDate();
    const dates = weekDates();

    const headCells = dates.map((date) =>
        `<th scope="col" class="${date === today ? "habit-col-today" : ""}">${dayName(date)}<span class="habit-date">${Number(date.slice(8))}</span></th>`);

    const rows = habits.map((habit) => {
        let total = 0;
        const cells = dates.map((date) => {
            const done = habit.isDoneOn(date);
            if (done) total += 1;
            return `<td class="${done ? "habit-mark-done" : "habit-mark-rest"}">
                <span aria-hidden="true">${done ? "✓" : "–"}</span>
                <span class="visually-hidden">${done ? "Checked in" : "No recorded check-in"}</span></td>`;
        });
        return `<tr><th scope="row">${escapeHTML(habit.title)}</th>${cells.join("")}<td class="habit-total">${total}</td></tr>`;
    });

    table.querySelector("caption").textContent = `Recorded check-ins, ${formatDate(dates[0])} – ${formatDate(dates[6])}`;
    table.querySelector("thead").innerHTML = `<tr><th scope="col">Habit</th>${headCells.join("")}<th scope="col">Total</th></tr>`;
    table.querySelector("tbody").innerHTML = rows.join("");
}

function renderHabits() {
    renderCheckIns();
    renderWeek();
    renderHistory();
    renderWeekTable();
}

// ---------- Form ----------

function showHabitFieldError(field, message) {
    field.classList.toggle("is-invalid", message !== "");
    field.setAttribute("aria-invalid", String(message !== ""));
    document.querySelector(`#${field.id}-error`).textContent = message;
}

function resetHabitForm() {
    const form = document.querySelector("#habit-form");
    editingHabitId = null;
    form.reset();
    form.querySelectorAll("input, select").forEach((field) => showHabitFieldError(field, ""));
    document.querySelector("#habit-form-title").textContent = "New habit";
    document.querySelector("#habit-submit").textContent = "Add habit";
    document.querySelector("#habit-cancel").hidden = true;
    document.querySelector("#habit-form-status").textContent = "";
}

function editHabit(habitId) {
    const habit = getHabitById(habitId);
    if (!habit) return;
    resetHabitForm();
    editingHabitId = habitId;
    document.querySelector("#habit-title").value = habit.title;
    document.querySelector("#habit-period").value = habit.period;
    document.querySelector("#habit-form-title").textContent = "Edit habit";
    document.querySelector("#habit-submit").textContent = "Save changes";
    document.querySelector("#habit-cancel").hidden = false;
    document.querySelector("#habit-title").focus();
}

function submitHabit(form) {
    const title = form.querySelector("#habit-title");
    const period = form.querySelector("#habit-period");
    const titleValue = title.value.trim();

    let titleError = "";
    if (titleValue === "") titleError = "Enter a habit title.";
    else if (titleValue.length > 80) titleError = "Use no more than 80 characters.";
    const periodError = habitPeriods.includes(period.value) ? "" : "Choose Morning, Afternoon or Evening.";

    showHabitFieldError(title, titleError);
    showHabitFieldError(period, periodError);
    if (titleError || periodError) {
        document.querySelector("#habit-form-status").textContent = "";
        form.querySelector(".is-invalid").focus();
        return;
    }

    const habit = getHabitById(editingHabitId);
    let message = "Habit added.";
    if (habit) {
        // Editing keeps the id and the check-in history.
        habit.rename(titleValue, period.value);
        message = "Habit updated.";
    } else {
        habits.push(new Habit({ id: makeId("habit"), title: titleValue, period: period.value, dates: [] }));
    }

    const saved = saveHabits(message);
    resetHabitForm();
    document.querySelector("#habit-form-status").textContent = saved
        ? `${message} Saved in this browser.`
        : `${message} Your browser could not save this change.`;
    title.focus();
}

function deleteHabit(habitId) {
    const habit = getHabitById(habitId);
    if (!habit || !window.confirm(`Delete "${habit.title}" and its check-in history? This cannot be undone.`)) return;
    habits = habits.filter((item) => item.id !== habitId);
    // Also clears the old "Habit added/updated" message under the form.
    resetHabitForm();
    saveHabits("Habit and its check-in history deleted.");
}

// ---------- Event handlers ----------

function setupHabitForm(list) {
    const form = document.querySelector("#habit-form");
    if (!form) return;
    resetHabitForm();

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        submitHabit(form);
    });
    form.querySelectorAll("input, select").forEach((field) => {
        field.addEventListener("input", () => showHabitFieldError(field, ""));
    });
    document.querySelector("#habit-cancel").addEventListener("click", () => {
        resetHabitForm();
        announce("Editing cancelled. The habit was not changed.");
    });

    // One listener on the list handles the buttons of every card.
    list.addEventListener("click", (event) => {
        const button = event.target.closest(".habit-edit, .habit-delete");
        if (!button) return;
        const habitId = button.closest("[data-habit-card]").dataset.habitCard;
        if (button.classList.contains("habit-edit")) editHabit(habitId);
        else deleteHabit(habitId);
    });
}

function setupHabits() {
    const list = document.querySelector("#habit-checkin-list");
    if (!list) return;

    habits = loadHabits();
    renderHabits();
    setupHabitForm(list);

    list.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-habit-id]");
        if (!checkbox) return;
        const habit = getHabitById(checkbox.dataset.habitId);
        if (!habit) return;
        habit.setDone(getLocalDate(), checkbox.checked);
        saveHabits(`${habit.title}: ${checkbox.checked ? "checked in" : "check-in removed"}.`);
    });
    // Today may have changed while this page was in the background.
    window.addEventListener("focus", renderHabits);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) renderHabits();
    });
}

export { setupHabits, loadHabits };
