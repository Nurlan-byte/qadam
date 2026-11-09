# Qadam endterm

This version extends the existing six-page Qadam midterm site. The existing calendar and habit-history layouts remain; interactive daily check-ins are on Today.

## Requirements map

| Requirement | Implementation |
| --- | --- |
| At least five connected pages | Home, Today, Calendar, Habits, Focus, Countdown |
| Two arrays | Task categories and starter tasks in `js/data.js`; habits are another array |
| Two loop examples | Group tasks by date, then render each group in `renderTasks` |
| Four reusable functions | `getVisibleTasks`, `renderTasks`, `validateTaskForm`, `getLocalDate`, plus other focused helpers |
| Returning a value | Search returns matching tasks; validation returns whether the form is valid |
| Dynamic DOM creation/removal | Task cards, adding a task, deleting a task, habit check-in rows |
| Five useful features | Search, list/status filtering, favorites, habit check-ins, focus timer; theme and countdown also work |
| Four interactions / three event types | Search input; category/status/completion change; action click; form submit |
| JavaScript validation | Title, date, time, allowed category and note length, errors next to fields, blocked invalid submission |
| jQuery selectors | ID selector for the task list; class selectors for delegated buttons |
| jQuery traversal | `closest` and `find` in task actions |
| jQuery events | Favorite, delete and detail button clicks |
| jQuery effects | `fadeOut` on deletion; `slideToggle` for details |
| External JavaScript | Small ES modules under `js/`, started by `js/app.js` |

## Manual acceptance checks

1. Visit all six pages and follow their navigation links. Repeat on a narrow screen.
2. Submit the Today form empty. Verify visible field-specific errors and no new task.
3. Add a valid task with notes. Search for it, filter its list, complete it and favorite it.
4. Open and close its details, delete it, and check the empty search result message.
5. Reload and verify saved changes. Invalid saved data must not stop the page from loading.
6. Toggle a habit on, off, then on. Its streak must not increase twice; a missed day starts a new streak.
7. On Focus, start, pause, resume and reset. A completed session records once. Starting another session begins at 25 minutes.
8. Check countdown dates before, on and after the event. Switch the theme on more than one page.
9. Check the browser console for application errors. CDN and hosting availability require an internet connection.

## Defence preparation

Each member should show their own features and explain the entire project: arrays, loops, functions, DOM changes, input events, validation, jQuery, storage and module imports. Each student should be able to change a small feature and find a bug while explaining the code.

## Existing storage

Task, habit, theme and focus-session persistence was already present in the starting work. It is preserved here. The final stage must add genuinely new features rather than count this same storage implementation again.
