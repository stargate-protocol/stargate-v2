const { runTypeChain, glob } = require('typechain');
const path = require('path');

module.exports = async (typechainConfig) => {
    const cwd = process.cwd();

    // Handle multiple configs and single config
    const configs = typechainConfig.configs || [
        {
            paths: typechainConfig.paths,
            outDir: './typechain',
        },
    ];

    for (const config of configs) {
        const basePath = typechainConfig.package ? typechainConfig.package : './';
        const absPaths = config.paths.map((p) => path.join(basePath, p));
        let allFiles = glob(cwd, absPaths);
        allFiles = allFiles.filter((file) => !file.includes('dbg'));

        await runTypeChain({
            cwd,
            filesToProcess: allFiles,
            allFiles,
            outDir: config.outDir,
            target: 'ethers-v5',
        });
    }
};
