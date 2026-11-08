import { setupCalendar } from "./calendar.js";
import { setupStatistics } from "./statistics.js";
import { setupWeather } from "./weather.js";
import { setupTheme } from "./theme.js";
import { setupTasks } from "./tasks.js";
import { setupHabits } from "./habits.js";
import { setupCountdowns } from "./countdown.js";
import { setupFocusTimer } from "./focus.js";

setupTheme();
setupTasks();
setupHabits();
setupCountdowns();
setupFocusTimer();

setupWeather();
setupCalendar();

setupStatistics();
