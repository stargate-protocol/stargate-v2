import { readdirSync } from 'fs';
import { join } from 'path';

const openZeppelinDir = join(__dirname, '.openzeppelin');
const jsonFiles = readdirSync(openZeppelinDir).filter(file => file.endsWith('.json'));

const exportsObj: any = {};

// Export each USDT JSON file dynamically
jsonFiles.forEach(file => {
    const filePath = join(openZeppelinDir, file);
    const jsonData = require(filePath);
    const exportName = file.replace('.json', '');

    exportsObj[exportName] = jsonData;
});

export const sepolia = exportsObj.sepolia; // TODO export relevant deployment files after deploying