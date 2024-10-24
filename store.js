const fs = require('fs');
const path = require('path');

const SRC = './USDCSignatureLib.json';
const PREFIX = '/Users/default-admin/Documents/circle/stablecoin-evm-private-usdc-mainnet-arb/contracts';

const contents = require(SRC);

for (let [abspath, { content }] of Object.entries(contents.metadata.sources)) {
    console.log('Checking', abspath);

    if (!abspath.includes(PREFIX)) continue;

    console.log('Storing', abspath);

    const relpath = abspath.replace(PREFIX, './packages/stg-evm-usdc-v2/tst');

    fs.mkdirSync(path.dirname(relpath), { recursive: true });

    fs.writeFileSync(relpath, content);
}
