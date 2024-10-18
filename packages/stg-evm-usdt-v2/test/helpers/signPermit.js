const { fromRpcSig } = require('ethereumjs-util');

const EIP2612_TYPE = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
];

module.exports = async ({ chainId, account, spender, version, tokenName, tokenAddress, amount, deadline }) => {
    const message = {
        owner: await account.getAddress(),
        spender,
        value: amount,
        nonce: 0,
        deadline,
    };
    const domain = {
        name: tokenName,
        version,
        verifyingContract: tokenAddress,
        chainId,
    };

    const dataJSON = {
        types: {
            Permit: EIP2612_TYPE,
        },
        domain,
        primaryType: 'Permit',
        message,
    };
    const signature = await account._signTypedData(dataJSON.domain, dataJSON.types, dataJSON.message);

    return fromRpcSig(signature);
};
