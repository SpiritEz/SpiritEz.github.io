// ==========================================
// TURVAMEES - RAKENDUSSE LÕPP OTSA SKRIPT
// Frontend JavaScript - UI ja juhtimise loogika
// ==========================================

// GLOBAALSED MUUTUJAD
let isRunning = false;
let volume = 50;
let sensitivity = 30;
let soundsEnabled = true;
let currentMode = 'normal';

// Helistamise objektide säilitamine
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBuffers = {};

// ==========================================
// RAKENDUSE INITSIALISATSIOON
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 TURVAMEES rakendus käivitatud');
  
  // Nuppe sündmused
  document.getElementById('startBtn').addEventListener('click', startCamera);
  document.getElementById('stopBtn').addEventListener('click', stopCamera);
  
  // Häire seaded
  document.getElementById('soundToggle').addEventListener('change', (e) => {
    soundsEnabled = e.target.checked;
    console.log('Helid:', soundsEnabled ? 'sisse' : 'välja');
  });
  
  // Helitugevuse kontroll
  document.getElementById('volumeSlider').addEventListener('input', (e) => {
    volume = parseInt(e.target.value);
    document.getElementById('volumeValue').textContent = volume + '%';
  });
  
  // Liikumise tundlikkus
  document.getElementById('sensitivitySlider').addEventListener('input', (e) => {
    sensitivity = parseInt(e.target.value);
    document.getElementById('sensitivityValue').textContent = sensitivity + '%';
    // Edasta tundlikkus liikumise tuvastamise skriptile
    window.postMessage({
      type: 'SENSITIVITY_CHANGED',
      value: sensitivity
    }, '*');
  });
  
  // Režiimide nupud
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Eemalda aktiivne klass kõigilt nuppudelt
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('btn-primary'));
      // Lisa aktiivne klass klõpatud nupule
      btn.classList.add('btn-primary');
      
      currentMode = btn.dataset.mode;
      changeMode(currentMode);
    });
  });
  
  // Laadi rakenduse teave
  loadAppInfo();
  
  // Luua test helid
  createSoundEffects();
});

// ==========================================
// KAAMERA JUHTIMINE
// ==========================================

// Kaamera alusta
async function startCamera() {
  console.log('📹 Kaamera käivitamine...');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    });
    
    const videoElement = document.getElementById('videoElement');
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      isRunning = true;
      
      // Värskenda UI
      document.getElementById('startBtn').disabled = true;
      document.getElementById('stopBtn').disabled = false;
      
      console.log('✅ Kaamera käivitatud edukalt');
      
      // Alusta liikumise tuvastamist
      initMotionDetection();
    };
  } catch (error) {
    console.error('❌ Kaamera käivitamise viga:', error);
    alert('Kaamera käivitamise viga. Veenduge, et brauseril on juurdepääs kaamerale.');
  }
}

// Kaamera peata
function stopCamera() {
  console.log('🛑 Kaamera peatamine...');
  
  const videoElement = document.getElementById('videoElement');
  const stream = videoElement.srcObject;
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  isRunning = false;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  
  // Puhasta canvas
  const canvas = document.getElementById('videoCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  console.log('✅ Kaamera peatatud');
}

// ==========================================
// HELIDE LOOMINE
// ==========================================

// Luua test helid (Web Audio API abil)
function createSoundEffects() {
  console.log('🔊 Helide loomine...');
  
  // BEEP HEL
  audioBuffers.beep = createBeepSound();
  
  // HÄIRE HEL
  audioBuffers.alarm = createAlarmSound();
  
  // KELLA HEL
  audioBuffers.bell = createBellSound();
  
  console.log('✅ Helid loodud');
}

// Beep heli (kõrge tooni beep)
function createBeepSound() {
  const now = audioContext.currentTime;
  const duration = 0.2;
  const frequency = 1000;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
  oscillator.start(now);
  oscillator.stop(now + duration);
  
  return { oscillator, gainNode };
}

// Häire heli (madala tooniga helismine)
function createAlarmSound() {
  const now = audioContext.currentTime;
  const duration = 0.5;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(400, now);
  oscillator.frequency.setValueAtTime(600, now + 0.1);
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
  oscillator.start(now);
  oscillator.stop(now + duration);
  
  return { oscillator, gainNode };
}

// Kella heli
function createBellSound() {
  const now = audioContext.currentTime;
  const duration = 0.8;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'triangle';
  
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
  oscillator.start(now);
  oscillator.stop(now + duration);
  
  return { oscillator, gainNode };
}

// Heliga mängimise funktsioon
function playSound(soundType) {
  if (!soundsEnabled) {
    console.log('🔇 Helid on välja lülitatud');
    return;
  }
  
  const volume_gain = volume / 100;
  console.log(`🔔 Mängib heli: ${soundType} (helitugevus: ${volume}%)`);
  
  const now = audioContext.currentTime;
  const gainNode = audioContext.createGain();
  
  gainNode.connect(audioContext.destination);
  gainNode.gain.setValueAtTime(volume_gain, now);
  
  // Luua heli vastavalt tüübile
  const oscillator = audioContext.createOscillator();
  oscillator.connect(gainNode);
  
  let freq = 1000;
  let duration = 0.3;
  
  if (soundType === 'beep') {
    freq = 1000;
    duration = 0.2;
  } else if (soundType === 'alarm') {
    freq = 400;
    duration = 0.5;
  } else if (soundType === 'bell') {
    freq = 800;
    duration = 0.8;
  }
  
  oscillator.frequency.value = freq;
  oscillator.type = 'sine';
  
  oscillator.start(now);
  oscillator.stop(now + duration);
  
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
}

// ==========================================
// LIIKUMISE TUVASTAMISE ALUSTAMINE
// ==========================================

function initMotionDetection() {
  console.log('🎯 Liikumise tuvastamine alustatud');
  
  // Pealda motion-detection.js faili funktsioonid
  window.postMessage({
    type: 'START_DETECTION',
    sensitivity: sensitivity
  }, '*');
}

// ==========================================
// REŽIIMIDE MUUTMINE
// ==========================================

function changeMode(mode) {
  console.log(`🎨 Režiim muudetud: ${mode}`);
  
  const body = document.body;
  
  // Eemalda kõik režiimi klassid
  body.classList.remove('night-mode', 'quiet-mode', 'normal-mode');
  
  if (mode === 'night') {
    body.classList.add('night-mode');
  } else if (mode === 'quiet') {
    body.classList.add('quiet-mode');
  } else {
    body.classList.add('normal-mode');
  }
}

// ==========================================
// RAKENDUSE TEABE LAADIMINE
// ==========================================

async function loadAppInfo() {
  try {
    const response = await fetch('/api/info');
    const data = await response.json();
    
    let html = `
      <strong>Nimi:</strong> ${data.name}<br>
      <strong>Versioon:</strong> ${data.version}<br>
      <strong>Kirjeldus:</strong> ${data.description}<br>
      <strong>Omadused:</strong><br>
      <ul>
    `;
    
    data.features.forEach(feature => {
      html += `<li>${feature}</li>`;
    });
    
    html += `
      </ul>
      <strong>GitHub:</strong> <a href="${data.repository}" target="_blank">${data.repository}</a>
    `;
    
    document.getElementById('appInfo').innerHTML = html;
  } catch (error) {
    console.error('Teabe laadimise viga:', error);
  }
}

// ==========================================
// GLOBAALSED SÕNUMI KUULAJAD
// ==========================================

// Kuula liikumise tuvastamise sõnumeid
window.addEventListener('message', (event) => {
  if (event.data.type === 'MOTION_DETECTED') {
    const direction = event.data.direction;
    console.log(`🚨 Liikumine tuvastatud: ${direction}`);
    
    // Näita liikumise indikaatorit
    const indicator = document.getElementById('motionIndicator');
    indicator.classList.add('active');
    
    // Mängi heli vastavalt suunnale
    const soundSelect = document.getElementById(`sound${direction.charAt(0).toUpperCase() + direction.slice(1)}`);
    if (soundSelect) {
      const selectedSound = soundSelect.value;
      playSound(selectedSound);
    }
    
    // Pea indikaator aktiivne 1 sekundi jaoks
    timeout = setTimeout(() => {
      indicator.classList.remove('active');
    }, 1000);
  }
  
  if (event.data.type === 'FPS_UPDATE') {
    document.getElementById('fpsCounter').textContent = event.data.fps;
    document.getElementById('objectCount').textContent = event.data.objects;
  }
});

console.log('✅ Frontend APP.js laaditud');
