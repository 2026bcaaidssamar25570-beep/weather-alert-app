// 🔑 लाइव सैटेलाइट डेटा की वर्किंग चाबी (API Key)
const API_KEY = "84931a742095368a5c4e97669d0d3de3"; 

// 🔊 असली अलार्म सायरन साउंड का सही इंटरनेट लिंक
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

// सर्च बटन क्लिक करने पर (यह सीधे सैटेलाइट सर्वर से असली डेटा लाएगा)
document.getElementById('search-btn').addEventListener('click', () => {
    const cityInput = document.getElementById('city-input').value.trim();
    if (cityInput === "") return;
    fetchLiveWeatherData(cityInput);
});

// 📍 GPS लाइव लोकेशन बटन (असली डिवाइस का GPS लोकेशन)
document.getElementById('gps-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
        document.getElementById('city-name').innerText = "TRACKING SATELLITE...";
        
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
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
    }
});

// इंटरनेट सर्वर से किसी भी शहर का लाइव डेटा खींचने का फंक्शन
function fetchLiveWeatherData(city) {
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
        tag.addEventListener('click', () => fetchLiveWeatherData(city)); // दोबारा क्लिक करने पर लाइव सर्च
        container.appendChild(tag);
    });
}

// 🖼️ मौसम के हिसाब से बैकग्राउंड की असली फोटो बदलने का फंक्शन
function changeAppBackground(condition) {
    let bgUrl = "https://unsplash.com"; // डिफॉल्ट तूफानी

    if (condition.includes('clear')) {
        bgUrl = "https://unsplash.com"; // धूप
    } else if (condition.includes('cloud')) {
        bgUrl = "https://unsplash.com"; // बादल
    } else if (condition.includes('rain') || condition.includes('thunder')) {
        bgUrl = "https://unsplash.com"; // बारिश
    } else if (condition.includes('snow')) {
        bgUrl = "https://unsplash.com"; // बर्फ
    }
    document.body.style.backgroundImage = "url('" + bgUrl + "')";
}

function getWeatherIcon(condition) {
    if (condition.includes('cloud')) return '☁️';
    if (condition.includes('rain')) return '🌧️';
    if (condition.includes('clear')) return '☀️';
    if (condition.includes('snow')) return '❄️';
    if (condition.includes('thunder')) return '⛈️';
    return '🌫️';
}

// लाइव डेटा को स्क्रीन पर सेट करने और आटोमेटिक आपदा चेक करने का इंजन
function updateAppUI(data) {
    alarmSound.pause();
    alarmSound.currentTime = 0;

    const cityName = data.name;
    const temp = Math.round(data.main.temp);
    const condition = data.weather[0].main.toLowerCase(); // ओपनवेदर का एरे फिक्स किया
    const weatherDesc = data.weather[0].description;
    const windSpeed = Math.round(data.wind.speed * 3.6);
    const humidity = data.main.humidity;
    
    // लाइव बारिश मापना
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

    // 1. लाइव आंधी-तूफान अलर्ट
    if (windSpeed > 50) {
        alertTitle = "💨 HIGH WIND EMERGENCY";
        alertDesc = `Dangerous gale winds at ${windSpeed} km/h detected in ${cityName}! Secure property and stay indoors.`;
    }
    
    // 2. लाइव बाढ़ अलर्ट
    if (rainEstimate > 30 || condition.includes('thunderstorm')) {
        floodRisk = "⚠️ CRITICAL DANGER";
        alertTitle = "🌊 FLOOD EMERGENCY WARNING";
        alertDesc = `Extreme rainfall and flood risk active in ${cityName}! Avoid low-lying areas.`;
    }

    // 3. पहाड़ी इलाके में लाइव लैंडस्लाइड अलर्ट
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

        alarmSound.play().catch(e => console.log("Click on screen first to enable alarm."));

        if (Notification.permission === 'granted') {
            new Notification(alertTitle, { body: alertDesc });
        }
    } else {
        alertBox.classList.add('hidden');
    }
}
