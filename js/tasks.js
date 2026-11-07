import { STORAGE, getLocalDate, readStorage, writeStorage, escapeHTML, announce, formatDate } from "./shared.js";
import { categories, defaultTasks } from "./data.js";

let tasks = loadTasks();
let favoritesOnly = false;

function isValidDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(`${value}T12:00:00`);
    return year > 0 && date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}

function isValidTime(value) {
    return value === "" || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidTask(task) {
    return task && typeof task.id === "string" && /^[a-zA-Z0-9_-]+$/.test(task.id)
        && typeof task.title === "string" && task.title.trim().length >= 3 && task.title.length <= 80
        && isValidDate(task.date) && isValidTime(task.time || "")
        && categories.some((category) => category.id === task.list)
        && (task.notes === undefined || (typeof task.notes === "string" && task.notes.length <= 240));
}

function loadTasks() {
    const stored = readStorage(STORAGE.tasks, defaultTasks);
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

function addTask(form) {
    const formData = new FormData(form);
    tasks.push({
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: String(formData.get("title")).trim(),
        date: String(formData.get("date")),
        time: String(formData.get("time") || ""),
        list: String(formData.get("list")),
        notes: String(formData.get("notes") || "").trim(),
        completed: false,
        favorite: false
    });
    const saved = saveTasks("Task added.");
    form.reset();
    form.querySelector("#task-date").value = getLocalDate();
    form.querySelector("#task-form-status").textContent = saved
        ? "Task added and saved in this browser."
        : "Task added for this visit. Your browser could not save it.";
    form.querySelector("#task-title").focus();
}

function setupTaskForm(form) {
    form.querySelector("#task-date").value = getLocalDate();
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
        addTask(form);
    });
}

function toggleFavorite(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    task.favorite = !task.favorite;
    saveTasks(`${task.favorite ? "Added to" : "Removed from"} favorites: ${task.title}`);
}

function deleteTask(taskId) {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks("Task deleted.");
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
        $card.find("button, input").prop("disabled", true);
        $card.fadeOut(160, () => deleteTask(taskId));
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

export { setupTasks };
