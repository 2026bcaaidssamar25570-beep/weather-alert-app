// 🔊 अलार्म सायरन साउंड सेट करना (सुरक्षित इंटरनेट ऑडियो लिंक)
const alarmSound = new Audio("https://google.com");

let searchHistory = [];

// 🌍 100% सुरक्षित स्थानीय डेटाबेस ताकि गिटहब नेटवर्क एरर न दे सके
const localDisasterDatabase = {
    mumbai: { name: "MUMBAI", country: "IN", temp: 26, condition: "rain", description: "heavy intensity rain", wind: 65, humidity: 95, rain: 140 },
    delhi: { name: "DELHI", country: "IN", temp: 42, condition: "clear", description: "extreme heatwave storm", wind: 55, humidity: 15, rain: 0 },
    shimla: { name: "SHIMLA", country: "IN", temp: 12, condition: "rain", description: "cloudburst and heavy rain", wind: 25, humidity: 88, rain: 95 },
    jaipur: { name: "JAIPUR", country: "IN", temp: 32, condition: "clear", description: "clear sky", wind: 12, humidity: 40, rain: 0 },
    london: { name: "LONDON", country: "GB", temp: 15, condition: "clouds", description: "overcast clouds", wind: 18, humidity: 75, rain: 5 },
    new_york: { name: "NEW YORK", country: "US", temp: 19, condition: "thunderstorm", description: "severe thunderstorm", wind: 70, humidity: 90, rain: 110 }
};

// मोबाइल अलर्ट बटन
document.getElementById('enable-notif-btn').addEventListener('click', () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('🎉 Emergency Mobile Alerts Activated!');
            }
        });
    }
});

// सर्च बटन क्लिक करने का काम
document.getElementById('search-btn').addEventListener('click', () => {
    const cityInput = document.getElementById('city-input').value.toLowerCase().trim().replace(" ", "_");
    if (cityInput === "") return;
    
    if (localDisasterDatabase[cityInput]) {
        processWeatherData(localDisasterDatabase[cityInput]);
    } else {
        alert("City not found! For testing, search for: Mumbai, Delhi, Shimla, Jaipur, London, or New York.");
    }
});

// 📍 GPS लाइव लोकेशन बटन (सिम्युलेटर मोड)
document.getElementById('gps-btn').addEventListener('click', () => {
    document.getElementById('city-name').innerText = "TRACKING LIVE SATELLITE...";
    setTimeout(() => {
        processWeatherData(localDisasterDatabase['jaipur']);
        alert("📍 Live Location Synced Successfully!");
    }, 1000);
});

// ⏱️ सर्च हिस्ट्री मैनेजमेंट
function addToHistory(city) {
    const formatCity = city.toUpperCase().replace("_", " ");
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
            const dbKey = city.toLowerCase().replace(" ", "_");
            processWeatherData(localDisasterDatabase[dbKey]);
        });
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
    } else if (condition.includes('rain') || condition.includes('thunder')) {
        bgUrl = "https://unsplash.com";
    } else if (condition.includes('snow')) {
        bgUrl = "https://unsplash.com";
    }
    document.body.style.backgroundImage = "url('" + bgUrl + "')";
}

// लाइव आइकॉन सेलेक्टर
function getWeatherIcon(condition) {
    if (condition.includes('cloud')) return '☁️';
    if (condition.includes('rain')) return '🌧️';
    if (condition.includes('clear')) return '☀️';
    if (condition.includes('snow')) return '❄️';
    if (condition.includes('thunder')) return '⛈️';
    return '烟 🌫️';
}

// स्क्रीन पर डेटा दिखाने और अलार्म बजाने का मुख्य इंजन
function processWeatherData(data) {
    alarmSound.pause();
    alarmSound.currentTime = 0;

    document.getElementById('city-name').innerText = data.name + ", " + data.country;
    document.getElementById('temperature').innerText = data.temp;
    document.getElementById('weather-condition').innerText = data.description;
    document.getElementById('humidity').innerText = data.humidity + "%";
    document.getElementById('wind').innerText = data.wind + " km/h";
    document.getElementById('rain').innerText = data.rain + " mm";
    document.getElementById('weather-icon-box').innerText = getWeatherIcon(data.condition);

    changeAppBackground(data.condition);
    addToHistory(data.name);

    let alertTitle = null;
    let alertDesc = null;
    let landslideRisk = "None";
    let floodRisk = "Safe";

    if (data.wind > 50) {
        alertTitle = "💨 HIGH WIND EMERGENCY";
        alertDesc = `Dangerous storm winds at ${data.wind} km/h detected in ${data.name}! Stay indoors.`;
    }
    
    if (data.rain > 40) {
        floodRisk = "⚠️ CRITICAL DANGER";
        alertTitle = "🌊 FLOOD EMERGENCY WARNING";
        alertDesc = `Extreme cloudburst and flood risk (${data.rain}mm) active in ${data.name}!`;
    }

    if (data.name === "SHIMLA" && data.rain > 30) {
        landslideRisk = "🚨 MAX CRITICAL RISK";
        alertTitle = "⛰️ LANDSLIDE DISASTER ALERT";
        alertDesc = `Active landslide danger in SHIMLA! Avoid travel.`;
    }

    document.getElementById('landslide').innerText = landslideRisk;
    document.getElementById('flood').innerText = floodRisk;

    const alertBox = document.getElementById('disaster-alert');
    if (alertTitle) {
        alertBox.classList.remove('hidden');
        document.getElementById('alert-title').innerText = alertTitle;
        document.getElementById('alert-desc').innerText = alertDesc;

        alarmSound.play().catch(e => console.log("Click on screen to enable sound."));

        if (Notification.permission === 'granted') {
            new Notification(alertTitle, { body: alertDesc });
        }
    } else {
        alertBox.classList.add('hidden');
    }
}
