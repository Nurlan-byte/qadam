# Qadam

Qadam is a responsive task and habit tracker. The endterm version continues the group's Web Technologies 1 midterm project and adds interactive task management, habit check-ins, a focus timer, and a theme switcher.

**Live site:** https://nurlan-byte.github.io/qadam/

## Pages

- Home — project overview and navigation
- Today — tasks, search and filters, favorites, task form, and habit check-ins
- Calendar — weekly schedule and monthly overview
- Habits — habit history and streak visualizations
- Focus — Pomodoro timer and locally stored session statistics
- Countdown — event dates with automatically calculated remaining days

## Endterm features

- Tasks are rendered from JavaScript arrays. Add, complete, favorite, search, filter, expand details, and delete tasks on the Today page.
- The task form checks the title length, due date, and list selection. It shows field-specific errors and a success message.
- Tasks, habit check-ins, theme choice, and completed focus sessions are saved in the browser with `localStorage`.
- Habit check-ins update the completion count and streak on Today.
- The theme switcher works across all pages.
- The Focus page provides a 25-minute start, pause, and reset timer and updates daily and weekly statistics after a completed session.
- Countdown values are calculated from event dates, including events that have already passed.
- jQuery powers task favorite and delete actions and the task-details disclosure animation.

## Run locally

Open the `qadam` folder with a local static server such as the VS Code Live Server extension. The website also uses Bootstrap, Bootstrap Icons, Google Fonts, and jQuery from public CDNs, so an internet connection is needed for those resources.

## Try the interactive features

1. Open **Today**. Submit an empty task or a title shorter than three characters to see the validation messages. Then add a valid task and confirm it appears in the correct date group.
2. Search for part of a task title, choose a list or status, and switch **Show favorites** on and off.
3. Complete a task, expand its details, favorite it, delete it, then refresh the page to confirm the remaining task data is saved.
4. Check in a habit and reload Today to confirm the check-in remains.
5. Switch the theme, navigate to another page, and reload to confirm the preference remains.
6. On **Focus**, start the timer, pause it, and reset it. For a full demo, let a 25-minute session finish; the daily and weekly session totals will update.
7. Open **Countdown** and check that each displayed value reflects the event date. Past dates are labelled as elapsed days.
8. At a narrow viewport, open the navigation menu and confirm the pages remain accessible.

## Implementation notes

- `js/app.js` starts the page modules. Each module exits when its controls are absent.
- `js/tasks.js` handles task data, rendering, search, validation, favorites and jQuery actions.
- `js/habits.js`, `js/focus.js`, `js/countdown.js` and `js/theme.js` each handle one feature.
- `js/shared.js` contains date, storage and display helpers; `js/data.js` contains starter records.
- `css/app.css` contains shared styles for the new controls and light theme.
- Native JavaScript handles form submission, validation, search, filters, task completion, habit check-ins, theme changes, and focus timing. jQuery is loaded on Today for delegated task actions and effects.
- There is no backend or account sync. Saved data stays in the current browser and device; clearing site data removes it.

## Team

The original midterm pages are preserved. Endterm responsibilities:

- **adilzhandev** — shared data and helpers, habit check-ins, module structure and integration.
- **AsylStyle** — theme, focus timer, countdown, responsive layout and visual checks.
- **Nurlan-byte** — task interactions and validation, accessible form feedback, endterm checks.

See [ENDTERM.md](ENDTERM.md) for the requirements map and defence checklist.

## Endterm version

The `project/endterm` branch and `endterm-v1` tag identify this stage. The repository uses plain HTML, CSS, Bootstrap, JavaScript modules and jQuery; there is no build step. Serve it over HTTP rather than opening files directly, because browsers restrict ES module loading from `file://` URLs.

From the repository folder, run `python3 -m http.server 8000` and visit `http://localhost:8000`.

The published link above belongs to the existing project. Local changes appear there only after the appropriate version is deployed.
