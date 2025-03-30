// ================ Configuration Constants ================
const IQAMAH_TIMES = {
  Fajr: "6:30 AM",
  Dhuhr: "2:00 PM",
  Asr: "5:15 PM",
  Maghrib: "10",
  Isha: "9:15 PM",
};

const UI_CONFIG = {
  TICKER_SPEED: 75,
  SLIDESHOW_INTERVAL: 10000,
};

// ================ Time Utilities ================
const TimeUtils = {
  convertTo12HourFormat(time24) {
    const [hours, minutes] = time24.split(":");
    let hours12 = parseInt(hours, 10);
    const modifier = hours12 >= 12 ? "PM" : "AM";
    hours12 = hours12 % 12 || 12;
    return `${hours12}:${minutes} ${modifier}`;
  },

  addMinutesToTime(time24, minutes) {
    const [hours, mins] = time24.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  },

  updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const modifier = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    const timeString = `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${modifier}`;
    document.getElementById("current-time").textContent = timeString;
  }
};

// ================ Prayer Time Management ================
const PrayerManager = {
  async fetchPrayerTimes() {
    const url = "https://api.aladhan.com/v1/timingsByCity/today?city=Arlington&country=USA";
    try {
      const response = await fetch(url);
      const data = await response.json();
      const timings = data.data.timings;
      const hijriDate = data.data.date.hijri;

      this.updateAthanTimes(timings);
      this.updateIqamahTimes(timings);
      this.updateHijriDate(hijriDate);
      this.setupPrayerNotifications(timings);

    } catch (error) {
      console.error("Error fetching prayer times:", error);
    }
  },

  // Update Hijri date
  updateHijriDate(hijriDate) {
    const [day, month, year] = hijriDate.date.split("-");
    const formattedDate = `${day} ${hijriDate.month.en} ${year}`; // Extract last 2 digits of the year
    document.getElementById("hijri-date").textContent = formattedDate;
  },

  updateAthanTimes(timings) {
    const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    prayers.forEach((prayer) => {
      const athanTime12Hr = TimeUtils.convertTo12HourFormat(timings[prayer]);
      document.getElementById(`${prayer.toLowerCase()}-athan`).textContent = athanTime12Hr;
    });
    document.getElementById("sunrise-time").textContent = TimeUtils.convertTo12HourFormat(timings.Sunrise);
  },

  updateIqamahTimes(timings) {
    for (const prayer in IQAMAH_TIMES) {
      const iqamah = IQAMAH_TIMES[prayer];
      const athanTime = timings[prayer];

      if (!isNaN(iqamah)) {
        const iqamahMinutes = parseInt(iqamah, 10);
        const iqamahTime = TimeUtils.addMinutesToTime(athanTime, iqamahMinutes);
        document.getElementById(`${prayer.toLowerCase()}-iqamah`).textContent = 
          TimeUtils.convertTo12HourFormat(iqamahTime);
      } else {
        document.getElementById(`${prayer.toLowerCase()}-iqamah`).textContent = iqamah;
      }
    }
  },

  setupPrayerNotifications(timings) {
    const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    prayers.forEach(prayer => {
      NotificationManager.schedulePrayerNotifications(prayer, timings[prayer]);
    });
  }
};

// ================ Notification Management ================
const NotificationManager = {
  schedulePrayerNotifications(prayerName, athanTime) {
    const now = new Date();
    const athanDate = new Date(`${now.toDateString()} ${athanTime}`);
    const iqamahElement = document.getElementById(`${prayerName.toLowerCase()}-iqamah`);
    const iqamahTime = iqamahElement.textContent;
    const iqamahDate = new Date(`${now.toDateString()} ${iqamahTime}`);
    const tile = document.getElementById(`${prayerName.toLowerCase()}-tile`);

    // Clear existing highlights
    tile.classList.remove('highlight-red');

    // Handle current prayer time
    if (now >= athanDate && now < iqamahDate) {
      this.handleCurrentPrayer(tile, prayerName, iqamahDate);
    } 
    // Handle upcoming prayer time
    else if (now < athanDate) {
      this.handleUpcomingPrayer(tile, prayerName, athanDate, iqamahDate);
    }
  },

  handleCurrentPrayer(tile, prayerName, iqamahDate) {
    const now = new Date();
    tile.classList.add('highlight-red');
    
    const timeUntilIqamah = iqamahDate - now;
    
    // Remove highlight after Iqamah
    setTimeout(() => {
      tile.classList.remove('highlight-red');
    }, timeUntilIqamah);

    // Schedule notification if more than 30 seconds until Iqamah
    const timeUntilNotification = timeUntilIqamah - (30 * 1000);
    if (timeUntilNotification > 0) {
      setTimeout(() => {
        this.showIqamahNotification(prayerName);
      }, timeUntilNotification);
    }
  },

  handleUpcomingPrayer(tile, prayerName, athanDate, iqamahDate) {
    const now = new Date();
    const timeUntilAthan = athanDate - now;
    const timeUntilIqamah = iqamahDate - now;
    
    // Schedule highlight to start at Athan
    setTimeout(() => {
      tile.classList.add('highlight-red');
    }, timeUntilAthan);

    // Schedule highlight removal at Iqamah
    setTimeout(() => {
      tile.classList.remove('highlight-red');
    }, timeUntilIqamah);

    // Schedule notification
    // const timeUntilNotification = timeUntilIqamah - (30 * 1000);
    // setTimeout(() => {
    //   this.showIqamahNotification(prayerName);
    // }, timeUntilNotification);
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

// ================ Scheduler Management ================
const ScheduleManager = {
  schedulePrayerTimesFetch() {
    const scheduleNextFetch = () => {
      const now = new Date();
      const nextFetch = new Date(now);
      nextFetch.setHours(3, 0, 0, 0);

      if (now > nextFetch) {
        nextFetch.setDate(nextFetch.getDate() + 1);
      }

      const timeUntilFetch = nextFetch - now;
      
      setTimeout(() => {
        PrayerManager.fetchPrayerTimes();
        scheduleNextFetch();
      }, timeUntilFetch);
    };

    scheduleNextFetch();
  }
};

// ================ UI Components ================
const UIManager = {
  initializeNewsTicker() {
    const ticker = document.getElementById("news-ticker");
    const tickerContent = document.querySelector(".ticker-content");
    
    ticker.style.display = 'block';
    
    const contentWidth = tickerContent.offsetWidth;
    const duration = contentWidth / UI_CONFIG.TICKER_SPEED;
    
    tickerContent.style.animationDuration = `${duration}s`;
  },

  initializeSlideshow() {
    const images = document.querySelectorAll(".slideshow-image");
    let currentImageIndex = 0;

    function changeSlideshowImage() {
      if (images.length === 0) return;

      images[currentImageIndex].classList.remove("active");
      currentImageIndex = (currentImageIndex + 1) % images.length;
      images[currentImageIndex].classList.add("active");
    }

    if (images.length > 0) {
      images[0].classList.add("active");
    }

    setInterval(changeSlideshowImage, UI_CONFIG.SLIDESHOW_INTERVAL);
  }
};

// ================ Initialization ================
function initialize() {
  UIManager.initializeSlideshow();
  UIManager.initializeNewsTicker();
  PrayerManager.fetchPrayerTimes();
  TimeUtils.updateCurrentTime();
  ScheduleManager.schedulePrayerTimesFetch();
  setInterval(TimeUtils.updateCurrentTime, 1000);
  document.getElementById("silent-video").play();
}

// Start the application
initialize();
