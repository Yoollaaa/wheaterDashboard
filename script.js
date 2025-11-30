const API_KEY = 'ac2888bdc4e0f71fe632e3d41545fbd5';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

let city = 'Jakarta';
let unit = 'metric'; 
let isDark = localStorage.getItem('theme') === 'dark';
let searchTimeout; 

const ui = {
    input: document.getElementById('city-input'),
    suggestions: document.getElementById('suggestions'),
    cityName: document.getElementById('city-name'),
    dateTime: document.getElementById('date-time'),
    temp: document.getElementById('main-temp'),
    desc: document.getElementById('main-desc'),
    icon: document.getElementById('main-icon'),
    humid: document.getElementById('val-humid'),
    wind: document.getElementById('val-wind'),
    max: document.getElementById('val-max'),
    vis: document.getElementById('val-vis'),
    forecast: document.getElementById('forecast-grid'),
    favList: document.getElementById('fav-list'),
    saveBtn: document.getElementById('save-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    btnC: document.getElementById('btn-c'),
    btnF: document.getElementById('btn-f'),
    themeBtn: document.getElementById('theme-toggle')
};

window.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    updateUnitUI();
    loadFavorites();
    getWeather(city);
    
    setInterval(() => getWeather(city), 300000); 
});

async function getWeather(cityName) {
    try {
        const res = await fetch(`${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=${unit}`);
        if (!res.ok) throw new Error('Kota tidak ditemukan');
        const data = await res.json();

        const resF = await fetch(`${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=${unit}`);
        const dataF = await resF.json();

        updateCurrentUI(data);
        updateForecastUI(dataF);
        
        city = data.name; 
        checkFavoriteStatus(city);

    } catch (err) {
        alert(err.message);
    }
}

function updateCurrentUI(data) {
    ui.cityName.textContent = `${data.name}, ${data.sys.country}`;
    ui.temp.textContent = Math.round(data.main.temp);
    ui.desc.textContent = data.weather[0].description;
    ui.humid.textContent = `${data.main.humidity}%`;
    ui.wind.textContent = `${data.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}`;
    ui.max.textContent = `${Math.round(data.main.temp_max)}°`;
    ui.vis.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    ui.icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    const now = new Date();
    ui.dateTime.textContent = now.toLocaleDateString('id-ID', { 
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
    });
}

function updateForecastUI(data) {
    ui.forecast.innerHTML = '';
    const daily = data.list.filter(item => item.dt_txt.includes('12:00:00'));

    daily.forEach(day => {
        const d = new Date(day.dt * 1000);
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
        
        const card = document.createElement('div');
        card.className = 'bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl flex flex-col items-center text-center hover:bg-white dark:hover:bg-slate-600 hover:shadow-md transition duration-300';
        card.innerHTML = `
            <p class="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" class="w-10 h-10 mb-1">
            <p class="text-xl font-bold text-slate-800 dark:text-white">${Math.round(day.main.temp)}°</p>
            <p class="text-xs text-slate-400 capitalize">${day.weather[0].description}</p>
        `;
        ui.forecast.appendChild(card);
    });
}

ui.input.addEventListener('input', function() {
    const query = this.value.trim();
    clearTimeout(searchTimeout);

    if (query.length < 3) {
        ui.suggestions.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(() => fetchSuggestions(query), 300);
});

async function fetchSuggestions(query) {
    try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
        const cities = await res.json();
        renderSuggestions(cities);
    } catch (err) {
        console.error(err);
    }
}

function renderSuggestions(cities) {
    ui.suggestions.innerHTML = '';
    if (cities.length === 0) {
        ui.suggestions.classList.add('hidden');
        return;
    }

    cities.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.name}, ${c.state ? c.state + ',' : ''} ${c.country}`;
        li.className = "px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-600 last:border-0";
        
        li.addEventListener('click', () => {
            ui.input.value = c.name;
            getWeather(c.name);
            ui.suggestions.classList.add('hidden');
        });
        ui.suggestions.appendChild(li);
    });
    ui.suggestions.classList.remove('hidden');
}

document.addEventListener('click', (e) => {
    if (!ui.input.contains(e.target) && !ui.suggestions.contains(e.target)) {
        ui.suggestions.classList.add('hidden');
    }
});

ui.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && ui.input.value.trim()) {
        getWeather(ui.input.value);
        ui.suggestions.classList.add('hidden');
    }
});

function loadFavorites() {
    const favs = JSON.parse(localStorage.getItem('weatherFavs') || '[]');
    ui.favList.innerHTML = '';
    
    if (favs.length === 0) {
        ui.favList.innerHTML = '<div class="text-xs text-slate-400 italic">Belum ada favorit.</div>';
        return;
    }

    favs.forEach(c => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-3 rounded-xl shadow-sm cursor-pointer hover:border-primary transition group';
        item.innerHTML = `
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">${c}</span>
            <button onclick="removeFavorite(event, '${c}')" class="text-slate-300 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
        `;
        item.onclick = (e) => {
            if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') getWeather(c);
        };
        ui.favList.appendChild(item);
    });
}

ui.saveBtn.addEventListener('click', () => {
    let favs = JSON.parse(localStorage.getItem('weatherFavs') || '[]');
    if (favs.includes(city)) {
        favs = favs.filter(c => c !== city); 
    } else {
        favs.push(city); 
    }
    localStorage.setItem('weatherFavs', JSON.stringify(favs));
    loadFavorites();
    checkFavoriteStatus(city);
});

window.removeFavorite = (e, c) => {
    e.stopPropagation();
    let favs = JSON.parse(localStorage.getItem('weatherFavs') || '[]');
    favs = favs.filter(item => item !== c);
    localStorage.setItem('weatherFavs', JSON.stringify(favs));
    loadFavorites();
    if(city === c) checkFavoriteStatus(c);
};

function checkFavoriteStatus(c) {
    const favs = JSON.parse(localStorage.getItem('weatherFavs') || '[]');
    const icon = ui.saveBtn.querySelector('i');
    if (favs.includes(c)) {
        ui.saveBtn.classList.add('text-yellow-400', 'border-yellow-400');
        icon.classList.replace('fa-regular', 'fa-solid');
    } else {
        ui.saveBtn.classList.remove('text-yellow-400', 'border-yellow-400');
        icon.classList.replace('fa-solid', 'fa-regular');
    }
}

ui.btnC.addEventListener('click', () => setUnit('metric'));
ui.btnF.addEventListener('click', () => setUnit('imperial'));

function setUnit(newUnit) {
    if (unit !== newUnit) {
        unit = newUnit;
        updateUnitUI();
        getWeather(city);
    }
}

function updateUnitUI() {
    const activeClass = "bg-primary text-white shadow-sm";
    const inactiveClass = "text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600";
    
    if (unit === 'metric') {
        ui.btnC.className = `flex-1 py-2 rounded-lg text-sm font-semibold transition ${activeClass}`;
        ui.btnF.className = `flex-1 py-2 rounded-lg text-sm font-semibold transition ${inactiveClass}`;
    } else {
        ui.btnC.className = `flex-1 py-2 rounded-lg text-sm font-semibold transition ${inactiveClass}`;
        ui.btnF.className = `flex-1 py-2 rounded-lg text-sm font-semibold transition ${activeClass}`;
    }
}

ui.themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme();
});

function applyTheme() {
    const icon = ui.themeBtn.querySelector('i');
    if (isDark) {
        document.documentElement.classList.add('dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

ui.refreshBtn.addEventListener('click', () => {
    const icon = ui.refreshBtn.querySelector('i');
    icon.classList.add('fa-spin');
    getWeather(city).then(() => setTimeout(() => icon.classList.remove('fa-spin'), 500));
});