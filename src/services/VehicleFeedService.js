/**
 * VehicleFeedService.js
 * This service handles fetching and parsing the Frazer DMS data feed.
 * Frazer typically uploads a CSV file (e.g., frazer.csv) via FTP.
 */

import { parse } from 'csv-parse/browser/esm';

export const fetchInventoryFromFrazer = async (url) => {
    try {
        const response = await fetch(url);
        const csvData = await response.text();

        return new Promise((resolve, reject) => {
            parse(csvData, {
                columns: true,
                skip_empty_lines: true,
            }, (err, records) => {
                if (err) {
                    console.error("Failed to parse Frazer feed:", err);
                    reject(err);
                } else {
                    // Map Frazer columns to our app structure
                    const mappedRecords = records.map(record => ({
                        id: record.StockNumber || record.VIN,
                        vin: record.VIN,
                        year: parseInt(record.Year),
                        make: record.Make,
                        model: record.Model,
                        trim: record.Trim,
                        mileage: parseInt(record.Mileage),
                        price: parseFloat(record.Price || record.Retail),
                        bodyType: record.BodyStyle,
                        exteriorColor: record.Color,
                        photos: record.PhotoURLs ? record.PhotoURLs.split(',') : [],
                        story: generateJobStory(record),
                        blemishes: [], // To be populated via separate blemish folder/data
                        status: "Available"
                    }));
                    resolve(mappedRecords);
                }
            });
        });
    } catch (error) {
        console.error("Error fetching Frazer feed:", error);
        return [];
    }
};

/**
 * Generates a "Job To Be Done" story based on vehicle attributes.
 * This can be expanded with AI or fixed templates.
 */
function generateJobStory(record) {
    const type = record.BodyStyle?.toLowerCase() || 'vehicle';
    if (type.includes('suv')) {
        return "The Weekend Warrior. High ground clearance and enough room for the whole crew. This SUV is built for reliability, not for showing off at the country club.";
    }
    if (type.includes('sedan')) {
        return "The Honest Commuter. Simple, efficient, and ready for another 100,000 miles. This car doesn't care about its age, it cares about getting you to work on time.";
    }
    if (type.includes('van') || type.includes('minivan')) {
        return "The Family Freedom Machine. Built for grocery runs, soccer practice, and road trips. It's got the space you need without the price tag you hate.";
    }
    return "The Practical Choice. A solid machine at a solid price. Ready to serve its next owner faithfully.";
}
