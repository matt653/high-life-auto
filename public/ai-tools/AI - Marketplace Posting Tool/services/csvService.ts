import { RawInventoryItem } from '../types';

// Helper to parse a CSV line correctly handling quotes
const parseLine = (text: string): string[] => {
  const result: string[] = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        // Double quote inside quotes is a literal quote
        cell += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of cell
      result.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  result.push(cell.trim());
  return result;
};

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  for (const name of possibleNames) {
    const idx = lowerHeaders.findIndex(h => h.includes(name.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
};

export const parseCSV = (content: string): RawInventoryItem[] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length === 0) return [];

  const headers = parseLine(lines[0]);
  
  // Dynamic Column Mapping
  const nameIdx = findColumnIndex(headers, ['Product', 'Name', 'Vehicle', 'Model', 'Title']);
  const makeIdx = findColumnIndex(headers, ['Make']);
  const yearIdx = findColumnIndex(headers, ['Year']);
  const priceIdx = findColumnIndex(headers, ['Price', 'Cost', 'Retail']);
  const conditionIdx = findColumnIndex(headers, ['Condition', 'Status']);
  const notesIdx = findColumnIndex(headers, ['Notes', 'Description', 'Comments', 'Details']);
  const imageIdx = findColumnIndex(headers, ['Photo', 'Image', 'Picture', 'Url']);

  const items: RawInventoryItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length < 2) continue;

    // Construct Product Name (smartly combine Year/Make/Model if separate)
    let productName = 'Unknown Item';
    if (yearIdx !== -1 && makeIdx !== -1 && nameIdx !== -1) {
       productName = `${row[yearIdx] || ''} ${row[makeIdx] || ''} ${row[nameIdx] || ''}`.trim();
    } else if (nameIdx !== -1) {
       productName = row[nameIdx] || 'Unknown Item';
    }

    // Parse Images
    let imageUrls: string[] = [];
    if (imageIdx !== -1 && row[imageIdx]) {
       // Dealer CSVs often separate images with pipes |, semi-colons ;, or commas
       // We split by standard delimiters and filter for valid-ish URLs
       const rawImages = row[imageIdx].split(/[,|;]/);
       imageUrls = rawImages
         .map(s => s.trim())
         .filter(s => s.startsWith('http'));
    }

    items.push({
      id: `item-${Date.now()}-${i}`,
      productName: productName,
      price: priceIdx !== -1 ? row[priceIdx] : '0',
      condition: conditionIdx !== -1 ? row[conditionIdx] : 'Used',
      rawNotes: notesIdx !== -1 ? row[notesIdx] : '',
      imageUrls: imageUrls
    });
  }

  return items;
};