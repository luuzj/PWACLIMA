const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEOCODING_URL = "https://api.openweathermap.org/geo/1.0";

export async function getWeatherByCity(city) {
  const res = await fetch(
    `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&lang=es&appid=${API_KEY}`
  );
  if (!res.ok) {
    throw new Error("No se encontró la ciudad solicitada.");
  }
  return res.json();
}

export async function searchCities(query, { signal } = {}) {
  const res = await fetch(
    `${GEOCODING_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`,
    { signal }
  );
  if (!res.ok) {
    throw new Error("No se pudieron buscar ciudades. Inténtalo de nuevo.");
  }
  return res.json();
}

export async function getWeatherByCoords(lat, lon) {
  const res = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`
  );
  if (!res.ok) {
    throw new Error("Error al consultar el clima para tu ubicación.");
  }
  return res.json();
}