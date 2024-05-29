require('@rushstack/eslint-patch/modern-module-resolution');
module.exports = {
    extends: ['@layerzerolabs/eslint-config-next/recommended'],
    rules: {
        'turbo/no-undeclared-env-vars': 'off',
    },
};
