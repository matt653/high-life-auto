# Implementation Plan - High Life Auto Website

## 1. Design & Branding

- **Core Motto**: "Cool to be Uncool"
- **Color Palette**:
  - Primary: Dark Charcoal (#1a1a1a)
  - Secondary: Off-White (#f9f9f9)
  - Accent: Muted Forest Green (#2d4a3e) or Slate Gold (#a39161)
- **Typography**:
  - Headings: 'Outfit', sans-serif (Bold, rugged)
  - Body: 'Inter', sans-serif (Clean, readable)
- **Visual Style**: High contrast, cards with subtle borders, raw photography, no glossy effects.

## 2. Technical Stack

- **Framework**: Vite + React
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Maps**: Leaflet (for Contact page)
- **Data Parsing**: `csv-parse` for Frazer DMS CSV feed.

## 3. Page Structure

### Homepage

- **Hero**: "Drive Debt-Free. Live Your Life."
- **Featured Inventory**: 3-4 cars with "Job To Be Done" stories.
- **Philosophy Section**: "Honest Philosophy" grid.

### Digital Showroom (Inventory)

- **Feed Integration**: Logic to fetch and parse the `frazer.csv`.
- **Transparent Tour**: Individual vehicle pages with:
  - Photo Gallery.
  - "The Honest Blemishes" section.
  - "Job To Be Done" Story (AI-enhanced or template-based).
  - Video Walkaround placeholder.

### Our Why (About Us)

- Narrative-driven horizontal or vertical timeline of the owners.
- "No BS" manifest.

### Financing

- Simplified form for pre-approval.
- Credit-positive messaging.

### Contact

- Map, Address, Phone, Lead Form.

## 4. Frazer Feed Implementation

- I will create a `VehicleFeedService` that:
  - Fetches the CSV from a specified URL/Storage.
  - Maps Frazer headers (VIN, Make, Model, Price, Mileage, etc.) to our internal `Vehicle` type.
  - Generates the "Job stories" dynamically.

## 5. Next Steps

1. Initialize `index.css` with the design system.
2. Create reusable components (Button, Card, Section).
3. Build the Homepage layout.
4. Set up the Inventory data layer.

## 6. AI Description Generation (New)

- **Goal**: Auto-generate "Honest Miriam" descriptions from YouTube test drives.
- **Workflow**:
  1. `scripts/generate-descriptions.js` reads inventory.
  2. Fetches audio transcript using `youtube-transcript`.
  3. Uses `Google Generative AI` (Gemini) to rewrite into an honest summary.
  4. Updates `public/frazer-inventory.csv` (or separate JSON).
- **Requirements**:
  - `npm install youtube-transcript @google/generative-ai`
  - Valid `GEMINI_API_KEY` environment variable.
