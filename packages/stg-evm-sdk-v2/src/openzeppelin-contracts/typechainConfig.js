const path = require('path');

require('../typechain')({
    package: path.dirname(require.resolve('@openzeppelin/contracts/package.json')),
    paths: ['/build/contracts/?(ERC20|IERC20).json'],
});
