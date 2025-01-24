const timerDisplay = document.getElementById("timer");
const progressBar = document.getElementById("progress-bar");
const customTimeInput = document.getElementById("custom-time");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");
const themeToggle = document.getElementById("theme-toggle");
const themes = ["default", "dark", "light"];
let currentThemeIndex = 0;

// Add these constants at the top with your other constants
const menuToggle = document.getElementById("menu-toggle");
const menuDropdown = document.getElementById("menu-dropdown");
const menuItems = document.querySelectorAll(".menu-item[data-theme]");

let customDuration = 25 * 60; // Default to 25 minutes

// Add this line to define backButtons
const backButtons = document.querySelectorAll('.back-button');

// Add this line to define submenus
const submenus = document.querySelectorAll('.submenu');

// Update the timer display
function updateTimerDisplay(timeLeft) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Update customDuration when the input field changes
customTimeInput.addEventListener("input", () => {
  const minutes = parseInt(customTimeInput.value, 10);
  if (minutes && minutes > 0 && minutes <= 120) {
    customDuration = minutes * 60;
  } else {
    customDuration = 25 * 60;
  }
  updateTimerDisplay(customDuration);
});

// Update the progress bar and timer display
function updateUI() {
  chrome.storage.local.get(["timeLeft", "isRunning", "totalTime"], (data) => {
    const timeLeft = data.timeLeft || customDuration;
    const totalTime = data.totalTime || customDuration;

    updateTimerDisplay(timeLeft);

    // Calculate percentage remaining (100% to 0%)
    const percentage = (timeLeft / totalTime) * 100;
    progressBar.style.width = `${percentage}%`;
    
    // Update progress bar color based on percentage
    if (percentage > 66) {
      progressBar.className = 'progress-bar bg-success';
    } else if (percentage > 33) {
      progressBar.className = 'progress-bar bg-warning';
    } else {
      progressBar.className = 'progress-bar bg-danger';
    }

    // Show or hide the input box based on whether the timer is running
    customTimeInput.style.display = data.isRunning ? "none" : "block";
  });
}

// Update the handleTimerCompletion function
function handleTimerCompletion() {
  try {
    // Reset UI
    updateTimerDisplay(customDuration);
    customTimeInput.style.display = "block";
    
    // Add visual feedback
    timerDisplay.classList.add('completed');
    setTimeout(() => {
      timerDisplay.classList.remove('completed');
    }, 1000);
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Open a new tab with the timer finished message
    chrome.tabs.create({ url: 'finished.html' });
  } catch (error) {
    console.error('Error in handleTimerCompletion:', error);
  }
}

// Send commands to the background script
function sendCommand(command) {
  const payload = command === "start" ? { command, customDuration } : { command };
  chrome.runtime.sendMessage(payload, (response) => {
    if (response) updateUI();
  });
}

// Update the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "timerFinished") {
    handleTimerCompletion();
  }
  return true; // Keep the message channel open for async responses
});

// Function to open a new tab for Chrome extensions
function openExtensionsTab() {
  chrome.tabs.create({ url: 'chrome://extensions/' });
}

// Set up event listeners for buttons
startButton.addEventListener("click", () => {
  sendCommand("start");
});
pauseButton.addEventListener("click", () => sendCommand("pause"));
resetButton.addEventListener("click", () => sendCommand("reset"));

// Periodically refresh the UI
setInterval(updateUI, 1000);

// Initial UI setup
updateUI();
updateTimerDisplay(customDuration);

// Add menu toggle handler
menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle('show');
  // Hide all submenus when main menu is toggled
  submenus.forEach(submenu => submenu.classList.remove('show'));
});

// Update submenu handling
document.querySelectorAll('.has-submenu').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const submenuId = item.dataset.submenu;
    const submenu = document.getElementById(`${submenuId}-submenu`);
    submenu.classList.add('show');
  });
});

// Update back button handling
backButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const submenu = button.closest('.submenu');
    submenu.classList.remove('show');
  });
});

// Close menu and submenus when clicking outside
document.addEventListener('click', (e) => {
  if (!menuDropdown.contains(e.target) && !menuToggle.contains(e.target)) {
    menuDropdown.classList.remove('show');
    submenus.forEach(submenu => submenu.classList.remove('show'));
  }
});

// Handle theme selection from menu
menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const newTheme = item.dataset.theme;
    document.documentElement.setAttribute('data-theme', newTheme);
    chrome.storage.local.set({ theme: newTheme });
    menuDropdown.classList.remove('show');
  });
});

// Update your existing initializeTheme function
function initializeTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    const savedTheme = result.theme || 'default';
    document.documentElement.setAttribute('data-theme', savedTheme);
  });
}

// Add theme toggle handler
themeToggle.addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  const newTheme = themes[currentThemeIndex];
  document.documentElement.setAttribute('data-theme', newTheme);
  chrome.storage.local.set({ theme: newTheme });
});

// Add to your initialization code
initializeTheme();
