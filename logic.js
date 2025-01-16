// Static Iqama and Jumah Times
const staticTimes = {
  fajrIqama: "06:30",
  dhuhrIqama: "13:00",
  asrIqama: "16:00",
  maghribIqama: "18:00",
  ishaIqama: "19:30",
  jumah1: "13:00",
  jumah2: "14:00",
};

// Set Static Times
document.getElementById("fajr-iqama").textContent = staticTimes.fajrIqama;
document.getElementById("dhuhr-iqama").textContent = staticTimes.dhuhrIqama;
document.getElementById("asr-iqama").textContent = staticTimes.asrIqama;
document.getElementById("maghrib-iqama").textContent = staticTimes.maghribIqama;
document.getElementById("isha-iqama").textContent = staticTimes.ishaIqama;
document.getElementById("jumah1").textContent = staticTimes.jumah1;
document.getElementById("jumah2").textContent = staticTimes.jumah2;

// Fetch Athan Times
async function fetchAthanTimes() {
  const url = "https://api.aladhan.com/v1/timingsByCity/16-01-2025?city=Arlington&country=USA";
  try {
    const response = await fetch(url);
    const data = await response.json();
    const timings = data.data.timings;

    document.getElementById("fajr-athan").textContent = timings.Fajr;
    document.getElementById("sunrise").textContent = timings.Sunrise;
    document.getElementById("dhuhr-athan").textContent = timings.Dhuhr;
    document.getElementById("asr-athan").textContent = timings.Asr;
    document.getElementById("maghrib-athan").textContent = timings.Maghrib;
    document.getElementById("isha-athan").textContent = timings.Isha;
  } catch (error) {
    console.error("Error fetching Athan times:", error);
  }
}

// Hijri Date and Current Time
function updateDateTime() {
  const now = new Date();
  const hijriDate = new Intl.DateTimeFormat("en-US", {
    calendar: "islamic",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  const currentTime = now.toLocaleTimeString();

  document.getElementById("hijri-date").textContent = hijriDate;
  document.getElementById("current-time").textContent = currentTime;
}

// Image Slideshow
let currentSlide = 0;
const slides = document.querySelectorAll(".slide");

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

// Initialize
fetchAthanTimes();
updateDateTime();
setInterval(updateDateTime, 1000); // Update time every second
setInterval(nextSlide, 5000); // Change slide every 5 seconds
