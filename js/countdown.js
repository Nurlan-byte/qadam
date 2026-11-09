import { getLocalDate } from "./shared.js";

function getDaysUntil(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
    const target = new Date(`${dateString}T12:00:00`);
    if (getLocalDate(target) !== dateString) return null;
    // UTC day indices avoid 23- and 25-hour days at daylight-saving changes.
    const targetDay = Date.parse(`${dateString}T00:00:00Z`);
    const todayDay = Date.parse(`${getLocalDate()}T00:00:00Z`);
    return Math.round((targetDay - todayDay) / 86400000);
}

function setupCountdowns() {
    document.querySelectorAll("[data-countdown-date]").forEach((timeElement) => {
        const days = getDaysUntil(timeElement.dateTime);
        const card = timeElement.closest(".countdown-card");
        const number = card?.querySelector(".countdown-value");
        const label = card?.querySelector(".countdown-unit");
        if (!number || !label) return;

        card.classList.toggle("countdown-past", days !== null && days < 0);
        if (days === null) {
            number.textContent = "—";
            label.textContent = "Date unavailable";
        } else if (days === 0) {
            number.textContent = "Today";
            label.textContent = "";
        } else {
            number.textContent = String(Math.abs(days));
            const unit = Math.abs(days) === 1 ? "day" : "days";
            label.textContent = `${unit} ${days > 0 ? "left" : "ago"}`;
        }
    });
}

export { getDaysUntil, setupCountdowns };
