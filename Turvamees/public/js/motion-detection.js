// ==========================================
// LIIKUMISE TUVASTAMISE SKRIPT
// Motion Detection using Canvas
// ==========================================

// LIIKUMISE TUVASTAMISE GLOBAALSED MUUTUJAD
const motionDetector = {
  // Kaamera elemendid
  videoElement: null,
  canvas: null,
  context: null,
  
  // Andmete hoidmise alused
  previousFrameData: null,
  currentFrameData: null,
  
  // Regulatsioon ja seaded
  sensitivity: 30,
  motionThreshold: 20,
  fps: 0,
  frameCount: 0,
  lastTime: Date.now(),
  detectedMotionObjects: [],
  
  // Käivitamise lipp
  isDetecting: false,
  
  // ==========================================
  // INITSIALISATSIOON
  // ==========================================
  
  init: function() {
    console.log('🎯 Liikumise tuvastaja initsialiseeritud');
    
    this.videoElement = document.getElementById('videoElement');
    this.canvas = document.getElementById('videoCanvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    
    // Määrata canvas suurus video suurusele
    this.videoElement.addEventListener('loadedmetadata', () => {
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;
      console.log(`📐 Canvas suurus: ${this.canvas.width}x${this.canvas.height}`);
      
      // Alusta liikumise tuvastamist
      this.startDetection();
    });
  },
  
  // ==========================================
  // LIIKUMISE TUVASTAMISE ALUSTAMINE
  // ==========================================
  
  startDetection: function() {
    console.log('▶️ Liikumise tuvastamine alustatud');
    this.isDetecting = true;
    this.detectMotion();
  },
  
  // ==========================================
  // LIIKUMISE TUVASTAMISE PÕHILOOGIKA
  // ==========================================
  
  detectMotion: function() {
    if (!this.isDetecting) return;
    
    // Joonista video kaadrit canvasiRG
    this.context.drawImage(
      this.videoElement,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    
    // Hangi pildi andmed
    const imageData = this.context.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    
    this.currentFrameData = imageData.data;
    
    // Kui on eelmiste kaadrite andmed, võrdle neid
    if (this.previousFrameData) {
      this.compareFrames();
    } else {
      // Esimene kaader - salvesta viite
      this.previousFrameData = new Uint8ClampedArray(this.currentFrameData);
    }
    
    // FPS arvutamine
    this.updateFPS();
    
    // Järgmine kaader
    requestAnimationFrame(() => this.detectMotion());
  },
  
  // ==========================================
  // KAADRITE VÕRDLEMINE
  // ==========================================
  
  compareFrames: function() {
    const pixelDifferences = [];
    const threshold = this.sensitivity;
    let motionPixels = 0;
    
    // Võrdle piksleid
    for (let i = 0; i < this.currentFrameData.length; i += 4) {
      // RGB kanali võrdlemine
      const rDiff = Math.abs(
        this.currentFrameData[i] - this.previousFrameData[i]
      );
      const gDiff = Math.abs(
        this.currentFrameData[i + 1] - this.previousFrameData[i + 1]
      );
      const bDiff = Math.abs(
        this.currentFrameData[i + 2] - this.previousFrameData[i + 2]
      );
      
      // Arvuta keskmine erinevus
      const avgDiff = (rDiff + gDiff + bDiff) / 3;
      
      if (avgDiff > threshold) {
        motionPixels++;
      }
    }
    
    // Arvuta liikumise protsent
    const motionPercentage = (motionPixels / (this.currentFrameData.length / 4)) * 100;
    
    // Jälgida liikumist
    if (motionPercentage > 0.5) {
      this.detectMotionDirection(motionPercentage);
    }
    
    // Salvesta praegune kaader viitena
    this.previousFrameData = new Uint8ClampedArray(this.currentFrameData);
  },
  
  // ==========================================
  // LIIKUMISE SUUNA MÄÄRAMINE
  // ==========================================
  
  detectMotionDirection: function(motionPercentage) {
    // Lihtsaidne suuna määramine
    // Tegelik rakendus kasutaks ML.js või TensorFlow.js
    
    const randomDirection = Math.random();
    let direction = 'forward';
    
    if (randomDirection < 0.33) {
      direction = 'forward'; // Edasi
    } else if (randomDirection < 0.66) {
      direction = 'backward'; // Tagasi
    } else {
      direction = 'side'; // Külg
    }
    
    // Saada sõnum parent windowile
    window.parent.postMessage({
      type: 'MOTION_DETECTED',
      direction: direction,
      intensity: motionPercentage
    }, '*');
    
    console.log(`📍 Liikumise suund: ${direction} (intensiivsus: ${motionPercentage.toFixed(2)}%)`);
  },
  
  // ==========================================
  // FPS ARVUTAMINE
  // ==========================================
  
  updateFPS: function() {
    this.frameCount++;
    const now = Date.now();
    const elapsed = now - this.lastTime;
    
    if (elapsed >= 1000) {
      this.fps = this.frameCount;
      console.log(`📊 FPS: ${this.fps}`);
      
      // Saada FPS update
      window.parent.postMessage({
        type: 'FPS_UPDATE',
        fps: this.fps,
        objects: this.detectedMotionObjects.length
      }, '*');
      
      this.frameCount = 0;
      this.lastTime = now;
    }
  }
};

// ==========================================
// SÕNUMITE KUULAMINE
// ==========================================

window.addEventListener('message', (event) => {
  if (event.data.type === 'START_DETECTION') {
    // Alusta liikumise tuvastamist
    motionDetector.sensitivity = event.data.sensitivity || 30;
    motionDetector.init();
  }
  
  if (event.data.type === 'SENSITIVITY_CHANGED') {
    // Muuda tundlikkust
    motionDetector.sensitivity = event.data.value || 30;
    console.log(`⚙️ Tundlikkus muudetud: ${motionDetector.sensitivity}`);
  }
});

console.log('✅ Motion Detection Script laaditud');
