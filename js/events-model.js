import { getLocalDate, addDays, isValidDate } from "./shared.js";

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

// Starter events are dated from today, so a new visitor always sees upcoming events.
const today = getLocalDate();
const starterEvents = [
    { id: "event-review", title: "Team review", date: addDays(today, 3), description: "Check all pages together before submission.", category: "teamwork", image: "team" },
    { id: "event-submission", title: "Project submission", date: addDays(today, 8), description: "Submit the Qadam project on Moodle.", category: "study", image: "study" },
    { id: "event-trip", title: "Weekend trip", date: addDays(today, 14), description: "Take a break and spend time outdoors.", category: "personal", image: "trip" }
];

// Checks a plain record (from localStorage or a backup file) before it becomes a CountdownEvent.
function isValidEvent(data) {
    if (!data || typeof data !== "object") return false;
    if (typeof data.id !== "string" || data.id === "") return false;
    if (typeof data.title !== "string" || data.title.trim().length < 3 || data.title.length > 80) return false;
    if (!isValidDate(data.date)) return false;
    if (typeof data.description !== "string" || data.description.length > 240) return false;
    return Object.keys(eventCategories).includes(data.category) && Object.keys(eventImages).includes(data.image);
}

class CountdownEvent {
    constructor(data) {
        this.id = data.id;
        this.title = data.title.trim();
        this.date = data.date;
        this.description = data.description.trim();
        this.category = data.category;
        this.image = data.image;
    }

    // Whole days from today to the event: negative when the event has passed.
    getDaysLeft(today = getLocalDate()) {
        const eventDay = new Date(`${this.date}T12:00:00`);
        const currentDay = new Date(`${today}T12:00:00`);
        return Math.round((eventDay - currentDay) / 86400000);
    }

    isPast() {
        return this.getDaysLeft() < 0;
    }

    // The big value and the small unit shown on the card, for example "8" and "days left".
    getCountdownText() {
        const days = this.getDaysLeft();
        if (days === 0) return { value: "Today", unit: "" };
        const unit = Math.abs(days) === 1 ? "day" : "days";
        return { value: String(Math.abs(days)), unit: `${unit} ${days > 0 ? "left" : "ago"}` };
    }

    getDateLabel() {
        return new Date(`${this.date}T12:00:00`).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
    }

    getCategoryLabel() {
        return eventCategories[this.category];
    }

    getImage() {
        return eventImages[this.image];
    }

    update(values) {
        this.title = values.title;
        this.date = values.date;
        this.description = values.description;
        this.category = values.category;
        this.image = values.image;
    }
}

export { CountdownEvent, eventCategories, eventImages, starterEvents, isValidEvent };
