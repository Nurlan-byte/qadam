import { STORAGE, getLocalDate, isValidDate, readStorage, writeStorage, escapeHTML, announce, formatDate, makeId } from "./shared.js";
import { categories, defaultTasks } from "./data.js";
import { Task, isValidTask, isValidTime } from "./task-model.js";

// jQuery is loaded only on the Today page, the only page that uses it.
const $ = window.jQuery;
const NOTES_LIMIT = 240;

let tasks = [];
let favoritesOnly = false;
let editingTaskId = null;
// The latest deleted task and its position, kept until the page is reloaded.
let deletedTask = null;

// ---------- Data ----------

// Reads saved records and turns every valid one into a Task object.
function loadTasks() {
    const saved = readStorage(STORAGE.tasks, defaultTasks);
    const records = Array.isArray(saved) ? saved : defaultTasks;
    const ids = new Set();
    return records.filter((record) => {
        if (!isValidTask(record) || ids.has(record.id)) return false;
        ids.add(record.id);
        return true;
    }).map((record) => new Task(record));
}

function saveTasks(message) {
    const saved = writeStorage(STORAGE.tasks, tasks);
    renderTasks();
    announce(saved ? message : `${message} This change could not be saved in your browser.`);
    return saved;
}

function getTaskById(taskId) {
    return tasks.find((task) => task.id === taskId);
}

function getVisibleTasks() {
    const search = document.querySelector("#task-search").value.trim();
    const categoryId = document.querySelector("#task-category-filter").value;
    const status = document.querySelector("#task-status-filter").value;

    return tasks.filter((task) => {
        if (favoritesOnly && !task.favorite) return false;
        return task.matchesSearch(search) && task.matchesFilters(categoryId, status);
    });
}

// ---------- Rendering ----------

function renderTaskCard(task) {
    const id = escapeHTML(task.id);
    const title = escapeHTML(task.title);
    const notes = escapeHTML(task.notes);
    const category = escapeHTML(task.getCategoryLabel());

    let timeMarkup = `<time class="today-time" datetime="${task.date}">${formatDate(task.date)}</time>`;
    if (task.time) {
        timeMarkup = `<time class="today-time" datetime="${task.date}T${task.time}">${task.time}</time>`;
    }

    let notesMarkup = "";
    if (notes) {
        notesMarkup = `<button class="task-notes-toggle" type="button" aria-expanded="false" aria-controls="task-notes-${id}">Details</button>
            <p class="task-notes" id="task-notes-${id}">${notes}</p>`;
    }

    return `<li class="today-task task-card${task.completed ? " today-task-done" : ""}${task.favorite ? " task-card-favorite" : ""}" data-task-id="${id}">
        <input class="form-check-input today-check" type="checkbox" id="complete-${id}" ${task.completed ? "checked" : ""}>
        <label class="today-task-title" for="complete-${id}">${title}</label>
        <span class="today-tag">${category}</span>
        ${timeMarkup}
        <div class="task-actions">
            <button class="task-favorite" type="button" aria-pressed="${task.favorite}" aria-label="${task.favorite ? "Remove from" : "Add to"} favorites: ${title}"><span class="task-favorite-icon" aria-hidden="true">${task.favorite ? "★" : "☆"}</span></button>
            <button class="task-edit btn btn-sm btn-outline-light" type="button" aria-label="Edit task: ${title}">Edit</button>
            <button class="task-delete" type="button" aria-label="Delete task: ${title}">Delete</button>
        </div>
        ${notesMarkup}
    </li>`;
}

function compareTasks(first, second) {
    return first.date.localeCompare(second.date) || first.time.localeCompare(second.time);
}

function renderTasks() {
    const today = getLocalDate();
    const visibleTasks = getVisibleTasks();
    const groups = { overdue: [], today: [], upcoming: [], completed: [] };

    for (const task of visibleTasks) {
        groups[task.getGroup(today)].push(task);
    }

    for (const groupName in groups) {
        const groupTasks = groups[groupName].sort(compareTasks);
        const section = document.querySelector(`[data-task-section="${groupName}"]`);
        section.querySelector(".today-list").innerHTML = groupTasks.map(renderTaskCard).join("");
        section.querySelector(".today-count").textContent = groupTasks.length;
        section.hidden = groupTasks.length === 0;
    }

    const completedCount = tasks.filter((task) => task.completed).length;
    document.querySelector("#task-summary").textContent = `${tasks.length - completedCount} open · ${completedCount} completed`;
    document.querySelector("#task-empty").hidden = visibleTasks.length > 0;
    document.querySelector("#clear-tasks").disabled = tasks.length === 0;

    const todayLabel = document.querySelector("#today-date");
    todayLabel.dateTime = today;
    todayLabel.textContent = new Date(`${today}T12:00:00`).toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" });
}

// The Undo panel slides in after a deletion and slides away after Undo or "Clear all".
function renderTaskUndo() {
    const $panel = $("#task-undo-panel");
    $panel.stop(true, true);

    if (deletedTask) {
        $panel.find("p").text(`Deleted "${deletedTask.task.title}". Undo is available on this page.`);
        $panel.prop("hidden", false).hide().slideDown(200);
    } else {
        $panel.slideUp(200, () => {
            $panel.prop("hidden", true);
            $panel.find("p").text("");
        });
    }
}

// ---------- Form and validation ----------

function showFieldError(field, message) {
    const error = document.querySelector(`[data-error-for="${field.id}"]`);
    field.classList.toggle("is-invalid", message !== "");
    field.setAttribute("aria-invalid", String(message !== ""));
    if (error) error.textContent = message;
}

function getTitleError(value) {
    if (value.length < 3) return "Enter at least 3 characters.";
    if (value.length > 80) return "Use no more than 80 characters.";
    return "";
}

function getDateError(value) {
    if (!value) return "Choose a due date.";
    if (!isValidDate(value)) return "Enter a valid date with a four-digit year.";
    return "";
}

// Shows a message next to every wrong field and returns true when the form is valid.
function validateTaskForm(form) {
    const title = form.querySelector("#task-title");
    const date = form.querySelector("#task-date");
    const time = form.querySelector("#task-time");
    const list = form.querySelector("#task-list-category");
    const notes = form.querySelector("#task-notes");
    const knownCategory = categories.some((category) => category.id === list.value);

    const errors = [
        [title, getTitleError(title.value.trim())],
        [date, getDateError(date.value)],
        [time, time.validity.badInput || !isValidTime(time.value) ? "Enter a valid time." : ""],
        [list, knownCategory ? "" : "Choose a task list."],
        [notes, notes.value.trim().length > NOTES_LIMIT ? `Use no more than ${NOTES_LIMIT} characters.` : ""]
    ];

    let valid = true;
    for (const [field, message] of errors) {
        showFieldError(field, message);
        if (message) valid = false;
    }
    return valid;
}

// Shows how many characters the notes use; the counter turns orange near the limit.
function updateNotesCounter() {
    const $notes = $("#task-form textarea");
    const length = $notes.val().length;
    $notes.siblings(".char-count")
        .text(`${length} / ${NOTES_LIMIT} characters`)
        .toggleClass("char-count-near", length >= NOTES_LIMIT - 20);
}

function readTaskForm(form) {
    return {
        title: form.querySelector("#task-title").value.trim(),
        date: form.querySelector("#task-date").value,
        time: form.querySelector("#task-time").value,
        list: form.querySelector("#task-list-category").value,
        notes: form.querySelector("#task-notes").value.trim()
    };
}

function resetTaskForm(form) {
    editingTaskId = null;
    form.reset();
    form.querySelector("#task-date").value = getLocalDate();
    form.querySelectorAll("input, select, textarea").forEach((field) => showFieldError(field, ""));
    document.querySelector("#today-form-title").textContent = "New task";
    form.querySelector("#task-submit").textContent = "Add task";
    form.querySelector("#task-cancel").hidden = true;
    form.querySelector("#task-form-status").textContent = "";
    updateNotesCounter();
}

function startEditingTask(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    const form = document.querySelector("#task-form");
    resetTaskForm(form);
    editingTaskId = taskId;
    form.querySelector("#task-title").value = task.title;
    form.querySelector("#task-date").value = task.date;
    form.querySelector("#task-time").value = task.time;
    form.querySelector("#task-list-category").value = task.list;
    form.querySelector("#task-notes").value = task.notes;
    updateNotesCounter();
    document.querySelector("#today-form-title").textContent = "Edit task";
    form.querySelector("#task-submit").textContent = "Save changes";
    form.querySelector("#task-cancel").hidden = false;
    form.querySelector("#task-title").focus();
    announce(`Editing: ${task.title}`);
}

function submitTask(form) {
    const values = readTaskForm(form);
    const task = getTaskById(editingTaskId);
    let message = "Task added.";

    if (task) {
        task.update(values);
        message = "Task updated.";
    } else {
        tasks.push(new Task({ id: makeId("task"), ...values, completed: false, favorite: false }));
    }

    const saved = saveTasks(message);
    resetTaskForm(form);
    form.querySelector("#task-form-status").textContent = saved
        ? `${message} Saved in this browser.`
        : `${message} Your browser could not save this change.`;
    form.querySelector("#task-title").focus();
}

// ---------- Actions ----------

function deleteTask(taskId) {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index === -1) return;
    deletedTask = { task: tasks[index], index: index };
    if (editingTaskId === taskId) resetTaskForm(document.querySelector("#task-form"));
    tasks.splice(index, 1);
    saveTasks("Task deleted. You can undo the latest deletion on this page.");
    renderTaskUndo();
}

function undoTaskDeletion() {
    if (!deletedTask) return;
    // Put the task back in the same position it had before.
    tasks.splice(deletedTask.index, 0, deletedTask.task);
    const title = deletedTask.task.title;
    deletedTask = null;
    saveTasks(`Restored: ${title}`);
    renderTaskUndo();
}

function clearTasks(form) {
    if (!window.confirm(`Delete all ${tasks.length} tasks? This cannot be undone.`)) return;
    tasks = [];
    deletedTask = null;
    resetTaskForm(form);
    saveTasks("All tasks cleared.");
    renderTaskUndo();
}

// ---------- Event handlers ----------

function setupTaskFilters() {
    document.querySelector("#task-search").addEventListener("input", renderTasks);
    document.querySelector("#task-category-filter").addEventListener("change", renderTasks);
    document.querySelector("#task-status-filter").addEventListener("change", renderTasks);
    document.querySelector("#favorite-filter").addEventListener("click", (event) => {
        favoritesOnly = !favoritesOnly;
        event.currentTarget.setAttribute("aria-pressed", String(favoritesOnly));
        event.currentTarget.textContent = favoritesOnly ? "Showing favorites" : "Show favorites";
        renderTasks();
    });
}

function setupTaskForm(form) {
    categories.forEach((category) => {
        form.querySelector("#task-list-category").add(new Option(category.label, category.id));
        document.querySelector("#task-category-filter").add(new Option(category.label, category.id));
    });
    resetTaskForm(form);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (validateTaskForm(form)) {
            submitTask(form);
        } else {
            form.querySelector("#task-form-status").textContent = "";
            form.querySelector(".is-invalid").focus();
        }
    });

    form.querySelector("#task-cancel").addEventListener("click", () => {
        resetTaskForm(form);
        announce("Editing cancelled. The task was not changed.");
    });

    // A message disappears as soon as the user starts fixing the field.
    form.querySelectorAll("input, select, textarea").forEach((field) => {
        field.addEventListener("input", () => showFieldError(field, ""));
    });
}

// jQuery: delegated clicks on the task list, with fade and slide effects.
function setupTaskJQuery() {
    const $taskList = $("#task-list");

    // Each group heading opens or closes its list. The list stays closed
    // while the tasks inside it are re-rendered.
    $("[data-task-section] .task-group-toggle").on("click", function () {
        const $toggle = $(this);
        const expanded = $toggle.attr("aria-expanded") === "true";
        $toggle.parent().next(".today-list").slideToggle(200);
        $toggle.attr("aria-expanded", String(!expanded));
    });

    $("#task-form textarea").on("input", updateNotesCounter);

    $taskList.on("change", ".today-check", function () {
        const task = getTaskById($(this).closest(".task-card").attr("data-task-id"));
        task.setCompleted(this.checked);
        saveTasks(task.completed ? `Completed: ${task.title}` : `Reopened: ${task.title}`);
    });

    $taskList.on("click", ".task-favorite", function () {
        const task = getTaskById($(this).closest(".task-card").attr("data-task-id"));
        task.toggleFavorite();
        saveTasks(`${task.favorite ? "Added to" : "Removed from"} favorites: ${task.title}`);
    });

    $taskList.on("click", ".task-edit", function () {
        startEditingTask($(this).closest(".task-card").attr("data-task-id"));
    });

    $taskList.on("click", ".task-delete", function () {
        const $card = $(this).closest(".task-card");
        $card.find("button, input").prop("disabled", true);
        $card.fadeOut(160, () => deleteTask($card.attr("data-task-id")));
    });

    $taskList.on("click", ".task-notes-toggle", function () {
        const $toggle = $(this);
        const expanded = $toggle.attr("aria-expanded") === "true";
        $toggle.closest(".task-card").find(".task-notes").slideToggle(160);
        $toggle.attr("aria-expanded", String(!expanded)).text(expanded ? "Details" : "Hide details");
    });
}

function setupTasks() {
    const form = document.querySelector("#task-form");
    if (!form) return;

    tasks = loadTasks();
    setupTaskFilters();
    setupTaskForm(form);
    setupTaskJQuery();
    document.querySelector("#task-undo").addEventListener("click", undoTaskDeletion);
    document.querySelector("#clear-tasks").addEventListener("click", () => clearTasks(form));
    renderTasks();
}

export { setupTasks, loadTasks };
