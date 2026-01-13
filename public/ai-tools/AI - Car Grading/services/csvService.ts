import Papa from 'papaparse';
import { Vehicle } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Define Regex constants to avoid inline literal parsing issues
// Use String.fromCharCode(44) to completely hide the comma token from the parser
const COMMA = String.fromCharCode(44);
const HEADER_CLEAN_REGEX = new RegExp('[\\s"-]', 'g');
const DIGITS_ONLY_REGEX = new RegExp('[^0-9]', 'g');
const PRICE_CLEAN_REGEX = new RegExp('[^0-9.]', 'g');
const DELIMITER_REGEX = new RegExp('[|;' + COMMA + ']', 'g');

export const parseCSV = (csvText: string): Vehicle[] => {
  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      return header.trim().toLowerCase().replace(HEADER_CLEAN_REGEX, '_');
    }
  });

  // Map arbitrary CSV columns to our Vehicle interface
  return results.data.map((row: any) => {
    // Helper to find key case-insensitively if exact match fails
    const findKey = (search: string) => {
      const keys = Object.keys(row);
      return keys.find(k => k.includes(search));
    };

    const year = row.year || row[findKey('year') || ''] || 'Unknown';
    const make = row.make || row[findKey('make') || ''] || 'Unknown';
    const model = row.model || row[findKey('model') || ''] || 'Unknown';
    
    // Fix: Remove commas and non-numeric chars before parsing miles
    let milesStr = (row.miles || row[findKey('odometer') || ''] || row[findKey('mileage') || ''] || '0');
    milesStr = milesStr.toString().replace(DIGITS_ONLY_REGEX, '');
    const miles = parseInt(milesStr, 10);

    // Fix: Remove currency symbols and commas before parsing price
    let priceStr = (row.price || row[findKey('price') || ''] || row[findKey('internet') || ''] || '0');
    priceStr = priceStr.toString().replace(PRICE_CLEAN_REGEX, '');
    const price = parseFloat(priceStr);
    
    // specific mappings requested
    const imageCol = row['image_url'] || row['photo_url'] || row[findKey('image') || ''] || '';
    
    // Split by common delimiters (|, ;, ,) and filter empty
    const normalizedImageCol = imageCol.replace(DELIMITER_REGEX, COMMA);
    const imageUrls = normalizedImageCol.split(COMMA)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && s.startsWith('http'));
      
    const imageUrl = imageUrls.length > 0 ? imageUrls[0] : '';

    const youtubeUrl = row['youtube_url'] || row['video_url'] || row[findKey('youtube') || ''] || '';
    const description = row['comments'] || row.description || row[findKey('desc') || ''] || '';

    return {
      id: uuidv4(),
      year,
      make,
      model,
      trim: row.trim || row[findKey('trim') || ''] || '',
      vin: row.vin || row[findKey('vin') || ''] || '',
      miles: isNaN(miles) ? 0 : miles,
      price: isNaN(price) ? 0 : price,
      color: row.color || row[findKey('color') || ''] || '',
      stockNumber: row.stock || row[findKey('stock') || ''] || '',
      description,
      imageUrls,
      imageUrl,
      youtubeUrl,
      location: 'Inventory'
    };
  }).filter((v: any) => v.year !== 'Unknown' && v.make !== 'Unknown');
};

export const fetchInventoryCSV = async (url: string): Promise<Vehicle[]> => {
  const fetchWithProxy = async (proxyUrl: string) => {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return response.text();
  };

  // Strategy 1: Direct Fetch (Works if CORS is enabled on server)
  try {
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      const data = parseCSV(text);
      if (data.length > 0) return data;
    }
  } catch (e) {
    // Continue to proxy
  }

  // Strategy 2: AllOrigins Proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const text = await fetchWithProxy(proxyUrl);
    const data = parseCSV(text);
    if (data.length > 0) return data;
  } catch (e) {
    // Continue to next proxy
  }

  // Strategy 3: CorsProxy.io (Backup)
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const text = await fetchWithProxy(proxyUrl);
    return parseCSV(text);
  } catch (e) {
    throw new Error("Unable to fetch inventory. Network blocked or CSV unavailable.");
  }
};

/**
 * Fetches an image URL via proxy to avoid CORS and converts it to Base64
 * for the Gemini API.
 */
export const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // Fallback to AllOrigins if corsproxy fails
    try {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Failed to fetch image fallback');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to fetch image:", url, e);
        return "";
    }
  }
};