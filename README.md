# Qadam

Qadam is a responsive task and habit tracker for Web Technologies 1, built with plain HTML, CSS, Bootstrap, JavaScript modules and jQuery.

[Live site](https://nurlan-byte.github.io/qadam/) · [Repository](https://github.com/Nurlan-byte/qadam)

## Run locally

From the repository directory run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. No build step or package installation is needed. Use an HTTP server because JavaScript modules are restricted on `file://` URLs. Internet access is needed for the Bootstrap, Bootstrap Icons, Google Fonts and jQuery CDNs, and for the weather service. Core task buttons also have a native JavaScript fallback if jQuery is unavailable.

## Pages

| Page | Purpose |
| --- | --- |
| Home | Overview and navigation |
| Today | Create, read, edit and delete tasks; search, filters, favorites and daily habit check-ins |
| Calendar | Current task calendar with month navigation, selected-day tasks and a live five-day weather planner |
| Habits | Create, edit and delete habits; daily check-ins, the current week and 28 days of recorded history |
| Focus | A saved 25-minute timer that resumes across page visits; completed-session history |
| Countdown | Create, edit and delete dated events with live countdowns |
| Statistics | Task and focus charts; JSON backup export/import |

Calendar reads the same saved tasks as Today. Habits and Today share dated check-ins, and Statistics reflects the same saved state. Changes in another browser tab update the relevant views. New users start with no habit history; older saved streak counts are preserved without inventing missing historical dates.

## Features

1. **Weather API:** five-day forecasts for Almaty, Astana and Shymkent, with loading, success, empty and error states, refresh, request cancellation and a timeout.
2. **Object-oriented JavaScript:** `ForecastDay` instances hold each forecast day's properties and calculate its date label, temperature range, weather summary and planning hint. Multiple instances are used to render actual API data.
3. **Full task CRUD and Undo:** edit tasks without losing their identity or flags, cancel editing, delete and restore the latest single deleted task, or clear all tasks with confirmation.
4. **Statistics dashboard:** real task/category and focus-time charts, completion rate and habit check-ins. It refreshes after changes, when returning to the page, and when another tab updates saved data.
5. **Accessible text-size preference:** choose 100%, 112% or 125% text size, preserved across pages and reloads, alongside the existing theme control.
6. **Task calendar:** a Monday-first month view with previous/next month, Today, selected-day task details and keyboard navigation.
7. **Habit management and recorded history:** create habits, edit their name/period without losing check-ins, or confirm deletion of a habit and its history. Today and Habits share dated check-ins; older streak counters never invent history.
8. **Persistent focus timer:** running and paused sessions survive reloads and navigation. Expired sessions are recorded once when the application next checks the saved timer.
9. **Event management:** create, edit and delete Countdown events with a title, date, description, category and a preset image. Events have their own saved collection; Calendar remains a task calendar.
10. **JSON backup:** export tasks, habits, events and completed focus sessions; validate and preview a backup before replacing those saved datasets.

Search, category/status filters, favorites, form validation, jQuery details/deletion effects, the focus timer, theme control and countdown are integrated into the same application.

## API

The Calendar page uses the public [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs), specifically `https://api.open-meteo.com/v1/forecast`.

- Parameters: city latitude/longitude, five forecast days, automatic timezone, daily minimum/maximum temperature and WMO weather code.
- `fetch` and `async/await` retrieve JSON; `createForecastDays` validates it before creating objects.
- The page displays Celsius temperatures, city-local dates and source attribution.
- No secret API key is stored in this repository. Network failures and invalid responses leave a visible retry control.

## Source layout

| File | Responsibility |
| --- | --- |
| `js/app.js` | Start each page's setup function |
| `js/shared.js` | Date helpers, storage helpers, escaping and announcements |
| `js/data.js` | Starter tasks, categories and habits |
| `js/tasks.js` | Task state, validation, CRUD, latest-deletion Undo and jQuery effects |
| `js/habits.js` | Habit CRUD, dated check-ins, migration, streaks and history |
| `js/calendar.js` | Month layout, date selection, task counts and selected-day details |
| `js/focus-model.js` | Timer/session validation, remaining time and completion deduplication |
| `js/focus.js` | Persistent timer controls, completion reconciliation and session totals |
| `js/events-model.js` | Event validation, normalization, categories and preset images |
| `js/countdown.js` | Event CRUD, saved events and countdown rendering |
| `js/theme.js` | Theme and text-size preferences |
| `js/weather-model.js` | ForecastDay class and response validation |
| `js/weather.js` | Forecast requests and weather-card rendering |
| `js/statistics.js` | Summary values and accessible bar charts |
| `js/backup-model.js` | Backup schema validation and replacement with rollback on write failure |
| `js/backup.js` | Backup download, file preview and confirmed import |

## Storage

Saved data stays in this browser and device. There is no backend or account synchronization. Keys are `qadam-tasks`, `qadam-habits`, `qadam-events`, `qadam-focus-sessions`, `qadam-focus-timer`, `qadam-theme`, `qadam-text-size` and `qadam-weather-city`.

Missing values use starter defaults. Invalid data is handled without breaking the page. An empty saved task array remains empty. If the browser refuses a save, the page shows a warning and tells the user that the change is only available for the current visit. Clear tasks affects tasks only; other preferences and focus history remain.

The timer stores its deadline or paused remainder. Closing the browser does not run JavaScript in the background; the next visit checks the deadline and records a completed session once using its ID. If saving fails, the warning explains the limitation and a later return can retry. Web Locks serialize timer actions when the browser supports them.

Task Undo holds one deleted task in memory on the current Today page, with no time limit. Another single deletion replaces it. Reload/navigation, Clear tasks, imported data or a task change in another tab clears it. It does not undo habit/event deletion or Clear tasks.

## Backup and restore

On Statistics, Export backup downloads a JSON file marked `app: "qadam"` and `version: 1`, with an export date and four collections: tasks, habits, events and completed focus sessions. The file limit is 2 MB; each collection is limited to 10,000 records.

Choose a backup to validate it and preview its counts, then confirm replacement. Import replaces those four collections rather than merging records, resets the active focus timer and clears pending task Undo. Theme, text size and weather-city preferences are unchanged and are not included in the backup. Canceling or rejecting an invalid file changes no saved data.

If a storage write fails, the importer attempts to restore the previous values and reports whether that recovery succeeded. Keep a separate backup file: browser storage can be cleared or unavailable, and this is not automatic cloud synchronization.

## Team

| Account | Responsibility |
| --- | --- |
| adilzhandev | Shared helpers, weather API/model, persistent focus timer, JSON backup and integration |
| AsylStyle | Event management, calendar, statistics, theme, text-size accessibility and responsive layout |
| Nurlan-byte | Task CRUD and Undo, habit CRUD/history, validation, jQuery interactions and persistence |

All three members review the complete application and prepare to explain its implementation.

## Project documentation

- [REQUIREMENTS.md](REQUIREMENTS.md): implementation checklist and manual acceptance checks.
- [DEFENSE.md](DEFENSE.md): Russian demonstration script and questions with answers.
- [SUBMISSION.md](SUBMISSION.md): repository and live-site links for submission.

## Publication

Live site: [Qadam on GitHub Pages](https://nurlan-byte.github.io/qadam/).

GitHub Pages publishes the repository root from `main` through the Pages build/deployment workflow. Merge reviewed changes into `main`, wait for the deployment to complete and verify the live pages. The repository and website represent one Qadam project.
