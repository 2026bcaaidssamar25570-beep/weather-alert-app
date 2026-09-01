// 🔑 लाइव सैटेलाइट डेटा की एक्टिवेटेड चाबी
const API_KEY = "a8fdadd8c940ac96fe4ba5fc2990a784";

// 🔊 अलार्म सायरन साउंड
const alarmSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

let searchHistory = [];

// सर्च बटन क्लिक करने पर
document.getElementById('search-btn').addEventListener('click', () => {
    const cityInput = document.getElementById('city-input').value.trim();
    if (cityInput === "") return;
    fetchLiveWeatherData(cityInput);
});

// लाइव डेटा फ़ेच करने का फंक्शन (शहर के नाम से)
function fetchLiveWeatherData(city) {
    const url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + API_KEY + "&units=metric";

    fetch(url)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            updateAppUI(data);
            addToHistory(city);
        })
        .catch(() => alert("City not found! Please check the spelling."));
}

// ⏱️ सर्च हिस्ट्री मैनेजमेंट
function addToHistory(city) {
    const formatCity = city.toUpperCase();
    if (!searchHistory.includes(formatCity)) {
        searchHistory.unshift(formatCity);
        if (searchHistory.length > 4) searchHistory.pop();
        renderHistory();
    }
}

function renderHistory() {
    const container = document.getElementById('history-tags');
    const box = document.getElementById('recent-box');
    container.innerHTML = "";
    if (searchHistory.length > 0) box.style.display = "block";

    searchHistory.forEach(city => {
        const tag = document.createElement('span');
        tag.className = 'history-tag';
        tag.innerText = city;
        tag.addEventListener('click', () => fetchLiveWeatherData(city));
        container.appendChild(tag);
    });
}

// UI और डेटा दिखाना
function updateAppUI(data) {
    alarmSound.pause();
    alarmSound.currentTime = 0;

    const cityName = data.name;
    const temp = Math.round(data.main.temp);

    const condition = data.weather[0].main.toLowerCase();
    const weatherDesc = data.weather[0].description;

    const windSpeed = Math.round(data.wind.speed * 3.6);
    const humidity = data.main.humidity;
    const rainEstimate = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) * 10 : 0;

    document.getElementById('city-name').innerText = cityName.toUpperCase() + ", " + data.sys.country;
    document.getElementById('temperature').innerText = temp;
    document.getElementById('weather-condition').innerText = weatherDesc;
    document.getElementById('humidity').innerText = humidity + "%";
    document.getElementById('wind').innerText = windSpeed + " km/h";
    document.getElementById('rain').innerText = rainEstimate + " mm";

    let alertTitle = null;
    let alertDesc = null;
    let landslideRisk = "None";
    let floodRisk = "Safe";

    if (windSpeed > 50) {
        alertTitle = "💨 HIGH WIND EMERGENCY";
        alertDesc = `Dangerous winds at ${windSpeed} km/h detected in ${cityName}!`;
    }

    if (rainEstimate > 30 || condition.includes('thunderstorm')) {
        floodRisk = "⚠️ CRITICAL DANGER";
        alertTitle = "🌊 FLOOD EMERGENCY WARNING";
        alertDesc = `Extreme rainfall active in ${cityName}!`;
    }

    if (rainEstimate > 20 && windSpeed > 30) {
        landslideRisk = "⚠️ HIGH RISK";
    }

    document.getElementById('landslide').innerText = landslideRisk;
    document.getElementById('flood').innerText = floodRisk;

    const alertBox = document.getElementById('disaster-alert');
    if (alertTitle) {
        alertBox.classList.remove('hidden');
        document.getElementById('alert-title').innerText = alertTitle;
        document.getElementById('alert-desc').innerText = alertDesc;
        alarmSound.play().catch(e => console.log("Sound played."));
    } else {
        alertBox.classList.add('hidden');
    }
}

// 📍 GPS Location Button
document.getElementById('gps-btn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByCoords(lat, lon);
        },
        () => {
            alert("Unable to get your location. Please allow location access.");
        }
    );
});

// निर्देशांक (lat/lon) से लाइव डेटा फ़ेच करना
function fetchWeatherByCoords(lat, lon) {
    const url = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + API_KEY + "&units=metric";

    fetch(url)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            updateAppUI(data);
            addToHistory(data.name);
        })
        .catch(() => alert("Could not fetch weather for your location."));
}

// 🔔 Turn On Mobile Alerts Button
document.getElementById('enable-notif-btn').addEventListener('click', () => {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
    }
    Notification.requestPermission().then((permission) => {
        if (permission ===
