// 🔑 लाइव सैटेलाइट डेटा की एक्टिवेटेड चाबी
// ⚠️ नोट: यह key यहाँ public रहेगी क्योंकि GitHub Pages static hosting है।
// भविष्य में key छुपाने के लिए backend (Vercel/Netlify function) जरूरी होगा।
const API_KEY = "a8fdadd8c940ac96fe4ba5fc2990a784";

// 🔊 अलार्म सायरन साउंड
const alarmSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

let searchHistory = [];
let alertHistory = [];
let lastAlertTitle = null;
let currentQuery = null; // { type: 'city'|'coords', city, lat, lon }
let currentAlertShareText = "";

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
    runFullUpdate({ type: 'city', city: cityInput });
});

function setLoadingState() {
    document.getElementById('temperature').innerText = "...";
    document.getElementById('weather-condition').innerText = "Loading...";
}

// एक जगह से पूरा डेटा (current + forecast + hourly + AQI) लाने वाला फंक्शन
function runFullUpdate(query) {
    setLoadingState();
    currentQuery = query;

    if (query.type === 'city') {
        fetchLiveWeatherData(query.city);
        fetchForecast(query.city);
    } else {
        fetchWeatherByCoords(query.lat, query.lon);
        fetchForecastByCoords(query.lat, query.lon);
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
            fetchAQI(data.coord.lat, data.coord.lon);
        })
        .catch(() => {
            document.getElementById('weather-condition').innerText = "Clear Sky";
            alert("City not found! Please check the spelling.");
        });
}

// ================== 📅 FORECAST (7-day + hourly) ==================
function fetchForecast(city) {
    const url = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&appid=" + API_KEY + "&units=metric";
    fetch(url)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            renderForecast(data.list);
            renderHourly(data.list);
        })
        .catch(() => console.log("Forecast not available for this city."));
}

function fetchForecastByCoords(lat, lon) {
    const url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + API_KEY + "&units=metric";
    fetch(url)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            renderForecast(data.list);
            renderHourly(data.list);
        })
        .catch(() => console.log("Forecast not available for this location."));
}

const ICON_MAP = {
    Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Snow: "❄️",
    Thunderstorm: "⛈️", Drizzle: "🌦️", Mist: "🌫️", Haze: "🌫️", Fog: "🌫️"
};

function renderForecast(list) {
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

        const counts = {};
        day.icons.forEach(ic => counts[ic] = (counts[ic] || 0) + 1);
        const mainIcon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        const dayNameSpan = document.createElement('span');
        dayNameSpan.innerText = dayName;
        dayNamesEl.appendChild(dayNameSpan);

        const iconSpan = document.createElement('span');
        iconSpan.innerText = ICON_MAP[mainIcon] || "☁️";
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

// ⏰ अगले 24 घंटे का पूर्वानुमान (हर 3 घंटे पर)
function renderHourly(list) {
    const container = document.getElementById('hourly-scroll');
    container.innerHTML = "";

    const next8 = list.slice(0, 8); // 8 x 3hr = 24 घंटे
    next8.forEach(item => {
        const date = new Date(item.dt * 1000);
        let hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12; hours = hours ? hours : 12;
        const timeLabel = hours + (ampm === 'AM' ? 'am' : 'pm');

        const icon = ICON_MAP[item.weather[0].main] || "☁️";
        const temp = Math.round(item.main.temp);

        const el = document.createElement('div');
        el.className = 'hourly-item';
        el.innerHTML =
            '<span class="h-time">' + timeLabel + '</span>' +
            '<span class="h-icon">' + icon + '</span>' +
            '<span class="h-temp">' + temp + '°</span>';
        container.appendChild(el);
    });
}

// ================== 🌫️ AIR QUALITY (AQI) ==================
function fetchAQI(lat, lon) {
    const url = "https://api.openweathermap.org/data/2.5/air_pollution?lat=" + lat + "&lon=" + lon + "&appid=" + API_KEY;
    fetch(url)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            const aqi = data.list[0].main.aqi; // 1 to 5
            const labels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Hazardous" };
            document.getElementById('aqi').innerText = aqi + " (" + labels[aqi] + ")";
        })
        .catch(() => {
            document.getElementById('aqi').innerText = "--";
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
        tag.addEventListener('click', () => runFullUpdate({ type: 'city', city }));
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

// ================== 📊 TEMPERATURE HISTORY (localStorage) ==================
function saveTempHistory(cityName, temp) {
    const key = 'tempHistory_' + cityName.toUpperCase();
    let history = JSON.parse(localStorage.getItem(key) || "[]");
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    const existingIndex = history.findIndex(h => h.date === today);
    if (existingIndex >= 0) {
        history[existingIndex].temp = temp;
    } else {
        history.push({ date: today, temp });
    }
    if (history.length > 7) history = history.slice(history.length - 7);

    localStorage.setItem(key, JSON.stringify(history));
    return history;
}

function renderTempHistory(cityName) {
    const key = 'tempHistory_' + cityName.toUpperCase();
    const history = JSON.parse(localStorage.getItem(key) || "[]");
    const graph = document.getElementById('temp-history-graph');
    graph.innerHTML = "";

    if (history.length === 0) {
        graph.innerHTML = '<p style="color: var(--secondary-text); font-size: 0.8rem;">Is shehar ke liye abhi tak koi history save nahi hui. Roz search karo to yahan trend dikhega.</p>';
        return;
    }

    const temps = history.map(h => h.temp);
    const maxT = Math.max(...temps);
    const minT = Math.min(...temps);
    const range = (maxT - minT) || 1;

    history.forEach(entry => {
        const barHeight = 30 + ((entry.temp - minT) / range) * 60;
        const marginTop = 100 - barHeight;
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        wrapper.innerHTML =
            '<span class="top-t">' + entry.temp + '°</span>' +
            '<div class="bar" style="height: ' + barHeight + 'px; margin-top: ' + marginTop + 'px;"></div>' +
            '<span class="bot-t">' + entry.date + '</span>';
        graph.appendChild(wrapper);
    });
}

document.getElementById('toggle-history-btn').addEventListener('click', () => {
    const box = document.getElementById('temp-history-box');
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden') && currentQuery) {
        const cityForHistory = currentQuery.type === 'city' ? currentQuery.city : document.getElementById('city-name').innerText;
        renderTempHistory(cityForHistory);
    }
});

// ================== 📤 SHARE ALERT ==================
document.getElementById('share-alert-btn').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: "Disaster Alert",
            text: currentAlertShareText
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(currentAlertShareText).then(() => {
            alert("Share supported nahi hai is browser me. Alert message copy kar diya gaya hai — WhatsApp/SMS me paste kar do.");
        });
    }
});

// UI और डेटा दिखाना
function updateAppUI(data) {
    alarmSound.pause();
    alarmSound.currentTime = 0;

    const cityName = data.name;
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);

    const condition = data.weather[0].main.toLowerCase();
    const weatherDesc = data.weather[0].description;

    const windSpeed = Math.round(data.wind.speed * 3.6);
    const humidity = data.main.humidity;
    const rainEstimate = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) * 10 : 0;

    document.getElementById('city-name').innerText = cityName.toUpperCase() + ", " + data.sys.country;
    document.getElementById('temperature').innerText = temp;
    document.getElementById('weather-condition').innerText = weatherDesc;
    document.getElementById('feels-like').innerText = feelsLike;
    document.getElementById('humidity').innerText = humidity + "%";
    document.getElementById('wind').innerText = windSpeed + " km/h";
    document.getElementById('rain').innerText = rainEstimate + " mm";

    // 🌅 Sunrise / Sunset (शहर के local time zone के हिसाब से)
    document.getElementById('sunrise').innerText = formatUnixToLocalTime(data.sys.sunrise, data.timezone);
    document.getElementById('sunset').innerText = formatUnixToLocalTime(data.sys.sunset, data.timezone);

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
    const shareBtn = document.getElementById('share-alert-btn');

    if (alertTitle) {
        alertBox.classList.remove('hidden');
        document.getElementById('alert-title').innerText = alertTitle;
        document.getElementById('alert-desc').innerText = alertDesc;

        // 🔔 अगर यह नया alert है (पहले वाले से अलग) तो notification भेजो, भले ही user कहीं और हो
        if (alertTitle !== lastAlertTitle && Notification.permission === "granted") {
            new Notification(alertTitle, { body: alertDesc });
        }
        lastAlertTitle = alertTitle;

        alarmSound.play().catch(e => console.log("Sound played."));
        addToAlertHistory(alertTitle, cityName);

        currentAlertShareText = alertTitle + " — " + alertDesc;
        shareBtn.classList.remove('hidden');
    } else {
        alertBox.classList.add('hidden');
        shareBtn.classList.add('hidden');
        lastAlertTitle = null;
    }

    // 📊 temperature history में आज का temp save करना
    saveTempHistory(cityName, temp);
}

function formatUnixToLocalTime(unixSeconds, tzOffsetSeconds) {
    const date = new Date((unixSeconds + tzOffsetSeconds) * 1000);
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12; hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutesStr + ' ' + ampm;
}

// ================== 📍 GPS LOCATION ==================
document.getElementById('gps-btn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    setLoadingState();
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            runFullUpdate({ type: 'coords', lat, lon });
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
            fetchAQI(lat, lon);
        })
        .catch(() => alert("Could not fetch weather for your location."));
}

// ================== 🔔 MOBILE ALERTS + AUTO-REFRESH ==================
document.getElementById('enable-notif-btn').addEventListener('click', () => {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
    }
    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            document.getElementById('enable-notif-btn').innerText = "🔔 Alerts Enabled (Auto-Checking)";
            new Notification("Disaster Alert App", { body: "Mobile alerts are now ON! App will auto-check every 15 minutes." });
        } else {
            alert("You need to allow notifications for this feature to work.");
        }
    });
});

// हर 15 मिनट में currently searched city/location का डेटा फिर से चेक करना
// ⚠️ नोट: यह सिर्फ तभी काम करेगा जब browser tab खुला रहेगा (सच्चा background नहीं, उसके लिए Service Worker चाहिए)
setInterval(() => {
    if (currentQuery) {
        if (currentQuery.type === 'city') {
            fetchLiveWeatherData(currentQuery.city);
        } else {
            fetchWeatherByCoords(currentQuery.lat, currentQuery.lon);
        }
    }
}, 15 * 60 * 1000); // 15 मिनट
