# Qadam

Qadam is a responsive task and habit tracker for Web Technologies 1, built with plain HTML, CSS, Bootstrap, JavaScript modules and jQuery.

[Live site](https://nurlan-byte.github.io/qadam/) · [Repository](https://github.com/Nurlan-byte/qadam)

## Run locally

From the repository directory run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. No build step or package installation is needed. Use an HTTP server because JavaScript modules do not load from `file://` URLs. Internet access is needed for the Bootstrap, Bootstrap Icons, Google Fonts and jQuery CDNs, and for the weather service.

## Pages

| Page | Purpose |
| --- | --- |
| Home | Overview and navigation |
| Today | Create, read, edit and delete tasks; search, filters, favorites and daily habit check-ins |
| Calendar | Month calendar of saved tasks, selected-day tasks and a live five-day weather forecast |
| Habits | Create, edit and delete habits; daily check-ins, the current week and 28 days of history |
| Focus | A saved 25-minute timer that continues after a reload; completed-session totals |
| Countdown | Create, edit and delete dated events with a days-left countdown |
| Statistics | Task and focus charts; JSON backup export and import |

Calendar reads the same saved tasks as Today. Habits and Today share the same check-ins, and Statistics is calculated from the same saved data.

## Features

1. **Weather API:** five-day forecasts for Almaty, Astana and Shymkent with loading, success, empty and error states and a refresh button.
2. **Object-oriented JavaScript:** five classes hold the application data and its logic: `Task`, `Habit`, `CountdownEvent`, `FocusTimer` and `ForecastDay` (see [Classes](#classes)).
3. **Full CRUD:** tasks, habits and events can be created, read, edited and deleted. Editing keeps the record's id. The latest deleted task can be restored with Undo.
4. **Search and filters:** tasks are filtered by text, list, status and favorites.
5. **Statistics dashboard:** open/completed tasks, completion rate, habit check-ins, a tasks-by-list chart and a seven-day focus chart.
6. **Theme and text size:** dark/light theme and 100%, 112% or 125% text size, saved between visits.
7. **Task calendar:** a Monday-first month view with previous/next month, Today, selected-day tasks and keyboard navigation.
8. **Persistent focus timer:** a running or paused session is restored after a reload or a visit to another page.
9. **JSON backup:** export tasks, habits, events and focus sessions to a file; a chosen file is checked and previewed before it replaces the saved data.

Form validation, jQuery effects on the task list and the Bootstrap layout from the earlier stages remain part of the same application.

## API

The Calendar page uses the public [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs): `https://api.open-meteo.com/v1/forecast`.

- Parameters: city latitude and longitude, five forecast days, automatic time zone, daily minimum/maximum temperature and WMO weather code.
- `fetch` with `async/await` retrieves the JSON. `createForecastDays` checks it and creates one `ForecastDay` object per day; each card is built with `document.createElement`.
- The service needs no API key, so there is no secret in the repository.
- A network failure, a bad HTTP status or an unexpected answer shows an error message, and the refresh button stays available.

## Classes

| Class | File | Properties | Methods |
| --- | --- | --- | --- |
| `Task` | `js/task-model.js` | id, title, date, time, list, notes, completed, favorite | `setCompleted`, `toggleFavorite`, `update`, `getGroup`, `isOverdue`, `matchesSearch`, `matchesFilters`, `getCategoryLabel` |
| `Habit` | `js/habit-model.js` | id, title, period, dates | `isDoneOn`, `setDone`, `rename`, `getStreak`, `getLongestRun` |
| `CountdownEvent` | `js/events-model.js` | id, title, date, description, category, image | `getDaysLeft`, `isPast`, `getCountdownText`, `getDateLabel`, `getCategoryLabel`, `getImage`, `update` |
| `FocusTimer` | `js/focus-model.js` | status, remainingSeconds, deadline | `start`, `pause`, `reset`, `getRemainingSeconds`, `isRunning`, `isPaused`, `isFinished`, `getDisplayTime` |
| `ForecastDay` | `js/weather-model.js` | date, minimum, maximum, code | `getDateLabel`, `getTemperatureRange`, `getSummary`, `isGoodForOutdoors`, `getPlanHint` |

Records read from `localStorage` are plain objects. Each page module checks them and creates class objects with `new`, for example `records.filter(isValidTask).map((record) => new Task(record))`. The objects are saved back with `JSON.stringify`.

## Source layout

| File | Responsibility |
| --- | --- |
| `js/app.js` | Starts each page's setup function |
| `js/shared.js` | Date helpers, `localStorage` helpers, HTML escaping and status messages |
| `js/data.js` | Categories, starter tasks and starter habits |
| `js/task-model.js` | `Task` class and task record check |
| `js/tasks.js` | Today page: task list, form validation, CRUD, Undo and jQuery handlers |
| `js/habit-model.js` | `Habit` class and habit record check |
| `js/habits.js` | Habit list, form, check-ins, week and 28-day history |
| `js/calendar.js` | Month grid, date selection and selected-day tasks |
| `js/focus-model.js` | `FocusTimer` class and session check |
| `js/focus.js` | Timer buttons, saved timer and session totals |
| `js/events-model.js` | `CountdownEvent` class, categories, images and starter events |
| `js/countdown.js` | Event list, form and CRUD |
| `js/theme.js` | Theme and text-size preferences |
| `js/weather-model.js` | `ForecastDay` class and API answer check |
| `js/weather.js` | Forecast request and weather cards |
| `js/statistics.js` | Summary numbers and bar charts |
| `js/backup-model.js` | Backup file check and restore |
| `js/backup.js` | Backup download, file preview and confirmed import |

## Storage

Saved data stays in this browser. There is no backend. The keys are `qadam-tasks`, `qadam-habits`, `qadam-events`, `qadam-focus-sessions`, `qadam-focus-timer`, `qadam-theme`, `qadam-text-size` and `qadam-weather-city`.

- Values are stored as JSON and restored when a page opens.
- A missing value uses starter data. Broken JSON shows a warning and starter data; a single invalid record is skipped.
- An empty saved list stays empty; starter records do not come back.
- If the browser refuses to save, the page shows a warning.
- "Clear all tasks" removes tasks only. Undo keeps one deleted task until the page is reloaded.

## Backup and restore

On Statistics, **Export backup** downloads a JSON file with `app: "qadam"`, `version: 1`, an export date and four lists: tasks, habits, events and completed focus sessions.

Choosing a file checks it and shows how many records it contains. After confirmation the four lists are replaced and the focus timer is reset. An invalid file changes nothing. Theme, text size and weather city are not part of the backup.

## Team

| Account | Responsibility |
| --- | --- |
| adilzhandev | Shared helpers, weather API/model, persistent focus timer, JSON backup and integration |
| AsylStyle | Event management, calendar, statistics, theme, text-size accessibility and responsive layout |
| Nurlan-byte | Task CRUD and Undo, habit CRUD/history, validation, jQuery interactions and persistence |

All three members review the complete application and prepare to explain its implementation.

## Project documentation

- [REQUIREMENTS.md](REQUIREMENTS.md): how the project covers the course requirements.
- [SUBMISSION.md](SUBMISSION.md): repository and live-site links for submission.

## Publication

Live site: [Qadam on GitHub Pages](https://nurlan-byte.github.io/qadam/). GitHub Pages publishes the repository root from the `main` branch.
