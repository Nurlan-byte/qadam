import { STORAGE, getLocalDate, isValidDate, readStorage, writeStorage, escapeHTML } from "./shared.js";
import { eventCategories, eventImages, starterEvents, isValidEvent, normalizeEvent } from "./events-model.js";

let events = null;
let editingEventId = null;
let hasUnsavedChanges = false;
let isSaving = false;

function isValidEventList(saved) {
    return Array.isArray(saved) && saved.every(isValidEvent)
        && new Set(saved.map((event) => event.id)).size === saved.length;
}

function loadEvents() {
    try {
        if (localStorage.getItem(STORAGE.events) === null) return starterEvents.map(normalizeEvent);
    } catch (error) {
        return readStorage(STORAGE.events, [], isValidEventList).map(normalizeEvent);
    }
    return readStorage(STORAGE.events, [], isValidEventList).map(normalizeEvent);
}

function getEvents({ reload = false } = {}) {
    if (events === null || (reload && !hasUnsavedChanges)) events = loadEvents();
    return events.map((event) => ({ ...event }));
}

function getDaysUntil(dateString) {
    if (!isValidDate(dateString)) return null;
    // UTC day indices avoid 23- and 25-hour days at daylight-saving changes.
    const targetDay = Date.parse(`${dateString}T00:00:00Z`);
    const todayDay = Date.parse(`${getLocalDate()}T00:00:00Z`);
    return Math.round((targetDay - todayDay) / 86400000);
}

function updateCountdownLabels() {
    document.querySelectorAll("[data-countdown-date]").forEach((timeElement) => {
        const days = getDaysUntil(timeElement.dateTime);
        const card = timeElement.closest(".countdown-card");
        const number = card?.querySelector(".countdown-value");
        const label = card?.querySelector(".countdown-unit");
        if (!number || !label) return;
        card.classList.toggle("countdown-past", days !== null && days < 0);
        if (days === null) {
            number.textContent = "—";
            label.textContent = "Date unavailable";
        } else if (days === 0) {
            number.textContent = "Today";
            label.textContent = "";
        } else {
            number.textContent = String(Math.abs(days));
            const unit = Math.abs(days) === 1 ? "day" : "days";
            label.textContent = `${unit} ${days > 0 ? "left" : "ago"}`;
        }
    });
}

function renderEventCard(event) {
    const image = eventImages[event.image];
    const title = escapeHTML(event.title);
    const dateLabel = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${event.date}T12:00:00`));
    return `<li class="col-12 col-md-6">
        <article class="card countdown-card h-100" data-event-id="${escapeHTML(event.id)}">
            <img src="${image.path}" alt="${image.alt}" class="countdown-image img-fluid">
            <div class="card-body countdown-content">
                <p class="countdown-category">${eventCategories[event.category]}</p>
                <h3 class="h5">${title}</h3>
                <p class="countdown-days"><strong class="countdown-value"></strong> <span class="countdown-unit"></span></p>
                <p><time datetime="${event.date}" data-countdown-date>${dateLabel}</time></p>
                <p class="countdown-description">${escapeHTML(event.description)}</p>
                <div class="event-actions">
                    <button class="btn btn-outline-light btn-sm" type="button" data-event-action="edit" aria-label="Edit event: ${title}">Edit</button>
                    <button class="btn btn-outline-light btn-sm" type="button" data-event-action="delete" aria-label="Delete event: ${title}">Delete</button>
                </div>
            </div>
        </article>
    </li>`;
}

function renderEvents() {
    const list = document.querySelector("#event-list");
    if (!list) return;
    list.innerHTML = getEvents().map(renderEventCard).join("");
    document.querySelector("#events-empty").hidden = events.length > 0;
    document.querySelector("#event-count").textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
    updateCountdownLabels();
}

function setEventStatus(message) {
    const status = document.querySelector("#event-status");
    if (status) status.textContent = message;
}

function saveEvents(message) {
    isSaving = true;
    const saved = writeStorage(STORAGE.events, events);
    isSaving = false;
    hasUnsavedChanges = !saved;
    renderEvents();
    setEventStatus(saved ? message : `${message} This change could not be saved and will be lost when you reload.`);
}

function showFieldError(field, message) {
    field.classList.toggle("is-invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    document.querySelector(`#${field.id}-error`).textContent = message;
}

function validateEventForm(form) {
    const fields = form.elements;
    const title = fields.title.value.trim();
    const errors = [
        [fields.title, title.length < 3 ? "Enter at least 3 characters." : title.length > 80 ? "Use no more than 80 characters." : ""],
        [fields.date, !isValidDate(fields.date.value) ? "Choose a valid date with a four-digit year." : ""],
        [fields.description, fields.description.value.trim().length > 240 ? "Use no more than 240 characters." : ""],
        [fields.category, !Object.hasOwn(eventCategories, fields.category.value) ? "Choose an event category." : ""],
        [fields.image, !Object.hasOwn(eventImages, fields.image.value) ? "Choose one of the event photos." : ""]
    ];
    errors.forEach(([field, message]) => showFieldError(field, message));
    return errors.every(([, message]) => !message);
}

function resetEventForm() {
    const form = document.querySelector("#event-form");
    editingEventId = null;
    form.reset();
    form.elements.date.value = getLocalDate();
    form.querySelectorAll("input, select, textarea").forEach((field) => showFieldError(field, ""));
    document.querySelector("#event-form-title").textContent = "New event";
    document.querySelector("#event-submit").textContent = "Add event";
    document.querySelector("#event-cancel").hidden = true;
}

function editEvent(id) {
    const event = getEvents({ reload: true }).find((item) => item.id === id);
    if (!event) return;
    resetEventForm();
    editingEventId = event.id;
    const form = document.querySelector("#event-form");
    for (const name of ["title", "date", "description", "category", "image"]) form.elements[name].value = event[name];
    document.querySelector("#event-form-title").textContent = "Edit event";
    document.querySelector("#event-submit").textContent = "Save changes";
    document.querySelector("#event-cancel").hidden = false;
    setEventStatus(`Editing ${event.title}.`);
    form.elements.title.focus();
}

function deleteEvent(id) {
    const current = getEvents({ reload: true });
    const event = current.find((item) => item.id === id);
    if (!event || !window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    events = current.filter((item) => item.id !== id);
    if (editingEventId === id) resetEventForm();
    saveEvents(`Deleted ${event.title}.`);
    document.querySelector("#event-title").focus();
}

function submitEvent(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateEventForm(form)) {
        form.querySelector(".is-invalid")?.focus();
        return;
    }
    const current = getEvents({ reload: true });
    if (editingEventId && !current.some((item) => item.id === editingEventId)) {
        resetEventForm();
        renderEvents();
        setEventStatus("This event was removed in another tab. Add a new event if needed.");
        return;
    }
    const record = { id: editingEventId || `event-${crypto.randomUUID()}` };
    for (const name of ["title", "date", "description", "category", "image"]) record[name] = form.elements[name].value.trim();
    const editing = editingEventId !== null;
    events = editing ? current.map((item) => item.id === record.id ? record : item) : [...current, record];
    resetEventForm();
    saveEvents(editing ? "Event updated." : "Event added.");
    form.elements.title.focus();
}

function refreshEvents() {
    getEvents({ reload: true });
    renderEvents();
}

function setupCountdowns() {
    const list = document.querySelector("#event-list");
    const form = document.querySelector("#event-form");
    if (!list || !form) return;
    refreshEvents();
    resetEventForm();
    form.addEventListener("submit", submitEvent);
    form.querySelectorAll("input, select, textarea").forEach((field) => {
        field.addEventListener("input", () => showFieldError(field, ""));
        field.addEventListener("change", () => showFieldError(field, ""));
    });
    document.querySelector("#event-cancel").addEventListener("click", () => {
        resetEventForm();
        setEventStatus("Editing cancelled. No changes were saved.");
        form.elements.title.focus();
    });
    list.addEventListener("click", (event) => {
        const button = event.target.closest("[data-event-action]");
        const card = button?.closest("[data-event-id]");
        if (!card) return;
        if (button.dataset.eventAction === "edit") editEvent(card.dataset.eventId);
        if (button.dataset.eventAction === "delete") deleteEvent(card.dataset.eventId);
    });
    window.addEventListener("storage", (event) => {
        if (event.key === STORAGE.events || event.key === null) refreshEvents();
    });
    document.addEventListener("qadam:data-changed", (event) => {
        if (event.detail?.key === STORAGE.events && !isSaving) refreshEvents();
    });
    document.addEventListener("qadam:data-restored", () => {
        hasUnsavedChanges = false;
        resetEventForm();
        refreshEvents();
        setEventStatus("Events restored from your backup.");
    });
    window.addEventListener("focus", refreshEvents);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) refreshEvents();
    });
    window.setInterval(updateCountdownLabels, 60000);
}

export { getDaysUntil, setupCountdowns, getEvents, isValidEvent };
