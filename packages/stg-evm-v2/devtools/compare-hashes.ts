import * as fs from 'fs'

interface HashEntry {
    name: string
    hashedContent: string
}

// Read both files
const hashes1: HashEntry[] = JSON.parse(fs.readFileSync('devtools/config/mainnet/01/hashes.json', 'utf8'))
const hashes2: HashEntry[] = JSON.parse(fs.readFileSync('devtools/config/mainnet/01/hashesMain.json', 'utf8'))

// Create maps for lookup
const map1 = new Map(hashes1.map((item) => [item.name, item.hashedContent]))
const map2 = new Map(hashes2.map((item) => [item.name, item.hashedContent]))

// Find differences
console.log('Files with different hashes:')
for (const [name, hash1] of map1) {
    const hash2 = map2.get(name)
    if (hash2 && hash1 !== hash2) {
        console.log(`- ${name}`)
    }
}
