// DOM Elements
const elements = {
  cityName: document.querySelector('.weather_city'),
  dateTime: document.querySelector('.weather_date_time'),
  forecast: document.querySelector('.weather_forecast'),
  icon: document.querySelector('.weather_icon'),
  temperature: document.querySelector('.weather_temperature'),
  minTemp: document.querySelector('.weather_min'),
  maxTemp: document.querySelector('.weather_max'),
  feelsLike: document.querySelector('.weather_feelsLike'),
  humidity: document.querySelector('.weather_humidity'),
  wind: document.querySelector('.weather_wind'),
  pressure: document.querySelector('.weather_pressure'),
  searchForm: document.querySelector('.weather_search'),
  suggestions: document.querySelector('.suggestions'),
  cityInput: document.querySelector('.city_name'),
  refreshBtn: document.querySelector('.refresh-btn'),
  error: document.querySelector('.error')
};

const API_KEY = '92919f71c5f1c373ae15f8dcef36a8bc';
let lastLocation = null;

// Format date and time
function formatDateTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
}

// Get country name from code
function getCountryName(code) {
  return new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
}

// Format location name
function formatLocation(name, state, country) {
  let location = name;
  if (state) location += `, ${state}`;
  location += `, ${getCountryName(country)}`;
  return location;
}

// Update weather UI
function updateWeatherUI(data) {
  const { main, name, weather, wind, sys, dt } = data;
  
  elements.cityName.textContent = formatLocation(name, '', sys.country);
  elements.dateTime.textContent = formatDateTime(dt);
  elements.forecast.textContent = weather[0].main;
  elements.icon.innerHTML = `<img src="https://openweathermap.org/img/wn/${weather[0].icon}@4x.png" alt="weather icon">`;
  elements.temperature.textContent = `${Math.round(main.temp)}°`;
  elements.minTemp.textContent = `Min: ${Math.round(main.temp_min)}°`;
  elements.maxTemp.textContent = `Max: ${Math.round(main.temp_max)}°`;
  elements.feelsLike.textContent = `${Math.round(main.feels_like)}°`;
  elements.humidity.textContent = `${main.humidity}%`;
  elements.wind.textContent = `${wind.speed} m/s`;
  elements.pressure.textContent = `${main.pressure} hPa`;
}

// Fetch weather data
async function getWeatherData(query) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error('City not found');
    
    const data = await response.json();
    elements.error.style.display = 'none';
    updateWeatherUI(data);
  } catch (error) {
    elements.error.style.display = 'block';
  }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    const data = await response.json();
    elements.error.style.display = 'none';
    updateWeatherUI(data);
  } catch (error) {
    elements.error.style.display = 'block';
  }
}

// Get city suggestions
async function getCitySuggestions(query) {
  if (query.length < 2) {
    elements.suggestions.style.display = 'none';
    return;
  }

  try {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
    const data = await response.json();

    if (data.length > 0) {
      elements.suggestions.innerHTML = '';
      data.forEach(city => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = formatLocation(city.name, city.state, city.country);
        div.addEventListener('click', () => {
          elements.cityInput.value = div.textContent;
          elements.suggestions.style.display = 'none';
          getWeatherData(city.name);
        });
        elements.suggestions.appendChild(div);
      });
      elements.suggestions.style.display = 'block';
    }
  } catch (error) {
    elements.suggestions.style.display = 'none';
  }
}

// Event Listeners
elements.searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = elements.cityInput.value.trim();
  if (city) getWeatherData(city);
  elements.cityInput.value = '';
});

elements.cityInput.addEventListener('input', (e) => {
  getCitySuggestions(e.target.value);
});

elements.refreshBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    elements.refreshBtn.classList.add('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
        elements.refreshBtn.classList.remove('loading');
      },
      (error) => {
        console.error('Error getting location:', error);
        elements.error.style.display = 'block';
        elements.refreshBtn.classList.remove('loading');
      }
    );
  }
});

document.addEventListener('click', (e) => {
  if (!elements.searchForm.contains(e.target)) {
    elements.suggestions.style.display = 'none';
  }
});

// Initial load
window.addEventListener('load', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
      },
      () => getWeatherData('London')
    );
  } else {
    getWeatherData('London');
  }
});