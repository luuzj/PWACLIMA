
"use client";
import { useState, useEffect } from "react";
import {
  getWeatherByCity,
  getWeatherByCoords,
  searchCities,
} from "@/lib/weather";
import InstallPrompt from "./components/InstallPrompt";

export default function Home() {
  const [city, setCity] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [citySearchCompleted, setCitySearchCompleted] = useState(false);
  const [searchingCities, setSearchingCities] = useState(false);
  const [citySearchError, setCitySearchError] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cachedWeather = localStorage.getItem("last_weather");
    if (cachedWeather) {
      setWeather(JSON.parse(cachedWeather));
    }
  }, []);

  useEffect(() => {
    const query = city.trim();
    if (selectedCity || query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSearchingCities(true);
      setCitySearchError("");
      try {
        const results = await searchCities(query, { signal: controller.signal });
        setCitySuggestions(results);
        setCitySearchCompleted(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setCitySuggestions([]);
          setCitySearchError(err.message || "Error al buscar ciudades.");
          setCitySearchCompleted(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingCities(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [city, selectedCity]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    executeFetch(() =>
      selectedCity
        ? getWeatherByCoords(selectedCity.lat, selectedCity.lon)
        : getWeatherByCity(city.trim())
    );
  };

  const handleCitySelect = (suggestion) => {
    setSelectedCity(suggestion);
    setCity(
      [suggestion.name, suggestion.state, suggestion.country]
        .filter(Boolean)
        .join(", ")
    );
    setCitySuggestions([]);
    setCitySearchCompleted(false);
    executeFetch(() =>
      getWeatherByCoords(suggestion.lat, suggestion.lon)
    );
  };

  const handleGeoLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        executeFetch(() => getWeatherByCoords(latitude, longitude));
      },
      () => setError("Permiso de ubicación denegado.")
    );
  };

  const executeFetch = async (apiCall) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiCall();
      setWeather(data);

      localStorage.setItem("last_weather", JSON.stringify(data));
    } catch (err) {
      setError(err.message || "Error al obtener datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
      {/* Encabezado */}
      <header className="w-full max-w-md flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-sky-400">WeatherPWA</h1>
        <InstallPrompt />
      </header>

      {/* Controles de Búsqueda y Ubicación */}
      <section className="w-full max-w-md space-y-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ejemplo: Oaxaca, Madrid..."
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setSelectedCity(null);
                setCitySuggestions([]);
                setCitySearchCompleted(false);
                setSearchingCities(false);
                setCitySearchError("");
              }}
              autoComplete="off"
              aria-label="Buscar ciudad"
              aria-autocomplete="list"
              aria-controls="city-suggestions"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400"
            />
            {(
              searchingCities ||
              citySuggestions.length > 0 ||
              citySearchCompleted ||
              citySearchError
            ) &&
              !selectedCity && (
                <ul
                  id="city-suggestions"
                  role="listbox"
                  className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-lg"
                >
                  {searchingCities && (
                    <li className="px-4 py-3 text-sm text-slate-400">
                      Buscando ciudades...
                    </li>
                  )}
                  {!searchingCities &&
                    citySuggestions.map((suggestion) => (
                      <li key={`${suggestion.lat}-${suggestion.lon}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected="false"
                          onClick={() => handleCitySelect(suggestion)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
                        >
                          {[
                            suggestion.name,
                            suggestion.state,
                            suggestion.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </button>
                      </li>
                    ))}
                  {!searchingCities &&
                    citySearchCompleted &&
                    citySuggestions.length === 0 &&
                    !citySearchError && (
                      <li className="px-4 py-3 text-sm text-slate-400">
                        No se encontraron ciudades.
                      </li>
                    )}
                  {citySearchError && (
                    <li className="px-4 py-3 text-sm text-red-400">
                      {citySearchError}
                    </li>
                  )}
                </ul>
              )}
          </div>
          <button
            type="submit"
            className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Buscar
          </button>
        </form>

        <button
          onClick={handleGeoLocation}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 rounded-lg text-sm text-sky-400 font-medium transition-colors"
        >
          📍 Usar mi ubicación actual
        </button>
      </section>

      {/* Indicadores de Estado */}
      {loading && <p className="text-slate-400 animate-pulse">Cargando datos del clima...</p>}
      {error && <p className="text-red-400 font-medium bg-red-950/50 p-3 rounded-lg border border-red-800">{error}</p>}

      {/* Tarjeta con los Datos del Clima */}
      {weather && !loading && (
        <article className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl text-center space-y-4">
          <h2 className="text-3xl font-bold">
            {weather.name}, {weather.sys.country}
          </h2>
          <div className="flex justify-center items-center">
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt={weather.weather[0].description}
            />
            <span className="text-5xl font-extrabold">
              {Math.round(weather.main.temp)}°C
            </span>
          </div>
          <p className="capitalize text-slate-300">
            {weather.weather[0].description}
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700 text-sm">
            <div>
              Humedad: <strong className="text-white">{weather.main.humidity}%</strong>
            </div>
            <div>
              Viento: <strong className="text-white">{weather.wind.speed} m/s</strong>
            </div>
          </div>
        </article>
      )}
    </main>
  );
}