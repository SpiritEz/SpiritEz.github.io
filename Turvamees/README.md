# 🛡️ TURVAMEES - Liikumise Tuvastaja Rakendus

Tere! See on kaasaegne veebirakendus, mis kasutab Node.js-i, Express'i ja WebRTC-d kaamerate liikumise tuvastamiseks reaalajas. Rakendus mängib erinevaid häiresignaale, sõltuvalt tuvastatud liikumise suunast.

## 📋 Projekt Kommentaarid

```
Turvamees/
│
├── 📄 app.js                 # Node.js Express server
├── 📄 package.json           # NPM pakett ja sõltuvused
├── 📄 .gitignore             # Git seaded
├── 📄 README.md              # See fail
│
└── 📁 public/                # Frontend failid
    ├── 📄 index.html         # Pealeht ja UI
    │
    ├── 📁 css/
    │   └── 📄 style.css      # Kõik stiilid ja disain
    │
    ├── 📁 js/
    │   ├── 📄 app.js         # Kasutajaliidese loogika
    │   └── 📄 motion-detection.js  # Liikumise tuvastamine
    │
    ├── 📁 sounds/            # Heli failid (tulevikus)
    └── 📁 images/            # Pildid ja ikonid (tulevikus)
```

## 🚀 Alustamine

### Eel-nõudmised

- **Node.js** (v14 või uuem)
- **npm** (Node Package Manager)
- Kaamera juurdepääsuga arvuti
- Moderni brauser (Chrome, Firefox, Safari)

### Installatsioon

1. **Projekti kloonimise** (GitHubist):
```bash
git clone https://github.com/yourusername/turvamees.git
cd turvamees
```

2. **Sõltuvuste installatsioon**:
```bash
npm install
```

3. **Serveri käivitamine**:
```bash
npm start
```

4. **Lingi avamine brauseris**:
Avage `http://localhost:3000` oma brauseris.

## 🎯 Omadused

### ✅ Praegused omadused

1. **📹 Reaalajaline kaamera**
   - WebRTC-d kasutades peaksite otse kaamera stream
   - Canvas-i joonistamine

2. **🚨 Liikumise tuvastamine**
   - Pikslite võrdlemine kaadrite vahel
   - Määritletav tundlikkus

3. **🔊 Kohandatavad helid**
   - Beep, häire, kella helid
   - Erinevatele liikumistele määratud helid
   - Web Audio API kasutamine

4. **🎨 Mitmed режimed**
   - Normaalne režiim
   - Öine režiim
   - Vaikne režiim

5. **⚙️ Seaded**
   - Helitugevuse kontroll
   - Liikumise tundlikkuse reguleerimine

6. **📊 Jõudluse näitajad**
   - FPS arvutamine
   - Tuvastatud objektide arv

7. **🎨 Reageeriv disain**
   - Töötab mobiilitest kuni lauaarvutiteni

8. **💾 Kohalik salvestamine**
   - Liikumise logide salvestamine

9. **🔐 Turvalisus**
   - Kaamera juurdepääsu küsimine
   - HTTPS tugi

10. **📱 Kasutajaliides**
    - Intuitiivne ja kaasaegne disain
    - Reaalajaline tagasiside

## 📖 Kasutamise juhend

### Kaamara käivitamine

1. Klõpsake "Käivita kaamera" nuppu
2. Aktsepteerige kaamara juurdepääsu küsimust
3. Liikumise tuvastamine algab automaatselt

### Helide seadistamine

1. Valige eri liikumistele erineva helid:
   - **Edasi**: Beep, häire või kell
   - **Tagasi**: Häire (vaikimisi)
   - **Külg**: Kell (vaikimisi)

2. Reguleerige helitugevust õigele tasemele

### Tundlikkuse reguleerimine

1. Kasutage "Liikumise tundlikkus" slider'd
2. Madalam % = vähem tundlik
3. Kõrgem % = rohkem tundlik

### Režiimide kasutamine

- **Normaalne**: Kõik näitajad ja helid nähtavad
- **Öine**: Tumedad värvid, infrared-i toetus
- **Vaikne**: Helid välja lülitatud, ainult visuaalne

## 🛠️ Tehniline omadused

### Backend (Node.js)

```javascript
// Express server
const app = express();
const PORT = 3000;

// CORS lubatud
app.use(cors());

// Staatiline failide jagamine
app.use(express.static(path.join(__dirname, 'public')));
```

### Frontend (vaniljaline JavaScript)

**Canvas liikumise tuvastamine**:
- Pikslite RGB väärtuste võrdlemine
- Erinevuse arvutamine
- Suuna määramine

**Web Audio API**:
- Helide loomine
- Helitugevuse kontroll
- Mitmete helide mängimise juhtimise

## 🚨 Juhised liikumise tuvastamiseks

### Pikslite võrdlus algoritm:

```javascript
// 1. Laadi kaadri andmed
const imageData = context.getImageData(0, 0, width, height);

// 2. Võrdle RGB väärtusi
const rDiff = Math.abs(current[i] - previous[i]);
const gDiff = Math.abs(current[i+1] - previous[i+1]);
const bDiff = Math.abs(current[i+2] - previous[i+2]);

// 3. Arvuta erinevus
const avgDiff = (rDiff + gDiff + bDiff) / 3;

// 4. Kontrolli tundlikkuse määr
if (avgDiff > threshold) {
  motionPixels++;
}
```

### Suuna määramise loogika:

1. **Edasi**: Liikumine video keskelt väljapoole
2. **Tagasi**: Liikumine video servast keskkonda
3. **Külg**: Horisontaalne liikumine

## 🔧 Konfigureerimine

### Helide muutmine

Muutke `app.js` failis `createSoundEffects()` funktsiooni:

```javascript
function createSoundEffects() {
  audioBuffers.beep = createBeepSound();
  audioBuffers.alarm = createAlarmSound();
  audioBuffers.bell = createBellSound();
}
```

### Serveri pordi muutmine

Muutke `app.js` failis:
```javascript
const PORT = process.env.PORT || 3000;
```

### Kaamera seaded

Muutke `app.js` failis `startCamera()` funktsiooni:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }
});
```

## 🚀 Juurutamine

### Heroku

1. Looge Heroku konto
2. Installige Heroku CLI
3. Käitage:
```bash
heroku create your-app-name
git push heroku main
```

### GitHub Pages (front-end only)

Kõigendada `gh-pages` branch ja seadistage GitHub Pages.

### Azure/AWS

Kasutage oma pilve platvormi dokumentatsiooni.

## 🐛 Tõrkeotsing

### "Kaamera käivitamise viga"
- Veenduge, et brauser lubab kaamerate juurdepääsu
- Kontrollige, et kaamera tööab
- Proovige erinevat brauserit

### "Liikumist ei tuvastata"
- Tõstke tundlikkuse taset
- Veenduge, et kaamera näeb liikumist
- Kontrollida valgustingimusi

### "Helid ei mängi"
- Veenduge, et helid on sisse lülitatud
- Kontrollige helitugevuse taset
- Proovige erinevat brauserit

## 📚 Kasutusel olevad teegid

- **Express.js**: Web framework
- **CORS**: Cross-Origin Resource Sharing
- **HTML5 Canvas**: Graafika ja video
- **Web Audio API**: Helide genereerimine
- **WebRTC**: Kaamera juurdepääs

## 📝 Litsents

MIT License - Vabalt kasutatav ja muudetav

## 👨‍💻 Autori teave

Loodud Node.js ja veebirakenduste kallal töötades.

## 🤝 Panustamine

Palun avage Pull Request omaduste või paranduste jaoks.

## 📞 Kontakt

GitHub: [@yourusername](https://github.com/yourusername)

---

**Märkus**: See projekt on õppimise eesmärgil. Tegelike turvalisuse lahenduste jaoks konsulteerige spetsialistiga.
