import { formatDate, isValidDate } from "./shared.js";

// One day of the weather forecast returned by the Open-Meteo API.
class ForecastDay {
    constructor(date, minimum, maximum, code) {
        this.date = date;
        this.minimum = minimum;
        this.maximum = maximum;
        this.code = code;
    }

    getDateLabel() {
        return formatDate(this.date);
    }

    getTemperatureRange() {
        return `${Math.round(this.minimum)}° to ${Math.round(this.maximum)}°C`;
    }

    // Turns the numeric WMO weather code from the API into words.
    getSummary() {
        if (this.code === 0) return "Clear sky";
        if (this.code <= 3) return "Partly cloudy or overcast";
        if (this.code === 45 || this.code === 48) return "Fog";
        if (this.code >= 51 && this.code <= 57) return "Drizzle";
        if (this.code >= 61 && this.code <= 67) return "Rain";
        if (this.code >= 71 && this.code <= 77) return "Snow";
        if (this.code >= 80 && this.code <= 82) return "Rain showers";
        if (this.code === 85 || this.code === 86) return "Snow showers";
        if (this.code >= 95) return "Thunderstorms";
        return "Mixed conditions";
    }

    isGoodForOutdoors() {
        return this.code <= 3;
    }

    getPlanHint() {
        return this.isGoodForOutdoors() ? "Consider your outdoor tasks." : "Keep indoor tasks as an option.";
    }
}

// Checks the "daily" part of the API answer and creates one ForecastDay per date.
// The API sends four parallel arrays: dates, minimums, maximums and weather codes.
function createForecastDays(daily) {
    if (!daily || !Array.isArray(daily.time) || !Array.isArray(daily.temperature_2m_min)
        || !Array.isArray(daily.temperature_2m_max) || !Array.isArray(daily.weather_code)) {
        throw new Error("The forecast is incomplete.");
    }

    const days = [];
    for (let index = 0; index < daily.time.length && index < 5; index += 1) {
        const date = daily.time[index];
        const minimum = daily.temperature_2m_min[index];
        const maximum = daily.temperature_2m_max[index];
        const code = daily.weather_code[index];
        if (!isValidDate(date) || !Number.isFinite(minimum) || !Number.isFinite(maximum) || !Number.isInteger(code)) {
            throw new Error("The forecast contains an invalid day.");
        }
        days.push(new ForecastDay(date, minimum, maximum, code));
    }
    return days;
}

export { ForecastDay, createForecastDays };
