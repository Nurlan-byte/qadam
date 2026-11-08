import { STORAGE, getLocalDate, addDays, isValidDate, readStorage, writeStorage, escapeHTML, announce } from "./shared.js";
import { defaultHabits } from "./data.js";

function validHabits(value) {
    return Array.isArray(value) && value.every((habit) => habit &&
        typeof habit.id === "string" && typeof habit.title === "string" &&
        typeof habit.period === "string" && Number.isInteger(habit.streak) && habit.streak >= 0 &&
        (habit.lastDoneDate === "" || isValidDate(habit.lastDoneDate)));
}

const habits = readStorage(STORAGE.habits, defaultHabits, validHabits);

function currentStreak(habit) {
    return habit.lastDoneDate >= addDays(getLocalDate(), -1) ? habit.streak : 0;
}

function renderHabits() {
    const list = document.querySelector("#habit-checkin-list");
    if (!list) return;
    const currentDate = getLocalDate();
    const completed = habits.filter((habit) => habit.lastDoneDate === currentDate).length;
    const count = document.querySelector("#habit-checkin-count");
    if (count) count.textContent = `${completed} of ${habits.length} done`;

    list.innerHTML = habits.map((habit) => {
        const done = habit.lastDoneDate === currentDate;
        return `<li class="today-task habit-checkin-row">
            <input class="form-check-input today-check" type="checkbox" id="${escapeHTML(habit.id)}" data-habit-id="${escapeHTML(habit.id)}" ${done ? "checked" : ""}>
            <label class="today-task-title" for="${escapeHTML(habit.id)}">${escapeHTML(habit.title)}</label>
            <span class="today-tag">${escapeHTML(habit.period)}</span>
            <span class="today-streak">🔥 ${currentStreak(habit)} day streak</span>
        </li>`;
    }).join("");
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

        if (checkbox.checked) {
            const yesterday = addDays(getLocalDate(), -1);
            habit.previousStreak = habit.streak;
            habit.previousDoneDate = habit.lastDoneDate;
            habit.streak = habit.lastDoneDate === yesterday ? habit.streak + 1 : 1;
            habit.lastDoneDate = getLocalDate();
        } else {
            habit.streak = Number.isInteger(habit.previousStreak) ? habit.previousStreak : Math.max(0, habit.streak - 1);
            habit.lastDoneDate = isValidDate(habit.previousDoneDate) ? habit.previousDoneDate : "";
        }
        writeStorage(STORAGE.habits, habits);
        renderHabits();
        announce(`${habit.title}: ${checkbox.checked ? "checked in" : "check-in removed"}.`);
    });
}

export { setupHabits };
