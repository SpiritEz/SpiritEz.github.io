const SNAP_FACTOR = 0.35;
const RECORDS_KEY = "pixel-puzzle-records";
const MAX_BOARD_WIDTH = 500;
const MAX_BOARD_HEIGHT = 500;

const uploadInput = document.getElementById("uploadInput");
const randomImageButton = document.getElementById("randomImageButton");
const cameraButton = document.getElementById("cameraButton");
const captureButton = document.getElementById("captureButton");
const difficultySelect = document.getElementById("difficultySelect");
const shapeSelect = document.getElementById("shapeSelect");
const musicSelect = document.getElementById("musicSelect");
const ghostButton = document.getElementById("ghostButton");
const cutButton = document.getElementById("cutButton");
const downloadRecordsButton = document.getElementById("downloadRecords");

const cameraPanel = document.getElementById("cameraPanel");
const cameraVideo = document.getElementById("cameraVideo");

const gameTitle = document.getElementById("gameTitle");
const assemblyGrid = document.getElementById("assemblyGrid");
const storagePieces = document.getElementById("storagePieces");
const originalCanvas = document.getElementById("originalCanvas");
const originalContext = originalCanvas.getContext("2d");
const ghostImage = document.getElementById("ghostImage");
const fxCanvas = document.getElementById("fxCanvas");
const fxContext = fxCanvas.getContext("2d");
const assemblySlotsLayer = document.createElement("div");
assemblySlotsLayer.className = "assembly-slots";
assemblyGrid.insertBefore(assemblySlotsLayer, fxCanvas);

const currentRecordNode = document.getElementById("currentRecord");
const lastTimeNode = document.getElementById("lastTime");
const leaderboardNode = document.getElementById("leaderboard");

const piecesById = new Map();

let gridSize = Number(difficultySelect.value);
let selectedShape = shapeSelect.value;

let boardWidth = 500;
let boardHeight = 500;
let pieceWidth = boardWidth / gridSize;
let pieceHeight = boardHeight / gridSize;

let imageLoaded = false;
let currentImage = null;
let cameraStream = null;
let dragPieceId = null;

let gameStarted = false;
let startTimeMs = null;
let completed = false;

let audioContext = null;
let musicNodes = [];
let musicIntervals = [];
let lastRandomImageNumber = null;

function formatSeconds(seconds) {
  return `${seconds.toFixed(2)} s`;
}

function getStoredRecords() {
  const raw = localStorage.getItem(RECORDS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function renderLeaderboard() {
  const records = getStoredRecords().sort((a, b) => a.seconds - b.seconds).slice(0, 8);
  leaderboardNode.innerHTML = "";

  if (records.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No records yet";
    leaderboardNode.appendChild(emptyItem);
    currentRecordNode.textContent = "—";
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("li");
    item.textContent = `${formatSeconds(record.seconds)} · ${record.grid}x${record.grid} · ${record.shape} · ${record.date}`;
    leaderboardNode.appendChild(item);
  });

  currentRecordNode.textContent = formatSeconds(records[0].seconds);
}

function exportRecordsAsJson() {
  const data = JSON.stringify(getStoredRecords(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "records.json";
  anchor.click();

  URL.revokeObjectURL(url);
}

function updateGridStyles() {
  document.documentElement.style.setProperty("--grid-size", String(gridSize));
  document.documentElement.style.setProperty("--board-width", `${boardWidth}px`);
  document.documentElement.style.setProperty("--board-height", `${boardHeight}px`);
  document.documentElement.style.setProperty("--piece-width", `${pieceWidth}px`);
  document.documentElement.style.setProperty("--piece-height", `${pieceHeight}px`);

  originalCanvas.width = Math.round(boardWidth);
  originalCanvas.height = Math.round(boardHeight);
  fxCanvas.width = Math.round(boardWidth);
  fxCanvas.height = Math.round(boardHeight);

  assemblyGrid.classList.toggle("shape-mode", selectedShape !== "square");
  rebuildAssemblySlots();
}

function resetGameState() {
  storagePieces.innerHTML = "";
  piecesById.clear();
  gameStarted = false;
  startTimeMs = null;
  completed = false;
  gameTitle.textContent = "Pixel Puzzle";
  gameTitle.classList.remove("success");
  lastTimeNode.textContent = "—";
}

function startTimerIfNeeded() {
  if (!gameStarted) {
    gameStarted = true;
    startTimeMs = performance.now();
  }
}

function createPolygonPath(context, points) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
    context.lineTo(points[pointIndex].x, points[pointIndex].y);
  }
  context.closePath();
}

function pointsToClipPath(points) {
  const values = points.map((point) => `${(point.x / pieceWidth) * 100}% ${(point.y / pieceHeight) * 100}%`);
  return `polygon(${values.join(",")})`;
}

function getPiecePoints(row, col, triangleVariant = 0) {
  if (selectedShape === "square") {
    return [
      { x: 0, y: 0 },
      { x: pieceWidth, y: 0 },
      { x: pieceWidth, y: pieceHeight },
      { x: 0, y: pieceHeight },
    ];
  }

  if (selectedShape === "triangle") {
    const slash = (row + col) % 2 === 0;

    if (slash) {
      return triangleVariant === 0
        ? [
            { x: 0, y: 0 },
            { x: pieceWidth, y: 0 },
            { x: pieceWidth, y: pieceHeight },
          ]
        : [
            { x: 0, y: 0 },
            { x: 0, y: pieceHeight },
            { x: pieceWidth, y: pieceHeight },
          ];
    }

    return triangleVariant === 0
      ? [
          { x: pieceWidth, y: 0 },
          { x: pieceWidth, y: pieceHeight },
          { x: 0, y: pieceHeight },
        ]
      : [
          { x: pieceWidth, y: 0 },
          { x: 0, y: 0 },
          { x: 0, y: pieceHeight },
        ];
  }

  const seed = row * 997 + col * 571 + gridSize * 31;
  const random = (offset) => {
    const value = Math.sin(seed + offset * 83.19) * 10000;
    return value - Math.floor(value);
  };

  return [
    { x: pieceWidth * (0.08 + random(1) * 0.18), y: pieceHeight * (0.02 + random(2) * 0.14) },
    { x: pieceWidth * (0.78 + random(3) * 0.18), y: pieceHeight * (0.05 + random(4) * 0.16) },
    { x: pieceWidth * (0.96 - random(5) * 0.12), y: pieceHeight * (0.55 + random(6) * 0.4) },
    { x: pieceWidth * (0.65 + random(7) * 0.28), y: pieceHeight * (0.94 - random(8) * 0.12) },
    { x: pieceWidth * (0.18 + random(9) * 0.2), y: pieceHeight * (0.94 - random(10) * 0.12) },
    { x: pieceWidth * (0.02 + random(11) * 0.12), y: pieceHeight * (0.52 + random(12) * 0.4) },
  ];
}

function drawImageAtOriginalSize(imageSource) {
  originalContext.clearRect(0, 0, boardWidth, boardHeight);
  originalContext.drawImage(imageSource, 0, 0, boardWidth, boardHeight);
  ghostImage.src = originalCanvas.toDataURL("image/png");
}

function rebuildAssemblySlots() {
  assemblySlotsLayer.innerHTML = "";

  if (selectedShape === "square") {
    return;
  }

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const variants = selectedShape === "triangle" ? [0, 1] : [0];

      variants.forEach((triangleVariant) => {
        const slot = document.createElement("div");
        slot.className = "shape-slot";
        slot.style.left = `${col * pieceWidth}px`;
        slot.style.top = `${row * pieceHeight}px`;
        slot.style.width = `${pieceWidth}px`;
        slot.style.height = `${pieceHeight}px`;

        const points = getPiecePoints(row, col, triangleVariant);
        const clip = pointsToClipPath(points);
        slot.style.clipPath = clip;
        slot.style.webkitClipPath = clip;

        assemblySlotsLayer.appendChild(slot);
      });
    }
  }
}

function getFittedBoardSize(sourceWidth, sourceHeight) {
  const scaleByWidth = MAX_BOARD_WIDTH / sourceWidth;
  const scaleByHeight = MAX_BOARD_HEIGHT / sourceHeight;
  const scale = Math.min(scaleByWidth, scaleByHeight, 1);

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

function createPieceFromCell(row, col, triangleVariant = 0) {
  const sourceX = col * pieceWidth;
  const sourceY = row * pieceHeight;
  const canvasWidth = Math.max(1, Math.round(pieceWidth));
  const canvasHeight = Math.max(1, Math.round(pieceHeight));

  const pieceCanvas = document.createElement("canvas");
  pieceCanvas.width = canvasWidth;
  pieceCanvas.height = canvasHeight;

  const pieceContext = pieceCanvas.getContext("2d");
  const points = getPiecePoints(row, col, triangleVariant);
  createPolygonPath(pieceContext, points);
  pieceContext.clip();

  pieceContext.drawImage(
    originalCanvas,
    sourceX,
    sourceY,
    pieceWidth,
    pieceHeight,
    0,
    0,
    pieceWidth,
    pieceHeight
  );

  const piece = document.createElement("img");
  const id = `piece-${row}-${col}-${triangleVariant}`;
  piece.id = id;
  piece.className = "puzzle-piece";
  piece.src = pieceCanvas.toDataURL("image/png");
  piece.draggable = true;
  piece.dataset.correctX = String(sourceX);
  piece.dataset.correctY = String(sourceY);
  piece.dataset.locked = "false";
  piece.style.clipPath = pointsToClipPath(points);
  piece.style.webkitClipPath = pointsToClipPath(points);

  attachPieceDnD(piece);
  piecesById.set(id, piece);
  return piece;
}

function shuffleArray(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
}

function createPuzzlePieces() {
  const pieces = [];

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      if (selectedShape === "triangle") {
        pieces.push(createPieceFromCell(row, col, 0));
        pieces.push(createPieceFromCell(row, col, 1));
      } else {
        pieces.push(createPieceFromCell(row, col, 0));
      }
    }
  }

  shuffleArray(pieces);
  pieces.forEach((piece) => storagePieces.appendChild(piece));
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playSnapSound() {
  ensureAudioContext();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(780, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(420, audioContext.currentTime + 0.15);

  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.17, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);

  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.22);
}

function stopMusic() {
  musicIntervals.forEach((intervalId) => clearInterval(intervalId));
  musicIntervals = [];

  musicNodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      // no-op
    }
  });

  musicNodes = [];
}

function startMusic(mode) {
  stopMusic();
  if (mode === "none") return;

  ensureAudioContext();

  const createTone = (frequency, type, gainValue) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = gainValue;
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    musicNodes.push(oscillator);
    return oscillator;
  };

  if (mode === "calm") {
    createTone(196, "sine", 0.02);
    createTone(293.66, "sine", 0.01);
    return;
  }

  const lead = createTone(440, "square", 0.015);
  const bass = createTone(110, "triangle", 0.02);
  const melody = [440, 523.25, 659.25, 523.25, 392, 523.25, 659.25, 783.99];
  let noteIndex = 0;

  const intervalId = setInterval(() => {
    lead.frequency.setValueAtTime(melody[noteIndex % melody.length], audioContext.currentTime);
    bass.frequency.setValueAtTime(noteIndex % 2 === 0 ? 110 : 146.83, audioContext.currentTime);
    noteIndex += 1;
  }, 280);

  musicIntervals.push(intervalId);
}

function attachPieceDnD(piece) {
  piece.addEventListener("dragstart", (event) => {
    if (piece.dataset.locked === "true") {
      event.preventDefault();
      return;
    }

    startTimerIfNeeded();
    dragPieceId = piece.id;
    piece.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", piece.id);
  });

  piece.addEventListener("dragend", () => {
    piece.classList.remove("dragging");
  });
}

function getPieceByTransfer(event) {
  const id = event.dataTransfer.getData("text/plain") || dragPieceId;
  if (!id) return null;
  return piecesById.get(id) || null;
}

function lockPiece(piece) {
  piece.dataset.locked = "true";
  piece.classList.add("locked");
  piece.draggable = false;
}

function snapPieceIfNear(piece) {
  const correctX = Number(piece.dataset.correctX);
  const correctY = Number(piece.dataset.correctY);
  const currentX = Number(piece.style.left.replace("px", ""));
  const currentY = Number(piece.style.top.replace("px", ""));

  const distance = Math.hypot(correctX - currentX, correctY - currentY);
  const threshold = Math.min(pieceWidth, pieceHeight) * SNAP_FACTOR;

  if (distance <= threshold) {
    piece.style.left = `${correctX}px`;
    piece.style.top = `${correctY}px`;
    lockPiece(piece);
    playSnapSound();
  }
}

function placePieceOnAssembly(piece, x, y) {
  piece.classList.add("in-assembly");
  assemblyGrid.appendChild(piece);

  const boundedX = Math.max(0, Math.min(x, boardWidth - pieceWidth));
  const boundedY = Math.max(0, Math.min(y, boardHeight - pieceHeight));

  piece.style.left = `${boundedX}px`;
  piece.style.top = `${boundedY}px`;

  snapPieceIfNear(piece);
  checkSuccess();
}

function isSolved() {
  const allPieces = Array.from(piecesById.values());
  return allPieces.length > 0 && allPieces.every((piece) => piece.dataset.locked === "true");
}

function addRecord(seconds) {
  const records = getStoredRecords();
  records.push({
    seconds,
    grid: gridSize,
    shape: selectedShape,
    date: new Date().toLocaleString("en-US"),
  });

  saveRecords(records);
  renderLeaderboard();
}

function launchWinExplosion() {
  const rockets = [];
  const particles = [];
  const rocketCount = Math.max(8, Math.min(14, gridSize + 4));

  for (let index = 0; index < rocketCount; index += 1) {
    rockets.push({
      x: boardWidth * (0.12 + Math.random() * 0.76),
      y: boardHeight + Math.random() * 50,
      targetY: boardHeight * (0.18 + Math.random() * 0.42),
      speedY: 5 + Math.random() * 2,
      hue: Math.floor(Math.random() * 360),
      exploded: false,
    });
  }

  const spawnExplosion = (x, y, hue) => {
    const burstCount = 56 + Math.floor(Math.random() * 28);

    for (let index = 0; index < burstCount; index += 1) {
      const angle = (Math.PI * 2 * index) / burstCount;
      const speed = 1.4 + Math.random() * 4.2;

      particles.push({
        x,
        y,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        life: 58 + Math.random() * 30,
        size: 2 + Math.random() * 3.4,
        hue: (hue + Math.floor(Math.random() * 45) - 22 + 360) % 360,
      });
    }

    particles.push({
      x,
      y,
      speedX: 0,
      speedY: 0,
      life: 18,
      size: 22,
      hue,
    });
  };

  let frame = 0;
  const animate = () => {
    fxContext.clearRect(0, 0, boardWidth, boardHeight);

    rockets.forEach((rocket) => {
      if (rocket.exploded) return;

      rocket.y -= rocket.speedY;
      rocket.speedY *= 0.995;

      fxContext.strokeStyle = `hsla(${rocket.hue}, 100%, 70%, 0.8)`;
      fxContext.lineWidth = 3.2;
      fxContext.beginPath();
      fxContext.moveTo(rocket.x, rocket.y + 20);
      fxContext.lineTo(rocket.x, rocket.y);
      fxContext.stroke();

      if (rocket.y <= rocket.targetY) {
        rocket.exploded = true;
        spawnExplosion(rocket.x, rocket.y, rocket.hue);
      }
    });

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.speedY += 0.04;
      particle.speedX *= 0.992;
      particle.life -= 1;

      const alpha = Math.max(0, particle.life / 88);
      fxContext.fillStyle = `hsla(${particle.hue}, 100%, 62%, ${alpha})`;
      fxContext.beginPath();
      fxContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      fxContext.fill();

      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    }

    frame += 1;
    const hasActiveRockets = rockets.some((rocket) => !rocket.exploded);
    const hasActiveParticles = particles.length > 0;

    if (frame < 220 && (hasActiveRockets || hasActiveParticles)) {
      requestAnimationFrame(animate);
    } else {
      fxContext.clearRect(0, 0, boardWidth, boardHeight);
    }
  };

  animate();
}

function checkSuccess() {
  if (!isSolved() || completed) return;

  completed = true;
  const elapsedSeconds = (performance.now() - startTimeMs) / 1000;
  lastTimeNode.textContent = formatSeconds(elapsedSeconds);

  gameTitle.textContent = "Success";
  gameTitle.classList.add("success");

  addRecord(elapsedSeconds);
  launchWinExplosion();
}

function clearAssemblyPieces() {
  Array.from(assemblyGrid.querySelectorAll(".puzzle-piece")).forEach((piece) => piece.remove());
}

function setImageSourceFromElement(imageSource) {
  const sourceWidth = imageSource.videoWidth || imageSource.naturalWidth || imageSource.width;
  const sourceHeight = imageSource.videoHeight || imageSource.naturalHeight || imageSource.height;

  if (!sourceWidth || !sourceHeight) return;

  const fitted = getFittedBoardSize(sourceWidth, sourceHeight);
  boardWidth = fitted.width;
  boardHeight = fitted.height;
  pieceWidth = boardWidth / gridSize;
  pieceHeight = boardHeight / gridSize;

  updateGridStyles();
  drawImageAtOriginalSize(imageSource);

  currentImage = imageSource;
  imageLoaded = true;
  cutButton.disabled = false;
  ghostButton.disabled = false;

  resetGameState();
  clearAssemblyPieces();
}

function handleUploadChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const image = new Image();
  image.onload = () => {
    setImageSourceFromElement(image);
    URL.revokeObjectURL(image.src);
    uploadInput.value = "";
  };
  image.src = URL.createObjectURL(file);
}

function loadRandomImage() {
  let randomNumber = Math.floor(Math.random() * 9) + 1;

  if (lastRandomImageNumber !== null && randomNumber === lastRandomImageNumber) {
    randomNumber = (randomNumber % 9) + 1;
  }

  lastRandomImageNumber = randomNumber;
  const image = new Image();

  image.onload = () => {
    setImageSourceFromElement(image);
  };

  image.onerror = () => {
    alert(`Failed to load image ${randomNumber}.jpg.`);
  };

  image.src = `${randomNumber}.jpg?v=${Date.now()}`;
}

async function toggleCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraPanel.classList.add("hidden");
    captureButton.disabled = true;
    cameraButton.textContent = "Camera";
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraVideo.srcObject = cameraStream;
    cameraPanel.classList.remove("hidden");
    captureButton.disabled = false;
    cameraButton.textContent = "Close camera";
  } catch {
    alert("Failed to open camera.");
  }
}

function captureFromCamera() {
  if (!cameraStream) return;

  const width = cameraVideo.videoWidth || 640;
  const height = cameraVideo.videoHeight || 480;

  const frame = document.createElement("canvas");
  frame.width = width;
  frame.height = height;
  const frameContext = frame.getContext("2d");
  frameContext.drawImage(cameraVideo, 0, 0, width, height);

  const image = new Image();
  image.onload = () => {
    setImageSourceFromElement(image);
  };
  image.src = frame.toDataURL("image/png");
}

function toggleGhost() {
  ghostImage.classList.toggle("visible");
  ghostButton.textContent = ghostImage.classList.contains("visible") ? "Hide" : "Show";
}

function handleCutButton() {
  if (!imageLoaded || !currentImage) return;

  resetGameState();
  clearAssemblyPieces();
  createPuzzlePieces();
}

function setupDropZones() {
  assemblyGrid.addEventListener("dragover", (event) => {
    event.preventDefault();
    assemblyGrid.classList.add("drop-hover");
  });

  assemblyGrid.addEventListener("dragleave", (event) => {
    if (event.target === assemblyGrid) {
      assemblyGrid.classList.remove("drop-hover");
    }
  });

  assemblyGrid.addEventListener("drop", (event) => {
    event.preventDefault();
    assemblyGrid.classList.remove("drop-hover");

    const piece = getPieceByTransfer(event);
    if (!piece || piece.dataset.locked === "true") return;

    const rect = assemblyGrid.getBoundingClientRect();
    const x = event.clientX - rect.left - pieceWidth / 2;
    const y = event.clientY - rect.top - pieceHeight / 2;

    placePieceOnAssembly(piece, x, y);
  });

  storagePieces.addEventListener("dragover", (event) => {
    event.preventDefault();
    storagePieces.classList.add("drop-hover");
  });

  storagePieces.addEventListener("dragleave", (event) => {
    if (event.target === storagePieces) {
      storagePieces.classList.remove("drop-hover");
    }
  });

  storagePieces.addEventListener("drop", (event) => {
    event.preventDefault();
    storagePieces.classList.remove("drop-hover");

    const piece = getPieceByTransfer(event);
    if (!piece || piece.dataset.locked === "true") return;

    piece.classList.remove("in-assembly");
    piece.style.left = "";
    piece.style.top = "";
    storagePieces.appendChild(piece);
  });
}

function applySettingsFromControls() {
  gridSize = Number(difficultySelect.value);
  selectedShape = shapeSelect.value;
  pieceWidth = boardWidth / gridSize;
  pieceHeight = boardHeight / gridSize;
  updateGridStyles();

  if (imageLoaded && currentImage) {
    drawImageAtOriginalSize(currentImage);
    cutButton.disabled = false;
    ghostButton.disabled = false;
    resetGameState();
    clearAssemblyPieces();
    createPuzzlePieces();
  }
}

uploadInput.addEventListener("change", handleUploadChange);
randomImageButton.addEventListener("click", loadRandomImage);
cameraButton.addEventListener("click", toggleCamera);
captureButton.addEventListener("click", captureFromCamera);
ghostButton.addEventListener("click", toggleGhost);
cutButton.addEventListener("click", handleCutButton);
downloadRecordsButton.addEventListener("click", exportRecordsAsJson);

musicSelect.addEventListener("change", () => {
  startMusic(musicSelect.value);
});

difficultySelect.addEventListener("change", applySettingsFromControls);
shapeSelect.addEventListener("change", applySettingsFromControls);

setupDropZones();
updateGridStyles();
renderLeaderboard();
