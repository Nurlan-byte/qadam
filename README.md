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
| Habits | Daily check-ins, the current week and 28 days of genuinely recorded history |
| Focus | Start, pause, resume and reset a 25-minute timer; save completed sessions |
| Countdown | Remaining days for the existing event dates |
| Statistics | Current task completion, tasks by category, habit check-ins and last-seven-day focus totals |

Calendar reads the same saved tasks as Today. Habits and Today share dated check-ins, and Statistics reflects the same saved state. Changes in another browser tab update the relevant views. New users start with no habit history; older saved streak counts are preserved without inventing missing historical dates.

## Features

1. **Weather API:** five-day forecasts for Almaty, Astana and Shymkent, with loading, success, empty and error states, refresh, request cancellation and a timeout.
2. **Object-oriented JavaScript:** `ForecastDay` instances hold each forecast day's properties and calculate its date label, temperature range, weather summary and planning hint. Multiple instances are used to render actual API data.
3. **Full task CRUD:** edit existing tasks, cancel editing, and clear all tasks with confirmation. Editing preserves each task's identity, completion and favorite flags.
4. **Statistics dashboard:** real task/category and focus-time charts, completion rate and habit check-ins. It refreshes after changes, when returning to the page, and when another tab updates saved data.
5. **Accessible text-size preference:** choose 100%, 112% or 125% text size, preserved across pages and reloads, alongside the existing theme control.
6. **Task calendar:** a Monday-first month view with previous/next month, Today, selected-day task details and keyboard navigation.
7. **Recorded habit history:** shared daily check-ins, current-week counts and a rolling 28-day history. Only saved dates are shown; older streak counters are migrated separately.

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
| `js/tasks.js` | Task state, rendering, search, validation, CRUD and jQuery effects |
| `js/habits.js` | Dated check-ins, migration of older records, streaks and history rendering |
| `js/calendar.js` | Month layout, date selection, task counts and selected-day details |
| `js/focus.js` | Deadline-based focus timer and saved session totals |
| `js/countdown.js` | Date differences for event cards |
| `js/theme.js` | Theme and text-size preferences |
| `js/weather-model.js` | ForecastDay class and response validation |
| `js/weather.js` | Forecast requests and weather-card rendering |
| `js/statistics.js` | Summary values and accessible bar charts |

## Storage

Saved data stays in this browser and device. There is no backend or account synchronization. Keys are `qadam-tasks`, `qadam-habits`, `qadam-focus-sessions`, `qadam-theme`, `qadam-text-size` and `qadam-weather-city`.

Missing values use starter defaults. Invalid data is handled without breaking the page. An empty saved task array remains empty. If the browser refuses a save, the page shows a warning and tells the user that the change is only available for the current visit. Clear tasks affects tasks only; other preferences and focus history remain.

## Team

| Account | Responsibility |
| --- | --- |
| adilzhandev | Shared helpers, forecast model, weather API and application integration |
| AsylStyle | Theme, timer, countdown, calendar, statistics, text-size accessibility and responsive layout |
| Nurlan-byte | Task CRUD, form validation, jQuery interactions, dated habit history and persistence |

All three members review the complete application and prepare to explain its implementation.

## Project documentation

- [REQUIREMENTS.md](REQUIREMENTS.md): implementation checklist and manual acceptance checks.
- [DEFENSE.md](DEFENSE.md): Russian demonstration script and questions with answers.
- [SUBMISSION.md](SUBMISSION.md): repository and live-site links for submission.

## Publication

Live site: [Qadam on GitHub Pages](https://nurlan-byte.github.io/qadam/).

GitHub Pages publishes the repository root from `main` through the Pages build/deployment workflow. Merge reviewed changes into `main`, wait for the deployment to complete and verify the live pages. The repository and website represent one Qadam project.
