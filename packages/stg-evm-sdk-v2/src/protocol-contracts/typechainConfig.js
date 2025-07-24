const path = require('path');

require('../typechain')({
    package: path.dirname(require.resolve('@layerzerolabs/lz-evm-sdk-v2/package.json')),
    paths: ['/artifacts/contracts/**/*.json'],
});
