const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const video = document.getElementById('video');
const statusText = document.getElementById('status');
const emotionLabel = document.getElementById('emotionLabel');
const faceEmotionTag = document.getElementById('faceEmotionTag');
const faceEmotionIcon = document.getElementById('faceEmotionIcon');
const cameraCard = document.querySelector('.camera-card');

const optBackground = document.getElementById('optBackground');
const optConfidence = document.getElementById('optConfidence');
const optMirror = document.getElementById('optMirror');
const optSound = document.getElementById('optSound');
const optFigmaEmotion = document.getElementById('optFigmaEmotion');

let detectionTimer = null;
let lastEmotion = 'neutral';

const emotionMap = {
  happy: { className: 'emotion-happy', label: 'Rõõm', icon: 'assets/emotions/happy.svg' },
  sad: { className: 'emotion-sad', label: 'Kurbus', icon: 'assets/emotions/sad.svg' },
  neutral: { className: 'emotion-neutral', label: 'Neutraalne', icon: 'assets/emotions/neutral.svg' },
  angry: { className: 'emotion-angry', label: 'Viha', icon: 'assets/emotions/angry.svg' },
};

const allEmotionClasses = ['emotion-happy', 'emotion-sad', 'emotion-neutral', 'emotion-angry'];

async function loadModels() {
  statusText.textContent = 'Laen tehisintellekti mudeleid...';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
}

async function startCamera() {
  statusText.textContent = 'Küsin kaamera luba...';

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' },
    audio: false,
  });

  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  await video.play();
  statusText.textContent = 'Kaamera töötab. Tuvastan emotsiooni...';
}

function pickEmotion(expressions) {
  const candidates = ['happy', 'sad', 'neutral', 'angry'];
  let best = 'neutral';
  let score = 0;

  for (const emotion of candidates) {
    const value = expressions[emotion] ?? 0;
    if (value > score) {
      score = value;
      best = emotion;
    }
  }

  return { emotion: best, confidence: score };
}

function setBackgroundByEmotion(emotion) {
  const config = emotionMap[emotion] ?? emotionMap.neutral;
  document.body.classList.remove(...allEmotionClasses);

  if (optBackground.checked) {
    document.body.classList.add(config.className);
  } else {
    document.body.classList.add('emotion-neutral');
  }

  emotionLabel.textContent = `Emotsioon: ${config.label}`;
}

function setFaceEmotionBadge(emotion, box) {
  if (!optFigmaEmotion.checked || !box || !video.videoWidth || !video.videoHeight) {
    faceEmotionTag.classList.add('hidden');
    return;
  }

  const config = emotionMap[emotion] ?? emotionMap.neutral;
  const scaleX = video.clientWidth / video.videoWidth;
  const scaleY = video.clientHeight / video.videoHeight;

  let left = (box.x + box.width + 12) * scaleX;
  const top = box.y * scaleY;

  if (optMirror.checked) {
    left = (video.videoWidth - box.x + 12) * scaleX;
  }

  const maxLeft = Math.max(0, video.clientWidth - 56);
  const finalLeft = Math.min(left, maxLeft);

  faceEmotionTag.style.left = `${finalLeft}px`;
  faceEmotionTag.style.top = `${Math.max(0, top)}px`;
  faceEmotionIcon.src = config.icon;
  faceEmotionIcon.alt = config.label;
  faceEmotionTag.classList.remove('hidden');
}

function playEmotionChangeBeep() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 720;
  gain.gain.value = 0.04;

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + 0.08);
}

function bindOptionEvents() {
  optMirror.addEventListener('change', () => {
    cameraCard.classList.toggle('mirror', optMirror.checked);
  });

  optFigmaEmotion.addEventListener('change', () => {
    if (!optFigmaEmotion.checked) {
      faceEmotionTag.classList.add('hidden');
    }
  });
}

async function detectEmotionLoop() {
  if (detectionTimer) {
    clearInterval(detectionTimer);
  }

  detectionTimer = setInterval(async () => {
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
        .withFaceExpressions();

      if (!detection) {
        statusText.textContent = 'Nägu ei leitud. Vaata kaamerasse.';
        setBackgroundByEmotion('neutral');
        setFaceEmotionBadge('neutral');
        return;
      }

      const { emotion, confidence } = pickEmotion(detection.expressions);
      setBackgroundByEmotion(emotion);
      setFaceEmotionBadge(emotion, detection.detection.box);

      if (optConfidence.checked) {
        statusText.textContent = `Tuvastus kindlus: ${Math.round(confidence * 100)}%`;
      } else {
        statusText.textContent = 'Kaamera töötab. Tuvastan emotsiooni...';
      }

      if (optSound.checked && emotion !== lastEmotion) {
        playEmotionChangeBeep();
      }

      lastEmotion = emotion;
    } catch {
      statusText.textContent = 'Tuvastamisel tekkis viga.';
    }
  }, 900);
}

async function init() {
  if (!window.isSecureContext && location.hostname !== 'localhost') {
    statusText.textContent = 'Kaamera vajab HTTPS-i või localhosti.';
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    statusText.textContent = 'Selles brauseris pole kaameratuge.';
    return;
  }

  try {
    bindOptionEvents();
    await loadModels();
    await startCamera();
    await detectEmotionLoop();
  } catch (error) {
    console.error(error);
    statusText.textContent = 'Rakendust ei saanud käivitada (kaamera või mudelid).';
  }
}

window.addEventListener('beforeunload', () => {
  if (detectionTimer) {
    clearInterval(detectionTimer);
  }

  const stream = video.srcObject;
  if (stream && typeof stream.getTracks === 'function') {
    stream.getTracks().forEach((track) => track.stop());
  }
});

init();
