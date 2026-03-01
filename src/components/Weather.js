import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const STORAGE_KEY = "forecastly_recent_cities_v1";

export default function Weather() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("metric"); // metric = °C, imperial = °F
  const [recent, setRecent] = useState([]);

  const apiKey = process.env.REACT_APP_OPENWEATHER_KEY;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setRecent(saved);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  }, [recent]);

  const canSearch = useMemo(() => city.trim().length > 0, [city]);

  function saveRecentCity(name) {
    const cleaned = name.trim();
    if (!cleaned) return;
    setRecent((prev) => {
      const next = [cleaned, ...prev.filter((c) => c.toLowerCase() !== cleaned.toLowerCase())];
      return next.slice(0, 6);
    });
  }

  function unitLabel() {
    return unit === "metric" ? "°C" : "°F";
  }

  function windLabel(speed) {
    return unit === "metric" ? `${speed} m/s` : `${speed} mph`;
  }

  async function fetchWeatherByCity(cityName) {
    const q = cityName.trim();

    if (!q) {
      setError("Please enter a city name.");
      setWeather(null);
      return;
    }

    if (!apiKey) {
      setError("Missing API key. Add REACT_APP_OPENWEATHER_KEY in your .env file.");
      setWeather(null);
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        q
      )}&appid=${apiKey}&units=${unit}`;

      const res = await axios.get(url);
      const data = res.data;

      setWeather({
        name: data.name,
        country: data.sys?.country,
        temp: data.main?.temp,
        feelsLike: data.main?.feels_like,
        humidity: data.main?.humidity,
        wind: data.wind?.speed,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon,
        main: data.weather?.[0]?.main, // for theme
      });

      saveRecentCity(data.name);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) setError("City not found. Please check the spelling and try again.");
      else if (status === 401) setError("Invalid API key. Please verify your OpenWeatherMap API key.");
      else setError("Failed to fetch weather. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeatherByCoords(lat, lon) {
    if (!apiKey) {
      setError("Missing API key. Add REACT_APP_OPENWEATHER_KEY in your .env file.");
      setWeather(null);
      return;
    }

    setGeoLoading(true);
    setError("");
    setWeather(null);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;
      const res = await axios.get(url);
      const data = res.data;

      setWeather({
        name: data.name,
        country: data.sys?.country,
        temp: data.main?.temp,
        feelsLike: data.main?.feels_like,
        humidity: data.main?.humidity,
        wind: data.wind?.speed,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon,
        main: data.weather?.[0]?.main,
      });

      saveRecentCity(data.name);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setError("Invalid API key. Please verify your OpenWeatherMap API key.");
      else setError("Could not get weather for your location.");
    } finally {
      setGeoLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    fetchWeatherByCity(city);
  }

  function onUseMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => setError("Location permission denied. Please allow location access and try again."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function toggleUnit() {
    setUnit((prev) => (prev === "metric" ? "imperial" : "metric"));
  }

  useEffect(() => {
    if (weather?.name) fetchWeatherByCity(weather.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const themeClass = useMemo(() => {
    const main = (weather?.main || "").toLowerCase();
    if (main.includes("rain") || main.includes("drizzle") || main.includes("thunder")) return "theme--rain";
    if (main.includes("snow")) return "theme--snow";
    if (main.includes("cloud")) return "theme--cloud";
    if (main.includes("clear")) return "theme--clear";
    return "theme--default";
  }, [weather]);

  useEffect(() => {
    const themeName = themeClass.replace("theme--", "");
    document.body.classList.remove("theme-default", "theme-clear", "theme-cloud", "theme-rain", "theme-snow");
    document.body.classList.add(`theme-${themeName}`);
  }, [themeClass]);

  return (
    <section className={`weather ${themeClass}`}>
      <form className="weather__search" onSubmit={onSubmit}>
        <div className="weather__topbar">
          <div>
            <label className="weather__label" htmlFor="city">City</label>
            <p className="weather__sub">Try Dubai, Los Angeles, Tokyo…</p>
          </div>

          <button type="button" className="weather__chipBtn" onClick={toggleUnit}>
            {unit === "metric" ? "°C" : "°F"} → {unit === "metric" ? "°F" : "°C"}
          </button>
        </div>

        <div className="weather__controls">
          <input
            id="city"
            className="weather__input"
            type="text"
            placeholder="e.g., Vilnius, London, Tokyo"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="off"
          />

          <button className="weather__button" type="submit" disabled={!canSearch || loading}>
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            className="weather__button weather__button--ghost"
            type="button"
            onClick={onUseMyLocation}
            disabled={geoLoading}
          >
            {geoLoading ? "Locating..." : "My Location"}
          </button>
        </div>

        {recent.length > 0 ? (
          <div className="weather__chips">
            <span className="weather__chipsLabel">Recent:</span>
            {recent.map((c) => (
              <button
                key={c}
                type="button"
                className="weather__chip"
                onClick={() => {
                  setCity(c);
                  fetchWeatherByCity(c);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="weather__error">{error}</p> : null}
      </form>

      <div className="weather__content">
        {!weather && !loading && !error ? (
          <article className="card card--hint">
            <h2>Tip</h2>
            <p>Search a city, use <b>My Location</b>, or click a recent search.</p>
          </article>
        ) : null}

        {weather ? (
          <article className="card">
            <div className="card__top">
              <div>
                <h2 className="card__title">
                  {weather.name}
                  {weather.country ? <span className="card__country"> • {weather.country}</span> : null}
                </h2>
                <p className="card__desc">{weather.description}</p>
              </div>

              {weather.icon ? (
                <img
                  className="card__icon"
                  alt={weather.description || "Weather icon"}
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                />
              ) : null}
            </div>

            <div className="card__grid">
              <div className="stat">
                <span className="stat__label">Temperature</span>
                <span className="stat__value">{Math.round(weather.temp)}{unitLabel()}</span>
              </div>

              <div className="stat">
                <span className="stat__label">Feels like</span>
                <span className="stat__value">{Math.round(weather.feelsLike)}{unitLabel()}</span>
              </div>

              <div className="stat">
                <span className="stat__label">Humidity</span>
                <span className="stat__value">{weather.humidity}%</span>
              </div>

              <div className="stat">
                <span className="stat__label">Wind</span>
                <span className="stat__value">{windLabel(weather.wind)}</span>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}