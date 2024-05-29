module.exports = {
    extends: ['solhint:recommended', require.resolve('@layerzerolabs/solhint-config')],
    rules: {
        'max-line-length': 'warn',
    },
};
