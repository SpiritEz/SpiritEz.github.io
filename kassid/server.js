const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const CAT_API_KEY = process.env.CAT_API_KEY || '';
const CAT_API_BASE = 'https://api.thecatapi.com/v1';
let cachedCats = [];

const BLOCKED_BREEDS = new Set([
  'khao manee',
  'korat',
  'kurilian',
  'laperm',
  'maine coon',
  'ocicat',
  'oriental',
  'pixie bob',
  'savannah',
  'selkirk rex',
  'snowshoe',
  'sphynx',
  'toyger',
  'turkish angora',
  'turkish van',
  'york chocolate',
  'bengal',
  'russian blue',
  'siamese',
  'persian'
]);

const BLOCKED_BREED_TERMS = [...BLOCKED_BREEDS];

function normalizeBreedName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPildidIndex() {
  const folderPath = path.join(__dirname, 'pildid');
  const index = new Map();

  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();

      if (!['.jpg', '.jpeg', '.jfif', '.png', '.webp', '.svg'].includes(ext)) {
        continue;
      }

      const fileBase = path.basename(entry.name, path.extname(entry.name));
      const lowerBase = fileBase.toLowerCase();
      const isBaby = lowerBase.includes(' baby');
      const breedBase = isBaby
        ? fileBase.replace(/\s+baby$/i, '')
        : fileBase;
      const key = normalizeBreedName(breedBase);

      if (!key) {
        continue;
      }

      const current = index.get(key) || { adult: '', baby: '' };
      const publicPath = `/pildid/${encodeURIComponent(entry.name)}`;

      if (isBaby) {
        current.baby = publicPath;
      } else {
        current.adult = publicPath;
      }

      index.set(key, current);
    }
  } catch (error) {
    return new Map();
  }

  return index;
}

function getDefaultBabyImage(pildidIndex) {
  for (const images of pildidIndex.values()) {
    if (images?.baby) {
      return images.baby;
    }
  }

  return '';
}

function enrichCatsWithLocalImages(cats, pildidIndex, defaultBabyImage = '') {
  return cats.map((cat) => {
    const pildid = pildidIndex.get(normalizeBreedName(cat.breed));

    return {
      ...cat,
      adultImage: cat.adultImage || pildid?.adult || '',
      babyImage: cat.babyImage || pildid?.baby || defaultBabyImage
    };
  });
}

function isBlockedBreed(cat) {
  const breedName = normalizeBreedName(cat?.breed);

  if (!breedName) {
    return false;
  }

  return BLOCKED_BREED_TERMS.some((blocked) => breedName.includes(blocked));
}

function filterBlockedBreeds(cats) {
  return (cats || []).filter((cat) => !isBlockedBreed(cat));
}

const LOCAL_FALLBACK_CATS = [
  {
    id: 'fallback-beng',
    imageUrl: 'https://cdn2.thecatapi.com/images/tv8tNeYaU.jpg',
    breed: 'Bengal',
    description: 'Athletic and playful spotted cat breed.',
    altNames: '',
    hairless: false,
    origin: 'United States',
    temperament: 'Alert, Agile, Energetic',
    lifeSpan: '12 - 16',
    wikipedia: 'https://en.wikipedia.org/wiki/Bengal_cat'
  },
  {
    id: 'fallback-rblu',
    imageUrl: 'https://cdn2.thecatapi.com/images/ks5wRxZmP.jpg',
    breed: 'Russian Blue',
    description: 'Elegant shorthaired cat with dense plush coat.',
    altNames: '',
    hairless: false,
    origin: 'Russia',
    temperament: 'Gentle, Quiet, Intelligent',
    lifeSpan: '12 - 20',
    wikipedia: 'https://en.wikipedia.org/wiki/Russian_Blue'
  },
  {
    id: 'fallback-siam',
    imageUrl: 'https://cdn2.thecatapi.com/images/hBXicehMA.jpg',
    breed: 'Siamese',
    description: 'Vocal and social cat with short silky fur.',
    altNames: '',
    hairless: false,
    origin: 'Thailand',
    temperament: 'Social, Vocal, Curious',
    lifeSpan: '12 - 15',
    wikipedia: 'https://en.wikipedia.org/wiki/Siamese_cat'
  },
  {
    id: 'fallback-sphy',
    imageUrl: 'https://cdn2.thecatapi.com/images/MuEGe1-Sz.jpg',
    breed: 'Sphynx',
    description: 'Hairless breed with warm suede-like skin.',
    altNames: '',
    hairless: true,
    origin: 'Canada',
    temperament: 'Loyal, Energetic, Friendly',
    lifeSpan: '8 - 14',
    wikipedia: 'https://en.wikipedia.org/wiki/Sphynx_cat'
  }
];

function getLocalFallbackCats(limit, page) {
  const safeLimit = Math.max(1, Math.min(limit, 70));
  const safePage = Math.max(0, page);
  const start = safePage * safeLimit;
  const end = start + safeLimit;
  const subset = LOCAL_FALLBACK_CATS.slice(start, end);

  if (subset.length > 0) {
    return subset;
  }

  return LOCAL_FALLBACK_CATS.slice(0, safeLimit);
}

function getCatApiHeaders() {
  return CAT_API_KEY ? { 'x-api-key': CAT_API_KEY } : {};
}

async function fetchBreedImageUrl(breedId) {
  try {
    const params = new URLSearchParams({
      limit: '1',
      breed_ids: breedId,
      size: 'med'
    });

    const response = await fetch(`${CAT_API_BASE}/images/search?${params.toString()}`, {
      headers: getCatApiHeaders()
    });

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    return data?.[0]?.url || '';
  } catch (error) {
    return '';
  }
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/pildid', express.static(path.join(__dirname, 'pildid')));

app.get('/api/cats', async (req, res) => {
  try {
    const pildidIndex = buildPildidIndex();
    const defaultBabyImage = getDefaultBabyImage(pildidIndex);
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const page = Number.parseInt(req.query.page, 10) || 0;
    const safeLimit = Math.max(1, Math.min(limit, 70));
    const apiFetchLimit = Math.min(safeLimit + 12, 90);

    const params = new URLSearchParams({
      limit: String(apiFetchLimit),
      page: String(Math.max(0, page))
    });

    const response = await fetch(`${CAT_API_BASE}/breeds?${params.toString()}`, {
      headers: getCatApiHeaders()
    });

    if (!response.ok) {
      if (cachedCats.length > 0) {
        const allowedCachedCats = filterBlockedBreeds(cachedCats);
        cachedCats = allowedCachedCats;
        return res.json({ count: allowedCachedCats.length, cats: allowedCachedCats, source: 'cache' });
      }

      const fallbackCats = enrichCatsWithLocalImages(
        getLocalFallbackCats(safeLimit, page),
        pildidIndex,
        defaultBabyImage
      );
      return res.json({ count: fallbackCats.length, cats: fallbackCats, source: 'local-fallback' });

    }

    const data = await response.json();

    const normalized = await Promise.all(data.map(async (breed) => {
      const imageUrl = breed.image?.url || await fetchBreedImageUrl(breed.id);
      const pildid = pildidIndex.get(normalizeBreedName(breed.name));

      return {
        id: breed.id,
        imageUrl: imageUrl || '/assets/figma-cats/figma-cat-1.svg',
        adultImage: pildid?.adult || '',
        babyImage: pildid?.baby || defaultBabyImage,
        breed: breed.name || 'Unknown breed',
        description: breed.description || '',
        altNames: breed.alt_names || '',
        hairless: Number(breed.hairless) === 1,
        origin: breed.origin || 'Unknown origin',
        temperament: breed.temperament || 'No temperament data',
        lifeSpan: breed.life_span || 'Unknown',
        wikipedia: breed.wikipedia_url || ''
      };
    }));

    const allowedCats = filterBlockedBreeds(normalized);
    const finalCats = allowedCats.slice(0, safeLimit);
    let usedFallback = false;

    if (finalCats.length < safeLimit) {
      const needed = safeLimit - finalCats.length;
      const extraCats = enrichCatsWithLocalImages(
        getLocalFallbackCats(safeLimit, 0),
        pildidIndex,
        defaultBabyImage
      )
        .filter((cat) => !isBlockedBreed(cat))
        .slice(0, needed);

      finalCats.push(...extraCats);
      usedFallback = extraCats.length > 0;
    }

    cachedCats = filterBlockedBreeds(finalCats);
    return res.json({
      count: cachedCats.length,
      cats: cachedCats,
      source: usedFallback ? 'api+fallback' : 'api'
    });
  } catch (error) {
    if (cachedCats.length > 0) {
      const allowedCachedCats = filterBlockedBreeds(cachedCats);
      cachedCats = allowedCachedCats;
      return res.json({ count: allowedCachedCats.length, cats: allowedCachedCats, source: 'cache' });
    }

    const pildidIndex = buildPildidIndex();
    const defaultBabyImage = getDefaultBabyImage(pildidIndex);
    const fallbackCats = enrichCatsWithLocalImages(
      getLocalFallbackCats(10, 0),
      pildidIndex,
      defaultBabyImage
    );
    return res.json({ count: fallbackCats.length, cats: fallbackCats, source: 'local-fallback' });

  }
});

app.get('/api/cat-image', async (req, res) => {
  try {
    const breedId = String(req.query.breedId || '').trim();

    if (!breedId) {
      return res.status(400).json({ error: 'breedId is required.' });
    }

    const imageUrl = await fetchBreedImageUrl(breedId);

    if (!imageUrl) {
      return res.status(404).json({ error: 'No image found for this breed.' });
    }

    return res.json({ imageUrl });
  } catch (error) {
    return res.status(500).json({ error: 'Server error while fetching cat image.' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Cats app is running on http://localhost:${PORT}`);
});
