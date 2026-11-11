import { isValidDate } from "./shared.js";
import { categories } from "./data.js";

function isValidTime(value) {
    return value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getCategoryLabel(categoryId) {
    const category = categories.find((item) => item.id === categoryId);
    return category ? category.label : "Other";
}

// Checks a plain record (from localStorage or a backup file) before it becomes a Task.
function isValidTask(data) {
    if (!data || typeof data !== "object") return false;
    if (typeof data.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.id)) return false;
    if (typeof data.title !== "string" || data.title.trim().length < 3 || data.title.length > 80) return false;
    if (!isValidDate(data.date)) return false;
    if (typeof data.time !== "string" || !isValidTime(data.time)) return false;
    if (!categories.some((category) => category.id === data.list)) return false;
    if (typeof data.notes !== "string" || data.notes.length > 240) return false;
    return typeof data.completed === "boolean" && typeof data.favorite === "boolean";
}

class Task {
    constructor(data) {
        this.id = data.id;
        this.title = data.title.trim();
        this.date = data.date;
        this.time = data.time || "";
        this.list = data.list;
        this.notes = data.notes || "";
        this.completed = data.completed === true;
        this.favorite = data.favorite === true;
    }

    setCompleted(completed) {
        this.completed = completed;
    }

    toggleFavorite() {
        this.favorite = !this.favorite;
    }

    // Changes the editable fields and keeps the id, completed and favorite flags.
    update(values) {
        this.title = values.title;
        this.date = values.date;
        this.time = values.time;
        this.list = values.list;
        this.notes = values.notes;
    }

    getCategoryLabel() {
        return getCategoryLabel(this.list);
    }

    // Which section of the Today page the task belongs to.
    getGroup(today) {
        if (this.completed) return "completed";
        if (this.date < today) return "overdue";
        if (this.date === today) return "today";
        return "upcoming";
    }

    isOverdue(today) {
        return this.getGroup(today) === "overdue";
    }

    matchesSearch(text) {
        const content = `${this.title} ${this.notes} ${this.getCategoryLabel()}`.toLowerCase();
        return content.includes(text.toLowerCase());
    }

    matchesFilters(categoryId, status) {
        const categoryMatches = categoryId === "all" || this.list === categoryId;
        let statusMatches = true;
        if (status === "completed") statusMatches = this.completed;
        if (status === "open") statusMatches = !this.completed;
        return categoryMatches && statusMatches;
    }
}

export { Task, isValidTask, isValidTime, getCategoryLabel };
