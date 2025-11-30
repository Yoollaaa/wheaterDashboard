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
        console.error(err);
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
    
    const dailyData = {};
    const today = new Date().toISOString().split('T')[0];

    data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0]; 
        
        if (date === today) return;

        if (!dailyData[date]) {
            dailyData[date] = {
                dt: item.dt,
                icon: item.weather[0].icon,
                min: item.main.temp_min,
                max: item.main.temp_max
            };
        } else {
            dailyData[date].min = Math.min(dailyData[date].min, item.main.temp_min);
            dailyData[date].max = Math.max(dailyData[date].max, item.main.temp_max);
        }
    });

    const forecastList = Object.values(dailyData).slice(0, 5);

    forecastList.forEach(day => {
        const d = new Date(day.dt * 1000);
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'long' }); 
        
        const card = document.createElement('div');
        card.className = 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/30 dark:border-slate-700/30 p-2 rounded-2xl flex flex-col items-center text-center text-sm shadow-sm transition hover:-translate-y-1';
        
        card.innerHTML = `
            <p class="font-bold text-slate-700 dark:text-slate-300 text-[10px] md:text-xs uppercase tracking-wide mb-1">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${day.icon}.png" class="w-8 h-8 drop-shadow-sm mb-1">
            
            <div class="flex items-center gap-2 w-full justify-center">
                <div class="flex flex-col items-center leading-none">
                    <span class="text-[8px] text-slate-500 dark:text-slate-400">Max</span>
                    <span class="font-extrabold text-rose-500 text-xs md:text-sm">↑${Math.round(day.max)}°</span>
                </div>
                <div class="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
                <div class="flex flex-col items-center leading-none">
                    <span class="text-[8px] text-slate-500 dark:text-slate-400">Min</span>
                    <span class="font-extrabold text-cyan-500 text-xs md:text-sm">↓${Math.round(day.min)}°</span>
                </div>
            </div>
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
        li.className = "px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 last:border-0";
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
    if (favs.length === 0) return;

    favs.forEach(c => {
        const btn = document.createElement('button');
        btn.className = "px-3 py-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-600 rounded-lg text-xs hover:bg-white dark:hover:bg-slate-700 transition flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium shadow-sm";
        btn.innerHTML = `${c} <span class="text-red-400 hover:text-red-600 font-bold px-1" onclick="removeFavorite(event, '${c}')">&times;</span>`;
        btn.onclick = (e) => {
            if(e.target.tagName !== 'SPAN') getWeather(c);
        };
        ui.favList.appendChild(btn);
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
    if(icon) {
        if (favs.includes(c)) {
            ui.saveBtn.classList.add('text-yellow-500');
            icon.classList.replace('fa-regular', 'fa-solid');
        } else {
            ui.saveBtn.classList.remove('text-yellow-500');
            icon.classList.replace('fa-solid', 'fa-regular');
        }
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
    const activeClass = "bg-indigo-600 text-white shadow-md scale-105";
    const inactiveClass = "text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white";

    // Reset Class
    ui.btnC.className = `px-5 rounded-lg text-sm font-extrabold transition-all duration-300`;
    ui.btnF.className = `px-5 rounded-lg text-sm font-extrabold transition-all duration-300`;

    if (unit === 'metric') {
        ui.btnC.classList.add(...activeClass.split(" "));
        ui.btnF.classList.add(...inactiveClass.split(" "));
    } else {
        ui.btnC.classList.add(...inactiveClass.split(" "));
        ui.btnF.classList.add(...activeClass.split(" "));
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