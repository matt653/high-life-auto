/**
 * CSV to JSON Converter for Gemini AI Access
 * Converts Frazer CSV to a clean JSON API endpoint
 */

import { parse } from 'csv-parse/browser/esm/sync';
import fs from 'fs';
import path from 'path';

// This script converts the Frazer CSV to JSON for AI agent access
async function convertFrazerToJSON() {
    try {
        // Read the Frazer CSV
        const csvPath = 'C:\\Frazer30\\VehicleUploads\\DealerCarSearch-1.csv';
        const csvContent = fs.readFileSync(csvPath, 'utf-8');

        // Parse CSV
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        // Map to clean JSON structure
        const inventory = records.map(record => ({
            stock: record.Stock,
            vin: record.VIN,
            year: parseInt(record.Year) || 0,
            make: record.Make,
            model: record.Model,
            trim: record.Style,
            price: parseFloat(record['Internet Price']?.trim()) || parseFloat(record['Retail Price']?.trim()) || 0,
            mileage: parseInt(record.Mileage) || 0,
            bodyType: record['Body Style'],
            engine: record.Engine,
            transmission: record.Transmission,
            drivetrain: record['Drive Train'],
            exteriorColor: record.Color,
            interiorColor: record['Color 2'],
            fuelType: record['Fuel Type'],
            doors: record.Doors,
            photos: record.PhotoURLs ? record.PhotoURLs.split(',').map(url => url.trim()) : [],
            description: record['Sales Comments'],
            features: record.Features,
        }));

        // Create JSON output
        const output = {
            note: "High Life Auto Inventory - Updated from Frazer DMS",
            lastUpdated: new Date().toISOString(),
            dealership: {
                name: "High Life Auto",
                phone: "(563) 332-4545",
                address: "2929 Rockingham Rd, Davenport, IA 52802",
                website: "https://highlifeauto.netlify.app"
            },
            totalVehicles: inventory.length,
            inventory: inventory
        };

        // Write to public/api/inventory.json
        const outputPath = path.join(process.cwd(), 'public', 'api', 'inventory.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

        console.log(`✅ Successfully converted ${inventory.length} vehicles to JSON`);
        console.log(`📄 Output: ${outputPath}`);
        console.log(`🌐 Will be accessible at: https://highlifeauto.netlify.app/api/inventory.json`);

    } catch (error) {
        console.error('❌ Error converting CSV to JSON:', error);
    }
}

// Run the conversion
convertFrazerToJSON();
