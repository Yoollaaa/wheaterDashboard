/* script.js - VERSI BASIC (Hanya Core API) */

const API_KEY = 'ac2888bdc4e0f71fe632e3d41545fbd5';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

let city = 'Jakarta';
let unit = 'metric';

// DOM Elements Sederhana
const ui = {
    city: document.getElementById('city-name'),
    date: document.getElementById('date-time'),
    temp: document.getElementById('main-temp'),
    desc: document.getElementById('main-desc'),
    icon: document.getElementById('main-icon'),
    humid: document.getElementById('val-humid'),
    wind: document.getElementById('val-wind'),
    max: document.getElementById('val-max'),
    vis: document.getElementById('val-vis'),
    forecast: document.getElementById('forecast-grid')
};

// Jalankan saat load
window.addEventListener('DOMContentLoaded', () => {
    getWeather(city);
});

async function getWeather(cityName) {
    try {
        // Ambil Current Weather
        const res = await fetch(`${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=${unit}`);
        if (!res.ok) throw new Error('Kota tidak ditemukan');
        const data = await res.json();

        // Ambil Forecast
        const resF = await fetch(`${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=${unit}`);
        const dataF = await resF.json();

        updateUI(data);
        updateForecast(dataF);
    } catch (err) {
        console.log("Error:", err.message);
    }
}

function updateUI(data) {
    ui.city.textContent = `${data.name}, ${data.sys.country}`;
    ui.temp.textContent = Math.round(data.main.temp);
    ui.desc.textContent = data.weather[0].description;
    ui.humid.textContent = `${data.main.humidity}%`;
    ui.wind.textContent = `${data.wind.speed} m/s`;
    ui.max.textContent = `${Math.round(data.main.temp_max)}°`;
    ui.vis.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    ui.icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    ui.date.textContent = new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', day: 'numeric', month: 'long' 
    });
}

function updateForecast(data) {
    ui.forecast.innerHTML = '';
    const daily = data.list.filter(item => item.dt_txt.includes('12:00:00'));

    daily.forEach(day => {
        const card = document.createElement('div');
        card.className = 'bg-slate-50 p-4 rounded-2xl flex flex-col items-center text-center border';
        card.innerHTML = `
            <p class="text-sm font-bold">${new Date(day.dt * 1000).toLocaleDateString('id-ID', { weekday: 'short' })}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" class="w-10 h-10">
            <p class="text-xl font-bold">${Math.round(day.main.temp)}°</p>
        `;
        ui.forecast.appendChild(card);
    });
}