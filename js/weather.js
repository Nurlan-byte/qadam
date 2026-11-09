import { readStorage, writeStorage } from "./shared.js";
import { createForecastDays } from "./weather-model.js";

const cities = {
    almaty: { name: "Almaty", latitude: 43.24, longitude: 76.89 },
    astana: { name: "Astana", latitude: 51.17, longitude: 71.45 },
    shymkent: { name: "Shymkent", latitude: 42.32, longitude: 69.59 }
};
const cityStorageKey = "qadam-weather-city";

function buildForecastCard(day) {
    const card = document.createElement("article");
    card.className = "weather-day";
    const heading = document.createElement("h3");
    const date = document.createElement("time");
    date.dateTime = day.date;
    date.textContent = day.getDateLabel();
    heading.append(date);
    card.append(heading);
    for (const [className, text] of [
        ["weather-temperature", day.getTemperatureRange()],
        ["weather-summary", day.getSummary()],
        ["weather-hint", day.getPlanHint()]
    ]) {
        const paragraph = document.createElement("p");
        paragraph.className = className;
        paragraph.textContent = text;
        card.append(paragraph);
    }
    return card;
}

function getForecastUrl(city) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
        latitude: city.latitude,
        longitude: city.longitude,
        daily: "temperature_2m_max,temperature_2m_min,weather_code",
        forecast_days: 5,
        timezone: "auto"
    });
    return url;
}

function setupWeather() {
    const panel = document.querySelector("#weather-planner");
    if (!panel) return;
    const select = panel.querySelector("#weather-city");
    const refresh = panel.querySelector("#weather-refresh");
    const status = panel.querySelector("#weather-status");
    const list = panel.querySelector("#weather-days");
    select.value = readStorage(cityStorageKey, "almaty", (key) => Object.hasOwn(cities, key));
    let currentRequest = null;

    async function loadForecast() {
        if (currentRequest) currentRequest.abort();
        const request = new AbortController();
        currentRequest = request;
        const city = cities[select.value];
        const timeout = window.setTimeout(() => request.abort(), 12000);
        panel.setAttribute("aria-busy", "true");
        refresh.disabled = true;
        list.replaceChildren();
        status.textContent = `Loading forecast for ${city.name}…`;
        try {
            const response = await fetch(getForecastUrl(city), { signal: request.signal });
            if (!response.ok) throw new Error("Weather service unavailable");
            const data = await response.json();
            const days = createForecastDays(data.daily);
            if (currentRequest !== request) return;
            list.replaceChildren(...days.map(buildForecastCard));
            status.textContent = days.length
                ? `${city.name}: ${days.length}-day forecast. Temperatures are in Celsius.`
                : `No forecast is available for ${city.name}. Try again later.`;
        } catch (error) {
            if (currentRequest !== request) return;
            status.textContent = request.signal.aborted
                ? "The forecast took too long to load. Please try again."
                : "The forecast could not be loaded. Check your connection and try again.";
        } finally {
            window.clearTimeout(timeout);
            if (currentRequest === request) {
                panel.setAttribute("aria-busy", "false");
                refresh.disabled = false;
                refresh.textContent = "Refresh forecast";
            }
        }
    }

    select.addEventListener("change", () => {
        writeStorage(cityStorageKey, select.value);
        loadForecast();
    });
    refresh.addEventListener("click", loadForecast);
    loadForecast();
}

export { setupWeather };
