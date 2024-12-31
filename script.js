
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
    const themeToggleButton = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        themeToggleButton.innerHTML = `
            <svg class="moon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z">
                </path>
            </svg>
        `;
    } else {
        themeToggleButton.innerHTML = `
            <svg class="sun" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z">
                </path>
            </svg>
        `;
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
    updateChart(currentLatitude); // Memperbarui chart dengan tema baru
}

// Weather data generation
const climateZones = {
    tropical: { baseTemp: 28, variance: 4 },
    subtropical: { baseTemp: 25, variance: 6 },
    temperate: { baseTemp: 20, variance: 8 },
    cold: { baseTemp: 15, variance: 10 }
};

function getClimateZone(latitude) {
    if (latitude >= -23.5 && latitude <= 23.5) return 'tropical';
    if (latitude >= -35 && latitude < -23.5 || latitude > 23.5 && latitude <= 35) return 'subtropical';
    if (latitude >= -66.5 && latitude < -35 || latitude > 35 && latitude <= 66.5) return 'temperate';
    return 'cold';
}

function generateWeatherData(latitude) {
    const zone = getClimateZone(latitude);
    const { baseTemp, variance } = climateZones[zone];
    const seasonalOffset = Math.sin((new Date().getMonth() / 12) * 2 * Math.PI) * (variance / 2);

    return {
        temp: baseTemp + seasonalOffset + (Math.random() * 4 - 2),
        humidity: Math.min(95, Math.max(40, 75 + (Math.random() * 20 - 10))),
        windSpeed: 5 + (Math.random() * 15),
        rainfall: Math.random() * (zone === 'tropical' ? 30 : 15)
    };
}

function generateForecastData(latitude) {
    const dates = [];
    const temperatures = [];
    const humidity = [];
    
    for(let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        const weatherData = generateWeatherData(latitude);
        temperatures.push(Math.round(weatherData.temp));
        humidity.push(Math.round(weatherData.humidity));
    }

    return { dates, temperatures, humidity };
}

let currentLatitude = 0;

async function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('Geolocation tidak didukung oleh browser ini');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                    .then(response => response.json())
                    .then(data => {
                        resolve({
                            latitude,
                            longitude,
                            city: data.address.city || data.address.town || data.address.village || 'Unknown',
                            country: data.address.country || 'Unknown'
                        });
                    })
                    .catch(() => {
                        resolve({ latitude, longitude, city: 'Unknown', country: 'Unknown' });
                    });
            },
            (error) => {
                reject('Error getting location: ' + error.message);
            },
            {
                timeout: 10000, // Timeout setelah 10 detik
                enableHighAccuracy: true // Mencoba mendapatkan lokasi yang lebih akurat
            }
        );
    });
}

function updateMetrics(latitude) {
    const data = generateWeatherData(latitude);
    document.getElementById('temperature').textContent = `${Math.round(data.temp)}°C`;
    document.getElementById('humidity').textContent = `${Math.round(data.humidity)}%`;
    document.getElementById('wind').textContent = `${Math.round(data.windSpeed)} km/h`;
    document.getElementById('rainfall').textContent = `${Math.round(data.rainfall)} mm`;
    
    document.getElementById('last-updated').textContent = 
        `Last updated: ${new Date().toLocaleTimeString()}`;
}

function updateChart(latitude) {
    const weatherData = generateForecastData(latitude);
    const ctx = document.getElementById('tempChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if(window.forecastChart) {
        window.forecastChart.destroy();
    }
    
    window.forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weatherData.dates,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: weatherData.temperatures,
                    borderColor: '#1a73e8',
                    tension: 0.1
                },
                {
                    label: 'Humidity (%)',
                    data: weatherData.humidity,
                    borderColor: '#34a853',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Temperature and Humidity Forecast',
                    color: isDark ? '#e8eaed' : '#202124'
                },
                legend: {
                    labels: {
                        color: isDark ? '#e8eaed' : '#202124'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isDark ? '#303134' : '#e8eaed'
                    },
                    ticks: {
                        color: isDark ? '#e8eaed' : '#202124'
                    }
                },
                x: {
                    grid: {
                        color: isDark ? '#303134' : '#e8eaed'
                    },
                    ticks: {
                        color: isDark ? '#e8eaed' : '#202124'
                    }
                }
            }
        }
    });
}

// Initialization
async function init() {
    try {
        const location = await getLocation();
        currentLatitude = location.latitude;
        document.getElementById('location').textContent = 
            `Location: ${location.city}, ${location.country}`;
        
        updateMetrics(location.latitude);
        updateChart(location.latitude);
        
        setInterval(() => {
            updateMetrics(location.latitude);
            updateChart(location.latitude);
        }, 30000);
    } catch(error) {
        console.error(error);
        document.getElementById('error-message').classList.add('active');
        document.getElementById('location').textContent = 'Location: Unknown';
        updateMetrics(0); // Gunakan latitude default (0)
        updateChart(0); // Gunakan latitude default (0)
    }
}

initTheme();
init();