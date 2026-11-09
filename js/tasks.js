import { STORAGE, getLocalDate, isValidDate, readStorage, writeStorage, escapeHTML, announce, formatDate } from "./shared.js";
import { categories, defaultTasks } from "./data.js";

let tasks = loadTasks();
let favoritesOnly = false;
let editingTaskId = null;
let deletedTask = null;
let taskChangeRevision = 0;

function isValidTime(value) {
    return value === "" || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidTask(task) {
    return Boolean(task && typeof task.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(task.id)
        && typeof task.title === "string" && task.title.trim().length >= 3 && task.title.length <= 80
        && isValidDate(task.date) && typeof task.time === "string" && isValidTime(task.time)
        && categories.some((category) => category.id === task.list)
        && typeof task.notes === "string" && task.notes.length <= 240
        && typeof task.completed === "boolean" && typeof task.favorite === "boolean");
}

function loadTasks() {
    const stored = readStorage(STORAGE.tasks, defaultTasks, Array.isArray);
    if (!Array.isArray(stored)) return defaultTasks.map((task) => ({ ...task }));
    const ids = new Set();
    return stored.filter((task) => {
        if (!isValidTask(task) || ids.has(task.id)) return false;
        ids.add(task.id);
        return true;
    }).map((task) => ({
        ...task,
        title: task.title.trim(),
        time: task.time || "",
        notes: task.notes || "",
        completed: task.completed === true,
        favorite: task.favorite === true
    }));
}

function saveTasks(message) {
    const saved = writeStorage(STORAGE.tasks, tasks);
    renderTasks();
    announce(saved === false ? `${message} This change could not be saved in your browser.` : message);
    return saved !== false;
}

function getTasks({ reload = false } = {}) {
    if (reload) tasks = loadTasks();
    return tasks.map((task) => ({ ...task }));
}

function getTaskById(taskId) {
    return tasks.find((task) => task.id === taskId);
}

function getCategoryLabel(categoryId) {
    const category = categories.find((item) => item.id === categoryId);
    return category ? category.label : "Other";
}

function populateCategoryFilters() {
    const formSelect = document.querySelector("#task-list-category");
    const filterSelect = document.querySelector("#task-category-filter");

    categories.forEach((category) => {
        if (formSelect) formSelect.add(new Option(category.label, category.id));
        if (filterSelect) filterSelect.add(new Option(category.label, category.id));
    });
}

function getVisibleTasks() {
    const search = (document.querySelector("#task-search")?.value || "").trim().toLowerCase();
    const categoryId = document.querySelector("#task-category-filter")?.value || "all";
    const status = document.querySelector("#task-status-filter")?.value || "all";

    return tasks.filter((task) => {
        const matchesSearch = `${task.title} ${task.notes || ""} ${getCategoryLabel(task.list)}`.toLowerCase().includes(search);
        const matchesCategory = categoryId === "all" || task.list === categoryId;
        const matchesStatus = status === "all" || (status === "completed" ? task.completed : !task.completed);
        return matchesSearch && matchesCategory && matchesStatus && (!favoritesOnly || task.favorite);
    });
}

function renderTaskCard(task) {
    const id = escapeHTML(task.id);
    const title = escapeHTML(task.title);
    const notes = escapeHTML(task.notes || "");
    const category = escapeHTML(getCategoryLabel(task.list));
    const isDone = Boolean(task.completed);
    const isFavorite = Boolean(task.favorite);
    const timeMarkup = task.time
        ? `<time class="today-time" datetime="${escapeHTML(task.date)}T${escapeHTML(task.time)}">${escapeHTML(task.time)}</time>`
        : `<time class="today-time" datetime="${escapeHTML(task.date)}">${escapeHTML(formatDate(task.date))}</time>`;
    const notesMarkup = notes
        ? `<button class="task-notes-toggle" type="button" aria-expanded="false" aria-controls="task-notes-${id}">Details</button><p class="task-notes" id="task-notes-${id}">${notes}</p>`
        : "";

    return `<li class="today-task task-card${isDone ? " today-task-done" : ""}${isFavorite ? " task-card-favorite" : ""}" data-task-id="${id}">
        <input class="form-check-input today-check" type="checkbox" id="complete-${id}" data-action="complete" ${isDone ? "checked" : ""}>
        <label class="today-task-title" for="complete-${id}">${title}</label>
        <span class="today-tag">${category}</span>
        ${timeMarkup}
        <div class="task-actions">
            <button class="task-favorite" type="button" data-action="favorite" aria-pressed="${isFavorite}" aria-label="${isFavorite ? "Remove from" : "Add to"} favorites: ${title}"><span class="task-favorite-icon" aria-hidden="true">${isFavorite ? "★" : "☆"}</span></button>
            <button class="task-edit btn btn-sm btn-outline-light" type="button" aria-label="Edit task: ${title}">Edit</button>
            <button class="task-delete" type="button" aria-label="Delete task: ${title}">Delete</button>
        </div>
        ${notesMarkup}
    </li>`;
}

function renderTasks() {
    const list = document.querySelector("#task-list");
    if (!list) return;

    const currentDate = getLocalDate();
    const visibleTasks = getVisibleTasks();
    const groups = { overdue: [], today: [], upcoming: [], completed: [] };

    for (const task of visibleTasks) {
        if (task.completed) groups.completed.push(task);
        else if (task.date < currentDate) groups.overdue.push(task);
        else if (task.date === currentDate) groups.today.push(task);
        else groups.upcoming.push(task);
    }

    for (const [groupName, groupTasks] of Object.entries(groups)) {
        const section = document.querySelector(`[data-task-section="${groupName}"]`);
        const groupList = section?.querySelector(".today-list");
        const count = section?.querySelector(".today-count");
        if (!section || !groupList) continue;
        groupTasks.sort((first, second) => first.date.localeCompare(second.date) || (first.time || "").localeCompare(second.time || ""));
        groupList.innerHTML = groupTasks.map(renderTaskCard).join("");
        if (count) count.textContent = String(groupTasks.length);
        section.hidden = groupTasks.length === 0;
    }

    const clearButton = document.querySelector("#clear-tasks");
    if (clearButton) clearButton.disabled = tasks.length === 0;
    const emptyMessage = document.querySelector("#task-empty");
    if (emptyMessage) emptyMessage.hidden = visibleTasks.length > 0;
    const openCount = tasks.filter((task) => !task.completed).length;
    const completedCount = tasks.length - openCount;
    const summary = document.querySelector("#task-summary");
    if (summary) summary.textContent = `${openCount} open · ${completedCount} completed`;
    const todayLabel = document.querySelector("#today-date");
    if (todayLabel) {
        todayLabel.dateTime = currentDate;
        todayLabel.textContent = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${currentDate}T12:00:00`));
    }
}

function showFieldError(field, message) {
    const error = document.querySelector(`[data-error-for="${field.id}"]`);
    field.classList.toggle("is-invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    if (error) error.textContent = message;
}

function validateTaskForm(form) {
    const title = form.querySelector("#task-title");
    const date = form.querySelector("#task-date");
    const time = form.querySelector("#task-time");
    const list = form.querySelector("#task-list-category");
    const notes = form.querySelector("#task-notes");
    const errors = [
        [title, title.value.trim().length < 3 ? "Enter at least 3 characters." : title.value.trim().length > 80 ? "Use no more than 80 characters." : ""],
        [date, !date.value ? "Choose a due date." : !isValidDate(date.value) ? "Enter a valid date with a four-digit year." : ""],
        [time, time.validity.badInput || !isValidTime(time.value) ? "Enter a valid time." : ""],
        [list, !categories.some((category) => category.id === list.value) ? "Choose a task list." : ""],
        [notes, notes.value.trim().length > 240 ? "Use no more than 240 characters." : ""]
    ];
    errors.forEach(([field, message]) => showFieldError(field, message));
    return errors.every(([, message]) => !message);
}

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

function readTaskForm(form) {
    const data = new FormData(form);
    return {
        title: String(data.get("title")).trim(),
        date: String(data.get("date")),
        time: String(data.get("time") || ""),
        list: String(data.get("list")),
        notes: String(data.get("notes") || "").trim()
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
}

function startEditingTask(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    const form = document.querySelector("#task-form");
    resetTaskForm(form);
    editingTaskId = taskId;
    for (const name of ["title", "date", "time", "list", "notes"]) {
        form.elements.namedItem(name).value = task[name];
    }
    document.querySelector("#today-form-title").textContent = "Edit task";
    form.querySelector("#task-submit").textContent = "Save changes";
    form.querySelector("#task-cancel").hidden = false;
    form.querySelector("#task-title").focus();
    announce(`Editing: ${task.title}`);
}

function submitTask(form) {
    const values = readTaskForm(form);
    const isEditing = editingTaskId !== null;
    if (isEditing) {
        const task = getTaskById(editingTaskId);
        if (!task) {
            resetTaskForm(form);
            announce("That task no longer exists. You can add a new task.");
            return;
        }
        Object.assign(task, values);
    } else {
        tasks.push({
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...values,
            completed: false,
            favorite: false
        });
    }
    const message = isEditing ? "Task updated." : "Task added.";
    const saved = saveTasks(message);
    resetTaskForm(form);
    form.querySelector("#task-form-status").textContent = saved
        ? `${message} Saved in this browser.`
        : `${message} Your browser could not save this change.`;
    form.querySelector("#task-title").focus();
}

function setupTaskForm(form) {
    resetTaskForm(form);
    form.querySelector("#task-cancel").addEventListener("click", () => {
        resetTaskForm(form);
        announce("Editing cancelled. The task was not changed.");
        form.querySelector("#task-title").focus();
    });
    form.querySelectorAll("input, select, textarea").forEach((field) => {
        const clearError = () => {
            showFieldError(field, "");
            form.querySelector("#task-form-status").textContent = "";
        };
        field.addEventListener("input", clearError);
        field.addEventListener("change", clearError);
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateTaskForm(form)) {
            form.querySelector("#task-form-status").textContent = "";
            form.querySelector(".is-invalid")?.focus();
            return;
        }
        submitTask(form);
    });
}

function toggleFavorite(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    task.favorite = !task.favorite;
    saveTasks(`${task.favorite ? "Added to" : "Removed from"} favorites: ${task.title}`);
}

function renderTaskUndo() {
    const panel = document.querySelector("#task-undo-panel");
    if (!panel) return;
    panel.hidden = !deletedTask;
    document.querySelector("#task-undo-message").textContent = deletedTask
        ? `Deleted "${deletedTask.task.title}". Undo is available on this page.`
        : "";
}

function invalidateTaskUndo() {
    deletedTask = null;
    taskChangeRevision += 1;
    renderTaskUndo();
}

function deleteTask(taskId) {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index === -1) return;
    deletedTask = { task: { ...tasks[index] }, index };
    if (editingTaskId === taskId) resetTaskForm(document.querySelector("#task-form"));
    tasks.splice(index, 1);
    saveTasks("Task deleted. You can undo the latest deletion on this page.");
    renderTaskUndo();
    document.querySelector("#task-undo")?.focus();
}

function undoTaskDeletion() {
    if (!deletedTask) return;
    const { task, index } = deletedTask;
    invalidateTaskUndo();
    if (getTaskById(task.id)) {
        announce("That task already exists. No existing task was overwritten.");
        return;
    }
    tasks.splice(Math.min(index, tasks.length), 0, task);
    saveTasks(`Restored: ${task.title}`);
    const checkbox = document.getElementById(`complete-${task.id}`);
    (checkbox || document.querySelector("#task-title"))?.focus();
}

function setupTaskEditing(list, form) {
    list.addEventListener("click", (event) => {
        const button = event.target.closest(".task-edit");
        if (button) startEditingTask(button.closest("[data-task-id]").dataset.taskId);
    });
    document.querySelector("#clear-tasks").addEventListener("click", () => {
        if (!tasks.length || !window.confirm(`Delete all ${tasks.length} tasks? This cannot be undone.`)) return;
        invalidateTaskUndo();
        tasks = [];
        resetTaskForm(form);
        saveTasks("All tasks cleared.");
    });
    window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE.tasks && event.key !== null) return;
        invalidateTaskUndo();
        tasks = loadTasks();
        if (editingTaskId && !getTaskById(editingTaskId)) resetTaskForm(form);
        renderTasks();
        announce("Tasks updated from another tab. Any pending undo was cleared.");
    });
    document.querySelector("#task-undo").addEventListener("click", undoTaskDeletion);
    document.addEventListener("qadam:data-restored", () => {
        invalidateTaskUndo();
        tasks = loadTasks();
        resetTaskForm(form);
        renderTasks();
    });
}

function setupNativeTaskActions(list) {
    list.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        const card = button?.closest("[data-task-id]");
        if (!card) return;
        if (button.matches(".task-favorite")) toggleFavorite(card.dataset.taskId);
        if (button.matches(".task-delete")) deleteTask(card.dataset.taskId);
        if (button.matches(".task-notes-toggle")) {
            const expanded = button.getAttribute("aria-expanded") === "true";
            card.querySelector(".task-notes").style.display = expanded ? "none" : "block";
            button.setAttribute("aria-expanded", String(!expanded));
            button.textContent = expanded ? "Details" : "Hide details";
        }
    });
}

function setupTasks() {
    const form = document.querySelector("#task-form");
    const list = document.querySelector("#task-list");
    if (!form || !list) return;

    populateCategoryFilters();
    setupTaskFilters();
    setupTaskForm(form);
    setupTaskEditing(list, form);
    renderTasks();
    list.addEventListener("change", (event) => {
        const checkbox = event.target.closest('[data-action="complete"]');
        if (!checkbox) return;
        const task = getTaskById(checkbox.closest("[data-task-id]").dataset.taskId);
        if (!task) return;
        task.completed = checkbox.checked;
        saveTasks(task.completed ? `Completed: ${task.title}` : `Reopened: ${task.title}`);
    });
    if (window.jQuery) setupTaskJQuery();
    else setupNativeTaskActions(list);
}

function setupTaskJQuery() {
    const $ = window.jQuery;
    const $taskList = $("#task-list");

    $taskList.on("click", ".task-favorite", function (event) {
        event.preventDefault();
        const $card = $(this).closest(".task-card");
        const task = getTaskById($card.attr("data-task-id"));
        if (!task) return;
        task.favorite = !task.favorite;
        $card.find(".task-favorite-icon").text(task.favorite ? "★" : "☆");
        saveTasks(`${task.favorite ? "Added to" : "Removed from"} favorites: ${task.title}`);
    });

    $taskList.on("click", ".task-delete", function (event) {
        event.preventDefault();
        const $card = $(this).closest(".task-card");
        const taskId = $card.attr("data-task-id");
        const revision = taskChangeRevision;
        $card.find("button, input").prop("disabled", true);
        $card.fadeOut(160, () => {
            if (revision === taskChangeRevision) deleteTask(taskId);
            else renderTasks();
        });
    });

    $taskList.on("click", ".task-notes-toggle", function (event) {
        event.preventDefault();
        const $toggle = $(this);
        const $details = $toggle.closest(".task-card").find(".task-notes");
        const expanded = $toggle.attr("aria-expanded") === "true";
        $details.stop(true, true).slideToggle(160);
        $toggle.attr("aria-expanded", String(!expanded)).text(expanded ? "Details" : "Hide details");
    });
}

export { setupTasks, getTasks, getCategoryLabel, isValidTask };
