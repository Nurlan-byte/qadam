import { formatDate, isValidDate } from "./shared.js";

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

    getSummary() {
        if (this.code === 0) return "Clear sky";
        if (this.code <= 3) return "Partly cloudy or overcast";
        if ([45, 48].includes(this.code)) return "Fog";
        if (this.code >= 51 && this.code <= 57) return "Drizzle";
        if (this.code >= 61 && this.code <= 67) return "Rain";
        if (this.code >= 71 && this.code <= 77) return "Snow";
        if (this.code >= 80 && this.code <= 82) return "Rain showers";
        if ([85, 86].includes(this.code)) return "Snow showers";
        if (this.code >= 95) return "Thunderstorms";
        return "Mixed conditions";
    }

    getPlanHint() {
        return this.code <= 3 ? "Consider your outdoor tasks." : "Keep indoor tasks as an option.";
    }
}

function createForecastDays(daily) {
    const keys = ["time", "temperature_2m_min", "temperature_2m_max", "weather_code"];
    if (!daily || !keys.every((key) => Array.isArray(daily[key]))) {
        throw new Error("The forecast is incomplete.");
    }
    if (!keys.every((key) => daily[key].length === daily.time.length)) {
        throw new Error("The forecast is incomplete.");
    }
    return daily.time.slice(0, 5).map((date, index) => {
        const minimum = daily.temperature_2m_min[index];
        const maximum = daily.temperature_2m_max[index];
        const code = daily.weather_code[index];
        if (!isValidDate(date) || !Number.isFinite(minimum) || !Number.isFinite(maximum) ||
            minimum > maximum || !Number.isInteger(code) || code < 0 || code > 99) {
            throw new Error("The forecast contains an invalid day.");
        }
        return new ForecastDay(date, minimum, maximum, code);
    });
}

export { ForecastDay, createForecastDays };
