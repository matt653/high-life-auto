/**
 * AI Vehicle Description Generator
 * Analyzes photos and videos to create honest vehicle descriptions
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { fileURLToPath } from 'url';

// CONFIGURATION
const FRAZER_CSV_PATH = 'G:\\My Drive\\Matt\\new app stuf\\matt ai\\frazer data\\DealerCarSearch-1.csv';
// Output explicit absolute path to project root
import 'dotenv/config';

// Output explicit absolute path to project root
const OUTPUT_CSV_PATH = 'G:\\My Drive\\Matt\\new app stuf\\matt ai\\remote idea\\public\\frazer-inventory-updated.csv'; // Generating directly to public for viewing
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper to manual stringify CSV to avoid broken dependency
function recordsToCSV(records, columns) {
    const header = columns.join(',');
    const rows = records.map(record => {
        return columns.map(col => {
            let val = record[col] || '';
            val = String(val).replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                val = `"${val}"`;
            }
            return val;
        }).join(',');
    });
    return [header, ...rows].join('\n');
}

async function getTranscript(youtubeUrl) {
    if (!youtubeUrl) return null;
    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(youtubeUrl);
        return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
        // console.warn(`⚠️  Could not fetch transcript for ${youtubeUrl}: ${error.message}`);
        return null;
    }
}

async function generateVehicleDescription(vehicle, model) {
    // Map CSV (DealerCarSearch format) to Script Variables
    const Year = vehicle['Vehicle Year'] || '';
    const Make = vehicle['Vehicle Make'] || '';
    const Model = vehicle['Vehicle Model'] || '';
    const Mileage = vehicle['Mileage'] || '';
    const Price = vehicle['Retail'] || vehicle['Internet Price'] || '';
    const PhotoURLs = vehicle['Image URL'] || '';
    const currentComments = vehicle['Comments'] || '';

    // Explicit YouTube URL column
    let youtubeUrl = vehicle['YouTube URL'];

    // Fallback: Try regex if empty or valid url not found
    if (!youtubeUrl || !youtubeUrl.includes('youtu')) {
        const youtubeMatch = currentComments?.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (youtubeMatch) {
            youtubeUrl = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;
        }
    }

    // Clean URL
    let cleanYoutubeUrl = youtubeUrl;
    if (youtubeUrl && youtubeUrl.includes('?')) cleanYoutubeUrl = youtubeUrl.split('?')[0];
    else if (youtubeUrl && youtubeUrl.includes('&')) cleanYoutubeUrl = youtubeUrl.split('&')[0];

    const transcript = await getTranscript(cleanYoutubeUrl);
    const photos = PhotoURLs ? PhotoURLs.split('|').length : 0;
    const vehicleInfo = `${Year} ${Make} ${Model} (${Mileage} miles, $${Price})`;

    console.log(`\n🤖 Generating for ${vehicleInfo}...`);
    if (youtubeUrl) console.log(`   - Video: ${cleanYoutubeUrl} (${transcript ? 'Transcript Loaded' : 'No Transcript'})`);

    const prompt = `
You are analyzing a ${vehicleInfo}.
Photos Count: ${photos}
${transcript ? `Video Transcript: "${transcript.substring(0, 5000)}..."` : 'No video transcript available (rely on general knowledge).'}

Create an HONEST vehicle description and REPORT CARD following these rules:
VISUAL GRADE (Exterior/Interior): Assume 7/10 unless transcript mentions damage. (We can't see photos, so be safe).
MECHANICAL GRADE: Based ONLY on the video transcript. If transcript is empty, assume "Runs and drives, test drive recommended."
SMELLS/FEATURES: Based ONLY on the video transcript.
Tone: "High Life Auto" voice: honest, down-to-earth, no BS. Gritty. Real.

Output Format (Strictly follow this structure):
[REPORT CARD]
Exterior Grade: [A-F]
Interior Grade: [A-F]
Mechanical Grade: [A-F]
Smell/Features: [Notes]
Overall Grade: [Average]

[BUYER TIPS]
- [Tip 1 specific to Year/Make/Model/Engine]
- [Tip 2 specific to Year/Make/Model/Engine]
- [Tip 3]

[DESCRIPTION]
(Write the "What You Need To Know" section here)
- Length: 4-8 sentences (Strict).
- Context: Write for someone driving 2 hours to see this car. Don't waste their time.
- Content: Combine specific vehicle specs (Engine reliability, common issues for this Year/Make/Model) with the Transcript (Mechanical condition/smells).
- Style: Raw, unpolished, and real. Avoid "marketing fluff". Write like a mechanic.
Updated: ${new Date().toLocaleDateString()}
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error(`❌ AI Generation failed for ${vehicleInfo}: ${error.message}`);
        return currentComments; // Fallback to original
    }
}

async function processInventory() {
    try {
        console.log("🔍 Final Check for API Key...");
        const modelName = "gemini-1.5-flash";

        process.stdout.write(`   Checking ${modelName}... `);
        try {
            const testModel = genAI.getGenerativeModel({ model: modelName });
            await testModel.generateContent("Test");
            console.log("✅ SUCCESS! The key is working now.");

            console.log(`\n🚀 Starting Generation...`);
            await runBatchGeneration(testModel);
            return;
        } catch (e) {
            console.log(`❌ FAILED.`);
            console.log(`   Reason: ${e.message}`);
            console.log(`   (This usually means the Google Cloud Project needs "Generative Language API" enabled or a billing account).`);
        }

        return; // Stop if failed
    } catch (error) {
        console.error('❌ Global Error:', error);
    }
}

async function runBatchGeneration(validModel) {
    let csvPath = FRAZER_CSV_PATH;
    if (!fs.existsSync(csvPath)) {
        console.warn(`⚠️  Frazer path not found: ${csvPath}`);
        return;
    }

    console.log(`📖 Reading CSV from: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true
    });

    console.log(`✅ Found ${records.length} vehicles`);

    let updatedCount = 0;
    const batchSize = 3;
    console.log(`🧪 Processing first ${batchSize} vehicles for test batch...`);

    for (let i = 0; i < Math.min(records.length, batchSize); i++) {
        const record = records[i];
        const newDescription = await generateVehicleDescription(record, validModel); // Pass model
        record['Comments'] = newDescription;
        updatedCount++;
    }

    const columns = Object.keys(records[0]);
    const outputCsv = recordsToCSV(records, columns);

    fs.writeFileSync(OUTPUT_CSV_PATH, outputCsv);

    console.log(`\n✅ Updated ${updatedCount} vehicle descriptions`);
    console.log(`📄 Saved to: ${OUTPUT_CSV_PATH}`);
}

processInventory();
