import { getLocalDate, addDays } from "./shared.js";

const categories = [
    { id: "study", label: "Study" },
    { id: "project", label: "Project" },
    { id: "personal", label: "Personal" },
    { id: "health", label: "Health" }
];

const today = getLocalDate();
const tomorrow = addDays(today, 1);
const defaultTasks = [
    { id: "task-brief", title: "Review the DAA assignment brief", date: today, time: "09:00", list: "study", notes: "Write down the submission checklist.", completed: false, favorite: true },
    { id: "task-qadam", title: "Polish the Qadam task page", date: today, time: "11:00", list: "project", notes: "Check the task form on a narrow screen.", completed: false, favorite: false },
    { id: "task-reading", title: "Read 20 pages", date: tomorrow, time: "19:00", list: "personal", notes: "Continue the current book.", completed: false, favorite: false },
    { id: "task-run", title: "Morning run, 3 km", date: today, time: "07:15", list: "health", notes: "", completed: true, favorite: false }
];

const defaultHabits = [
    { id: "habit-water", title: "Drink a glass of water", period: "Morning", streak: 0, lastDoneDate: "", dates: [] },
    { id: "habit-stretch", title: "Stretch for five minutes", period: "Afternoon", streak: 0, lastDoneDate: "", dates: [] },
    { id: "habit-read", title: "Read 20 pages", period: "Evening", streak: 0, lastDoneDate: "", dates: [] }
];

export { categories, defaultTasks, defaultHabits };
