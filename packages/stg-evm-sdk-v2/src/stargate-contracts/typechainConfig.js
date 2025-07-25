const path = require('path');

require('../typechain')({
    package: path.dirname(require.resolve('../../package.json')),
    paths: ['artifacts/src/**/*.json'],
});
