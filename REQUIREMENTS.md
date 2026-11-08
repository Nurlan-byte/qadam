# Qadam requirements and acceptance checks

This checklist maps the project requirements to the current application. It preserves the technical minimums and provides practical verification steps; it does not introduce a new grading scheme.

## HTML, JavaScript and interaction

| Requirement | Implementation and evidence |
| --- | --- |
| Coherent project continuation | One project topic and team; features integrate into the existing site while preserving responsive HTML, CSS, Bootstrap and navigation |
| At least five connected responsive pages | Seven pages: Home, Today, Calendar, Habits, Focus, Countdown and Statistics; shared navigation and working Bootstrap components |
| At least two arrays; one containing project data | `categories`, `defaultTasks` and `defaultHabits` in `js/data.js`; saved task and habit records are used by the interface |
| At least two appropriate loop examples | `renderTasks` loops over matching tasks and over their groups; category options also use `forEach` |
| At least four reusable functions | Examples: `getVisibleTasks`, `renderTasks`, `validateTaskForm`, `getLocalDate`, `addDays`; parameters are used where appropriate |
| At least one function returning a value | `getVisibleTasks` returns matching tasks; `validateTaskForm` returns a boolean |
| Select and modify DOM elements | Task actions update text, classes, attributes, visibility, counts and status messages |
| Generate content from an array | Task cards, calendar dates, habit history, forecast cards and statistics are generated from data |
| Dynamically add or remove a DOM element | Adding/deleting tasks changes the rendered task list; weather refresh replaces forecast cards |
| At least five useful interface features | Search, category/status filters, favorites, habit check-ins and focus timer; calendar, details, theme and countdown provide further functions |
| `addEventListener` and at least four meaningful interactions | Search, filtering, completion, favorites, form submission, calendar navigation and timer controls |
| At least three event types | `input`, `change`, `click` and `submit`; relevant handlers use the event object |
| Control default browser behavior where needed | Form submission uses `preventDefault`; calendar keyboard handling prevents unwanted page scrolling |
| Clear visual feedback | Field errors, success/status messages, empty states, completed/favorite styles and selected calendar dates |

## Form validation and jQuery

| Requirement | Implementation and evidence |
| --- | --- |
| Validate at least one substantial form with JavaScript | Today task form: title, date, optional time, allowed category and notes |
| Required fields and appropriate rules | Trimmed title 3–80 characters, valid four-digit-year date, allowed category, valid time when supplied, notes up to 240 characters |
| Specific messages near fields; block invalid submission | `validateTaskForm` and `showFieldError`; invalid input cannot create or update a task |
| Clear success feedback; not HTML validation alone | A valid create/update shows a status message; JS checks and field-specific messages supplement input attributes |
| Correct jQuery inclusion and syntax | jQuery is loaded on Today and used in `setupTaskJQuery` |
| At least two selector types | ID selector `#task-list` and class selectors for action buttons |
| At least two DOM traversal methods | `closest` and `find` |
| At least two user events handled with jQuery | Delegated favorite, delete and details button clicks |
| At least two useful effects/animations | `fadeOut` on deletion and `slideToggle` for task details |

The loop requirement is two appropriate examples, not necessarily two different loop constructs. The jQuery requirement is two user events; the separate three-event-type minimum is covered by the JavaScript interactions above. A native fallback keeps task actions usable if the jQuery CDN cannot load.

## Application features and data

| Requirement or project feature | Implementation and evidence |
| --- | --- |
| At least one suitable external API with useful remote data | Calendar displays a five-day Open-Meteo forecast for the selected city |
| `fetch` with Promises or `async/await`, JSON processing and dynamic DOM | `loadForecast` in `js/weather.js` validates the response through `createForecastDays` and renders weather cards |
| Loading, success, empty-data and error states | Visible status text, retry control, request cancellation and a 12-second timeout; invalid responses do not create fabricated weather |
| Keep secret API keys out of public code | The selected public Open-Meteo endpoint needs no secret key in the repository |
| At least one meaningful class with constructor, properties and methods | `ForecastDay` stores a date, minimum/maximum temperature and weather code, and provides formatting, summary and planning methods |
| Multiple objects used in real functionality | `createForecastDays` creates a separate `ForecastDay` object for each displayed day; `buildForecastCard` uses its methods |
| Meaningful persistent browser data | Tasks, habits, focus sessions, theme, text size and selected weather city use `localStorage` |
| Restore, update and clear saved data | Data is restored on loading; CRUD and preferences update it; Clear tasks explicitly stores an empty array |
| Structured JSON and safe invalid-data handling | Shared storage helpers catch parse/save errors; modules validate stored values and records |
| At least two features from the additional-feature choices | Full task CRUD, meaningful statistics and persisted accessibility preferences provide three choices |
| Full CRUD | Create/read/update/delete tasks, cancel editing and clear all with confirmation; editing preserves ID and completion/favorite flags |
| Meaningful data visualization | Completion summary, tasks-by-category chart and seven-day focus-minute chart use current saved records |
| Persisted accessibility preference | Text size 100%, 112% or 125%; labeled controls, keyboard access and readable numeric chart labels |
| Connected task calendar | Monday-first month grid, selected-day tasks, date navigation, keyboard controls and cross-tab refresh |
| Recorded habit history | Shared Today/Habits check-ins, current week and 28-day history; legacy streak counters do not invent dates |

Five substantial capabilities are identifiable separately: API integration, OOP used by the forecast, full CRUD, the statistics dashboard and persisted text-size accessibility. Local storage supports the application as a whole and is not counted repeatedly as different features. Calendar and recorded habit history add further integrated functionality.

## Code quality, delivery and defence

- Preserve working navigation, forms, responsive layout and Bootstrap behavior across the whole application.
- Use readable names, reusable logic, organized external ES modules and comments for non-obvious logic. Separate data, rendering and event handling where practical.
- Keep the console free of application errors during normal use; handle network, input and storage failures visibly.
- Keep the design consistent, content readable and form controls accessibly labeled.
- Do not rely on unexplained copied code. Every member must understand the complete project.
- Provide the organized source files/assets, working repository/site links and a README describing the project, members, API, features, local run and test instructions.
- Defence is worth 40 points and is individual: each member explains their contribution and the complete website, demonstrates relevant code and answers at least four questions. Questions can cover course material from Week 1, including HTML/CSS/Bootstrap, JavaScript, DOM, jQuery, API, OOP and storage. Be ready to read, modify or debug code. Features that cannot be demonstrated or explained may not receive full credit.

## Manual acceptance checks

Use a separate browser profile or disposable test context. Do not clear or corrupt real user data to demonstrate resilience. The checks below describe expected behavior, not a claim that an external service can never fail.

### Navigation and presentation

1. Visit all seven pages, follow their links and test the mobile Bootstrap navigation.
2. Repeat key actions at a narrow width and at 125% text size. Content and controls remain usable; wide tables scroll within their container.
3. Switch theme and text size, move to another page and reload. Preferences persist. Navigate important controls with the keyboard and inspect the console.

### Tasks, validation and jQuery

1. Submit an empty form, a short title and invalid field values. Verify specific messages, focus on the first error and no created/updated record.
2. Add a valid task with notes. Find it using search, category and status filters; complete it and add it to favorites. Check matching and empty-result states.
3. Expand/collapse details and delete a test task. Observe jQuery effects. With the jQuery request blocked in a test context, basic favorite/details/delete actions still work.
4. Edit a task's title/date/notes, save and reload. Values persist without duplicating its ID or losing completion/favorite flags.
5. Edit again and cancel: the record is unchanged. Delete the record currently being edited: the form returns to add mode.
6. Cancel Clear tasks and verify no change. In the disposable profile, confirm it and reload: the task array remains empty; habits and preferences are unaffected.

### Weather API and objects

1. Open Calendar and observe loading followed by dated forecast cards, Celsius ranges, conditions and planning hints. Change city, refresh and reload; city choice persists.
2. Inspect `ForecastDay`, `createForecastDays` and `buildForecastCard`: multiple validated instances supply the displayed values.
3. After the page has loaded, block the API request or use DevTools Offline, then refresh the forecast. Verify a visible error and an enabled retry control; restore the connection and retry.
4. Change cities quickly: an older response must not overwrite the newest selection. A request that takes too long releases the controls with a timeout message.
5. In an isolated test, provide empty arrays, malformed JSON, mismatched array lengths or invalid values. Expect an empty/error state and no fabricated cards.

### Calendar and habits

1. Add tasks on different dates and times, including a completed task. Select their dates in Calendar; counts, chronological order, category and state match Today.
2. Test previous/next month, Today, February in leap/non-leap years and the December/January boundary. January 31 clamps to the last valid day of February.
3. Use arrow keys, Home/End and PageUp/PageDown. Change tasks in another tab; the chosen date refreshes without an unexpected month jump.
4. In a fresh profile, Habits has no invented check-in history. Check a habit on Today; Habits shows the same checkbox, current-day count and dated history. Undo from Habits and verify Today updates.
5. Reload, then repeat check/uncheck. Dates persist and streaks do not inflate. A missed day breaks the active streak.
6. With isolated legacy records, preserve the old streak baseline separately and display only known dates. Duplicate/future dates must not fabricate recorded activity.

### Focus, countdown and statistics

1. Start, pause, resume and reset Focus. Pause keeps the remaining time; reset returns to 25 minutes. A completed session is saved once, and Start another session begins a new 25-minute session.
2. Verify countdown output before, on and after an event date, using a disposable clock/date test when necessary.
3. Compare Statistics with actual task totals, category counts and habit check-ins. The completion rate is 0% for an empty task list.
4. Change data in another tab and return to Statistics. Values update; the last-seven-day chart includes actual saved minutes for those dates and excludes older/future sessions.

### Storage resilience

1. In the test context only, supply malformed JSON, `null`/objects instead of arrays, invalid dates or duplicate task IDs. The application remains usable with safe fallback/filtered data.
2. Deny writes: show a visible warning and truthful unsaved feedback. Temporary changes must not be described as successfully persisted.
3. Reload valid saved data, including an intentionally empty task array. Verify restoration and cross-tab updates without resurrecting starter tasks.

Use [DEFENSE.md](DEFENSE.md) for the demonstration and questions, [README.md](README.md) for setup and architecture, and [SUBMISSION.md](SUBMISSION.md) for submission links.
