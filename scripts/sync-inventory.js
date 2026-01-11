
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const SOURCE_PATH = 'G:\\My Drive\\Matt\\new app stuf\\matt ai\\frazer data\\DealerCarSearch-1.csv';
// Public folder is one level up from scripts
const DEST_PATH = path.join(process.cwd(), 'public', 'frazer-inventory.csv');

console.log('\n🔄 Syncing High Life Auto Inventory...');
console.log(`   📂 Source: ${SOURCE_PATH}`);

try {
    if (fs.existsSync(SOURCE_PATH)) {
        // Copy and rename
        fs.copyFileSync(SOURCE_PATH, DEST_PATH);

        // Validation check
        const stats = fs.statSync(DEST_PATH);
        console.log(`   ✅ Success! Synced to public/frazer-inventory.csv`);
        console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   🕒 Time: ${new Date().toLocaleTimeString()}\n`);
    } else {
        console.warn(`   ⚠️  WARNING: Source file not found!`);
        console.warn(`   Checked path: ${SOURCE_PATH}`);
        console.warn(`   Using existing data if available.\n`);
        // Do not exit with error, allow app to start with old data
    }
} catch (error) {
    console.error(`   ❌ Failed to sync inventory: ${error.message}\n`);
    // Do not exit with error
}
