# Juurutamise Juhend

## 🚀 Erinev Juurutamise Valikud

### 1. Lokaalsed Arvutis (Development)

```bash
# Installige sõltuvused
npm install

# Käivitage server
npm start

# Avage http://localhost:3000 brauseriš
```

---

## 2. Heroku'l

### Ettevalmist is

```bash
# 1. Installige Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Looge app
heroku create turvamees-app
```

### Deploy'i

```bash
# 1. Pushige koodi
git push heroku main

# 2. Vaadake logisid
heroku logs --tail

# 3. Avage app
heroku open
```

### Heroku Procfile

Looge `Procfile` fail:
```
web: node app.js
```

---

## 3. Vercel'ile

### Ettevalmist is

```bash
# 1. Installige Vercel CLI
npm install -g vercel

# 2. Login
vercel login
```

### Deploy'i

```bash
# Käivitage deploy
vercel

# Produktsioon
vercel --prod
```

Looge `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ]
}
```

---

## 4. Railway.app'le

### Ettevalmist is

```bash
# 1. Looge konto
# https://railway.app

# 2. Lingige GitHub
# Railway Dashboard > Connect GitHub
```

### Deploy'i

```bash
# Railway automaatselt deploy'i peale GitHub push'i
git push origin main
```

---

## 5. DigitalOcean App Platform'ile

### Ettevalmist is

1. Looge DigitalOcean konto
2. Linkige GitHub

### Deploy'i

1. Valige "Create App"
2. Valige oma GitHub repositoorium
3. Seadistage keskkonna muutujad
4. Klõpsake "Deploy"

---

## 6. AWS'ile (EC2)

### Ettevalmist is

```bash
# 1. Looge EC2 instance (Ubuntu)
# 2. SSH ühendus

# 3. Installige Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# 4. Installige PM2 (process manager)
sudo npm install -g pm2
```

### Deploy'i

```bash
# 1. Kloonige repositoorium
git clone https://github.com/yourusername/turvamees.git
cd turvamees

# 2. Installige sõltuvused
npm install

# 3. Käivitage PM2'ga
pm2 start app.js --name "turvamees"

# 4. Seadistage autostart
pm2 startup
pm2 save
```

---

## 7. Docker'iga

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

### docker-compose.yml

```yaml
version: '3'
services:
  turvamees:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

### Deploy'i

```bash
# Ehita image
docker build -t turvamees .

# Käivitage konteinerit
docker run -p 3000:3000 turvamees

# Või docker-compose'ga
docker-compose up
```

---

## 8. GitHub Pages'ile (Front-end only)

### Ettevalmist is

1. Looge `gh-pages` branch
2. Seadistage GitHub Pages

### Deploy'i

Käivitage scripti `package.json`'is:

```json
{
  "scripts": {
    "deploy": "git subtree push --prefix public origin gh-pages"
  }
}
```

```bash
npm run deploy
```

---

## 📊 Keskkonna Muutujad

### .env fail

```env
# Node.js keskkond
NODE_ENV=production

# Server port
PORT=3000

# Database URL (tulevikus)
DATABASE_URL=

# API võtmed (tulevikus)
API_KEY=
```

### Seadistamine

```javascript
// app.js
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

---

## 🔒 Turvalisuse Seaded

### HTTPS

```javascript
// Heroku automaatselt HTTPS'i seadistab

// AWS/EC2 puhul:
// 1. Installige SSL sertifikaat (Let's Encrypt)
// 2. Seadistage Nginx reverse proxy
```

### Helmet.js (Security Headers)

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

---

## 📈 Optimisatsioon

### Gzip kompresioon

```javascript
const compression = require('compression');
app.use(compression());
```

### Staatiline failide cache'i

```javascript
app.use(express.static(
  path.join(__dirname, 'public'),
  { maxAge: '1h' }
));
```

### CDN integratsioon

Kasutage Cloudflare'i või Amazon CloudFront'i

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# Näita jookseva processi status
pm2 status

# Näita logisid
pm2 logs turvamees

# Restart
pm2 restart turvamees
```

### SendGrid Email Alerts

```bash
npm install nodemailer
```

---

## 🆘 Deployment Troubleshooting

### "Cannot find module"

```bash
# Installige sõltuvused
npm install

# Clear cache
npm cache clean --force
```

### "Port already in use"

```bash
# Leia protsess
netstat -ano | findstr :3000

# Peatage protsess
taskkill /PID <PID> /F
```

### "Out of memory"

```bash
# Increase Node.js memory
node --max-old-space-size=4096 app.js
```

---

## ✅ Juurutamise Checklist

- [ ] package.json on seadistatud
- [ ] .gitignore on määratud
- [ ] Environment muutujad seadistatud
- [ ] HTTPS seadistatud
- [ ] Error handling implementeeritud
- [ ] Logging seadistatud
- [ ] Database backup seadistatud (võimalusel)
- [ ] Monitoring seadistatud
- [ ] Recovery plan olemas

---

## 📚 Kasulikud Lingid

- [Heroku Docs](https://devcenter.heroku.com)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [AWS EC2 Docs](https://docs.aws.amazon.com/ec2/)
- [Docker Docs](https://docs.docker.com)
- [Let's Encrypt](https://letsencrypt.org)

---

**Viimane uuendus**: 2024-03-23
