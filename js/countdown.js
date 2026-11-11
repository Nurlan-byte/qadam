import { STORAGE, getLocalDate, isValidDate, readStorage, writeStorage, escapeHTML, makeId } from "./shared.js";
import { CountdownEvent, eventCategories, eventImages, starterEvents, isValidEvent } from "./events-model.js";

let events = [];
let editingEventId = null;

// ---------- Data ----------

// Reads saved records and turns every valid one into a CountdownEvent object.
// Starter events are used only until the user saves a list of their own.
function loadEvents() {
    const saved = readStorage(STORAGE.events, starterEvents);
    const records = Array.isArray(saved) ? saved : starterEvents;
    return records.filter(isValidEvent).map((record) => new CountdownEvent(record));
}

function saveEvents(message) {
    const saved = writeStorage(STORAGE.events, events);
    renderEvents();
    setEventStatus(saved ? message : `${message} This change could not be saved and will be lost when you reload.`);
}

function getEventById(eventId) {
    return events.find((event) => event.id === eventId);
}

// ---------- Rendering ----------

function renderEventCard(event) {
    const image = event.getImage();
    const title = escapeHTML(event.title);
    const countdown = event.getCountdownText();
    return `<li class="col-12 col-md-6">
        <article class="card countdown-card h-100${event.isPast() ? " countdown-past" : ""}" data-event-id="${escapeHTML(event.id)}">
            <img src="${image.path}" alt="${image.alt}" class="countdown-image img-fluid">
            <div class="card-body countdown-content">
                <p class="countdown-category">${event.getCategoryLabel()}</p>
                <h3 class="h5">${title}</h3>
                <p class="countdown-days"><strong class="countdown-value">${countdown.value}</strong> <span class="countdown-unit">${countdown.unit}</span></p>
                <p><time datetime="${event.date}">${event.getDateLabel()}</time></p>
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
    document.querySelector("#event-list").innerHTML = events.map(renderEventCard).join("");
    document.querySelector("#events-empty").hidden = events.length > 0;
    document.querySelector("#event-count").textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
}

function setEventStatus(message) {
    document.querySelector("#event-status").textContent = message;
}

// ---------- Form and validation ----------

function showFieldError(field, message) {
    field.classList.toggle("is-invalid", message !== "");
    field.setAttribute("aria-invalid", String(message !== ""));
    document.querySelector(`#${field.id}-error`).textContent = message;
}

function getTitleError(title) {
    if (title.length < 3) return "Enter at least 3 characters.";
    if (title.length > 80) return "Use no more than 80 characters.";
    return "";
}

function validateEventForm(form) {
    const fields = form.elements;
    const errors = [
        [fields.title, getTitleError(fields.title.value.trim())],
        [fields.date, isValidDate(fields.date.value) ? "" : "Choose a valid date with a four-digit year."],
        [fields.description, fields.description.value.trim().length > 240 ? "Use no more than 240 characters." : ""],
        [fields.category, Object.keys(eventCategories).includes(fields.category.value) ? "" : "Choose an event category."],
        [fields.image, Object.keys(eventImages).includes(fields.image.value) ? "" : "Choose one of the event photos."]
    ];

    let valid = true;
    for (const [field, message] of errors) {
        showFieldError(field, message);
        if (message) valid = false;
    }
    return valid;
}

function readEventForm(form) {
    return {
        title: form.elements.title.value.trim(),
        date: form.elements.date.value,
        description: form.elements.description.value.trim(),
        category: form.elements.category.value,
        image: form.elements.image.value
    };
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

// ---------- Actions ----------

function editEvent(eventId) {
    const event = getEventById(eventId);
    if (!event) return;
    resetEventForm();
    editingEventId = eventId;
    const form = document.querySelector("#event-form");
    form.elements.title.value = event.title;
    form.elements.date.value = event.date;
    form.elements.description.value = event.description;
    form.elements.category.value = event.category;
    form.elements.image.value = event.image;
    document.querySelector("#event-form-title").textContent = "Edit event";
    document.querySelector("#event-submit").textContent = "Save changes";
    document.querySelector("#event-cancel").hidden = false;
    setEventStatus(`Editing ${event.title}.`);
    form.elements.title.focus();
}

function deleteEvent(eventId) {
    const event = getEventById(eventId);
    if (!event || !window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    events = events.filter((item) => item.id !== eventId);
    if (editingEventId === eventId) resetEventForm();
    saveEvents(`Deleted ${event.title}.`);
}

function submitEvent(submitEventObject) {
    submitEventObject.preventDefault();
    const form = submitEventObject.currentTarget;
    if (!validateEventForm(form)) {
        form.querySelector(".is-invalid").focus();
        return;
    }

    const values = readEventForm(form);
    const event = getEventById(editingEventId);
    let message = "Event added.";
    if (event) {
        event.update(values);
        message = "Event updated.";
    } else {
        events.push(new CountdownEvent({ id: makeId("event"), ...values }));
    }
    resetEventForm();
    saveEvents(message);
    form.elements.title.focus();
}

function setupCountdowns() {
    const list = document.querySelector("#event-list");
    const form = document.querySelector("#event-form");
    if (!list || !form) return;

    events = loadEvents();
    renderEvents();
    resetEventForm();

    form.addEventListener("submit", submitEvent);
    form.querySelectorAll("input, select, textarea").forEach((field) => {
        field.addEventListener("input", () => showFieldError(field, ""));
    });
    document.querySelector("#event-cancel").addEventListener("click", () => {
        resetEventForm();
        setEventStatus("Editing cancelled. No changes were saved.");
    });

    // One listener on the list handles the buttons of every card.
    list.addEventListener("click", (event) => {
        const button = event.target.closest("[data-event-action]");
        if (!button) return;
        const eventId = button.closest("[data-event-id]").dataset.eventId;
        if (button.dataset.eventAction === "edit") editEvent(eventId);
        else deleteEvent(eventId);
    });

    // Refresh the "days left" numbers in case the page stays open past midnight.
    window.setInterval(renderEvents, 60000);
}

export { setupCountdowns, loadEvents };
