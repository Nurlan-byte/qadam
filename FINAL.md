# Qadam final acceptance

The final stage builds on the endterm tag. All original pages and earlier interactive features remain available.

## Requirements map

| Requirement | Implementation | Owner |
| --- | --- | --- |
| External API and async JSON | Calendar weather planner with Open-Meteo; loading, success, empty, error and timeout handling | adilzhandev |
| Meaningful OOP, multiple objects | ForecastDay constructor/properties/methods; one object per displayed forecast day | adilzhandev |
| Persistent browser data | Task CRUD, restore and clear; new city and text-size preferences; invalid data and save-error handling | Nurlan-byte / AsylStyle |
| Additional feature: full CRUD | Today task create/read/update/delete, edit cancellation and clear-all confirmation | Nurlan-byte |
| Additional feature: statistics | Task category chart, completion summaries and seven-day focus chart from saved data | AsylStyle |
| Additional feature: accessibility | Persistent text-size controls, labels and keyboard-usable controls | AsylStyle |
| Preserve endterm | Search, filters, jQuery actions/effects, validation, check-ins, timer, theme and countdown | All |
| Documentation and deployment preparation | README, stage tags, acceptance checks and existing Pages instructions | All |

There are five substantial additions after endterm: API, OOP, full CRUD editing, the statistics dashboard, and persisted text-size accessibility. Storage was already present and is not counted twice.

## Check Today

1. Add a task with a title, valid date, category and optional notes.
2. Mark it completed and favorite it. Edit its title/date/notes, save, then reload.
3. Verify the edited values and both flags remain, with no duplicate task.
4. Edit again and cancel: no saved values should change.
5. Start editing a task, then delete that task: the form returns to add mode.
6. Cancel the clear-all confirmation: tasks remain. Confirm it: the list stays empty after reload.
7. Repeat search, category/status filters, favorites and details disclosure from endterm.
8. Check that invalid dates/fields show specific messages and do not create or update a record.

## Check the weather planner

1. Open Calendar and wait for the forecast. Change city, refresh and reload; the city choice persists.
2. Verify each card has a date, temperature range, weather condition and planning hint.
3. With browser network tools, block the forecast request. Confirm a visible error and retry control.
4. Restore the network and retry. Change city quickly: an older response must not replace the latest city's forecast.
5. Empty or malformed responses must show an empty/error state, not fabricated weather.

## Check statistics and accessibility

1. Open Statistics and compare total/completed tasks and category values with Today.
2. Change a task in another tab. The dashboard updates after the storage change or when brought back into focus.
3. A newly completed focus session adds its actual saved minutes to the appropriate day of the last-seven-day chart.
4. Choose 125% text size, switch pages and reload. Verify the setting stays selected and controls remain usable on mobile.
5. Switch between dark and light themes and navigate with the keyboard.

## Check resilience

Use a separate browser profile or test context so real task data is preserved. Test malformed JSON, null/object values where arrays are expected, invalid dates, duplicate task IDs, and denied localStorage writes. The application should keep running and report save failures. Existing endterm checks are in ENDTERM.md.

## Defence

Each person explains their own contribution and the whole application. Be ready to trace data from an API request through ForecastDay objects to DOM elements; show CRUD changes going into JSON/localStorage; explain dashboard aggregation; and modify a small function live. Explain the original static calendar/history examples accurately.
