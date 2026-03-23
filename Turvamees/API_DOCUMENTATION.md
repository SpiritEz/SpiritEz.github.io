# TURVAMEES API Dokumentatsioon

## 📡 REST API Endpoints

### 1. Pealehe päring

**Lõpp-punkt**: `GET /`

**Kirjeldus**: Tagastab pealeht HTML

**Vastus**: HTML leht

```bash
curl http://localhost:3000/
```

---

### 2. Rakenduse info

**Lõpp-punkt**: `GET /api/info`

**Kirjeldus**: Tagastab rakenduse informatsiooni JSON formaadis

**Vastus**:
```json
{
  "name": "Turvamees - Liikumise tuvastaja",
  "version": "1.0.0",
  "description": "Veebirakendus kaamerate liikumise tuvastamiseks",
  "features": [...],
  "repository": "https://github.com/yourusername/turvamees"
}
```

**Näide**:
```bash
curl http://localhost:3000/api/info
```

---

### 3. Portfoolio link

**Lõpp-punkt**: `GET /portfolio`

**Kirjeldus**: Tagastab portfoolio teabe

**Vastus**:
```json
{
  "message": "Tere! See on Turvamees rakendus",
  "portfolio": "/index.html",
  "github": "https://github.com/yourusername/turvamees"
}
```

---

## 🎯 Frontend API (JavaScript)

### Motion Detection

**Initsialisatsioon**:
```javascript
motionDetector.init();
motionDetector.startDetection();
```

### Motion Logger

**Logi liikumist**:
```javascript
motionLogger.logMotion('forward', 25.5);
```

**Eksport JSON**:
```javascript
motionLogger.exportToJSON();
```

**Eksport CSV**:
```javascript
motionLogger.exportToCSV();
```

**Kuvage statistika**:
```javascript
motionLogger.displayStatistics();
```

---

## 📨 Post Message API

### Motion Detection Events

**Tüüp**: `'MOTION_DETECTED'`

**Andmed**:
```javascript
{
  type: 'MOTION_DETECTED',
  direction: 'forward' | 'backward' | 'side',
  intensity: 0-100
}
```

**Näide lajadus**:
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'MOTION_DETECTED') {
    console.log('Liikumine:', event.data.direction);
  }
});
```

---

### FPS Update

**Tüüp**: `'FPS_UPDATE'`

**Andmed**:
```javascript
{
  type: 'FPS_UPDATE',
  fps: 30,
  objects: 5
}
```

---

## ⚙️ Configuration API

### Sound Management

**Heli mängimise funktsioon**:
```javascript
playSound('beep');          // Beep heli
playSound('alarm');         // Häire heli
playSound('bell');          // Kella heli
```

### Motion Detection Settings

**Tundlikkuse muutmine**:
```javascript
window.postMessage({
  type: 'SENSITIVITY_CHANGED',
  value: 50
}, '*');
```

**Liikumise tuvastamise alustamine**:
```javascript
window.postMessage({
  type: 'START_DETECTION',
  sensitivity: 30
}, '*');
```

---

## 🎨 UI Controls

### Camera Controls

**Käivita kaamera**:
```javascript
startCamera();
```

**Peata kaamera**:
```javascript
stopCamera();
```

### Mode Changes

**Režiimi muutmine**:
```javascript
changeMode('normal');   // Normaalne
changeMode('night');    // Öine
changeMode('quiet');    // Vaikne
```

---

## 📊 Data Structures

### Log Entry

```javascript
{
  timestamp: "2024-03-23T10:30:00.000Z",
  direction: "forward",
  intensity: 25.5,
  uid: "uid-1711180200000-abc123"
}
```

### Statistics

```javascript
{
  totalMotionEvents: 150,
  forwardCount: 50,
  backwardCount: 60,
  sideCount: 40,
  totalMotionPixels: 3750,
  averageIntensity: 25.0
}
```

---

## 🔌 Integration Examples

### Integrateeri välise API-ga

```javascript
// Saada liikumise andmed välisele serverisse
window.addEventListener('message', (event) => {
  if (event.data.type === 'MOTION_DETECTED') {
    fetch('/api/log-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: event.data.direction,
        intensity: event.data.intensity,
        timestamp: new Date().toISOString()
      })
    });
  }
});
```

### WebSocket integratsioon

```javascript
// Real-time liikumise andmete saatmine
const ws = new WebSocket('ws://localhost:3001');

window.addEventListener('message', (event) => {
  if (event.data.type === 'MOTION_DETECTED') {
    ws.send(JSON.stringify(event.data));
  }
});
```

---

## 📝 Error Handling

### Camera Access Denied

```javascript
// Brauser keelab kaamara juurdepääsu
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    console.error('Kaamera juurdepääs keelatud');
  }
}
```

### Storage Quota Exceeded

```javascript
// localStorage on täis
try {
  localStorage.setItem('data', json);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('Storage kvoot ületatud');
  }
}
```

---

## 🔐 Security Features

### CORS

```javascript
// app.js
app.use(cors());  // Lubatud kõikidelt domeenidelt
```

### Content Security Policy

```javascript
// Soovitus lisada header'ites
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'"
  );
  next();
});
```

---

## 📈 Performance Considerations

- **Canvas rendering**: 30-60 FPS
- **Frame comparison**: O(n) kus n = pikslite arv
- **Motion detection**: Tundlikkus 0-100%
- **Storage**: ~1-2KB per log entry

---

## 🐛 Debugging

### Enable Debug Logging

```javascript
// Browser konsooli
motionLogger.displayStatistics();
motionLogger.generateReport();
```

### Export Logs

```javascript
// JSON ekspord
motionLogger.exportToJSON();

// CSV ekspord
motionLogger.exportToCSV();
```

---

## 📞 Support

Küsimuste korral avage [GitHub Issue](https://github.com/yourusername/turvamees/issues)

---

**Viimane uuendus**: 2024-03-23
