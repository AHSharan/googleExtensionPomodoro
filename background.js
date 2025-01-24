let timer = null;
let timeLeft = 25 * 60; // Default 25 minutes
let totalTime = 25 * 60; // Default total duration
let isRunning = false;

// Create audio context and buffer for sound
// let audioContext = null;
// let audioBuffer = null;

function showNotification() {
  chrome.notifications.create('pomodoroComplete', {
    type: 'basic',
    iconUrl: 'images/icon-32.png',
    title: 'Time is up!',
    message: 'Your Pomodoro session is complete!',
    priority: 2,
    requireInteraction: true,
    buttons: [{ title: 'Start Break' }, { title: 'Dismiss' }]
  });
}

function startTimer(duration) {
  if (!isRunning) {
    isRunning = true;
    totalTime = totalTime === 25 * 60 ? duration : totalTime;
    timeLeft = timeLeft === 0 ? duration : timeLeft;
    chrome.storage.local.set({ timeLeft, isRunning, totalTime });

    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        chrome.storage.local.set({ timeLeft, isRunning });
      } else {
        clearInterval(timer);
        isRunning = false;
        chrome.storage.local.set({ timeLeft: 0, isRunning });
        
        // Show notification
        showNotification();
        
        // Notify popup if it's open
        chrome.runtime.sendMessage({ 
          command: "timerFinished"
        }).catch(() => {
          // Ignore error if popup is closed
        });
      }
    }, 1000);
  }
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  chrome.storage.local.set({ isRunning });
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = totalTime;
  isRunning = false;
  chrome.storage.local.set({ timeLeft, isRunning });
}

// Initialize audio when background script loads
// initAudio();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.command === "start") {
    startTimer(message.customDuration || 25 * 60);
    sendResponse({ success: true });
  }
  if (message.command === "pause") pauseTimer();
  if (message.command === "reset") resetTimer();
  sendResponse({ timeLeft, isRunning });
});

// Add notification button click handler
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'pomodoroComplete') {
    if (buttonIndex === 0) {
      // Start Break button clicked
      startTimer(5 * 60); // 5 minute break
    }
    // Clear the notification
    chrome.notifications.clear(notificationId);
  }
});
