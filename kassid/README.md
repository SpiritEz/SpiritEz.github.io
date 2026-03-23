# Cats in Cards (Node.js)

Simple Node.js web app that fetches cat data from The Cat API and displays it as cards.

## Run

```bash
npm install
npm start
```

Open: `http://localhost:3000`

## Features (10)

1. Fetch cat data through a Node.js backend endpoint (`/api/cats`).
2. Display multiple cat cards with image + info.
3. `Show Other Cats` button for fresh random cards.
4. `Load More` button for pagination-style appending.
5. Live search by breed, origin, or temperament.
6. Sorting options (breed and origin).
7. Favorite cards with persistence in `localStorage`.
8. `Favorites Only` filter mode.
9. Theme toggle (light/dark) with persistence.
10. On image hover, swap to a random "Figma-style" cat image chosen from 5 drawings in `public/assets/figma-cats`.

## Optional API key

You can set a key from The Cat API:

```bash
set CAT_API_KEY=your_key_here
npm start
```
