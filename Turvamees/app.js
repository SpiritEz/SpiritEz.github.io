// ==========================================
// TURVAMEES - Liikumise tuvastamise rakendus
// Node.js server - Express
// ==========================================

const express = require('express');
const cors = require('cors');
const path = require('path');

// Express rakenduse initsialiseerimine
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// MARSRUUDID (Routes)
// ==========================================

// Pealehe jaoks marsruut
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API marsruut - rakenduse teabe jaoks
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Turvamees - Liikumise tuvastaja',
    version: '1.0.0',
    description: 'Veebirakendus kaamerate liikumise tuvastamiseks ja häirehädega',
    features: [
      'Reaalajaline kaamerapilt',
      'Objektide liikumise tuvastamine',
      'Erinevatele liikumistele määratud helid',
      'Turvalisuse seaded ja konfigureerimine',
      'Liikumise logid ja statistika',
      'Öise režiimi tugi',
      'Vaikseim režiim',
      'Helikulud ja visualisatsioon',
      'Mitme kaamera tugi',
      'Kohandatavad häirete seaded'
    ],
    repository: 'https://github.com/yourusername/turvamees'
  });
});

// Portfoolio pealehe link
app.get('/portfolio', (req, res) => {
  res.json({
    message: 'Tere! See on Turvamees rakendus',
    portfolio: '/index.html',
    github: 'https://github.com/yourusername/turvamees'
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

// Serveri käivitamine
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  TURVAMEES - LIIKUMISE TUVASTAJA      ║
  ║  Server käivitatud edukalt!            ║
  ╠════════════════════════════════════════╣
  ║  Aadress: http://localhost:${PORT}                ║
  ║  Keskkond: ${process.env.NODE_ENV || 'development'}        ║
  ╚════════════════════════════════════════╝
  `);
});

// Käsitleda serveri vigu
process.on('unhandledRejection', (reason, promise) => {
  console.error('Käsitlemata promise eitamine:', reason);
});

module.exports = app;
