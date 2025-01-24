// Initialize sound by attempting to play it silently on page load
document.addEventListener('DOMContentLoaded', function() {
    const alarmSound = document.getElementById('alarm-sound');
    if (alarmSound) {
        alarmSound.volume = 0;
        alarmSound.play().then(() => {
            alarmSound.pause();
            alarmSound.currentTime = 0;
            alarmSound.volume = 1;
        }).catch(error => {
            console.error('Error initializing sound:', error);
        });
    }
}); 