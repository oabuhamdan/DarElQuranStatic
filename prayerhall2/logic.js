// Configuration will be loaded from file
let CONFIG = {
    iqamahTimes: {},
    jumaaTimings: {}
};

// Time Utilities
const TimeUtils = {
    convertTo12HourFormat(time24, includeAMPM = false) {
        if (!time24 || !time24.includes(':')) return time24;

        const [hours, minutes] = time24.split(':').map(Number);
        const hours12 = hours % 12 || 12;
        const modifier = hours >= 12 ? 'PM' : 'AM';

        return includeAMPM ?
            `${hours12}:${String(minutes).padStart(2, '0')}<span class="ampm">${modifier}</span>` :
            `${hours12}:${String(minutes).padStart(2, '0')}`;
    },

    addMinutesToTime(time24, minutes) {
        if (!time24 || !time24.includes(':')) return time24;

        const [hours, mins] = time24.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins + parseInt(minutes), 0);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    updateCurrentTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const modifier = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        const timeString = `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}<span class="ampm">${modifier}</span>`;
        document.getElementById('current-time').innerHTML = timeString;
    },

    timeToNextAthan() {
        const now = new Date();
        const prayerTimes = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
            .map(prayer => TimeUtils.createTimeDate(PrayerManager.prayerTimes[prayer]));

        // Handle next day's Fajr if current time is after Isha
        if (now > prayerTimes[4]) {
            const nextDayFajr = new Date(prayerTimes[0]);
            nextDayFajr.setDate(nextDayFajr.getDate() + 1);
            prayerTimes.push(nextDayFajr);
        }

        const upcomingPrayer = prayerTimes.find(time => time > now);

        if (upcomingPrayer) {
            const diff = upcomingPrayer - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById("to-next-athan").textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    },

    createTimeDate(timeStr) {
        const now = new Date();
        if (!timeStr || !timeStr.includes(':')) return now;

        const [hours, minutes] = timeStr.split(':').map(Number);
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    }
};

// Configuration Manager
const ConfigManager = {
    async loadConfig() {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        CONFIG = await response.json();
        console.log("Configuration loaded successfully", CONFIG);

        // Update Jumaa times in the UI
        this.updateJumaaTimes();
        return true;
    },

    updateJumaaTimes() {
        if (CONFIG.jumaaTimings) {
            document.getElementById("jumaa1-time").textContent =
                TimeUtils.convertTo12HourFormat(CONFIG.jumaaTimings.Jumaa1, false);
            document.getElementById("jumaa2-time").textContent =
                TimeUtils.convertTo12HourFormat(CONFIG.jumaaTimings.Jumaa2, false);
        }
    }
};

// Prayer Manager
const PrayerManager = {
    prayerTimes: {},

    async fetchPrayerTimes() {
        const url = "https://api.aladhan.com/v1/timingsByCity/today?city=Arlington&country=USA";
        try {
            const response = await fetch(url);
            const data = await response.json();
            const timings = data.data.timings;
            const hijriDate = data.data.date.hijri;

            this.prayerTimes = timings; // Store the original 24-hour times
            this.updateAthanTimes(timings);
            this.updateIqamahTimes(timings);
            this.updateIshraqTime(timings.Sunrise);
            this.updateHijriDate(hijriDate);
            this.setupPrayerNotifications(timings);

        } catch (error) {
            console.error("Error fetching prayer times:", error);
        }
    },

    updateIshraqTime(sunriseTime) {
        const ishraqTime = TimeUtils.addMinutesToTime(sunriseTime, 15);
        document.getElementById("ishraq-time").innerHTML =
            TimeUtils.convertTo12HourFormat(ishraqTime, false);
    },

    updateHijriDate(hijriDate) {
        const [day, month, year] = hijriDate.date.split("-");
        const formattedDate = `${day} ${hijriDate.month.en} ${year}`;
        document.getElementById("hijri-date").textContent = formattedDate;
    },

    updateAthanTimes(timings) {
        const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
        prayers.forEach((prayer) => {
            document.getElementById(`${prayer.toLowerCase()}-athan`).innerHTML =
                TimeUtils.convertTo12HourFormat(timings[prayer], false);
        });
        document.getElementById("sunrise-time").innerHTML =
            TimeUtils.convertTo12HourFormat(timings.Sunrise, false);
    },

    updateIqamahTimes(timings) {
        const isOnlyDigits = str => /^\d+$/.test(str);
        for (const prayer in CONFIG.iqamahTimes) {
            const iqamah = CONFIG.iqamahTimes[prayer];
            const athanTime = timings[prayer];

            if (isOnlyDigits(iqamah)) {
                // Special handling - add minutes to athan time
                const iqamahTime = TimeUtils.addMinutesToTime(athanTime, iqamah);
                document.getElementById(`${prayer.toLowerCase()}-iqamah`).innerHTML =
                    TimeUtils.convertTo12HourFormat(iqamahTime, false);
            } else {
                document.getElementById(`${prayer.toLowerCase()}-iqamah`).innerHTML =
                    TimeUtils.convertTo12HourFormat(iqamah, false);
            }
        }
    },

    setupPrayerNotifications(timings) {
        const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
        prayers.forEach(prayer => {
            const athanTime = timings[prayer];
            let iqamahTime;

            if (prayer === 'Maghrib') {
                // For Maghrib, calculate iqamah time by adding minutes
                iqamahTime = TimeUtils.addMinutesToTime(athanTime, CONFIG.iqamahTimes[prayer]);
            } else {
                iqamahTime = CONFIG.iqamahTimes[prayer];
            }

            NotificationManager.schedulePrayerNotifications(prayer, athanTime, iqamahTime);
        });
    }
};

// Notification Manager
const NotificationManager = {
    schedulePrayerNotifications(prayerName, athanTime, iqamahTime) {
        const now = new Date();
        const athanDate = TimeUtils.createTimeDate(athanTime);
        const iqamahDate = TimeUtils.createTimeDate(iqamahTime);
        const tile = document.getElementById(`${prayerName.toLowerCase()}-tile`);

        // Clear existing highlight
        tile.classList.remove('current-prayer');

        // Check if we're between athan and iqamah
        if (now >= athanDate && now < iqamahDate) {
            this.handleCurrentPrayer(tile, prayerName, iqamahDate);
        } else if (now < athanDate) {
            this.handleUpcomingPrayer(tile, prayerName, athanDate, iqamahDate);
        }
    },

    handleCurrentPrayer(tile, prayerName, iqamahDate) {
        const now = new Date();
        tile.classList.add('current-prayer');

        const timeUntilIqamah = iqamahDate - now;

        if (timeUntilIqamah > 0) {
            setTimeout(() => {
                tile.classList.remove('current-prayer');
            }, timeUntilIqamah);

            const timeUntilNotification = timeUntilIqamah - (30 * 1000);
            if (timeUntilNotification > 0) {
                setTimeout(() => {
                    this.showIqamahNotification(prayerName);
                }, timeUntilNotification);
            }
        }
    },

    handleUpcomingPrayer(tile, prayerName, athanDate, iqamahDate) {
        const now = new Date();
        const timeUntilAthan = athanDate - now;
        const timeUntilIqamah = iqamahDate - now;

        if (timeUntilAthan > 0) {
            setTimeout(() => {
                tile.classList.add('current-prayer');
            }, timeUntilAthan);
        }

        if (timeUntilIqamah > 0) {
            setTimeout(() => {
                tile.classList.remove('current-prayer');
            }, timeUntilIqamah);

            const timeUntilNotification = timeUntilIqamah - (30 * 1000);
            if (timeUntilNotification > 0) {
                setTimeout(() => {
                    this.showIqamahNotification(prayerName);
                }, timeUntilNotification);
            }
        }
    },

    showIqamahNotification(prayerName) {
        this.showPopup(`30 Seconds to ${prayerName} Iqamah`);
        this.playSound();
    },

    showPopup(message) {
        const popup = document.getElementById("iqamah-popup");
        const popupMessage = document.getElementById("popup-message");
        popupMessage.textContent = message;
        popup.classList.add("active", "pulse");

        setTimeout(() => {
            popup.classList.remove("active", "pulse");
        }, 10000);
    },

    playSound() {
        const audio = document.getElementById("iqamah-sound");
        audio.play();
    }
};

// Scheduler Management
const ScheduleManager = {
    schedulePrayerTimesFetch() {
        const scheduleNextFetch = () => {
            const now = new Date();
            const nextFetch = new Date(now);
            nextFetch.setHours(3, 0, 0, 0);

            if (now > nextFetch) nextFetch.setDate(nextFetch.getDate() + 1);

            setTimeout(() => {
                PrayerManager.fetchPrayerTimes();
                scheduleNextFetch();
            }, nextFetch - now);
        };

        scheduleNextFetch();
    }
};

// Initialization
async function initialize() {
    await ConfigManager.loadConfig();
    await PrayerManager.fetchPrayerTimes();
    TimeUtils.updateCurrentTime();
    ScheduleManager.schedulePrayerTimesFetch();
    setInterval(TimeUtils.updateCurrentTime, 1000);
    setInterval(TimeUtils.timeToNextAthan, 1000);
    setTimeout(() => {
        location.reload();
    }, 21600000); //43200000 (12 hours in milliseconds) - currently set to 6 hours
}

initialize();
