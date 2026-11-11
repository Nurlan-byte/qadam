import { addDays, isValidDate } from "./shared.js";

const habitPeriods = ["Morning", "Afternoon", "Evening"];

// Checks a plain record (from localStorage or a backup file) before it becomes a Habit.
function isValidHabit(data) {
    if (!data || typeof data !== "object") return false;
    if (typeof data.id !== "string" || data.id === "") return false;
    if (typeof data.title !== "string" || data.title.trim() === "" || data.title.length > 80) return false;
    return habitPeriods.includes(data.period);
}

class Habit {
    constructor(data) {
        this.id = data.id;
        this.title = data.title.trim();
        this.period = data.period;
        // Dates of check-ins as sorted "YYYY-MM-DD" strings without repeats.
        this.dates = [];
        if (Array.isArray(data.dates)) {
            for (const date of data.dates) {
                if (isValidDate(date) && !this.dates.includes(date)) this.dates.push(date);
            }
            this.dates.sort();
        }
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
