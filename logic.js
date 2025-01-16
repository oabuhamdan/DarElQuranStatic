// Update Date and Time
function updateDateTime() {
    const hijriDateElement = document.getElementById('hijriDate');
    const gregorianDateElement = document.getElementById('gregorianDate');
    const currentTimeElement = document.getElementById('currentTime');

    const now = new Date();

    // Hijri Date
    const hijriOptions = { year: 'numeric', month: 'long', day: 'numeric', calendar: 'islamic' };
    const hijriDate = new Intl.DateTimeFormat('en-US', hijriOptions).format(now);
    hijriDateElement.textContent = `${hijriDate}`;

    // Gregorian Date
    const gregorianOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const gregorianDate = now.toLocaleDateString('en-US', gregorianOptions);
    gregorianDateElement.textContent = `${gregorianDate}`;

    // Current Time
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const currentTime = now.toLocaleTimeString('en-US', timeOptions);
    currentTimeElement.textContent = `Time: ${currentTime}`;
}

setInterval(updateDateTime, 1000);
updateDateTime();

// Image Slider
let currentSlide = 0;
const slides = document.querySelectorAll('.slider-image');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

setInterval(nextSlide, 3000); // Change slide every 3 seconds
showSlide(currentSlide); // Show first slide initially
