import { STORAGE, readStorage, writeStorage } from "./shared.js";
import { createForecastDays } from "./weather-model.js";

const cities = {
    almaty: { name: "Almaty", latitude: 43.24, longitude: 76.89 },
    astana: { name: "Astana", latitude: 51.17, longitude: 71.45 },
    shymkent: { name: "Shymkent", latitude: 42.32, longitude: 69.59 }
};

// Builds one forecast card with DOM methods from a ForecastDay object.
function buildForecastCard(day) {
    const card = document.createElement("article");
    card.className = "weather-day";

    const heading = document.createElement("h3");
    const date = document.createElement("time");
    date.dateTime = day.date;
    date.textContent = day.getDateLabel();
    heading.append(date);

    const temperature = document.createElement("p");
    temperature.className = "weather-temperature";
    temperature.textContent = day.getTemperatureRange();

    const summary = document.createElement("p");
    summary.className = "weather-summary";
    summary.textContent = day.getSummary();

    const hint = document.createElement("p");
    hint.className = "weather-hint";
    hint.textContent = day.getPlanHint();

    card.append(heading, temperature, summary, hint);
    return card;
}

function getForecastUrl(city) {
    return "https://api.open-meteo.com/v1/forecast"
        + `?latitude=${city.latitude}&longitude=${city.longitude}`
        + "&daily=temperature_2m_max,temperature_2m_min,weather_code"
        + "&forecast_days=5&timezone=auto";
}

function setupWeather() {
    const panel = document.querySelector("#weather-planner");
    if (!panel) return;
    const select = panel.querySelector("#weather-city");
    const refresh = panel.querySelector("#weather-refresh");
    const status = panel.querySelector("#weather-status");
    const list = panel.querySelector("#weather-days");

    // Restore the city chosen on the last visit.
    const savedCity = readStorage(STORAGE.weatherCity, "almaty");
    select.value = Object.keys(cities).includes(savedCity) ? savedCity : "almaty";

    async function loadForecast() {
        const city = cities[select.value];

        // Loading state: the controls are disabled until the request ends,
        // so two requests can never run at the same time.
        select.disabled = true;
        refresh.disabled = true;
        panel.setAttribute("aria-busy", "true");
        list.replaceChildren();
        status.textContent = `Loading forecast for ${city.name}…`;

        try {
            const response = await fetch(getForecastUrl(city));
            if (!response.ok) throw new Error("Weather service unavailable");
            const data = await response.json();
            const days = createForecastDays(data.daily);

            if (days.length === 0) {
                // Empty state
                status.textContent = `No forecast is available for ${city.name}. Try again later.`;
            } else {
                // Success state
                for (const day of days) {
                    list.append(buildForecastCard(day));
                }
                status.textContent = `${city.name}: ${days.length}-day forecast. Temperatures are in Celsius.`;
            }
        } catch (error) {
            // Error state: no network, a bad HTTP status or an unexpected answer.
            status.textContent = "The forecast could not be loaded. Check your connection and try again.";
        } finally {
            select.disabled = false;
            refresh.disabled = false;
            panel.setAttribute("aria-busy", "false");
        }
    }

    select.addEventListener("change", () => {
        writeStorage(STORAGE.weatherCity, select.value);
        loadForecast();
    });
    refresh.addEventListener("click", loadForecast);
    loadForecast();
}

export { setupWeather };
