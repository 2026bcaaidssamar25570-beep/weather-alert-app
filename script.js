// 🔑 आपकी एक्टिवेटेड और वर्किंग पर्सनल चाबी
const API_KEY = "a8fdadd8c940ac96fe4ba5fc2990a784"; 

// 🔊 अलार्म सायरन साउंड (सुरक्षित HTTPS लिंक)
const alarmSound = new Audio("https://google.com");

let searchHistory = [];

// मोबाइल अलर्ट ऑन बटन
document.getElementById('enable-notif-btn').addEventListener('click', () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('🎉 Emergency Mobile Alerts Activated!');
            }
        });
    }
});

// सर्च बटन क्लिक करने पर
document.getElementById('search-btn').addEventListener('click', () => {
    const cityInput = document.getElementById('city-input').value.trim();
    if (cityInput === "") return;
    fetchLiveWeatherData(cityInput);
});

// 📍 GPS लाइव लोकेशन बटन
document.getElementById('gps-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
        document.getElementById('city-name').innerText = "TRACKING SATELLITE...";
        
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // ✅ बिल्कुल सटीक और शुद्ध URL लिंक
            const url = "https://openweathermap.org" + lat + "&lon=" + lon + "&appid=" + API_KEY + "&units=metric";
            
            fetch(url)
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(data => updateAppUI(data))
                .catch(() => {
                    alert("GPS Weather Fetch Failed.");
                    document.getElementById('city-name').innerText = "SELECT A CITY";
                });
        }, () => {
            alert("GPS Access Denied. Please enable location.");
            document.getElementById('city-name').innerText = "SELECT A CITY";
        });
    } else {
        alert("GPS not supported on this browser.");
    }
});

// लाइव डेटा फ़ेच करने का फंक्शन
function fetchLiveWeatherData(city) {
    // ✅ बिल्कुल सटीक और शुद्ध सर्च URL लिंक
    const url = "https://openweathermap.org" + city + "&appid=" + API_KEY + "&units=metric";

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

// 🖼️ मौसम के हिसाब से लाइव बैकग्राउंड बदलना
function changeAppBackground(condition) {
    let bgUrl = "https://unsplash.com";

    if (condition.includes('clear')) {
        bgUrl = "https://unsplash.com";
    } else if (condition.includes('cloud')) {
        bgUrl = "https://unsplash.com";
    } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunder')) {
        bgUrl = "https://unsplash.com";
    } else if (condition.includes('snow')) {
        bgUrl = "https://unsplash.com";
    }
    document.body.style.backgroundImage = "url('" + bgUrl + "')";
}

// लाइव आइकॉन सेलेक्टर
function getWeatherIcon(condition) {
    if (condition.includes('cloud')) return '☁️';
    if (condition.includes('rain') || condition.includes('drizzle')) return '🌧️';
    if (condition.includes('clear')) return '☀️';
    if (condition.includes('snow')) return '❄️';
    if (condition.includes('thunder')) return '⛈️';
    return '烟 🌫️';
}

// UI और आपदा चेतावनियाँ अपडेट करना
function updateAppUI(data) {
    alarmSound.pause();
    alarmSound.currentTime = 0;

    const cityName = data.name;
    const temp = Math.round(data.main.temp);
    
    // ✅ यहाँ एरे फॉर्मेट को पूरी तरह सही कर दिया गया है
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
    document.getElementById('weather-icon-box').innerText = getWeatherIcon(condition);

    changeAppBackground(condition);

    let alertTitle = null;
    let alertDesc = null;
    let landslideRisk = "None";
    let floodRisk = "Safe";

    if (windSpeed > 50) {
        alertTitle = "💨 HIGH WIND EMERGENCY";
        alertDesc = `Dangerous gale winds at ${windSpeed} km/h detected in ${cityName}! Secure property and stay indoors.`;
    }
    
    if (rainEstimate > 30 || condition.includes('thunderstorm')) {
        floodRisk = "⚠️ CRITICAL DANGER";
        alertTitle = "🌊 FLOOD EMERGENCY WARNING";
        alertDesc = `Extreme rainfall and flood risk active in ${cityName}! Avoid low-lying areas.`;
    }

    const hillyRegions = ["shimla", "manali", "dehradun", "srinagar", "leh", "darjeeling", "guwahati"];
    if (hillyRegions.includes(cityName.toLowerCase()) && (rainEstimate > 10 || condition.includes('rain'))) {
        landslideRisk = "🚨 HIGH RISK";
        alertTitle = "⛰️ LANDSLIDE DISASTER ALERT";
        alertDesc = `Mountain terrain instability detected in ${cityName} due to rain. High probability of mudslides!`;
    }

    document.getElementById('landslide').innerText = landslideRisk;
    document.getElementById('flood').innerText = floodRisk;

    const alertBox = document.getElementById('disaster-alert');
    if (alertTitle) {
        alertBox.classList.remove('hidden');
        document.getElementById('alert-title').innerText = alertTitle;
        document.getElementById('alert-desc').innerText = alertDesc;

        alarmSound.play().catch(e => console.log("Sound play required interaction."));

        if (Notification.permission === 'granted') {
            new Notification(alertTitle, { body: alertDesc });
        }
    } else {
        alertBox.classList.add('hidden');
    }
}
