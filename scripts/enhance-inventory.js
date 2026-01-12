/**
 * enhance-inventory.js
 * 
 * 1. Reads Frazer CSV
 * 2. identifying "New" or "Modified" vehicles
 * 3. Uses Gemini 1.5 Flash (Vision + Text) to generate strict "Report Cards"
 * 4. Caches results to avoid billing spikes
 * 5. Outputs public/inventory-enhanced.json
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';

// CONFIGURATION
const SOURCE_CSV_PATH = 'G:\\My Drive\\Matt\\new app stuf\\matt ai\\frazer data\\DealerCarSearch-1.csv';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUTPUT_JSON_PATH = path.join(PUBLIC_DIR, 'inventory-enhanced.json');
const CACHE_PATH = path.join(process.cwd(), 'scripts', 'ai-cache.json');

// API KEY
const GEMINI_API_KEY = "AIzaSyBjyT8TsGpcA8ureyU989vbHqWKywBPAPg";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Ensure scripts dir exists for cache
if (!fs.existsSync(path.join(process.cwd(), 'scripts'))) {
    fs.mkdirSync(path.join(process.cwd(), 'scripts'));
}

// Helper: Load Cache
function loadCache() {
    if (fs.existsSync(CACHE_PATH)) {
        return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    }
    return {};
}

// Helper: Save Cache
function saveCache(cache) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// Helper: Generate Hash for Change Detection
function generateHash(record) {
    // We combine fields that, if changed, should trigger a re-analysis
    const data = [
        record['Stock Number'] || record['Stock'],
        record['Retail'] || record['Internet Price'],
        record['YouTube URL'] || record['Details'],
        record['Image URL'] || record['PhotoURLs']
    ].join('|');

    // Simple string hash
    let hash = 0, i, chr;
    if (data.length === 0) return hash;
    for (i = 0; i < data.length; i++) {
        chr = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// Helper: Fetch Transcript
async function getTranscript(youtubeUrl) {
    if (!youtubeUrl) return null;
    try {
        // Handle various URL formats for the library
        let videoId = null;
        if (youtubeUrl.includes('v=')) videoId = youtubeUrl.split('v=')[1].split('&')[0];
        else if (youtubeUrl.includes('youtu.be/')) videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];

        if (!videoId) return null;

        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
        return null; // Silent fail
    }
}

// Helper: Fetch Image as Buffer (for Vision)
async function fetchImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        return await response.arrayBuffer();
    } catch (error) {
        console.warn(`   ⚠️  Could not fetch image for AI analysis: ${url}`);
        return null;
    }
}

// AI GENERATION FUNCTION
async function generateAIGrading(vehicle, transcript, photoBuffers) {
    // Construct Prompt
    const vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.mileage} miles, $${vehicle.price})`;
    const videoContext = transcript ? `TRANSCRIPT FROM VIDEO WALK AROUND:\n"${transcript.substring(0, 8000)}..."` : "NO VIDEO TRANSCRIPT AVAILABLE.";

    const promptParts = [
        `You are the Senior Evaluator at "High Life Auto". You are analyzing a ${vehicleInfo}.
        
        INPUTS:
        1. ${photoBuffers.length} Photos of the actual car (analyze for cosmetic condition).
        2. A YouTube Video Transcript (analyze for mechanical condition, engine sounds described, features, and honest flaws mentioned).

        TASK:
        Generate a strict Grading Report.
        
        RULES:
        - AGE: Based directly on Model Year vs Current Year (${new Date().getFullYear()}).
        - TITLE/HISTORY: Look for clues in transcript (e.g., "one owner", "clean title", "rebuilt"). If unsure, put "N/A".
        - MECHANICAL (+2 sentences): Judge PURELY from the transcript. what did they say about how it runs? did they mention issues? If no transcript, put "N/A - Test Drive Recommended".
        - COSMETIC (+2 sentences): Judge PURELY from the provided images. Look for rust, dents, interior quality.
        - VALUE (+2 sentences): Judge based on the Price vs likely functionality. High Life Auto sells "Freedom Machines" (cheap reliable transport), so a $2000 car that runs is an "A" value even if it's ugly.
        - BUYER TIPS: Identify 3 "Common Known Issues" specific to this Year/Make/Model/Engine. (e.g., "Chevy 5.3L engines from this era often have AFM lifter tick"). Make it clear these are things to CHECK, not necessarily present on this car.

        OUTPUT FORMAT (JSON ONLY):
        {
            "grades": {
                "overall": "B+",
                "age": { "grade": "C", "criterias": "2008 Model (15+ years old)" },
                "titleHistory": { "status": "Clean", "notes": "Transcript mentions 2 owners." },
                "mechanical": { "grade": "A-", "notes": "Engine sounds smooth in video. Miriam mentioned new brakes." },
                "cosmetic": { "grade": "C", "notes": "Visible rust on wheel wells shown in photos. Interior styling is dated but intact." },
                "value": { "grade": "A", "notes": "At $2,500, this is a steal for a running driving Honda. unbeatable bang for buck." }
            },
            "buyerTips": [
                 "Tip 1: Known issue X for this engine...",
                 "Tip 2: Check for rust in Y area...",
                 "Tip 3: Transmission Z requires regular fluid changes..."
            ],
            "oneLiner": "A rusty but trusty commuter that saves you money.",
            "description": "Full description here (4-6 sentences)..."
        }
        
        Return ONLY valid JSON.
        `,
        videoContext
    ];

    // Add images to prompt
    for (const buffer of photoBuffers) {
        if (buffer) {
            promptParts.push({
                inlineData: {
                    data: Buffer.from(buffer).toString("base64"),
                    mimeType: "image/jpeg"
                }
            });
        }
    }

    try {
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        // Clean markdown code blocks if present
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("AI Generation Error:", error);
        return null;
    }
}

// MAIN PROCESS
async function main() {
    console.log('\n🧠 Starting AI Inventory Enhancement...');

    // 1. Read CSV
    if (!fs.existsSync(SOURCE_CSV_PATH)) {
        console.error(`❌ Source CSV not found at: ${SOURCE_CSV_PATH}`);
        process.exit(1);
    }
    const csvContent = fs.readFileSync(SOURCE_CSV_PATH, 'utf-8');
    const rawRecords = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

    console.log(`   Found ${rawRecords.length} vehicles in feed.`);

    // 2. Load Cache
    const cache = loadCache();
    let updatedCount = 0;
    const finalInventory = [];

    // 3. Process Items
    for (const record of rawRecords) {
        // Map basic fields first
        const id = record['Stock Number'] || record['Stock'];

        // Photos
        const rawPhotos = record['Image URL'] || record['PhotoURLs'] || record['Photos'] || '';
        const photos = rawPhotos ? rawPhotos.split('|').map(u => u.trim()).filter(Boolean) : [];

        // YouTube
        let youtubeUrl = record['YouTube URL'];
        if (!youtubeUrl) {
            const match = (record['Comments'] || '').match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (match) youtubeUrl = match[0];
        }

        const vehicle = {
            id: id,
            stock: id,
            vin: record['Vehicle Vin'] || record['VIN'],
            year: parseInt(record['Vehicle Year'] || record['Year']) || 0,
            make: record['Vehicle Make'] || record['Make'],
            model: record['Vehicle Model'] || record['Model'],
            trim: record['Vehicle Trim Level'] || record['Style'] || '',
            price: parseFloat((record['Retail'] || record['Internet Price'] || '0').replace(/[^0-9.]/g, '')) || 0,
            mileage: parseInt(record['Mileage'] || '0'),
            photos: photos,
            youtubeUrl: youtubeUrl,
            rawComments: record['Comments']
        };

        // Check Cache
        const currentHash = generateHash(record);
        const cachedItem = cache[id];

        let aiData = null;

        if (cachedItem && cachedItem.hash === currentHash && cachedItem.aiData) {
            // HIT
            aiData = cachedItem.aiData;
        } else {
            // MISS - Generate New Data
            console.log(`   ⚡ Analyzing New/Modified: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);

            // Limit Photos for Vision API (Max 3 to save tokens/latency)
            const photoBuffers = [];
            for (let i = 0; i < Math.min(photos.length, 3); i++) {
                const b = await fetchImage(photos[i]);
                if (b) photoBuffers.push(b);
            }

            const transcript = await getTranscript(vehicle.youtubeUrl);

            const generated = await generateAIGrading(vehicle, transcript, photoBuffers);

            if (generated) {
                aiData = generated;
                updatedCount++;

                // Update Cache
                cache[id] = {
                    hash: currentHash,
                    aiData: generated,
                    lastUpdated: new Date().toISOString()
                };
                // Save incrementally
                saveCache(cache);
            } else {
                console.warn(`      ⚠️ AI Failed. Using calculated fallback.`);

                // FALLBACK LOGIC: Calculate grades based on data
                const age = new Date().getFullYear() - vehicle.year;
                const ageGrade = age > 15 ? "C" : (age > 10 ? "B" : "A");

                const mileage = vehicle.mileage;
                const mechGrade = mileage > 200000 ? "C-" : (mileage > 150000 ? "B-" : "A-");

                const overallNotes = [];
                if (age > 15) overallNotes.push("Classic model");
                if (mileage < 100000) overallNotes.push("Low miles");

                aiData = {
                    grades: {
                        overall: "B+ (Est.)",
                        age: { grade: ageGrade, criterias: `${vehicle.year} Model (${age} years old)` },
                        titleHistory: { status: "Check Rpt", notes: "Ask dealer for full history." },
                        mechanical: { grade: mechGrade, notes: `Based on ${mileage.toLocaleString()} miles. Test drive recommended.` },
                        cosmetic: { grade: "B", notes: "Visual inspection required. See photos." },
                        value: { grade: "A", notes: "Priced to sell. Great value for the money." }
                    },
                    oneLiner: `A ${vehicle.year} ${vehicle.make} ready for its next owner.`,
                    description: vehicle.rawComments || "Visit us to see this vehicle in person.",
                    buyerTips: [
                        `Check for frame rust (Common on ${vehicle.year} models)`,
                        "Verify transmission shift quality",
                        "Inspect fluids regularly"
                    ]
                };
            }
        }

        // Merge AI Data
        finalInventory.push({
            ...vehicle,
            ai: aiData
        });
    }

    // 4. Output JSON
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(finalInventory, null, 2));
    console.log(`   ✅ Exported ${finalInventory.length} vehicles to public/inventory-enhanced.json`);
    console.log(`   (Newly analyzed: ${updatedCount})\n`);
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
