/**
 * FrazerFeedService.js
 * Parses the real Frazer DMS CSV feed and integrates YouTube video data.
 */

import { parse } from 'csv-parse/browser/esm/sync';

/**
 * Fetches and parses inventory from the local Frazer DMS CSV file.
 * In production, this would point to a cloud-hosted version of the CSV.
 */
export const loadInventoryFromFrazerCSV = async (csvPath) => {
    try {
        const response = await fetch(csvPath);
        const csvText = await response.text();

        const records = parse(csvText, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        return records.map(record => mapFrazerRecordToVehicle(record));
    } catch (error) {
        console.error("Error loading Frazer CSV:", error);
        return [];
    }
};

/**
 * Maps a Frazer CSV record to our internal Vehicle structure.
 */
function mapFrazerRecordToVehicle(record) {
    // Photos: Prioritize 'Image URL' (pipe delimited)
    const rawPhotos = record['Image URL'] || record['PhotoURLs'] || record['Photos'] || '';
    const photoURLs = rawPhotos ? rawPhotos.split('|').map(url => url.trim()).filter(url => url.length > 0) : [];

    // YouTube: Prioritize 'YouTube URL' column
    let youtubeLink = record['YouTube URL'];
    if (!youtubeLink) {
        youtubeLink = record['Video URL'] || extractYouTubeLink(record['Comments'] || record['Sales Comments']);
    }

    // Comments
    const comments = record['Comments'] || record['Sales Comments'] || '';

    // Price: Prioritize 'Retail' then 'Internet Price'
    // The new CSV uses 'Retail' format: "    1850.00" (needs trimming)
    const strPrice = record['Retail'] || record['Internet Price'] || record['Retail Price'] || '0';
    const price = parseFloat(strPrice.replace(/[^0-9.]/g, '')) || 0;

    return {
        id: record['Stock Number'] || record['Stock'],
        stock: record['Stock Number'] || record['Stock'],
        vin: record['Vehicle Vin'] || record['VIN'],
        year: parseInt(record['Vehicle Year'] || record['Year']) || 0,
        make: record['Vehicle Make'] || record['Make'],
        model: record['Vehicle Model'] || record['Model'],
        trim: record['Vehicle Trim Level'] || record['Style'] || record['Trim'],
        mileage: parseInt(record['Mileage']) || 0,
        price: price,
        bodyType: record['Vehicle Type'] || record['Body Style'],
        transmission: record['Vehicle Transmission Type'] || record['Transmission'],
        engine: record['Engine'],
        drivetrain: record['Vehicle Drive Type'] || record['Drive Train'],
        fuelType: record['Fuel Type'],
        exteriorColor: record['Exterior Color'] || record['Color'],
        interiorColor: record['Interior Color'] || record['Color 2'],
        features: record['Option List'] || record['Features'],
        doors: '',
        photos: photoURLs,
        salesComments: comments,
        youtubeVideoUrl: youtubeLink ? convertToEmbedUrl(youtubeLink) : null,
        blemishes: generateBlemishList(comments),
        blemishDescription: "",
        story: generateBriefSummary({ ...record, Make: record['Vehicle Make'] || record['Make'], Model: record['Vehicle Model'] || record['Model'], 'Sales Comments': comments }),
        status: determineStatus(record),
        grade: null,
    };
}

/**
 * Generates a "Transcript Style" Brief Summary.
 * Should sound like Miriam talking in the video.
 */
function generateBriefSummary(record) {
    const comments = record['Sales Comments'] || '';
    const cleanComments = comments.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/If there is no description.*/i, '').trim();

    if (cleanComments && cleanComments.length > 20) {
        // Assume the comments ARE the transcript summary
        return `Video Recap: ${cleanComments}`;
    }

    // Fallback: Synthesize a "Transcript"
    const make = record.Make;
    const model = record.Model;
    const engine = record.Engine || 'engine';

    const intros = [
        "In this video, we take a look at a ",
        "Miriam here with a honest walkaround of this ",
        "Join us for a test drive of this "
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];

    return `${intro}${make} ${model}. We fire up the ${engine}, check the AC, and take it down the highway. It's an honest car at a fair price. Watch the full video to see the test drive results.`;
}

/**
 * Scans comments for keywords to build a "Blemish List".
 */
function generateBlemishList(comments) {
    if (!comments) return [];
    const lower = comments.toLowerCase();
    const blemishes = [];

    if (lower.includes('dent') || lower.includes('ding')) blemishes.push("Minor Dents/Dings");
    if (lower.includes('scratch') || lower.includes('paint')) blemishes.push("Paint Scratches");
    if (lower.includes('rust')) blemishes.push("Some Rust Present");
    if (lower.includes('tear') || lower.includes('rip')) blemishes.push("Interior Wear/Tear");
    if (lower.includes('leak')) blemishes.push("Minor Seepage");
    if (lower.includes('crack') || lower.includes('chip')) blemishes.push("Glass Chip/Crack");

    if (blemishes.length === 0) return ["Normal wear for age/mileage"];
    return blemishes;
}

/**
 * Converts various YouTube URL formats to an embed URL.
 */
function convertToEmbedUrl(url) {
    if (!url) return null;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

/**
 * Extracts YouTube video URL from Sales Comments field.
 */
function extractYouTubeLink(comments) {
    if (!comments) return null;
    const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = comments.match(youtubeRegex);
    return match ? match[0] : null; // Return the full URL, let convertToEmbedUrl handle the format
}

/**
 * Generates "Job To Be Done" story based on vehicle type and data.
 */
function generateJobStory(record) {
    const type = record['Body Style']?.toLowerCase() || '';
    const make = record.Make;
    const model = record.Model;
    const price = parseFloat(record['Internet Price'] || record['Retail Price'] || 0);

    if (type.includes('suv')) {
        return `The Weekend Warrior. This ${make} ${model} has the ground clearance and space for your family adventures without the luxury price tag. At $${price.toLocaleString()}, it's a freedom machine, not a status symbol.`;
    }

    if (type.includes('sedan')) {
        return `The Honest Commuter. Reliable, efficient, and ready to rack up another 100,000 miles. This ${make} doesn't care about its age, it cares about getting you to work debt-free.`;
    }

    if (type.includes('van') || type.includes('minivan')) {
        return `The Family Freedom Machine. Built for soccer practice, grocery runs, and road trips. It's got the space you need without the monthly payment you hate.`;
    }

    if (type.includes('truck') || type.includes('pick-up')) {
        return `The Workhorse. This ${make} ${model} is built to haul, tow, and earn its keep. At $${price.toLocaleString()}, you're investing in capability, not chrome.`;
    }

    if (type.includes('convertible')) {
        return `The Joy Ride. Life's too short to drive boring cars—but not too short to avoid car payments. This ${make} is fun without the financial regret.`;
    }

    return `The Practical Choice. A solid ${make} ${model} at an honest price. Ready to serve its next owner faithfully without breaking the bank.`;
}

/**
 * Determines vehicle status (Available, Just Arrived, etc.)
 */
function determineStatus(record) {
    // Logic can be expanded: check if Stock number is recent, etc.
    return "Available";
}

/**
 * Generates a "Realistic" Report Card based on vehicle data.
 * Since we can't actually watch the video in real-time here, we infer the condition
 * from the data points we have (Mileage, Year, Price, Comments).
 */
export async function analyzeVideoTranscript(youtubeUrl, vehicleData) {
    // 1. Calculate Mechanical Grade (Heavy weighting on Mileage)
    let mechScore = 85; // Start at B
    if (vehicleData.mileage > 200000) mechScore -= 15;
    else if (vehicleData.mileage > 150000) mechScore -= 8;
    else if (vehicleData.mileage < 100000) mechScore += 5;
    else if (vehicleData.mileage < 60000) mechScore += 10;

    // Check comments for mechanical cues
    const lowerComments = (vehicleData.salesComments || "").toLowerCase();
    if (lowerComments.includes("run") && lowerComments.includes("good")) mechScore += 2;
    if (lowerComments.includes("needs") || lowerComments.includes("work") || lowerComments.includes("mechanic")) mechScore -= 15;
    if (lowerComments.includes("as-is")) mechScore -= 5;

    // 2. Calculate Cosmetic Grade (Weighting on Year + Keywords)
    let cosmScore = 80; // Start at B-
    const age = new Date().getFullYear() - vehicleData.year;
    if (age > 15) cosmScore -= 10;
    else if (age > 10) cosmScore -= 5;
    else if (age < 5) cosmScore += 10;

    if (lowerComments.includes("clean") || lowerComments.includes("sharp")) cosmScore += 5;
    if (lowerComments.includes("dent") || lowerComments.includes("scratch") || lowerComments.includes("rust") || lowerComments.includes("tear")) cosmScore -= 10;

    // 3. Calculate Value Grade (Always high for High Life Auto)
    // "Honest price covers the flaws"
    let valueScore = 95; // Start at A
    if (mechScore < 70) valueScore = 98; // "If it's rough, it's cheap -> Great Value"

    // Helper to convert score to letter
    const getLetter = (score) => {
        if (score >= 97) return "A+";
        if (score >= 93) return "A";
        if (score >= 90) return "A-";
        if (score >= 87) return "B+";
        if (score >= 83) return "B";
        if (score >= 80) return "B-";
        if (score >= 77) return "C+";
        if (score >= 73) return "C";
        if (score >= 70) return "C-";
        return "D";
    };

    const mechanicalGrade = getLetter(mechScore);
    const cosmeticGrade = getLetter(cosmScore);
    const valueGrade = getLetter(valueScore);

    // Overall is average of Mech and Cosmetic (Value doesn't bump up the condition)
    const overallScore = (mechScore + cosmScore) / 2;
    const overallGrade = getLetter(overallScore);

    // Generate Honest Notes
    let mechNotes = "Runs and drives. Standard wear for the mileage.";
    if (mechanicalGrade.startsWith('A')) mechNotes = "Engine is strong, transmission shifts smooth. A solid runner.";
    if (mechanicalGrade.startsWith('C') || mechanicalGrade.startsWith('D')) mechNotes = "High mileage or older model. Expect some maintenance needed.";
    if (lowerComments.includes("needs")) mechNotes = "As noted in description, this vehicle needs some mechanical attention.";

    let cosmNotes = "Average wear and tear. It's a used car, not a museum piece.";
    if (cosmeticGrade.startsWith('A')) cosmNotes = "Surprisingly clean for its age. Paint shines and interior is tidy.";
    if (cosmeticGrade.startsWith('C') || cosmeticGrade.startsWith('D')) cosmNotes = "Shows its battle scars. Dents, dings, or fade present—but that saves you money.";

    let valueNotes = `At $${vehicleData.price.toLocaleString()}, you're paying for the metal, not the shine.`;
    if (overallGrade.startsWith('A') || overallGrade.startsWith('B')) valueNotes = "A fair price for a solid vehicle. Good bang for your buck.";
    if (overallGrade.startsWith('C')) valueNotes = "Priced aggressively to reflect its condition. Perfect debt-free daily driver.";

    return {
        overallGrade,
        mechanical: {
            grade: mechanicalGrade,
            notes: mechNotes
        },
        cosmetic: {
            grade: cosmeticGrade,
            notes: cosmNotes
        },
        value: {
            grade: valueGrade,
            notes: valueNotes
        },
        consumerEducation: [
            `This ${vehicleData.year} model is ${age} years old.`,
            vehicleData.mileage > 150000 ? "High mileage vehicles require regular fluid checks." : "Regular oil changes will keep this running long.",
            "Miriam's Take: We price them based on reality, not book value."
        ]
    };
}
