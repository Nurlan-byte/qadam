import { addDays, getLocalDate, isValidDate } from "./shared.js";

const habitPeriods = ["Morning", "Afternoon", "Evening"];

// Checks a plain record (from localStorage or a backup file) before it becomes a Habit.
function isValidHabit(data) {
    if (!data || typeof data !== "object") return false;
    if (typeof data.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.id)) return false;
    if (typeof data.title !== "string" || data.title.trim() === "" || data.title.length > 80) return false;
    if (!habitPeriods.includes(data.period)) return false;
    const validDate = (date) => isValidDate(date) && date <= getLocalDate();
    if (data.dates !== undefined && (!Array.isArray(data.dates)
        || !data.dates.every(validDate) || new Set(data.dates).size !== data.dates.length)) return false;
    if (data.streak !== undefined && (!Number.isSafeInteger(data.streak) || data.streak < 0)) return false;
    if (data.lastDoneDate !== undefined && data.lastDoneDate !== "" && !validDate(data.lastDoneDate)) return false;
    if (data.previousDoneDate !== undefined && data.previousDoneDate !== "" && !validDate(data.previousDoneDate)) return false;
    if (data.previousStreak !== undefined && (!Number.isSafeInteger(data.previousStreak) || data.previousStreak < 0)) return false;
    const legacy = data.legacyStreak;
    if (legacy !== undefined && legacy !== null
        && (!validDate(legacy.date) || !Number.isSafeInteger(legacy.count) || legacy.count < 1)) return false;
    // Backups may contain the current dates array or the original streak fields.
    return Array.isArray(data.dates)
        || (Number.isSafeInteger(data.streak) && typeof data.lastDoneDate === "string");
}

class Habit {
    constructor(data) {
        this.id = data.id;
        this.title = data.title.trim();
        this.period = data.period;
        // Dates of check-ins as sorted "YYYY-MM-DD" strings without repeats.
        this.dates = [];
        const hasHistory = Array.isArray(data.dates);
        const knownDates = hasHistory ? data.dates : [data.lastDoneDate, data.previousDoneDate];
        const today = getLocalDate();
        for (const date of knownDates) {
            if (isValidDate(date) && date <= today && !this.dates.includes(date)) this.dates.push(date);
        }
        this.dates.sort();
        // Keep an older streak total without guessing the dates behind it.
        this.legacyStreak = hasHistory ? data.legacyStreak || null : null;
        if (!hasHistory && this.dates.length) {
            const hasPrevious = this.dates.includes(data.previousDoneDate)
                && Number.isSafeInteger(data.previousStreak) && data.previousStreak > 0;
            this.legacyStreak = hasPrevious
                ? { date: data.previousDoneDate, count: data.previousStreak }
                : { date: data.lastDoneDate, count: data.streak };
        }
        const legacy = this.legacyStreak;
        if (!legacy || !isValidDate(legacy.date) || legacy.date > today
            || !Number.isSafeInteger(legacy.count) || legacy.count < 1) this.legacyStreak = null;
    }

    isDoneOn(date) {
        return this.dates.includes(date);
    }

    setDone(date, done) {
        this.dates = this.dates.filter((item) => item !== date);
        if (done) {
            this.dates.push(date);
            this.dates.sort();
        }
    }

    rename(title, period) {
        this.title = title;
        this.period = period;
    }

    // Days in a row up to today. A habit not yet done today keeps yesterday's streak.
    getStreak(today) {
        let date = this.isDoneOn(today) ? today : addDays(today, -1);
        let streak = 0;
        while (this.isDoneOn(date)) {
            if (this.legacyStreak && this.legacyStreak.date === date) return streak + this.legacyStreak.count;
            streak += 1;
            date = addDays(date, -1);
        }
        return streak;
    }

    // The longest run of days in a row in the whole recorded history.
    getLongestRun() {
        let longest = 0;
        let run = 0;
        let previous = "";
        for (const date of this.dates) {
            run = previous !== "" && date === addDays(previous, 1) ? run + 1 : 1;
            if (run > longest) longest = run;
            previous = date;
        }
        return longest;
    }
}

export { Habit, habitPeriods, isValidHabit };
