// Simple DOM selectors
const $ = selector => document.querySelector(selector);
const weather = {
  city: $('.weather_city'),
  date: $('.weather_date_time'),
  forecast: $('.weather_forecast'),
  icon: $('.weather_icon'),
  temp: $('.weather_temperature'),
  min: $('.weather_min'),
  max: $('.weather_max'),
  feels: $('.weather_feelsLike'),
  humidity: $('.weather_humidity'),
  wind: $('.weather_wind'),
  pressure: $('.weather_pressure')
};

const searchForm = $('.weather_search');
const searchInput = $('.city_name');
const suggestions = $('.suggestions');
const refreshBtn = $('.refresh-btn');
const errorMsg = $('.error');

const API_KEY = '92919f71c5f1c373ae15f8dcef36a8bc';

// Update weather display
function updateWeather(data) {
  const { main, name, weather: w, wind, sys, dt } = data;
  
  weather.city.textContent = `${name}, ${new Intl.DisplayNames(['en'], { type: 'region' }).of(sys.country)}`;
  weather.date.textContent = new Date(dt * 1000).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
  
  weather.forecast.textContent = w[0].main;
  weather.icon.innerHTML = `<img src="https://openweathermap.org/img/wn/${w[0].icon}@4x.png" alt="weather">`;
  weather.temp.textContent = `${Math.round(main.temp)}°`;
  weather.min.textContent = `Min: ${Math.round(main.temp_min)}°`;
  weather.max.textContent = `Max: ${Math.round(main.temp_max)}°`;
  weather.feels.textContent = `${Math.round(main.feels_like)}°`;
  weather.humidity.textContent = `${main.humidity}%`;
  weather.wind.textContent = `${wind.speed} m/s`;
  weather.pressure.textContent = `${main.pressure} hPa`;
}

// Fetch weather
async function getWeather(query) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${API_KEY}`);
    if (!res.ok) throw new Error();
    
    const data = await res.json();
    errorMsg.style.display = 'none';
    updateWeather(data);
  } catch {
    errorMsg.style.display = 'block';
  }
}

// Get weather by location
async function getWeatherByLocation(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    const data = await res.json();
    errorMsg.style.display = 'none';
    updateWeather(data);
  } catch {
    errorMsg.style.display = 'block';
  }
}

// Search suggestions
async function showSuggestions(query) {
  if (query.length < 2) {
    suggestions.style.display = 'none';
    return;
  }

  try {
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
    const cities = await res.json();

    if (cities.length) {
      suggestions.innerHTML = cities.map(city => `
        <div class="suggestion-item">
          ${city.name}${city.state ? `, ${city.state}` : ''}, ${new Intl.DisplayNames(['en'], { type: 'region' }).of(city.country)}
        </div>
      `).join('');
      
      suggestions.style.display = 'block';
      suggestions.querySelectorAll('.suggestion-item').forEach((item, i) => {
        item.onclick = () => {
          searchInput.value = item.textContent;
          suggestions.style.display = 'none';
          getWeather(cities[i].name);
        };
      });
    }
  } catch {
    suggestions.style.display = 'none';
  }
}

// Event listeners
searchForm.onsubmit = e => {
  e.preventDefault();
  const city = searchInput.value.trim();
  if (city) getWeather(city);
  searchInput.value = '';
};

searchInput.oninput = e => showSuggestions(e.target.value);

refreshBtn.onclick = () => {
  if (navigator.geolocation) {
    refreshBtn.classList.add('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        getWeatherByLocation(lat, lon);
        refreshBtn.classList.remove('loading');
      },
      () => {
        errorMsg.style.display = 'block';
        refreshBtn.classList.remove('loading');
      }
    );
  }
};

document.onclick = e => {
  if (!searchForm.contains(e.target)) {
    suggestions.style.display = 'none';
  }
};

// Initial load
window.onload = () => {
  navigator.geolocation?.getCurrentPosition(
    pos => getWeatherByLocation(pos.coords.latitude, pos.coords.longitude),
    () => getWeather('London')
  );
};