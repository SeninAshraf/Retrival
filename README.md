# ShiftSync | Personnel & Work Log Retrieval Portal

ShiftSync is a premium, high-fidelity single-page web dashboard designed to retrieve and display work logs of personnel working across multiple rotational shifts. Built with a modern dark theme and responsive glassmorphic interfaces, it features instant name-based search, quick-search shortcut tags, and a featured profile detail panel.

## Key Features

- 🔍 **Instant Retrieval Search**: Dynamic fuzzy matching as you type.
- 👤 **Retrieved Profile View**: Highlights detailed staff references, logged dates, shift codes, and full task descriptions when an exact match is found.
- ⚡ **Quick Search Shortcut Tags**: Instant lookup of specific roster personnel.
- 📊 **Operational Metrics Grid**: Dynamic stats showing total personnel count, shifts logged (A, B, or C), and current query matches.
- 🎨 **Glassmorphism Design**: Sleek typography, glowing shift badges, floating ambient orbs, and fluid hover animations.

## Tech Stack

- **Structure**: HTML5 (Semantic elements)
- **Styling**: Vanilla CSS3 (Custom properties, grid & flexbox layouts, CSS backdrop filters, custom keyframes)
- **Logic**: Vanilla JavaScript ES6 (Dynamic DOM rendering, filtering algorithms, statistics calculation)

## How to Run

1. Clone this repository:
   ```bash
   git clone https://github.com/SeninAshraf/retrival.git
   cd retrival
   ```
2. Open `index.html` directly in any web browser:
   ```bash
   # On macOS
   open index.html
   
   # On Windows
   start index.html
   ```
3. Or host it on a local development server:
   ```bash
   # Using Python
   python3 -m http.server 8080
   
   # Using Node.js
   npx serve .
   ```
   Then navigate to `http://localhost:8080` or the address provided by `serve`.
