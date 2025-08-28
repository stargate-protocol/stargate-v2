#!/usr/bin/env node
import fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadMainnetChainsFromYaml(stage) {
    let allChainsNames;
    try {
        allChainsNames = getAllChainsNames(stage);
    } catch (error) {
        console.warn('Failed to load mainnet chains from config:', error);
    }
    return allChainsNames;
}

// Get the network from environment variable or default to mainnet
const network = process.env.NETWORK || 'mainnet';

// Select the appropriate chain list based on the network
const chainList = loadMainnetChainsFromYaml(network);

// Return the list of strings
console.log(JSON.stringify(chainList));

function getAllChainsNames(stage) {
    if (stage !== 'mainnet' && stage !== 'testnet' && stage !== 'sandbox') {
        throw new Error('Invalid stage');
    }
    const rootDir = path.join(__dirname, '..', '..', '..', 'packages', 'stg-evm-v2', 'devtools', 'config');

    const chainsToChainsDir = {
        ['mainnet']: path.join(rootDir, 'mainnet', '01', 'chainsConfig'),
        ['testnet']: path.join(rootDir, 'testnet', 'chainsConfig'),
        ['sandbox']: path.join(rootDir, 'sandbox', 'chainsConfig'),
    };

    const chainsDir = chainsToChainsDir[stage];

    // Read all yml files from the chains directory
    let chainFiles = fs.readdirSync(chainsDir).filter((file) => file.endsWith('.yml'));

    // remove template-chain.yml
    chainFiles = chainFiles.filter((file) => file !== '0-template-chain.yml');

    // the file name is the chain name
    return chainFiles.map((file) => {
        return path.basename(file, path.extname(file));
    });
}
