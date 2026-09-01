// 🔑 लाइव सैटेलाइट डेटा की एक्टिवेटेड चाबी
// ⚠️ नोट: यह key यहाँ public रहेगी क्योंकि GitHub Pages static hosting है।
// भविष्य में key छुपाने के लिए backend (Vercel/Netlify function) जरूरी होगा।
const API_KEY = "a8fdadd8c940ac96fe4ba5fc2990a784";

// 🔊 अलार्म सायरन साउंड
const alarmSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

let searchHistory = [];
let alertHistory = [];

// ================== 🌗 THEME TOGGLE ==================
function applyStoredTheme() {
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}
applyStoredTheme();

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('appTheme', isLight ? 'light' : 'dark');
});

// ================== 🔍 SEARCH ==================
document.getElementById('search-btn').addEventListener('click', () => {
    const cityInput = document.getElementById('city-input').value.trim();
    if (cityInput === "") return;
    setLoadingState(true);
    fetchLiveWeatherData(cityInput);
    fetchForecast(cityInput);
});

function setLoadingState(isLoading) {
    if (isLoading) {
        document.getElementById('temperature').innerText = "...";
        document.getElementById('weather-condition').innerText = "Loading...";
    }
}

// लाइव डेटा फ़ेच करने का फंक्शन (शहर के नाम से)
function fetchLiveWeatherData(city) {
    const url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + API_KEY + "&units=metric";

    fetch(url)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            updateAppUI(data);
            addToHistory(city);
        })
        .catch(() => {
            document.getElementById('weather-condition').innerText = "Clear Sky";
            alert("City not found! Please check the spelling.");
        });
}

// ================== 📅 7-DAY LIVE FORECAST ==================
function fetchForecast(city) {
    const url = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&appid=" + API_KEY + "&units=metric";
    fetch(url)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => renderForecast(data.list))
        .catch(() => console.log("Forecast not available for this city."));
}

function fetchForecastByCoords(lat, lon) {
    const url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + API_KEY + "&units=metric";
    fetch(url)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => renderForecast(data.list))
        .catch(() => console.log("Forecast not available for this location."));
}

function renderForecast(list) {
    const iconMap = {
        Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Snow: "❄️",
        Thunderstorm: "⛈️", Drizzle: "🌦️", Mist: "🌫️", Haze: "🌫️", Fog: "🌫️"
    };

    // डेटा को दिन के हिसाब से ग्रुप करना (API हर 3 घंटे का डेटा देता है)
    const daysMap = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().split('T')[0];
        if (!daysMap[dayKey]) daysMap[dayKey] = { temps: [], icons: [], date };
        daysMap[dayKey].temps.push(item.main.temp);
        daysMap[dayKey].icons.push(item.weather[0].main);
    });

    const dayKeys = Object.keys(daysMap).slice(0, 7);

    const dayNamesEl = document.getElementById('forecast-days');
    const iconsEl = document.getElementById('forecast-icons');
    const graphEl = document.getElementById('forecast-graph');
    dayNamesEl.innerHTML = "";
    iconsEl.innerHTML = "";
    graphEl.innerHTML = "";

    const maxTemps = dayKeys.map(k => Math.round(Math.max(...daysMap[k].temps)));
    const minTemps = dayKeys.map(k => Math.round(Math.min(...daysMap[k].temps)));
    const graphMax = Math.max(...maxTemps);
    const graphMin = Math.min(...minTemps);
    const range = (graphMax - graphMin) || 1;

    dayKeys.forEach((key, i) => {
        const day = daysMap[key];
        const dayName = day.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

        // उस दिन का सबसे ज़्यादा आने वाला weather condition चुनना
        const counts = {};
        day.icons.forEach(ic => counts[ic] = (counts[ic] || 0) + 1);
        const mainIcon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        const dayNameSpan = document.createElement('span');
        dayNameSpan.innerText = dayName;
        dayNamesEl.appendChild(dayNameSpan);

        const iconSpan = document.createElement('span');
        iconSpan.innerText = iconMap[mainIcon] || "☁️";
        iconsEl.appendChild(iconSpan);

        const max = maxTemps[i];
        const min = minTemps[i];
        const barHeight = 30 + ((max - graphMin) / range) * 60;
        const marginTop = 100 - barHeight;

        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        wrapper.innerHTML =
            '<span class="top-t">' + max + '°</span>' +
            '<div class="bar" style="height: ' + barHeight + 'px; margin-top: ' + marginTop + 'px;"></div>' +
            '<span class="bot-t">' + min + '°</span>';
        graphEl.appendChild(wrapper);
    });
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
        tag.addEventListener('click', () => {
            setLoadingState(true);
            fetchLiveWeatherData(city);
            fetchForecast(city);
        });
        container.appendChild(tag);
    });
}

// ================== 📋 अलर्ट हिस्ट्री ==================
function addToAlertHistory(title, cityName) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    alertHistory.unshift({ title, cityName, time });
    if (alertHistory.length > 5) alertHistory.pop();
    renderAlertHistory();
}

function renderAlertHistory() {
    const box = document.getElementById('alert-history-box');
    const list = document.getElementById('alert-history-list');
    list.innerHTML = "";

    if (alertHistory.length === 0) {
        box.classList.add('hidden');
        return;
    }
    box.classList.remove('hidden');

    alertHistory.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'alert-history-item';
        item.innerHTML = '<span>' + entry.title + ' — ' + entry.cityName + '</span><span>' + entry.time + '</span>';
        list.appendChild(item);
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
        alertDesc = "Dangerous winds at " + windSpeed + " km/h detected in " + cityName + "!";
    }

    if (rainEstimate > 30 || condition.includes('thunderstorm')) {
        floodRisk = "⚠️ CRITICAL DANGER";
        alertTitle = "🌊 FLOOD EMERGENCY WARNING";
        alertDesc = "Extreme rainfall active in " + cityName + "!";
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
        addToAlertHistory(alertTitle, cityName);
    } else {
        alertBox.classList.add('hidden');
    }
}

// ================== 📍 GPS LOCATION ==================
document.getElementById('gps-btn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    setLoadingState(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByCoords(lat, lon);
            fetchForecastByCoords(lat, lon);
        },
        () => {
            document.getElementById('weather-condition').innerText = "Clear Sky";
            alert("Unable to get your location. Please allow location access.");
        }
    );
});

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

// ================== 🔔 MOBILE ALERTS ==================
document.getElementById('enable-notif-btn').addEventListener('click', () => {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
    }
    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            document.getElementById('enable-notif-btn').innerText = "🔔 Alerts Enabled";
            new Notification("Disaster Alert App", { body: "Mobile alerts are now ON!" });
        } else {
            alert("You need to allow notifications for this feature to work.");
        }
    });
});
