# Qadam

Qadam is a responsive task and habit tracker for Web Technologies 1. This final version continues the same midterm and endterm website using plain HTML, CSS, Bootstrap, JavaScript modules and jQuery.

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

## Final additions

1. **Weather API:** five-day forecasts for Almaty, Astana and Shymkent, with loading, success, empty and error states, refresh, request cancellation and a timeout.
2. **Object-oriented JavaScript:** `ForecastDay` instances hold each forecast day's properties and calculate its date label, temperature range, weather summary and planning hint. Multiple instances are used to render actual API data.
3. **Full task CRUD:** edit existing tasks, cancel editing, and clear all tasks with confirmation. Editing preserves each task's identity, completion and favorite flags.
4. **Statistics dashboard:** real task/category and focus-time charts, completion rate and habit check-ins. It refreshes after changes, when returning to the page, and when another tab updates saved data.
5. **Accessible text-size preference:** choose 100%, 112% or 125% text size, preserved across pages and reloads, alongside the existing theme control.

Task, habit, theme and focus-session storage already existed in endterm. Final extends persistence to new city and text-size preferences, completes task update/clear flows, and connects storage changes to the dashboard. Existing storage is not counted again as a new feature.

## Additional final improvements

- **Task calendar:** a Monday-first month view with previous/next month, Today, selected-day task details and keyboard navigation.
- **Recorded habit history:** shared daily check-ins, current-week counts and a rolling 28-day history. Only saved dates are shown; older streak counters are migrated separately.

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

## Team and versions

| Account | Endterm responsibility | Final responsibility |
| --- | --- | --- |
| adilzhandev | Shared data/helpers, habit check-ins and integration | Forecast model, weather API and integration |
| AsylStyle | Theme, focus timer, countdown and responsive pages | Statistics, task calendar, text-size accessibility and responsive polish |
| Nurlan-byte | Task interactions, form validation and acceptance checks | Full task CRUD, dated habit history, persistence and final checks |

- `project/endterm`, tag `endterm-v1`: the completed endterm stage.
- `final-v1`: the first completed final stage.
- `project/final`, tag `final-v2`: the final stage including the live calendar, dated habit history and defence guide.
- Endterm has three main commits per account; final has four per account. Git author names and emails match the identities already used in this repository.

See [ENDTERM.md](ENDTERM.md) and [FINAL.md](FINAL.md) for requirement maps and acceptance scenarios. [DEFENSE.md](DEFENSE.md) contains a Russian demo script, responsibilities and questions with answers. [SUBMISSION.md](SUBMISSION.md) contains the repository links for submission.

## Publication

The existing [GitHub Pages site](https://nurlan-byte.github.io/qadam/) is published from `main`. The prepared final version is on `project/final`; it has not been moved to the publishing branch. To publish later, merge the reviewed final version into `main`, push it and wait for the existing Pages build/deployment workflow to finish. Then verify the live site.

Until publication, review or submit the [final branch](https://github.com/Nurlan-byte/qadam/tree/project/final). The endterm branch and tags stay available for separate submission.
