# TURVAMEES Projektisse panustamise juhend

## 🎯 Tere tulemast!

Täname teie huvi TURVAMEES projekti panustamise vastu! Selle juhendi järgimine aitab meil säilitada koodi kvaliteeti ja protsessit.

## 📝 Panustamise sammud

### 1. Fork'i repositoorium

```bash
# GitHub'is klõpsake "Fork" nuppu
# See loob teile kopeerimise repositooriumist
```

### 2. Kloonige teie fork

```bash
git clone https://github.com/yourusername/turvamees.git
cd turvamees
```

### 3. Looge feature branch

```bash
git checkout -b feature/amazing-feature
# Näiteks: feature/better-motion-detection
# Näiteks: feature/new-sounds
# Näiteks: bugfix/camera-issue
```

### 4. Tehke muudatused

- Muutke/lisage kood
- Testige oma muudatusi
- Kirjutage kommentaarid koodisse

### 5. Commit'i ja Push

```bash
# Lisage muudatused
git add .

# Commit'i kirjeldusega
git commit -m "✨ Lisa parandus ABC"

# Push'i teie arenduse harule
git push origin feature/amazing-feature
```

### 6. Pull Request

- Avage GitHub
- Klõpsake "New Pull Request"
- Kirjeldage oma muudatusi
- Oodake ülevaatamist

## 📋 Commit'i nõuded

### Commit'i vorming

```
<emoji> <type>: <description>

<optional body>
```

### Emoji abil

- `✨` - Uus funktsioon
- `🐛` - Veaparandus
- `📝` - Dokumentatsioon
- `🎨` - Disain/stiil
- `⚙️` - Konfiguratsioon
- `🔧` - Parandused
- `🚀` - Jõudluse parandused
- `📦` - Sõltuvuste uuendus

### Näited

```bash
git commit -m "✨ lisa öine režiim"
git commit -m "🐛 parandus: kaamera stream aeg-ajalt peatub"
git commit -m "📝 uuenda README.md"
```

## 🏗️ Koodistiil

### JavaScript nõuded

```javascript
// ✅ HEA
// Kirjutage kommentaarid
function detectMotion(frame) {
  // Võrdle piksleid eelmise kaadriga
  const differences = comparePixels(frame);
  
  // Arvuta liikumise protsent
  const motionPercentage = (differences / totalPixels) * 100;
  
  return motionPercentage > threshold;
}

// ❌ HALB
// Puudu dokumentatsioon
function dm(f) {
  const d = cp(f);
  const m = (d / tp) * 100;
  return m > thr;
}
```

### CSS nõuded

```css
/* ✅ HEA - Selged klassid */
.motion-indicator {
  background: rgba(0, 0, 0, 0.7);
  color: #27ae60;
}

.motion-indicator.active {
  color: #e74c3c;
}

/* ❌ HALB - Lühikesed, ebaselgete klassid */
.mi { /* ... */ }
.mi.a { /* ... */ }
```

### HTML nõuded

```html
<!-- ✅ HEA - Selge struktuur ja semantika -->
<section class="camera-section">
  <div class="camera-container">
    <canvas id="videoCanvas"></canvas>
  </div>
</section>

<!-- ❌ HALB - Mittesemantiline -->
<div class="section">
  <div class="container">
    <canvas id="c"></canvas>
  </div>
</div>
```

## 🧪 Testimine

### Testida lokaalselt

```bash
# 1. Installige sõltuvused
npm install

# 2. Käivitage server
npm start

# 3. Avage brauseris
# http://localhost:3000

# 4. Testimine
# - Käivitage kaamera
# - Liigute objekti
# - Veenduge, et helid mängitakse
```

### Testimise kontroll-list

- [ ] Kaamera käivitub normaalselt
- [ ] Liikumist tuvastatakse
- [ ] Helid mängitakse
- [ ] UI reageeriv
- [ ] Konsoolis vigu pole

## 📚 Dokumentatsioon

### Suurte muudatuste puhul

Lisage dokumentatsioon `doc/` kausta:

```markdown
# Funktsioonil X

## Käivitus

[Kirjeldus]

## API

## Naide

## Märkused
```

### Koodi kommentaarid

```javascript
// ==========================================
// JAOTISE NIMI
// ==========================================

// Selge kommentaar iga funktsiooni jaoks
/**
 * Detekteerib liikumist video kaadris
 * @param {HTMLVideoElement} video - Video element
 * @param {Canvas} canvas - Canvas element
 * @returns {boolean} - Kas liikumine on tuvastatud
 */
function detectMotion(video, canvas) {
  // Kood siin
}
```

## 🐛 Vigade teatamine

### Enne registreerimist

- Kontrollige GitHub Issues
- Vahest see on juba teada?

### Issue loomine

1. Klõpsake "Issues"
2. Klõpsake "New issue"
3. Valige mall: "Bug report"
4. Täitke andmed:

```markdown
## Kirjeldus
[Lühike kirjeldus]

## Samm-sammult taastoomine
1. [Samm 1]
2. [Samm 2]

## Oodatav käitumine
[Mis peaks juhtuma]

## Tegelik käitumine
[Mis tegelikult juhtus]

## Keskkond
- Node.js versioon:
- Brauser:
- OS:
```

## 💡 Feature ettepanekud

### Feature Request loomine

1. GitHub Issues
2. "New issue"
3. Valige "Feature request"
4. Kirjeldage:

```markdown
## Probleemi kirjeldus
[Selge kirjeldus]

## Lahenduse ettepanekud
[Kuidas lahendada]

## Alternatiivsed lahendused
[Muud võimalused]
```

## 📖 Ressursid

- [GitHub Dokumentatsioon](https://docs.github.com)
- [Git Alused](https://git-scm.com/doc)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 🤝 Käitumine

- Ole sõbralik ja aus
- Kuula teiste arvamusi
- Aita kaasaegsetel arendajail
- Ahista koodi osa

## 📞 Küsimused?

Avan issue'i või kontakteeri maintainerit!

Täname panustamise eest! 🎉

---

**Happy coding!** 🚀
