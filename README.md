# Qadam — Small steps, every day

Qadam is a responsive personal productivity website for planning tasks, building habits, tracking focus sessions and counting down to important events. A shared calendar, weather forecast and statistics dashboard bring these activities together.

Developed for **Web Technologies 1**, Qadam continues the same topic and team from the Midterm and Endterm stages as one application on the `main` branch.

**[Open the website](https://nurlan-byte.github.io/qadam/)** · **[Source repository](https://github.com/Nurlan-byte/qadam)** · **[Requirements coverage](REQUIREMENTS.md)**

## Contents

- [Group members](#group-members)
- [Technologies](#technologies)
- [Run locally](#run-locally)
- [Pages](#pages)
- [Implemented features](#features)
- [JavaScript architecture and OOP](#javascript-architecture-and-oop)
- [Open-Meteo API integration](#open-meteo-api-integration)
- [Data persistence](#data-persistence)
- [Backup and restore](#backup-and-restore)
- [Manual verification](#manual-verification)
- [Deployment and submission](#deployment-and-submission)

## Group members

| Member / GitHub | Main responsibilities |
| --- | --- |
| [adilzhandev](https://github.com/adilzhandev) | Shared JavaScript helpers; weather API and model; persistent focus timer; JSON backup and restore; integration between modules |
| [AsylStyle](https://github.com/AsylStyle) | Event management and countdowns; task calendar; statistics; theme and text-size controls; responsive layout |
| [Nurlan-byte](https://github.com/Nurlan-byte) | Task CRUD and Undo; habit CRUD and history; form validation; jQuery interactions; task and habit persistence |

These are the team's main areas of responsibility. Each member must understand the complete application and be able to demonstrate, explain, modify and debug it during the individual defence.

## Technologies

| Technology | Use in Qadam |
| --- | --- |
| HTML5 | Seven connected pages, semantic sections, forms and accessible labels |
| CSS3 | CSS variables, Flexbox, Grid, responsive layouts and interaction states |
| Bootstrap 5.3.3 | Responsive grid, navigation, forms, buttons and utilities |
| Bootstrap Icons 1.11.3 | Navigation and interface icons |
| JavaScript ES modules | DOM updates, validation, reusable functions and classes |
| jQuery 3.7.1 | Delegated events, DOM traversal and effects on Today |
| Fetch API and `async` / `await` | Asynchronous weather requests and JSON processing |
| `localStorage` | Records, timer state and user preferences saved between visits |
| Open-Meteo | Five-day weather forecasts |
| GitHub Pages | Static website hosting |

The application uses plain JavaScript without a frontend framework, package installation or build step. Google Fonts supplies the Manrope and Unbounded fonts.

## Run locally

You need a modern browser and Python 3 for the local HTTP server. Git is only needed if you choose to clone the repository.

1. Clone the project and enter its directory:

   ```sh
   git clone https://github.com/Nurlan-byte/qadam.git
   cd qadam
   ```

   Alternatively, download and extract the repository ZIP, then open a terminal in the directory containing `index.html`.

2. Start the server:

   ```sh
   python3 -m http.server 8000
   ```

   On Windows with the Python launcher, use `py -m http.server 8000`.

3. Open [http://localhost:8000](http://localhost:8000). Stop the server with `Ctrl+C` when finished.

Use an HTTP server instead of opening an HTML file directly: the application loads JavaScript modules. Internet access is required for Bootstrap, Bootstrap Icons, jQuery, Google Fonts and the weather service. No API key or environment file is needed for this project.

On the first visit, the application provides sample tasks, habits and events. Changes are saved in the current browser. Localhost and the published website have separate storage; use a JSON backup to transfer records between them.

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

A typical workflow is to add a task on Today, view it in Calendar, complete a focus session, check in a habit and review progress on Statistics.

## Features

1. **Weather API:** five-day forecasts for Almaty, Astana and Shymkent with loading, success, empty and error states and a refresh button.
2. **Object-oriented JavaScript:** five classes hold the application data and its logic: `Task`, `Habit`, `CountdownEvent`, `FocusTimer` and `ForecastDay` (see [JavaScript architecture and OOP](#javascript-architecture-and-oop)).
3. **Full CRUD:** tasks, habits and events can be created, read, edited and deleted. Editing keeps the record's id. The latest deleted task can be restored with Undo.
4. **Search and filters:** tasks are filtered by text, list, status and favorites.
5. **Statistics dashboard:** open/completed tasks, completion rate, habit check-ins, a tasks-by-list chart and a seven-day focus chart.
6. **Theme and text size:** dark/light theme and 100%, 112% or 125% text size, saved between visits.
7. **Task calendar:** a Monday-first month view with previous/next month, Today, selected-day tasks and keyboard navigation.
8. **Persistent focus timer:** a running or paused session is restored after a reload or a visit to another page.
9. **JSON backup:** export tasks, habits, events and focus sessions to a file; a chosen file is checked and previewed before it replaces the saved data.

Form validation, jQuery interactions on the Today page and the Bootstrap layout from the earlier stages remain part of the same application.

## jQuery on the Today page

All jQuery code is in `setupTaskJQuery` and the helpers next to it in `js/tasks.js`.

| Interaction | Event | Selectors and traversal | Effect |
| --- | --- | --- | --- |
| Complete, favorite or edit a task | `change`, `click` (delegated on `#task-list`) | `$(this).closest(".task-card")` | — |
| Delete a task | `click` | `closest`, `find("button, input")` | `fadeOut` |
| Show task details | `click` | `closest(".task-card").find(".task-notes")` | `slideToggle` |
| Close or open a task group | `click` | `$("[data-task-section] .task-group-toggle")`, `parent().next(".today-list")` | `slideToggle` |
| Notes character counter | `input` | `$("#task-form textarea").siblings(".char-count")` | — |
| Undo panel after a deletion | — | `$("#task-undo-panel").find("p")` | `slideDown` / `slideUp` |

## Interface and validation

The layout adapts to desktop and mobile screens. Users can choose a dark or light theme and a text size of **100%, 112% or 125%**. Both preferences persist across visits; `theme-preload.js` applies saved settings early in the page load.

Forms have labels and field feedback, interactive elements have visible focus states, and status messages use appropriate ARIA attributes. Calendar supports arrow keys, Page Up and Page Down. CSS includes reduced-motion rules; jQuery effects are handled separately.

Task validation requires a 3–80 character title, a valid date and a known category. Time is optional, and notes are limited to 240 characters. Invalid submissions are blocked with field messages; successful submissions show confirmation. Canceling an edit leaves the saved record unchanged.

## JavaScript architecture and OOP

[js/app.js](js/app.js) imports and runs the setup functions. Feature modules handle forms, events and DOM updates, while model modules contain classes and record validation. [js/shared.js](js/shared.js) provides common date, storage, HTML-escaping and status-message helpers.

Each class below has a constructor, properties and methods used by the application. Multiple task, habit, event and forecast objects represent individual records. Related behavior stays with its data instead of being repeated in DOM handlers.

| Class | File | Properties | Methods |
| --- | --- | --- | --- |
| `Task` | `js/task-model.js` | id, title, date, time, list, notes, completed, favorite | `setCompleted`, `toggleFavorite`, `update`, `getGroup`, `isOverdue`, `matchesSearch`, `matchesFilters`, `getCategoryLabel` |
| `Habit` | `js/habit-model.js` | id, title, period, dates, legacyStreak | `isDoneOn`, `setDone`, `rename`, `getStreak`, `getLongestRun` |
| `CountdownEvent` | `js/events-model.js` | id, title, date, description, category, image | `getDaysLeft`, `isPast`, `getCountdownText`, `getDateLabel`, `getCategoryLabel`, `getImage`, `update` |
| `FocusTimer` | `js/focus-model.js` | id, status, remainingSeconds, deadline | `start`, `pause`, `reset`, `getRemainingSeconds`, `isRunning`, `isPaused`, `isFinished`, `getDisplayTime` |
| `ForecastDay` | `js/weather-model.js` | date, minimum, maximum, code | `getDateLabel`, `getTemperatureRange`, `getSummary`, `isGoodForOutdoors`, `getPlanHint` |

Records read from `localStorage` are plain objects. Each page module checks them and creates class objects with `new`, for example `records.filter(isValidTask).map((record) => new Task(record))`. The objects are saved back with `JSON.stringify`.

Changes follow the same general flow: **user action → validation/model update → save → render feedback**. A running focus timer uses a saved deadline to calculate the remaining time, so reloading a page does not restart the session.

## Open-Meteo API integration

Calendar requests weather data from the public [Open-Meteo Forecast API](https://open-meteo.com/en/docs) to help users plan indoor and outdoor activities. This educational application uses the public endpoint without an API key.

**Endpoint:** `https://api.open-meteo.com/v1/forecast`

Supported cities are **Almaty, Astana and Shymkent**. Each city has predefined coordinates in [js/weather.js](js/weather.js).

| Parameter | Value used by Qadam |
| --- | --- |
| `latitude`, `longitude` | Coordinates of the selected city |
| `daily` | `temperature_2m_max,temperature_2m_min,weather_code` |
| `forecast_days` | `5` |
| `timezone` | `auto` |

[Example request for Almaty](https://api.open-meteo.com/v1/forecast?latitude=43.24&longitude=76.89&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=5&timezone=auto)

The integration works as follows:

1. Display a loading message and disable the city selector and Refresh button.
2. Send a request with `fetch`, check `response.ok` and read the JSON using `await response.json()`.
3. Validate the `daily` arrays in `createForecastDays` and create up to five `ForecastDay` instances.
4. Build cards with DOM methods, showing dates, minimum/maximum temperatures in Celsius, weather descriptions and planning hints.
5. Show an empty-state or error message when appropriate. Restore the controls in `finally` so the user can retry.

The selected city is saved locally. Forecast responses are fetched again rather than stored as offline data.

## Data persistence

Qadam stores JSON in the browser's `localStorage`. It has no backend, account system or automatic synchronization between devices.

| Storage key | Saved value |
| --- | --- |
| `qadam-tasks` | Task records |
| `qadam-habits` | Habit records and check-in dates |
| `qadam-events` | Countdown events |
| `qadam-focus-sessions` | Completed focus sessions |
| `qadam-focus-timer` | Current timer status, remaining time and deadline |
| `qadam-theme` | Dark/light preference |
| `qadam-text-size` | Text-size preference |
| `qadam-weather-city` | Selected forecast city |

`readStorage` reads and parses JSON, returning a fallback if the value is missing or cannot be read. `writeStorage` serializes and saves values, showing a warning if saving fails. Record loaders also validate the data they receive.

- Invalid individual records are skipped.
- A saved empty list stays empty instead of being replaced with sample records.
- "Clear all tasks" removes tasks only. Undo keeps the latest deleted task while available in the current page session.
- Changes made in another tab appear after reloading the page.
- Older habit streak totals are preserved separately from recorded dates; missing dates are not invented.

## Backup and restore

1. Open **Statistics** and select **Export backup** to download a JSON file.
2. To restore a backup, choose the file in the import controls.
3. Review the displayed counts of tasks, habits, events and completed focus sessions.
4. Confirm the import, or cancel to keep the current data.

The file includes `app: "qadam"`, format `version: 1`, an export timestamp and those four record collections. Import checks the structure, record values and duplicate IDs before allowing restoration. The maximum file size is **2 MiB (2,097,152 bytes)**; the interface labels this as 2 MB.

**Import replaces the four saved collections and resets the active focus timer.** It does not merge records. Theme, text size and weather city are not included in the backup. Invalid files are rejected before saved records are changed. If saving fails during restoration, the app attempts to recover the previous data and reports the result.

## Project structure

```text
qadam/
├── index.html             # Home
├── today.html             # Tasks and daily check-ins
├── calendar.html          # Task calendar and weather
├── habits.html            # Habits and history
├── focus.html             # Focus timer
├── countdown.html         # Dated events
├── statistics.html        # Dashboard and backups
├── css/                   # Shared and page-specific styles
├── images/                # Local logos, illustrations and event photos
├── js/                    # JavaScript modules and models
├── README.md              # Setup, features, architecture and team
├── REQUIREMENTS.md        # Course requirement mapping
└── SUBMISSION.md          # Submission links
```

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
| `js/theme-preload.js` | Applies the saved theme and text size in `<head>`, before the page is drawn |
| `js/weather-model.js` | `ForecastDay` class and API answer check |
| `js/weather.js` | Forecast request and weather cards |
| `js/statistics.js` | Summary numbers and bar charts |
| `js/backup-model.js` | Backup file check and restore |
| `js/backup.js` | Backup download, file preview and confirmed import |

## Manual verification

These are repeatable manual checks, not an automated test suite. Use test records in a separate browser profile, especially for deletion and backup import. Check the browser console for errors while following these steps.

1. Visit all seven pages and test navigation at a narrow screen width. Change the theme and text size, then reload: both preferences should remain selected.
2. On Today, submit an empty or short task title: a specific field error should prevent saving. Type notes and watch the character counter (it turns orange near 240). Add a valid task with notes, then search, filter, complete and favorite it. Open its details to see the slide effect; delete it to see the fade effect and the Undo panel slide in, then use Undo. Click a group heading (Overdue, Today, Upcoming, Completed) to close and open that list.
3. Edit the task and reload to check persistence. Cancel another edit and confirm the task is unchanged. Clear the test task list and reload: it should stay empty.
4. Create, edit, cancel an edit and delete test habits and events. Check a habit on Today, then open Habits: its check-in and history should agree. Reload to confirm saved changes; check an event's countdown before, on and after its date.
5. Add dated tasks and check their counts and details in Calendar. Try arrow keys, Page Up, Page Down and Today. Observe the weather loading state and forecast cards, change city and refresh. After the page loads, switch the browser offline and refresh the forecast: an error should appear and retry should remain available. Reconnect and retry.
6. Start Focus, reload, pause, reload again and resume: the remaining time should persist. Test Reset. Complete a session and compare its totals with Statistics; use Refresh to update the dashboard.
7. On Statistics, export a backup, select it and verify the preview counts. Cancel once, then import it and compare the restored data. Select malformed JSON: it should be rejected without changing saved records.

## Current limitations

- Clearing browser site data removes saved records. Export a backup to keep a separate copy.
- Weather and CDN dependencies require internet access; the site is not a fully offline application.
- There is no live synchronization between tabs or devices.
- Focus uses a fixed 25-minute duration. Completion is detected while a Qadam page runs or when the app opens again; there are no notifications while the browser is closed.
- The Home page's “21-day streak” graphic is a static illustration. Actual habit history is displayed on Habits.

## Deployment and submission

The published project is hosted on **GitHub Pages**, using the repository root on `main`. It is a static site with no server-side application or build command.

| Deliverable | Location |
| --- | --- |
| Published website | [nurlan-byte.github.io/qadam](https://nurlan-byte.github.io/qadam/) |
| Source repository | [github.com/Nurlan-byte/qadam](https://github.com/Nurlan-byte/qadam) |
| Complete project folder | Clone or download the repository, keeping all HTML files and the `css/`, `js/` and `images/` directories together |
| Updated README | This document |
| Requirement mapping | [REQUIREMENTS.md](REQUIREMENTS.md) |
| Submission links | [SUBMISSION.md](SUBMISSION.md) |

Before submission, check the published website using the verification steps above and ensure the latest source and README are available in the repository.
