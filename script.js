// State Management
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
let audioCtx = null;

// DOM Elements
const reminderForm = document.getElementById('reminder-form');
const reminderList = document.getElementById('reminder-list');
const activeCount = document.getElementById('active-count');
const notifyBtn = document.getElementById('notify-btn');

// Unlock Browser Audio on First User Click/Tap
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Global click listener to unlock audio engine on mobile
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderReminders();
  startReminderChecker();
  checkNotificationPermission();
});

// Request Web Notifications Permission
notifyBtn.addEventListener('click', () => {
  initAudio();
  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        alert('Notifications & Audio alerts enabled successfully!');
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
  initAudio();

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
  initAudio();
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

function saveAndRender() {
  localStorage.setItem('reminders', JSON.stringify(reminders));
  renderReminders();
}

// Alarm & Notification Interval Engine (Runs every 3 seconds)
function startReminderChecker() {
  setInterval(() => {
    const now = Date.now();

    reminders.forEach((item) => {
      if (item.status === 'pending' && now >= item.time) {
        triggerNotification(item);
        item.status = 'triggered';
      }
    });

    reminders = reminders.filter((item) => item.status === 'pending');
    saveAndRender();
  }, 3000);
}

// Ringtone & Web Notification Trigger
function triggerNotification(item) {
  // Play ringtone chime
  playRingtoneChime();

  // Show push notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`🔔 Reminder: ${item.title}`, {
      body: `Time for your ${item.category.toLowerCase()} routine!`,
      icon: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png',
    });
  } else {
    alert(`🚨 REMINDER: ${item.title}`);
  }
}

// Loud 3-Beat Ringtone Chime
function playRingtoneChime() {
  try {
    initAudio();
    if (!audioCtx) return;

    // Repeats ringtone chime 3 times like a real ringtone
    for (let r = 0; r < 3; r++) {
      const delay = r * 0.6; // Repeat interval
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Bright ringtone melody)

      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle'; // Clear bell tone
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        const startTime = audioCtx.currentTime + delay + (index * 0.1);
        const stopTime = startTime + 0.12;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(stopTime);
      });
    }
  } catch (e) {
    console.log('Audio Context Error:', e);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
