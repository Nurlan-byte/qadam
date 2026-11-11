import { isValidDate } from "./shared.js";

const eventCategories = {
    study: "Study",
    teamwork: "Teamwork",
    personal: "Personal"
};

const eventImages = {
    study: { path: "images/countdown-study.jpg", alt: "Open books on a study desk" },
    team: { path: "images/countdown-team.jpg", alt: "Team working together with laptops" },
    trip: { path: "images/countdown-trip.jpg", alt: "Mountain landscape for an outdoor trip" }
};

const starterEvents = [
    { id: "event-submission", title: "Midterm submission", date: "2026-10-14", description: "Submit the Qadam project on Moodle.", category: "study", image: "study" },
    { id: "event-review", title: "Team review", date: "2026-10-09", description: "Check all pages together before submission.", category: "teamwork", image: "team" },
    { id: "event-trip", title: "Weekend trip", date: "2026-10-17", description: "Take a break and spend time outdoors.", category: "personal", image: "trip" }
];

function isValidEvent(event) {
    return Boolean(event && typeof event === "object" && !Array.isArray(event)
        && typeof event.id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(event.id)
        && typeof event.title === "string" && event.title.trim().length >= 3 && event.title.length <= 80
        && isValidDate(event.date)
        && typeof event.description === "string" && event.description.length <= 240
        && typeof event.category === "string" && Object.hasOwn(eventCategories, event.category)
        && typeof event.image === "string" && Object.hasOwn(eventImages, event.image));
}

function normalizeEvent(event) {
    return {
        id: event.id,
        title: event.title.trim(),
        date: event.date,
        description: event.description.trim(),
        category: event.category,
        image: event.image
    };
}

export { eventCategories, eventImages, starterEvents, isValidEvent, normalizeEvent };
