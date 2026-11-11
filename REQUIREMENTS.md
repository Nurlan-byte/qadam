# Qadam requirements coverage

This checklist shows where each course requirement is implemented.

## HTML, JavaScript and interaction

| Requirement | Implementation |
| --- | --- |
| Project continuation | Same topic and team; new features are added to the existing responsive Bootstrap site |
| At least five connected responsive pages | Seven pages: Home, Today, Calendar, Habits, Focus, Countdown and Statistics with shared navigation |
| Arrays with project data | `categories`, `defaultTasks` and `defaultHabits` in `js/data.js`; `starterEvents` in `js/events-model.js` |
| Loops | `for...of` over visible tasks and `for...in` over task groups in `renderTasks`; `for` loops in `getMonthDays` and `daysFrom` |
| Reusable functions, some returning values | `getLocalDate`, `addDays`, `isValidDate`, `escapeHTML`, `getVisibleTasks`, `validateTaskForm` |
| Select and modify DOM elements | Task actions update text, classes, attributes, visibility and counters |
| Generate content from an array | Task cards, calendar days, habit history, forecast cards and charts |
| Add or remove DOM elements | Adding and deleting tasks, habits and events; refreshing the forecast |
| `addEventListener` with several event types | `input`, `change`, `click`, `submit` and `keydown` |
| Control default behavior | Forms use `preventDefault`; calendar keys do not scroll the page |
| Visual feedback | Field errors, status messages, empty states, completed and favorite styles |

## Form validation and jQuery

| Requirement | Implementation |
| --- | --- |
| JavaScript form validation | Today task form: title 3–80 characters, valid date, optional valid time, known list, notes up to 240 characters |
| Messages near fields; invalid submit blocked | `validateTaskForm` and `showFieldError` in `js/tasks.js` |
| Success feedback | "Task added. Saved in this browser." under the form |
| jQuery inclusion and selectors | Loaded on Today; `$("#task-list")` and class selectors in `setupTaskJQuery` |
| DOM traversal | `closest` and `find` |
| Events handled with jQuery | Delegated `click` and `change` on task cards |
| Effects | `fadeOut` on deletion and `slideToggle` for task details |

## Final-stage features

| Requirement | Implementation |
| --- | --- |
| External API with useful data | Five-day Open-Meteo forecast on Calendar |
| `fetch` with `async/await`, JSON, dynamic DOM | `loadForecast` in `js/weather.js`, `createForecastDays` in `js/weather-model.js`, `buildForecastCard` |
| Loading, success, empty and error states | Status text and disabled controls while loading; messages for an empty answer and for errors |
| No secret keys in public code | Open-Meteo needs no key |
| Meaningful classes with constructor, properties and methods | `Task`, `Habit`, `CountdownEvent`, `FocusTimer`, `ForecastDay` |
| Multiple objects in real functionality | Every saved task, habit, event and forecast day is an object of its class |
| Meaningful `localStorage` data | Tasks, habits, events, focus sessions, the current timer, theme, text size and weather city |
| Restore, update and clear | Data is restored on load; CRUD updates it; "Clear all tasks" and deletion remove it |
| JSON and safe handling of bad values | `readStorage` catches broken JSON; invalid records are skipped |
| Additional feature: CRUD | Tasks, habits and events |
| Additional feature: search and filtering | Task search, list filter, status filter and favorites |
| Additional feature: data visualization | Statistics charts |
| Additional feature: saved theme/accessibility preference | Theme and text size |

See [README.md](README.md) for setup, classes and file responsibilities, and [SUBMISSION.md](SUBMISSION.md) for the submission links.
