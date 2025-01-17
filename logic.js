// Static Iqamah times (numbers indicate minutes after Athan)
const iqamahTimes = {
  Fajr: "6:45 PM", // 10 minutes after Fajr Athan
  Dhuhr: "1:30 PM", // Fixed time
  Asr: "5:00 PM", // Fixed time
  Maghrib: "10", // 7 minutes after Maghrib Athan
  Isha: "8:30 PM", // Fixed time
};

// Function to fetch prayer times from the API
async function fetchPrayerTimes() {
  const url = "https://api.aladhan.com/v1/timingsByCity/16-01-2025?city=Arlington&country=USA";
  try {
    const response = await fetch(url);
    const data = await response.json();
    const timings = data.data.timings;

    // Convert Athan times to 12-hour format and update the tiles
    updateAthanTimes(timings);

    // Calculate and update Iqamah times
    updateIqamahTimes(timings);

    // Highlight the previous Athan time
    highlightPreviousAthan(timings);

    // Check for Iqamah notifications
    checkIqamahNotifications(timings);
  } catch (error) {
    console.error("Error fetching prayer times:", error);
  }
}

// Function to convert 24-hour time to 12-hour format
function convertTo12HourFormat(time24) {
  const [hours, minutes] = time24.split(":");
  let hours12 = parseInt(hours, 10);
  const modifier = hours12 >= 12 ? "PM" : "AM";
  hours12 = hours12 % 12 || 12; // Convert 0 to 12 for 12-hour format
  return `${hours12}:${minutes} ${modifier}`;
}

// Function to update Athan times in the tiles
function updateAthanTimes(timings) {
  const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  prayers.forEach((prayer) => {
    const athanTime12Hr = convertTo12HourFormat(timings[prayer]);
    document.getElementById(`${prayer.toLowerCase()}-athan`).textContent = athanTime12Hr;
  });

  // Update Sunrise time (if needed)
  document.getElementById("sunrise-time").textContent = convertTo12HourFormat(timings.Sunrise);
}

// Function to calculate and update Iqamah times
function updateIqamahTimes(timings) {
  for (const prayer in iqamahTimes) {
    const iqamah = iqamahTimes[prayer];
    const athanTime = timings[prayer];

    if (!isNaN(iqamah)) {
      // If Iqamah is a number, calculate it as minutes after Athan
      const iqamahMinutes = parseInt(iqamah, 10);
      const iqamahTime = addMinutesToTime(athanTime, iqamahMinutes);
      document.getElementById(`${prayer.toLowerCase()}-iqamah`).textContent = convertTo12HourFormat(iqamahTime);
    } else {
      // If Iqamah is a fixed time, use it directly
      document.getElementById(`${prayer.toLowerCase()}-iqamah`).textContent = iqamah;
    }
  }
}

// Function to add minutes to a time string (e.g., "05:30")
function addMinutesToTime(time24, minutes) {
  const [hours, mins] = time24.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// Function to highlight the previous Athan time
function highlightPreviousAthan(timings) {
  const now = new Date();
  const prayerTimes = [
    { name: "Fajr", time: timings.Fajr, iqamah: document.getElementById("fajr-iqamah").textContent },
    { name: "Dhuhr", time: timings.Dhuhr, iqamah: document.getElementById("dhuhr-iqamah").textContent },
    { name: "Asr", time: timings.Asr, iqamah: document.getElementById("asr-iqamah").textContent },
    { name: "Maghrib", time: timings.Maghrib, iqamah: document.getElementById("maghrib-iqamah").textContent },
    { name: "Isha", time: timings.Isha, iqamah: document.getElementById("isha-iqamah").textContent },
  ];

  let previousPrayer = null;
  let currentPrayer = null;

  for (let i = 0; i < prayerTimes.length; i++) {
    const athanTime = new Date(`${now.toDateString()} ${prayerTimes[i].time}`);
    const iqamahTime = new Date(`${now.toDateString()} ${prayerTimes[i].iqamah}`);

    if (now >= athanTime && now < iqamahTime) {
      currentPrayer = prayerTimes[i].name; // Current Athan time
    } else if (now < athanTime) {
      break; // Stop checking if the current time is before the Athan time
    } else {
      previousPrayer = prayerTimes[i].name; // Previous Athan time
    }
  }

  // Remove previous highlights
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.classList.remove("highlight", "current");
  });

  // Highlight previous Athan time
  if (previousPrayer) {
    document.getElementById(`${previousPrayer.toLowerCase()}-tile`).classList.add("highlight");
  }

  // Highlight current Athan time
  if (currentPrayer) {
    document.getElementById(`${currentPrayer.toLowerCase()}-tile`).classList.add("current");
  }
}

// Function to check for Iqamah notifications
function checkIqamahNotifications(timings) {
  const now = new Date();
  for (const prayer in iqamahTimes) {
    const iqamahTime = document.getElementById(`${prayer.toLowerCase()}-iqamah`).textContent;
    const iqamahDate = new Date(`${now.toDateString()} ${iqamahTime}`);

    // Calculate the time difference in seconds
    const timeDiff = (iqamahDate - now) / 1000;

    // If 30 seconds left, show the popup and play the sound
    if (timeDiff > 0 && timeDiff <= 30) {
      showPopup(`30 Seconds to ${prayer} Iqamah`);
      playSound();
      break; // Only show one notification at a time
    }
  }
}

// Function to show the popup
function showPopup(message) {
  const popup = document.getElementById("iqamah-popup");
  const popupMessage = document.getElementById("popup-message");
  popupMessage.textContent = message;
  popup.style.display = "block";

  // Hide the popup after 5 seconds
  setTimeout(() => {
    popup.style.display = "none";
  }, 5000);
}

// Function to play the sound
function playSound() {
  const audio = document.getElementById("iqamah-sound");
  audio.play();
}

// Function to update current time and Hijri date
function updateTimeAndDate() {
  const now = new Date();
  const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
  document.getElementById("current-time").textContent = now.toLocaleTimeString('en-US', options);

  // Hijri date calculation (using a library like moment-hijri would be better)
  const hijriDate = new Intl.DateTimeFormat('en-US-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  document.getElementById("hijri-date").textContent = hijriDate;
}

// Function to change slideshow image
let currentImageIndex = 1;
function changeSlideshowImage() {
  const images = ["image1.jpg", "image2.jpg", "image3.jpg"];
  const slideshowImage = document.getElementById("slideshow-image");
  slideshowImage.src = images[currentImageIndex];
  currentImageIndex = (currentImageIndex + 1) % images.length;
}

// Initialize functions
fetchPrayerTimes();
updateTimeAndDate();
setInterval(updateTimeAndDate, 1000); // Update time every second
setInterval(() => fetchPrayerTimes(), 60000); // Check for Iqamah notifications every minute
setInterval(changeSlideshowImage, 5000); // Change image every 5 seconds
