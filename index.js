let cityName = document.querySelector(".weather_city");
let dateTime = document.querySelector(".weather_date_time");
let w_forecast = document.querySelector(".weather_forecast");
let w_icon = document.querySelector(".weather_icon");
let w_temperature = document.querySelector(".weather_temperature");
let w_minTem = document.querySelector(".weather_min");
let w_maxTem = document.querySelector(".weather_max");

let w_feelsLike = document.querySelector(".weather_feelsLike");
let w_humidity = document.querySelector(".weather_humidity");
let w_wind = document.querySelector(".weather_wind");
let w_pressure = document.querySelector(".weather_pressure");

let citySearch = document.querySelector(".weather_search");
let suggestionsContainer = document.querySelector(".suggestions");
let cityInput = document.querySelector(".city_name");

let city = "Patna";
let lastLocation = null;
const MIN_DISTANCE_CHANGE = 1000; // Minimum distance in meters to trigger update
const refreshBtn = document.querySelector(".refresh-btn");

// to get the actual country name
const getCountryName = (code) => {
  return new Intl.DisplayNames([code], { type: "region" }).of(code);
};

// to get the date and time

const getDateTime = (dt) => {
  const curDate = new Date(dt * 1000); // Convert seconds to milliseconds
  console.log(curDate);
  // // const date = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  console.log(formatter);
  return formatter.format(curDate);
};

// Function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Function to format location name
const formatLocationName = (name, localName, state, country) => {
  let locationName = name;
  if (localName && localName !== name) {
    locationName += ` (${localName})`;
  }
  if (state) {
    locationName += `, ${state}`;
  }
  locationName += `, ${getCountryName(country)}`;
  return locationName;
};

// Function to get weather by coordinates
const getWeatherByCoordinates = async (lat, lon) => {
  refreshBtn.classList.add("loading");

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&APPID=92919f71c5f1c373ae15f8dcef36a8bc`;

  try {
    const res = await fetch(weatherUrl);
    if (res.status === 404) {
      document.querySelector(".error").style.display = "block";
    } else {
      document.querySelector(".error").style.display = "none";
      const data = await res.json();
      const { main, name, weather, wind, sys, dt } = data;

      // Get detailed location information from reverse geocoding
      const reverseGeocodeUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=92919f71c5f1c373ae15f8dcef36a8bc`;
      const reverseRes = await fetch(reverseGeocodeUrl);
      const reverseData = await reverseRes.json();
      const locationDetails = reverseData[0] || {};
      const state = locationDetails.state || "";
      const localName =
        locationDetails.local_names?.en || locationDetails.name || "";

      cityName.innerHTML = formatLocationName(
        name,
        localName,
        state,
        sys.country
      );
      dateTime.innerHTML = getDateTime(dt);

      w_forecast.innerHTML = weather[0].main;
      w_icon.innerHTML = `<img src="http://openweathermap.org/img/wn/${weather[0].icon}@4x.png" />`;

      w_temperature.innerHTML = `${main.temp}&#176`;
      w_minTem.innerHTML = `Min: ${main.temp_min.toFixed()}&#176`;
      w_maxTem.innerHTML = `Max: ${main.temp_max.toFixed()}&#176`;

      w_feelsLike.innerHTML = `${main.feels_like.toFixed(2)}&#176`;
      w_humidity.innerHTML = `${main.humidity}%`;
      w_wind.innerHTML = `${wind.speed} m/s`;
      w_pressure.innerHTML = `${main.pressure} hPa`;
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    document.querySelector(".error").style.display = "block";
  } finally {
    refreshBtn.classList.remove("loading");
  }
};

// Function to handle location success
const handleLocationSuccess = (position) => {
  const { latitude, longitude } = position.coords;

  if (lastLocation) {
    const distance = calculateDistance(
      lastLocation.latitude,
      lastLocation.longitude,
      latitude,
      longitude
    );

    if (distance >= MIN_DISTANCE_CHANGE) {
      lastLocation = { latitude, longitude };
      getWeatherByCoordinates(latitude, longitude);
    }
  } else {
    lastLocation = { latitude, longitude };
    getWeatherByCoordinates(latitude, longitude);
  }
};

// Function to handle location error
const handleLocationError = (error) => {
  console.error("Error getting location:", error);
  const errorElement = document.createElement("div");
  errorElement.className = "location-error";
  errorElement.textContent =
    "Unable to get your location. Please check your browser settings.";
  document.querySelector(".weather_header").appendChild(errorElement);
  errorElement.style.display = "block";

  // Fallback to default city
  getWeatherData();
};

// Function to get current location
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
    getWeatherData();
  }
};

// Add click event listener to refresh button
refreshBtn.addEventListener("click", () => {
  getCurrentLocation();
});

// Watch for location changes
const watchLocation = () => {
  if (navigator.geolocation) {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );
  }
};

// Get weather for current location when page loads
document.addEventListener("DOMContentLoaded", () => {
  getCurrentLocation();
  watchLocation();
});

// search functionality
citySearch.addEventListener("submit", (e) => {
  e.preventDefault();

  let cityName = document.querySelector(".city_name");
  const inputValue = cityName.value.trim();

  if (inputValue) {
    // Extract just the city name from the formatted string (everything before the first comma)
    city = inputValue.split(",")[0].trim();
    getWeatherData();
  }

  cityName.value = "";
});

const getWeatherData = async () => {
  let weatherUrl;

  // If we have complete city data from a suggestion, use coordinates
  if (window.selectedCity) {
    weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${window.selectedCity.lat}&lon=${window.selectedCity.lon}&units=metric&APPID=92919f71c5f1c373ae15f8dcef36a8bc`;
    // Clear the selected city data after using it
    window.selectedCity = null;
  } else {
    weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&APPID=92919f71c5f1c373ae15f8dcef36a8bc`;
  }

  try {
    const res = await fetch(weatherUrl);
    if (res.status === 404) {
      document.querySelector(".error").style.display = "block";
    } else {
      document.querySelector(".error").style.display = "none";
      const data = await res.json();
      const { main, name, weather, wind, sys, dt } = data;

      // Get detailed location information from geocoding
      const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${name}&limit=1&appid=92919f71c5f1c373ae15f8dcef36a8bc`;
      const geocodeRes = await fetch(geocodeUrl);
      const geocodeData = await geocodeRes.json();
      const locationDetails = geocodeData[0] || {};
      const state = locationDetails.state || "";
      const localName =
        locationDetails.local_names?.en || locationDetails.name || "";

      cityName.innerHTML = formatLocationName(
        name,
        localName,
        state,
        sys.country
      );
      dateTime.innerHTML = getDateTime(dt);

      w_forecast.innerHTML = weather[0].main;
      w_icon.innerHTML = `<img src="http://openweathermap.org/img/wn/${weather[0].icon}@4x.png" />`;

      w_temperature.innerHTML = `${main.temp}&#176`;
      w_minTem.innerHTML = `Min: ${main.temp_min.toFixed()}&#176`;
      w_maxTem.innerHTML = `Max: ${main.temp_max.toFixed()}&#176`;

      w_feelsLike.innerHTML = `${main.feels_like.toFixed(2)}&#176`;
      w_humidity.innerHTML = `${main.humidity}%`;
      w_wind.innerHTML = `${wind.speed} m/s`;
      w_pressure.innerHTML = `${main.pressure} hPa`;
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    document.querySelector(".error").style.display = "block";
  }
};

// Function to fetch city suggestions
const getCitySuggestions = async (query) => {
  if (query.length < 2) {
    suggestionsContainer.style.display = "none";
    return;
  }

  const suggestionsUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=92919f71c5f1c373ae15f8dcef36a8bc`;

  try {
    const res = await fetch(suggestionsUrl);
    const data = await res.json();

    if (data.length > 0) {
      suggestionsContainer.innerHTML = "";
      data.forEach((city) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.className = "suggestion-item";
        const localName = city.local_names?.en || city.name || "";
        const formattedLocation = formatLocationName(
          city.name,
          localName,
          city.state,
          city.country
        );
        suggestionItem.textContent = formattedLocation;
        suggestionItem.addEventListener("click", () => {
          cityInput.value = formattedLocation;
          suggestionsContainer.style.display = "none";
          // Store the complete city data
          window.selectedCity = {
            name: city.name,
            state: city.state,
            country: city.country,
            lat: city.lat,
            lon: city.lon,
          };
          city = city.name;
          getWeatherData();
        });
        suggestionsContainer.appendChild(suggestionItem);
      });
      suggestionsContainer.style.display = "block";
    } else {
      suggestionsContainer.style.display = "none";
    }
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    suggestionsContainer.style.display = "none";
  }
};

// Add input event listener for city suggestions
cityInput.addEventListener("input", (e) => {
  getCitySuggestions(e.target.value);
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!citySearch.contains(e.target)) {
    suggestionsContainer.style.display = "none";
  }
});
