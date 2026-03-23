const cardsContainer = document.getElementById('cardsContainer');
const refreshBtn = document.getElementById('refreshBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const themeBtn = document.getElementById('themeBtn');
const favoritesOnlyBtn = document.getElementById('favoritesOnlyBtn');
const retryBtn = document.getElementById('retryBtn');
const errorBox = document.getElementById('errorBox');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const cardsCount = document.getElementById('cardsCount');
const favoritesCount = document.getElementById('favoritesCount');
const cardTemplate = document.getElementById('cardTemplate');
const CATS_PER_PAGE = 70;
const DEFAULT_CAT_IMAGE = '/assets/figma-cats/figma-cat-1.svg';
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

const colorSampleCache = new Map();
const figmaHoverImageCache = new Map();
const figmaHoverImagePromiseCache = new Map();

let allCats = [];
let page = 0;
let isFavoritesOnly = false;

const savedFavorites = localStorage.getItem('catFavorites');
const favorites = new Set(savedFavorites ? JSON.parse(savedFavorites) : []);

const savedTheme = localStorage.getItem('catTheme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
}

function saveFavorites() {
  localStorage.setItem('catFavorites', JSON.stringify([...favorites]));
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  retryBtn.classList.remove('hidden');
}

function clearError() {
  errorBox.classList.add('hidden');
  retryBtn.classList.add('hidden');
}

async function fetchAlternateBreedImage(breedId) {
  try {
    const response = await fetch(`/api/cat-image?breedId=${encodeURIComponent(breedId)}`);

    if (!response.ok) {
      return '';
    }

    const payload = await response.json();
    return payload.imageUrl || '';
  } catch (error) {
    return '';
  }
}

function renderSkeletons(count = 6) {
  cardsContainer.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const sk = document.createElement('div');
    sk.className = 'skeleton';
    cardsContainer.appendChild(sk);
  }
}

function applySearchAndSort(cats) {
  const searchValue = searchInput.value.trim().toLowerCase();

  const isBlockedBreed = (breed) => {
    const normalizedBreed = String(breed || '')
      .toLowerCase()
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalizedBreed) {
      return false;
    }

    return [...BLOCKED_BREEDS].some((blocked) => normalizedBreed.includes(blocked));
  };

  let filtered = cats.filter((cat) => {
    if (isBlockedBreed(cat.breed)) {
      return false;
    }

    if (isFavoritesOnly && !favorites.has(cat.id)) {
      return false;
    }

    if (!searchValue) {
      return true;
    }

    const text = `${cat.breed} ${cat.origin} ${cat.temperament}`.toLowerCase();
    return text.includes(searchValue);
  });

  switch (sortSelect.value) {
    case 'breed-asc':
      filtered = [...filtered].sort((a, b) => a.breed.localeCompare(b.breed));
      break;
    case 'breed-desc':
      filtered = [...filtered].sort((a, b) => b.breed.localeCompare(a.breed));
      break;
    case 'origin-asc':
      filtered = [...filtered].sort((a, b) => a.origin.localeCompare(b.origin));
      break;
    default:
      break;
  }

  return filtered;
}

function updateStats(visibleCount) {
  cardsCount.textContent = String(visibleCount);
  favoritesCount.textContent = String(favorites.size);
}

function hashString(value) {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function clampColorChannel(channel) {
  return Math.max(0, Math.min(255, channel));
}

function hexToRgb(hex) {
  const raw = typeof hex === 'string' ? hex : '';
  const safeHex = raw.replace('#', '');
  const validHex = /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/;

  if (!validHex.test(safeHex)) {
    return { r: 140, g: 120, b: 104 };
  }

  const normalized = safeHex.length === 3
    ? safeHex.split('').map((char) => `${char}${char}`).join('')
    : safeHex;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  const toHex = (channel) => clampColorChannel(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shiftColor(hex, amount) {
  const rgb = hexToRgb(hex);
  return rgbToHex(rgb.r + amount, rgb.g + amount, rgb.b + amount);
}

function getHairProfile(cat) {
  const text = `${cat.breed} ${cat.description || ''} ${cat.altNames || ''}`.toLowerCase();

  const longHairHints = [
    'persian',
    'maine coon',
    'norwegian',
    'ragdoll',
    'birman',
    'balinese',
    'angora',
    'longhair'
  ];

  if (cat.hairless || text.includes('hairless') || text.includes('sphynx')) {
    return 'bald';
  }

  if (longHairHints.some((hint) => text.includes(hint))) {
    return 'hairball';
  }

  return 'few';
}

function getBreedColorFallback(cat) {
  const text = `${cat.breed} ${cat.description || ''} ${cat.altNames || ''}`.toLowerCase();

  if (text.includes('black')) return '#2f3438';
  if (text.includes('white')) return '#d6dde2';
  if (text.includes('blue') || text.includes('gray') || text.includes('grey')) return '#8ea0ae';
  if (text.includes('ginger') || text.includes('orange') || text.includes('red')) return '#c98659';
  if (text.includes('cream') || text.includes('beige') || text.includes('fawn')) return '#c9b596';
  if (text.includes('brown') || text.includes('chocolate')) return '#8c6449';
  if (text.includes('golden')) return '#b89a61';

  return '#9c8b79';
}

async function sampleCatColor(imageUrl) {
  if (!imageUrl) {
    return '';
  }

  if (colorSampleCache.has(imageUrl)) {
    return colorSampleCache.get(imageUrl);
  }

  const sampledColor = await new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const sampleSize = 40;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
          resolve('');
          return;
        }

        context.drawImage(image, 0, 0, sampleSize, sampleSize);

        const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;
        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let count = 0;

        for (let i = 0; i < pixels.length; i += 16) {
          const red = pixels[i];
          const green = pixels[i + 1];
          const blue = pixels[i + 2];
          const alpha = pixels[i + 3];

          if (alpha < 180) {
            continue;
          }

          const brightness = (red + green + blue) / 3;

          if (brightness > 236 || brightness < 20) {
            continue;
          }

          totalR += red;
          totalG += green;
          totalB += blue;
          count += 1;
        }

        if (!count) {
          resolve('');
          return;
        }

        resolve(rgbToHex(
          Math.round(totalR / count),
          Math.round(totalG / count),
          Math.round(totalB / count)
        ));
      } catch (error) {
        resolve('');
      }
    };

    image.onerror = () => resolve('');
    image.src = imageUrl;
  });

  colorSampleCache.set(imageUrl, sampledColor);
  return sampledColor;
}

function buildHairPaths(hairProfile, strokeColor, seed) {
  if (hairProfile === 'bald') {
    return '';
  }

  const strandCount = hairProfile === 'hairball' ? 44 : 18;
  const centerX = 400;
  const centerY = 306;
  const radiusX = hairProfile === 'hairball' ? 206 : 196;
  const radiusY = hairProfile === 'hairball' ? 166 : 156;
  const inwardInset = hairProfile === 'hairball' ? 10 : 7;

  let paths = '';

  for (let i = 0; i < strandCount; i += 1) {
    const ratio = strandCount === 1 ? 0.5 : i / (strandCount - 1);
    const angle = (-170 + (ratio * 160)) * (Math.PI / 180);
    const edgeX = centerX + (Math.cos(angle) * radiusX);
    const edgeY = centerY + (Math.sin(angle) * radiusY);

    const normalX = Math.cos(angle);
    const normalY = Math.sin(angle);

    const rootX = Math.round(edgeX - (normalX * inwardInset));
    const rootY = Math.round(edgeY - (normalY * inwardInset));

    const length = hairProfile === 'hairball'
      ? 18 + ((seed + (i * 11)) % 34)
      : 11 + ((seed + (i * 7)) % 16);
    const controlBend = ((seed + (i * 13)) % 20) - 10;

    const tipX = Math.round(edgeX + (normalX * length) + ((seed + i) % 5) - 2);
    const tipY = Math.round(edgeY + (normalY * length));
    const controlX = Math.round(rootX + (normalX * (length * 0.55)) - (normalY * controlBend));
    const controlY = Math.round(rootY + (normalY * (length * 0.55)) + (normalX * controlBend));

    paths += `<path d="M ${rootX} ${rootY} Q ${controlX} ${controlY} ${tipX} ${tipY}" stroke="${strokeColor}" stroke-width="${hairProfile === 'hairball' ? 3 : 2.5}" stroke-linecap="round" fill="none"/>`;
  }

  return paths;
}

function buildFigmaSvg(cat, furColor) {
  const seed = hashString(cat.id || cat.breed || 'cat');
  const hairProfile = getHairProfile(cat);
  const darkFur = shiftColor(furColor, -40);
  const lightFur = shiftColor(furColor, 36);
  const innerFur = shiftColor(furColor, 74);
  const whiskerColor = shiftColor(furColor, -62);
  const hairStroke = shiftColor(furColor, hairProfile === 'hairball' ? -48 : -24);
  const eyeTone = (seed % 3 === 0) ? '#6fa86f' : ((seed % 3 === 1) ? '#b8a86c' : '#84a1b8');
  const earNudge = (seed % 12) - 6;

  const hairPaths = buildHairPaths(hairProfile, hairStroke, seed);
  const stripeOpacity = hairProfile === 'bald' ? 0 : (hairProfile === 'hairball' ? 0.24 : 0.16);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shiftColor(furColor, 104)}"/><stop offset="1" stop-color="${shiftColor(furColor, 136)}"/></linearGradient><radialGradient id="fur" cx="50%" cy="44%" r="62%"><stop offset="0" stop-color="${lightFur}"/><stop offset="1" stop-color="${darkFur}"/></radialGradient></defs><rect width="800" height="560" fill="url(#bg)"/><ellipse cx="400" cy="470" rx="270" ry="38" fill="${shiftColor(furColor, -120)}33"/><path d="M ${250 + earNudge} 174 L ${326 + earNudge} 228 L ${260 + earNudge} 248 Z" fill="${darkFur}"/><path d="M ${550 - earNudge} 174 L ${474 - earNudge} 228 L ${540 - earNudge} 248 Z" fill="${darkFur}"/><path d="M ${272 + earNudge} 184 L ${320 + earNudge} 218 L ${280 + earNudge} 234 Z" fill="${innerFur}"/><path d="M ${528 - earNudge} 184 L ${480 - earNudge} 218 L ${520 - earNudge} 234 Z" fill="${innerFur}"/><ellipse cx="400" cy="306" rx="194" ry="156" fill="url(#fur)"/><ellipse cx="400" cy="334" rx="118" ry="96" fill="${innerFur}"/>${hairPaths}<path d="M276 298 C320 272, 352 274, 384 300" stroke="${darkFur}" stroke-width="10" fill="none" stroke-linecap="round" opacity="${stripeOpacity}"/><path d="M524 298 C480 272, 448 274, 416 300" stroke="${darkFur}" stroke-width="10" fill="none" stroke-linecap="round" opacity="${stripeOpacity}"/><path d="M300 214 C332 238, 352 270, 344 324" stroke="${darkFur}" stroke-width="9" fill="none" stroke-linecap="round" opacity="${stripeOpacity}"/><path d="M500 214 C468 238, 448 270, 456 324" stroke="${darkFur}" stroke-width="9" fill="none" stroke-linecap="round" opacity="${stripeOpacity}"/><ellipse cx="336" cy="266" rx="33" ry="36" fill="#ffffff"/><ellipse cx="464" cy="266" rx="33" ry="36" fill="#ffffff"/><ellipse cx="336" cy="270" rx="14" ry="16" fill="${eyeTone}"/><ellipse cx="464" cy="270" rx="14" ry="16" fill="${eyeTone}"/><ellipse cx="336" cy="271" rx="6" ry="8" fill="#111418"/><ellipse cx="464" cy="271" rx="6" ry="8" fill="#111418"/><circle cx="341" cy="264" r="4" fill="#ffffff"/><circle cx="469" cy="264" r="4" fill="#ffffff"/><path d="M384 314 L400 334 L416 314 Z" fill="#eea199"/><path d="M400 334 Q374 358 346 348" stroke="${shiftColor(furColor, -88)}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M400 334 Q426 358 454 348" stroke="${shiftColor(furColor, -88)}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M332 338 L258 330" stroke="${whiskerColor}" stroke-width="3" stroke-linecap="round"/><path d="M332 350 L248 352" stroke="${whiskerColor}" stroke-width="3" stroke-linecap="round"/><path d="M332 362 L258 374" stroke="${whiskerColor}" stroke-width="3" stroke-linecap="round"/><path d="M468 338 L542 330" stroke="${whiskerColor}" stroke-width="3" stroke-linecap="round"/><path d="M468 350 L552 352" stroke="${whiskerColor}" stroke-width="3" stroke-linecap="round"/><path d="M468 362 L542 374" stroke="${whiskerColor}" stroke-width="3" stroke-linecap="round"/></svg>`;
}

async function getFigmaImageForCat(cat) {
  if (figmaHoverImageCache.has(cat.id)) {
    return figmaHoverImageCache.get(cat.id);
  }

  if (figmaHoverImagePromiseCache.has(cat.id)) {
    return figmaHoverImagePromiseCache.get(cat.id);
  }

  const promise = (async () => {
    try {
      const sampledColor = await sampleCatColor(cat.imageUrl);
      const furColor = sampledColor || getBreedColorFallback(cat);
      const svg = buildFigmaSvg(cat, furColor);
      const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

      figmaHoverImageCache.set(cat.id, dataUrl);
      return dataUrl;
    } catch (error) {
      return DEFAULT_CAT_IMAGE;
    } finally {
      figmaHoverImagePromiseCache.delete(cat.id);
    }
  })();

  figmaHoverImagePromiseCache.set(cat.id, promise);
  return promise;
}

function createCard(cat) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const image = card.querySelector('.cat-image');
  const breed = card.querySelector('.breed');
  const origin = card.querySelector('.origin');
  const temperament = card.querySelector('.temperament');
  const lifespan = card.querySelector('.lifespan');
  const favoriteBtn = card.querySelector('.favorite-btn');
  const wikiLink = card.querySelector('.wiki-link');

  const adultImage = cat.adultImage || cat.imageUrl || DEFAULT_CAT_IMAGE;
  const babyImage = cat.babyImage || '';

  image.src = adultImage;
  image.alt = `${cat.breed} cat`;
  image.dataset.original = adultImage;
  image.dataset.baby = babyImage;
  image.dataset.breedId = cat.id || '';
  image.dataset.retryImage = '0';

  image.addEventListener('error', async () => {
    const breedId = image.dataset.breedId;

    if (
      image.dataset.retryImage === '0'
      && breedId
      && !breedId.startsWith('fallback-')
    ) {
      image.dataset.retryImage = '1';
      const alternativeImage = await fetchAlternateBreedImage(breedId);

      if (alternativeImage) {
        image.dataset.original = alternativeImage;
        image.src = alternativeImage;
        return;
      }
    }

    if (image.dataset.original !== DEFAULT_CAT_IMAGE) {
      image.dataset.original = DEFAULT_CAT_IMAGE;
      image.src = DEFAULT_CAT_IMAGE;
    }
  });

  let isHovering = false;

  image.addEventListener('mouseenter', async () => {
    isHovering = true;

    try {
      let hoverImage = image.dataset.baby || '';

      if (!hoverImage) {
        hoverImage = await getFigmaImageForCat(cat);
      }

      if (isHovering && hoverImage) {
        image.src = hoverImage;
      }
    } catch (error) {
      image.src = image.dataset.original;
    }
  });

  image.addEventListener('mouseleave', () => {
    isHovering = false;
    image.src = image.dataset.original;
  });

  getFigmaImageForCat(cat).catch(() => {});

  breed.textContent = cat.breed;
  origin.textContent = cat.origin;
  temperament.textContent = cat.temperament;
  lifespan.textContent = cat.lifeSpan;

  if (!cat.wikipedia) {
    wikiLink.classList.add('hidden');
  } else {
    wikiLink.href = cat.wikipedia;
  }

  const setFavoriteStyle = () => {
    const active = favorites.has(cat.id);
    favoriteBtn.classList.toggle('active', active);
    favoriteBtn.textContent = active ? '★ Favorited' : '☆ Favorite';
  };

  favoriteBtn.addEventListener('click', () => {
    if (favorites.has(cat.id)) {
      favorites.delete(cat.id);
    } else {
      favorites.add(cat.id);
    }

    saveFavorites();
    setFavoriteStyle();

    if (isFavoritesOnly) {
      renderCards();
    } else {
      updateStats(applySearchAndSort(allCats).length);
    }
  });

  setFavoriteStyle();

  return card;
}

function renderCards() {
  const visibleCats = applySearchAndSort(allCats);
  cardsContainer.innerHTML = '';

  if (visibleCats.length === 0) {
    cardsContainer.innerHTML = '<p>No cats matched your filters.</p>';
    updateStats(0);
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleCats.forEach((cat) => fragment.appendChild(createCard(cat)));
  cardsContainer.appendChild(fragment);
  updateStats(visibleCats.length);
}

async function fetchCats({ append = false } = {}) {
  clearError();
  renderSkeletons();

  try {
    const response = await fetch(`/api/cats?limit=${CATS_PER_PAGE}&page=${page}`);

    if (!response.ok) {
      throw new Error('The cat service did not respond correctly.');
    }

    const payload = await response.json();
    const nextCats = payload.cats || [];

    allCats = append ? [...allCats, ...nextCats] : nextCats;
    renderCards();
  } catch (error) {
    cardsContainer.innerHTML = '';
    showError('Could not load cats right now. Please try again.');
  }
}

refreshBtn.addEventListener('click', () => {
  page = 0;
  fetchCats({ append: false });
});

loadMoreBtn.addEventListener('click', () => {
  page += 1;
  fetchCats({ append: true });
});

themeBtn.addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark');
  localStorage.setItem('catTheme', dark ? 'dark' : 'light');
});

favoritesOnlyBtn.addEventListener('click', () => {
  isFavoritesOnly = !isFavoritesOnly;
  favoritesOnlyBtn.textContent = `Favorites Only: ${isFavoritesOnly ? 'On' : 'Off'}`;
  renderCards();
});

retryBtn.addEventListener('click', () => {
  fetchCats({ append: page > 0 });
});

searchInput.addEventListener('input', renderCards);
sortSelect.addEventListener('change', renderCards);

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    page = 0;
    fetchCats({ append: false });
  }
});

fetchCats();
