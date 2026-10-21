// State Management
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];

// DOM Elements
const reminderForm = document.getElementById('reminder-form');
const reminderList = document.getElementById('reminder-list');
const activeCount = document.getElementById('active-count');
const notifyBtn = document.getElementById('notify-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderReminders();
  startReminderChecker();
  checkNotificationPermission();
});

// Request Web Notifications Permission
notifyBtn.addEventListener('click', () => {
  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        alert('Notifications enabled successfully!');
        notifyBtn.style.display = 'none';
      } else {
        alert('Please allow notification access in browser settings.');
      }
    });
  } else {
    alert('Browser notifications are not supported in this browser.');
  }
});

function checkNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'granted') {
    notifyBtn.style.display = 'none';
  }
}

// Form Submit Handler
reminderForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value;
  const time = document.getElementById('reminder-time').value;

  if (!title || !time) return;

  const newReminder = {
    id: Date.now(),
    title,
    category,
    time: new Date(time).getTime(),
    status: 'pending',
  };

  reminders.push(newReminder);
  saveAndRender();
  reminderForm.reset();
});

// Quick Add Presets
function quickAdd(title, minutesFromNow, category) {
  const targetTime = new Date(Date.now() + minutesFromNow * 60000).getTime();

  const newReminder = {
    id: Date.now(),
    title,
    category,
    time: targetTime,
    status: 'pending',
  };

  reminders.push(newReminder);
  saveAndRender();
}

// Delete Reminder
function deleteReminder(id) {
  reminders = reminders.filter((item) => item.id !== id);
  saveAndRender();
}

// Render Reminders List
function renderReminders() {
  reminderList.innerHTML = '';

  const activeReminders = reminders.filter((r) => r.status === 'pending');
  activeCount.textContent = `${activeReminders.length} Active`;

  if (reminders.length === 0) {
    reminderList.innerHTML = `<p class="empty-msg">No active reminders set. Add one above!</p>`;
    return;
  }

  // Sort by time
  reminders.sort((a, b) => a.time - b.time);

  reminders.forEach((item) => {
    const formattedTime = new Date(item.time).toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const div = document.createElement('div');
    div.className = 'reminder-item';
    div.innerHTML = `
      <div class="reminder-info">
        <h4>${getCategoryIcon(item.category)} ${escapeHtml(item.title)}</h4>
        <p><i class="fa-regular fa-clock"></i> Scheduled for: ${formattedTime}</p>
      </div>
      <button class="delete-btn" onclick="deleteReminder(${item.id})">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    reminderList.appendChild(div);
  });
}

function getCategoryIcon(cat) {
  switch (cat) {
    case 'Water': return '💧';
    case 'Medicine': return '💊';
    case 'Health': return '🧘';
    case 'Work': return '💻';
    default: return '🔔';
  }
}

// Local Storage Helper
function saveAndRender() {
  localStorage.setItem('reminders', JSON.stringify(reminders));
  renderReminders();
}

// Alarm & Notification Interval Engine (Runs every 5 seconds)
function startReminderChecker() {
  setInterval(() => {
    const now = Date.now();

    reminders.forEach((item) => {
      if (item.status === 'pending' && now >= item.time) {
        triggerNotification(item);
        item.status = 'triggered';
      }
    });

    // Clean up triggered alerts
    reminders = reminders.filter((item) => item.status === 'pending');
    saveAndRender();
  }, 5000);
}

// Trigger Web Push Notification & Sound Alert
function triggerNotification(item) {
  // 1. Play Audio Beep
  playBeepSound();

  // 2. Trigger Web Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`Reminder: ${item.title}`, {
      body: `Time to take care of your ${item.category.toLowerCase()} routine!`,
      icon: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png',
    });
  } else {
    alert(`🚨 REMINDER: ${item.title}`);
  }
}

// Audio Beep Generator using Web Audio API (No external file needed)
// Upgraded Audio Alert Engine (Plays a soft pleasant ringtone chime)
function playBeepSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();

    // Notes sequence (Musical frequency in Hz for a soft bell ringtone)
    // E5, G5, B5, E6 (Pleasant rising chime tone)
    const notes = [659.25, 783.99, 987.77, 1318.51];
    const duration = 0.18; // Duration of each note in seconds

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine'; // Smooth tone
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + index * duration;
      const stopTime = startTime + duration;

      // Soft fading sound effect (Envelope)
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03); // Attack
      gain.gain.exponentialRampToValueAtTime(0.001, stopTime);   // Decay

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(stopTime);
    });

  } catch (e) {
    console.log('Audio Context Error:', e);
  }
}
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
