import { Sale, VehicleType } from './types';
import Papa from 'papaparse';

// Heuristic to guess vehicle type based on model name
const guessVehicleType = (model: string): VehicleType => {
  const m = model ? model.toUpperCase() : '';
  
  if (m.match(/F-?150|F-?250|F-?350|SILVERADO|SIERRA|RAM|DAKOTA|RANGER|COLORADO|TITAN|FRONTIER|TUNDRA|TACOMA|C1500|K1500/)) {
    return VehicleType.TRUCK;
  }
  if (m.match(/ESCAPE|EXPLORER|EQUINOX|TAHOE|SUBURBAN|YUKON|CHEROKEE|LIBERTY|PATRIOT|COMPASS|DURANGO|JOURNEY|ENVOY|MURANO|ROGUE|PATHFINDER|4RUNNER|HIGHLANDER|PILOT|CR-V|RAV4|BLAZER|TRAILBLAZER|ACADIA|ENCLAVE/)) {
    return VehicleType.SUV;
  }
  if (m.match(/CARAVAN|ODYSSEY|SIENNA|QUEST|TOWN & COUNTRY|VENTURE|UPLANDER|WINDSTAR|FREESTAR|PACIFICA/)) {
    return VehicleType.VAN;
  }
  if (m.match(/MUSTANG|CAMARO|CORVETTE|CHALLENGER|CHARGER|ECLIPSE|350Z|FIREBIRD|TRANS AM/)) {
    return VehicleType.SPORTS;
  }
  if (m.match(/IMPALA|MALIBU|TAURUS|FUSION|FOCUS|COBALT|CRUZE|ALTIMA|MAXIMA|SENTRA|CIVIC|ACCORD|CAMRY|COROLLA|PRIUS|300|200|SEBRING|STRATUS|NEON|GRAND AM|GRAND PRIX|G6|JETTA|PASSAT|SONATA|ELANTRA/)) {
    return VehicleType.SEDAN;
  }
  
  return VehicleType.OTHER;
};

// Helper to convert MM/DD/YY to YYYY-MM-DD
// Assumes 2-digit years 00-30 are 2000-2030, 31-99 are 1931-1999
const parseFrazerDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr; // Return original if format unknown

  const m = parts[0].padStart(2, '0');
  const d = parts[1].padStart(2, '0');
  let y = parseInt(parts[2], 10);

  // Simple pivot for 2-digit years
  if (y < 100) {
    // If year is less than current year short + 5, assume 20xx (e.g. 15 -> 2015)
    // Otherwise 19xx (e.g. 99 -> 1999)
    y += (y < 40) ? 2000 : 1900; 
  }

  return `${y}-${m}-${d}`;
};

export const parseFrazerCSV = (csvContent: string): Promise<Sale[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const sales: Sale[] = results.data.map((row: any) => {
            // Map Frazer columns to our Schema
            
            // Stock # is a good ID candidate
            const id = row['Stock #'] || Math.random().toString(36).substr(2, 9);
            
            const make = row['Vehicle Make'] || 'Unknown';
            const model = row['Vehicle Model'] || 'Unknown';
            
            // Clean up currency strings if they come with $ or commas
            const cleanNumber = (val: any) => {
                if (typeof val === 'number') return val;
                if (!val) return 0;
                return parseFloat(val.toString().replace(/[$,]/g, ''));
            };

            return {
              id: id,
              customer: {
                id: `cust_${id}`,
                firstName: row['First Name'] || 'Unknown',
                lastName: row['Last Name'] || '',
                email: row['Email'] || '',
                phone: row['Cell Phone'] || row['Other Phone 2'] || '',
                birthDate: parseFrazerDate(row['Birthday']),
              },
              vehicle: {
                make: make,
                model: model,
                year: parseInt(row['Vehicle Year']) || new Date().getFullYear(),
                type: guessVehicleType(model),
                price: cleanNumber(row['Sales Price']),
                vin: row['Vehicle VIN'] || ''
              },
              saleDate: parseFrazerDate(row['Sale Date']),
              profit: cleanNumber(row['Profit On Sale']),
              daysOnLot: parseInt(row['Days on lot']) || 0,
              notes: [
                row['City'] ? `City: ${row['City']}` : '',
                row['State'] ? `State: ${row['State']}` : '',
                row['Vehicle Color'] ? `Color: ${row['Vehicle Color']}` : '',
                row['Mileage'] ? `Mileage: ${row['Mileage']}` : ''
              ].filter(Boolean).join(' | ')
            };
          });
          
          // Filter out completely empty or invalid rows if any
          const validSales = sales.filter(s => s.id && s.vehicle.make !== 'Unknown');
          resolve(validSales);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};