import { parseEther } from '@ethersproject/units'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import {
    type AssetConfig,
    CreditMessagingNetworkConfig,
    NetworksConfig,
    RewardTokenName,
    RewardsConfig,
    StargateType,
    TokenMessagingNetworkConfig,
    TokenName,
} from './types'

export const DVNS = {
    //
    // MAINNET
    //
    NETHERMIND: {
        [EndpointId.ARBITRUM_V2_MAINNET]: '0xa7b5189bcA84Cd304D8553977c7C614329750d99',
        [EndpointId.AURORA_V2_MAINNET]: '0x34730f2570e6cff8b1c91faabf37d0dd917c4367',
        [EndpointId.AVALANCHE_V2_MAINNET]: '0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5',
        [EndpointId.BASE_V2_MAINNET]: '0xcd37CA043f8479064e10635020c65FfC005d36f6',
        [EndpointId.BSC_V2_MAINNET]: '0x31F748a368a893Bdb5aBB67ec95F232507601A73',
        [EndpointId.EBI_V2_MAINNET]: '0x261150ab73528dbd51573a52917eab243be9729a',
        [EndpointId.ETHEREUM_V2_MAINNET]: '0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5',
        [EndpointId.KAVA_V2_MAINNET]: '0x6a4C9096F162f0ab3C0517B0a40dc1CE44785e16',
        [EndpointId.KLAYTN_V2_MAINNET]: '0x6a4C9096F162f0ab3C0517B0a40dc1CE44785e16',
        [EndpointId.MANTLE_V2_MAINNET]: '0xB19A9370D404308040A9760678c8Ca28aFfbbb76',
        [EndpointId.METIS_V2_MAINNET]: '0x6ABdb569Dc985504cCcB541ADE8445E5266e7388',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0xa7b5189bcA84Cd304D8553977c7C614329750d99',
        [EndpointId.POLYGON_V2_MAINNET]: '0x31F748a368a893Bdb5aBB67ec95F232507601A73',
        [EndpointId.RARIBLE_V2_MAINNET]: '0xb53648ca1aa054a80159c1175c03679fdc76bf88',
        [EndpointId.SCROLL_V2_MAINNET]: '0x446755349101cB20c582C224462c3912d3584dCE',
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: '0xDd7B5E1dB4AaFd5C8EC3b764eFB8ed265Aa5445B',
        // [EndpointId.ZKSYNC_V2_MAINNET]: '0xb183c2b91cf76cAd13602b32ADa2Fd273f19009C',
    } satisfies Partial<Record<EndpointId, string>>,
    LZ_LABS: {
        [EndpointId.ARBITRUM_V2_MAINNET]: '0x2f55C492897526677C5B68fb199ea31E2c126416',
        [EndpointId.AURORA_V2_MAINNET]: '0xD4a903930f2c9085586cda0b11D9681EECb20D2f',
        [EndpointId.AVALANCHE_V2_MAINNET]: '0x962F502A63F5FBeB44DC9ab932122648E8352959',
        [EndpointId.BASE_V2_MAINNET]: '0x9e059a54699a285714207b43B055483E78FAac25',
        [EndpointId.BSC_V2_MAINNET]: '0xfD6865c841c2d64565562fCc7e05e619A30615f0',
        [EndpointId.EBI_V2_MAINNET]: '0x6788f52439ACA6BFF597d3eeC2DC9a44B8FEE842',
        [EndpointId.ETHEREUM_V2_MAINNET]: '0x589dEDbD617e0CBcB916A9223F4d1300c294236b',
        [EndpointId.KAVA_V2_MAINNET]: '0x2D40A7B66F776345Cf763c8EBB83199Cd285e7a3',
        [EndpointId.KLAYTN_V2_MAINNET]: '0xc80233AD8251E668BecbC3B0415707fC7075501e',
        [EndpointId.MANTLE_V2_MAINNET]: '0x28B6140ead70cb2Fb669705b3598ffB4BEaA060b',
        [EndpointId.METIS_V2_MAINNET]: '0x32d4F92437454829b3Fe7BEBfeCE5D0523DEb475',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0x6A02D83e8d433304bba74EF1c427913958187142',
        [EndpointId.POLYGON_V2_MAINNET]: '0x23DE2FE932d9043291f870324B74F820e11dc81A',
        [EndpointId.RARIBLE_V2_MAINNET]: '0x0b5E5452d0c9DA1Bb5fB0664F48313e9667d7820',
        [EndpointId.SCROLL_V2_MAINNET]: '0xbe0d08a85EeBFCC6eDA0A843521f7CBB1180D2e2',
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: '0x129Ee430Cb2Ff2708CCADDBDb408a88Fe4FFd480',
        // [EndpointId.ZKSYNC_V2_MAINNET]: '0x620A9DF73D2F1015eA75aea1067227F9013f5C51',
    } satisfies Partial<Record<EndpointId, string>>,
    STG: {
        [EndpointId.ARBITRUM_V2_MAINNET]: '0x5756a74e8e18d8392605ba667171962b2b2826b5',
        [EndpointId.AURORA_V2_MAINNET]: '0xe11c808bc6099abc9be566c9017aa2ab0f131d35',
        [EndpointId.AVALANCHE_V2_MAINNET]: '0x252b234545e154543ad2784c7111eb90406be836',
        [EndpointId.BASE_V2_MAINNET]: '0xcdf31d62140204c08853b547e64707110fbc6680',
        [EndpointId.BSC_V2_MAINNET]: '0xac8de74ce0a44a5e73bbc709fe800406f58431e0',
        [EndpointId.EBI_V2_MAINNET]: '0x97841d4ab18e9a923322a002d5b8eb42b31ccdb5',
        [EndpointId.ETHEREUM_V2_MAINNET]: '0x8fafae7dd957044088b3d0f67359c327c6200d18',
        [EndpointId.KAVA_V2_MAINNET]: '0x9cbaf815ed62ef45c59e9f2cb05106babb4d31d3',
        [EndpointId.KLAYTN_V2_MAINNET]: '0x17720e3f361dcc2f70871a2ce3ac51b0eaa5c2e4',
        [EndpointId.MANTLE_V2_MAINNET]: '0xfe809470016196573d64a8d17a745bebea4ecc41',
        [EndpointId.METIS_V2_MAINNET]: '0x61a1b61a1087be03abedc04900cfcc1c14187237',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0xfe6507f094155cabb4784403cd784c2df04122dd',
        [EndpointId.POLYGON_V2_MAINNET]: '0xc79f0b1bcb7cdae9f9ba547dcfc57cbfcd2993a5',
        [EndpointId.RARIBLE_V2_MAINNET]: '0x2fa870cee4da57de84d1db36759d4716ad7e5038',
        [EndpointId.SCROLL_V2_MAINNET]: '0xb87591d8b0b93fae8b631a073577c40e8dd46a62',
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: '0xef269bbadb81de86e4b3278fa1dae1723545268b',
        // [EndpointId.ZKSYNC_V2_MAINNET]: '0x62aa89bad332788021f6f4f4fb196d5fe59c27a6',
    } satisfies Partial<Record<EndpointId, string>>,
}

export const EXECUTORS = {
    //
    // MAINNET
    //
    LZ_LABS: {
        [EndpointId.ARBITRUM_V2_MAINNET]: '0x31CAe3B7fB82d847621859fb1585353c5720660D',
        [EndpointId.AURORA_V2_MAINNET]: '0xA2b402FFE8dd7460a8b425644B6B9f50667f0A61',
        [EndpointId.AVALANCHE_V2_MAINNET]: '0x90E595783E43eb89fF07f63d27B8430e6B44bD9c',
        [EndpointId.BASE_V2_MAINNET]: '0x2CCA08ae69E0C44b18a57Ab2A87644234dAebaE4',
        [EndpointId.BSC_V2_MAINNET]: '0x3ebD570ed38B1b3b4BC886999fcF507e9D584859',
        [EndpointId.EBI_V2_MAINNET]: '0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f',
        [EndpointId.ETHEREUM_V2_MAINNET]: '0x173272739Bd7Aa6e4e214714048a9fE699453059',
        [EndpointId.KAVA_V2_MAINNET]: '0x41ED8065dd9bC6c0caF21c39766eDCBA0F21851c',
        [EndpointId.KLAYTN_V2_MAINNET]: '0xe149187a987F129FD3d397ED04a60b0b89D1669f',
        [EndpointId.MANTLE_V2_MAINNET]: '0x4Fc3f4A38Acd6E4cC0ccBc04B3Dd1CCAeFd7F3Cd',
        [EndpointId.METIS_V2_MAINNET]: '0xE6AB3B3E632f3C65c3cb4c250DcC42f5E915A1cf',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0x2D2ea0697bdbede3F01553D2Ae4B8d0c486B666e',
        [EndpointId.POLYGON_V2_MAINNET]: '0xCd3F213AD101472e1713C72B1697E727C803885b',
        [EndpointId.RARIBLE_V2_MAINNET]: '0x1E4CAc6c2c955cAED779ef24d5B8C5EE90b1f914',
        [EndpointId.SCROLL_V2_MAINNET]: '0x581b26F362AD383f7B51eF8A165Efa13DDe398a4',
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: '0x0408804C5dcD9796F22558464E6fE5bDdF16A7c7',
        // [EndpointId.ZKSYNC_V2_MAINNET]: '0x664e390e672A811c12091db8426cBb7d68D5D8A6',
    } satisfies Partial<Record<EndpointId, string>>,
}

// TODO better names for these?
// CreditMessaging constants
export const DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG: CreditMessagingNetworkConfig = {
    creditGasLimit: 40000n, // fixed gas limit for creditMsging
    sendCreditGasLimit: 40000n, // marginal gasLimit for sending credit
}

// TokenMessaging constants
export const DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG: TokenMessagingNetworkConfig = {
    nativeDropAmount: BigInt(1e13),
    taxiGasLimit: 150000n,
    busGasLimit: 38000n,
    busRideGasLimit: 30000n,
    nativeDropGasLimit: 13000n,
    maxPassengerCount: 20,
}

export const ASSETS: Record<TokenName, AssetConfig> = {
    [TokenName.ETH]: {
        name: 'ETH',
        symbol: 'ETH',
        assetId: 13,
        sharedDecimals: 6,
        localDecimals: 18,
        networks: {
            //
            // MAINNET
            //
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.ARBITRUM_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.METIS_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Pool,
                address: '0x420000000000000000000000000000000000000a',
            },
            [EndpointId.ZKCONSENSYS_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Pool,
                address: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
            },
            [EndpointId.BASE_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.SCROLL_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.IOTA_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.KLAYTN_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.SEI_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },

            //
            // TESTNET
            //
            [EndpointId.SEPOLIA_V2_TESTNET]: {
                type: StargateType.Native,
            },
            [EndpointId.OPTSEP_V2_TESTNET]: {
                type: StargateType.Native,
            },
            [EndpointId.ARBSEP_V2_TESTNET]: {
                type: StargateType.Native,
            },
            [EndpointId.KLAYTN_V2_TESTNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },

            //
            // SANDBOX
            //
            [EndpointId.ETHEREUM_V2_SANDBOX]: {
                type: StargateType.Native,
            },
            [EndpointId.POLYGON_V2_SANDBOX]: {
                type: StargateType.Oft,
            },
        },
    },
    [TokenName.USDT]: {
        name: 'Tether USD',
        symbol: 'USDT',
        assetId: 2,
        sharedDecimals: 6,
        localDecimals: 6,
        networks: {
            //
            // MAINNET
            //
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            },
            [EndpointId.BSC_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x55d398326f99059fF775485246999027B3197955',
            },
            [EndpointId.AVALANCHE_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            },
            [EndpointId.POLYGON_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            },
            [EndpointId.ARBITRUM_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
            },
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
            },
            [EndpointId.RARIBLE_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.METIS_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xbB06DCA3AE6887fAbF931640f67cab3e3a16F4dC',
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
            },
            [EndpointId.IOTA_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.KAVA_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x919C1c267BC06a7039e03fcc2eF738525769109c',
            },
            [EndpointId.KLAYTN_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.EBI_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.SEI_V2_MAINNET]: {
                type: StargateType.Oft,
            },

            //
            // TESTNET
            //
            [EndpointId.SEPOLIA_V2_TESTNET]: {
                type: StargateType.Pool,
            },
            [EndpointId.BSC_V2_TESTNET]: {
                address: '0xe37Bdc6F09DAB6ce6E4eBC4d2E72792994Ef3765',
                type: StargateType.Pool,
            },
            [EndpointId.OPTSEP_V2_TESTNET]: {
                type: StargateType.Pool,
            },
            [EndpointId.ARBSEP_V2_TESTNET]: {
                type: StargateType.Pool,
            },
            [EndpointId.KLAYTN_V2_TESTNET]: {
                type: StargateType.Oft,
            },

            //
            // SANDBOX
            //
            // default: StargateType.Pool
            [EndpointId.BSC_V2_SANDBOX]: {
                type: StargateType.Oft,
            },
            [EndpointId.ETHEREUM_V2_SANDBOX]: {
                type: StargateType.Pool,
            },
            [EndpointId.POLYGON_V2_SANDBOX]: {
                type: StargateType.Pool,
            },
        },
    },
    [TokenName.USDC]: {
        name: 'USDC',
        symbol: 'USDC',
        assetId: 1,
        sharedDecimals: 6,
        networks: {
            //
            // MAINNET
            //
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                type: StargateType.Pool,
            },
            [EndpointId.AVALANCHE_V2_MAINNET]: {
                address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
                type: StargateType.Pool,
            },
            [EndpointId.POLYGON_V2_MAINNET]: {
                address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
                type: StargateType.Pool,
            },
            [EndpointId.ARBITRUM_V2_MAINNET]: {
                address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                type: StargateType.Pool,
            },
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
                type: StargateType.Pool,
            },
            [EndpointId.RARIBLE_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
                type: StargateType.Pool,
            },
            [EndpointId.BASE_V2_MAINNET]: {
                address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                type: StargateType.Pool,
            },
            [EndpointId.SCROLL_V2_MAINNET]: {
                address: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
                type: StargateType.Pool,
                symbol: 'USDC.e',
            },
            [EndpointId.AURORA_V2_MAINNET]: {
                address: '0x368ebb46aca6b8d0787c96b2b20bd3cc3f2c45f7',
                type: StargateType.Pool,
            },
            [EndpointId.IOTA_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.KLAYTN_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.TAIKO_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },

            //
            // TESTNET
            //
            [EndpointId.SEPOLIA_V2_TESTNET]: {
                address: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590',
                type: StargateType.Pool,
            },
            [EndpointId.OPTSEP_V2_TESTNET]: {
                address: '0x488327236B65C61A6c083e8d811a4E0D3d1D4268',
                type: StargateType.Pool,
            },
            [EndpointId.ARBSEP_V2_TESTNET]: {
                address: '0x3253a335E7bFfB4790Aa4C25C4250d206E9b9773',
                type: StargateType.Pool,
            },
            [EndpointId.KLAYTN_V2_TESTNET]: {
                symbol: 'USDC.e',
                type: StargateType.Oft,
            },

            //
            // SANDBOX
            //
            [EndpointId.BSC_V2_SANDBOX]: {
                type: StargateType.Oft,
            },
            [EndpointId.ETHEREUM_V2_SANDBOX]: {
                type: StargateType.Pool,
            },
            [EndpointId.POLYGON_V2_SANDBOX]: {
                type: StargateType.Oft,
            },
        },
    },
    [TokenName.METIS]: {
        name: 'METIS',
        symbol: 'METIS',
        assetId: 17,
        sharedDecimals: 6,
        networks: {
            //
            // MAINNET
            //
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                address: '0x9e32b13ce7f2e80a01932b42553652e053d6ed8e',
                type: StargateType.Pool,
            },
            [EndpointId.METIS_V2_MAINNET]: {
                address: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
                type: StargateType.Pool,
            },
        },
    },
    [TokenName.mETH]: {
        name: 'mETH',
        symbol: 'mETH',
        assetId: 22,
        sharedDecimals: 6,
        networks: {
            //
            // MAINNET
            //
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                address: '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa',
                type: StargateType.Pool,
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                address: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0',
                type: StargateType.Pool,
            },
        },
    },
}

export const REWARDS: RewardsConfig = {
    [RewardTokenName.MOCK_A]: {
        name: 'RewardTokenMock',
        networks: {
            //
            // Testnet
            //
            // We don't deploy the token on testnet since there are no pools
            //
            [EndpointId.SEPOLIA_V2_TESTNET]: {},
            [EndpointId.BSC_V2_TESTNET]: {},
            [EndpointId.OPTSEP_V2_TESTNET]: {},
            [EndpointId.ARBSEP_V2_TESTNET]: {},

            //
            // Sandbox
            //
            [EndpointId.BSC_V2_SANDBOX]: {},
            [EndpointId.ETHEREUM_V2_SANDBOX]: {},
            [EndpointId.POLYGON_V2_SANDBOX]: {},
        },
    },
    [RewardTokenName.STG]: {
        name: 'STG',
        networks: {
            //
            // Mainnet
            //
            [EndpointId.ARBITRUM_V2_MAINNET]: {
                address: '0x6694340fc020c5E6B96567843da2df01b2CE1eb6',
            },
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                address: '0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6',
            },
            [EndpointId.BSC_V2_MAINNET]: {
                address: '0xB0D502E938ed5f4df2E681fE6E419ff29631d62b',
            },
            [EndpointId.AVALANCHE_V2_MAINNET]: {
                address: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590',
            },
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                address: '0x296F55F8Fb28E498B858d0BcDA06D955B2Cb3f97',
            },
            [EndpointId.POLYGON_V2_MAINNET]: {
                address: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590',
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                address: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
            },
            [EndpointId.ZKCONSENSYS_V2_MAINNET]: {
                address: '0x808d7c71ad2ba3FA531b068a2417C63106BC0949',
            },
            [EndpointId.BASE_V2_MAINNET]: {
                address: '0xE3B53AF74a4BF62Ae5511055290838050bf764Df',
            },
            [EndpointId.SCROLL_V2_MAINNET]: {
                address: '0x8731d54e9d02c286767d56ac03e8037c07e01e98',
            },
        },
    },
    [RewardTokenName.ARB]: {
        name: 'ARB',
        networks: {
            //
            // Mainnet
            [EndpointId.ARBITRUM_V2_MAINNET]: {
                address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
            },
        },
    },
    [RewardTokenName.OP]: {
        name: 'OP',
        networks: {
            //
            // Mainnet
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                address: '0x4200000000000000000000000000000000000042',
            },
        },
    },
    [RewardTokenName.METIS]: {
        name: 'METIS',
        networks: {
            //
            // Mainnet
            [EndpointId.METIS_V2_MAINNET]: {
                address: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
            },
        },
    },
    [RewardTokenName.wKAVA]: {
        name: 'wKAVA',
        networks: {
            //
            // Mainnet
            [EndpointId.KAVA_V2_MAINNET]: {
                address: '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b',
            },
        },
    },
    [RewardTokenName.AURORA]: {
        name: 'AURORA',
        networks: {
            //
            // Mainnet
            [EndpointId.AURORA_V2_MAINNET]: {
                address: '0x8BEc47865aDe3B172A928df8f990Bc7f2A3b9f79',
            },
        },
    },
}

export const NETWORKS: NetworksConfig = {
    //
    // MAINNET
    //
    [EndpointId.ARBITRUM_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ARBITRUM_V2_MAINNET], DVNS.STG[EndpointId.ARBITRUM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ARBITRUM_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ARBITRUM_V2_MAINNET], DVNS.STG[EndpointId.ARBITRUM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ARBITRUM_V2_MAINNET],
            nativeDropAmount: parseEther('0.00001').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x9CD50907aeb5D16F29Bddf7e1aBb10018Ee8717d',
            safeUrl: 'https://safe-transaction-arbitrum.safe.global/',
        },
    },
    [EndpointId.AURORA_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.AURORA_V2_MAINNET], DVNS.STG[EndpointId.AURORA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.AURORA_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.AURORA_V2_MAINNET], DVNS.STG[EndpointId.AURORA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.AURORA_V2_MAINNET],
            nativeDropAmount: parseEther('0.00005').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x5D3917b47E963eC703eD66Da6637C701365fF500',
            safeUrl: 'https://safe-transaction-aurora.safe.global/',
        },
    },
    [EndpointId.AVALANCHE_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.AVALANCHE_V2_MAINNET], DVNS.STG[EndpointId.AVALANCHE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.AVALANCHE_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.AVALANCHE_V2_MAINNET], DVNS.STG[EndpointId.AVALANCHE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.AVALANCHE_V2_MAINNET],
            nativeDropAmount: parseEther('0.018').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x2B065946d41ADf43BBc3BaF8118ae94Ed19D7A40',
            safeUrl: 'https://safe-transaction-avalanche.safe.global/',
        },
    },
    [EndpointId.BASE_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.BASE_V2_MAINNET], DVNS.STG[EndpointId.BASE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.BASE_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.BASE_V2_MAINNET], DVNS.STG[EndpointId.BASE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.BASE_V2_MAINNET],
            nativeDropAmount: parseEther('0.00005').toBigInt(),
            busGasLimit: 50000n,
            busRideGasLimit: 43000n,
        },
        safeConfig: {
            safeAddress: '0x81EAb64E630C4a2E3E849268A6B64cb76D1C8109',
            safeUrl: 'https://safe-transaction-base.safe.global/',
        },
    },
    [EndpointId.BSC_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.BSC_V2_MAINNET], DVNS.STG[EndpointId.BSC_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.BSC_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.BSC_V2_MAINNET], DVNS.STG[EndpointId.BSC_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.BSC_V2_MAINNET],
            nativeDropAmount: parseEther('0.0012').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x6e690075eedBC52244Dd4822D9F7887d4f27442F',
            safeUrl: 'https://safe-transaction-bsc.safe.global/',
        },
    },
    [EndpointId.EBI_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.EBI_V2_MAINNET], DVNS.STG[EndpointId.EBI_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.EBI_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.EBI_V2_MAINNET], DVNS.STG[EndpointId.EBI_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.EBI_V2_MAINNET],
            nativeDropAmount: parseEther('0.00003').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xb93Aa694A3De8662E1ca9aD0C811440E48cDFe5E',
            safeUrl: 'https://ebi-tx.lzdevnet.org/',
            contractNetworks: {
                [98881]: {
                    multiSendAddress: '0x00B3FA8E2020e93Cc092508C61DcCa70425635E3',
                    multiSendCallOnlyAddress: '0xddE16aA6EA27d17c83D43C8f62f828427Ae9848d',
                    safeMasterCopyAddress: '0xA042C3543E6b546a34ECe6411cD3E3093e7551ec',
                    safeProxyFactoryAddress: '0x3Dc5fA91e051BB23051Fd424125bc90f24A7DFB9',
                    fallbackHandlerAddress: '0x075bB7db8EbE09E507295A9Be57da19DEA01aa3B',
                    createCallAddress: '0x5BF7D6509be83C1e0AA5b9C0bCaF81d626204848',
                    signMessageLibAddress: '0x9DE94C4F9AB1E1157d3637E04bD96fb8A8143401',
                    simulateTxAccessorAddress: '0xa60175Fe4Ea218afE3C5dD23203a0fe82BDB6638',
                },
            },
        },
    },
    [EndpointId.ETHEREUM_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ETHEREUM_V2_MAINNET], DVNS.STG[EndpointId.ETHEREUM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ETHEREUM_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ETHEREUM_V2_MAINNET], DVNS.STG[EndpointId.ETHEREUM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ETHEREUM_V2_MAINNET],
            nativeDropAmount: parseEther('0.0042').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x65bb797c2B9830d891D87288F029ed8dACc19705',
            safeUrl: 'https://safe-transaction-mainnet.safe.global/',
        },
    },
    [EndpointId.IOTA_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.IOTA_V2_MAINNET], DVNS.STG[EndpointId.IOTA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.IOTA_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.IOTA_V2_MAINNET], DVNS.STG[EndpointId.IOTA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.IOTA_V2_MAINNET],
            nativeDropAmount: parseEther('0.0042').toBigInt(),
        },
        safeConfig: {
            // FIXME
            safeAddress: '0xwat',
            safeUrl: 'https://iota-tx.lzdevnet.org/',
            contractNetworks: {
                [8822]: {
                    multiSendAddress: '0x9946dea53F93F17A974630F35D533b83C79417a0',
                    multiSendCallOnlyAddress: '0xb67aE1Ee4dd72a84D9Db534f9279c5984E7E4a9E',
                    safeMasterCopyAddress: '0x59c04Ecf0e4EBcaDa027b7B03E46339B1C7575C2',
                    safeProxyFactoryAddress: '0xF9073883A11fFEC9627D227F936ebb2E79b5864F',
                    fallbackHandlerAddress: '0x3F694eC171E2000C7A9993aF67Fd10325D30cD7F',
                    createCallAddress: '0x04f9dcEcf954D0bBD16108a828Df34C010144acD',
                    signMessageLibAddress: '0xD334818e16AbF71EF5fd5F7E3A1Bef78DF21B596',
                    simulateTxAccessorAddress: '0x623bB01e9AA264D82AD9E9869ACeACff7038F83E',
                },
            },
        },
    },
    [EndpointId.KAVA_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.KAVA_V2_MAINNET], DVNS.STG[EndpointId.KAVA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.KAVA_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.KAVA_V2_MAINNET], DVNS.STG[EndpointId.KAVA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.KAVA_V2_MAINNET],
            nativeDropAmount: parseEther('0.001').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x424aCEFcd5E9fE8329e3530a214C5e88375b542f',
            safeUrl: 'https://kava-tx.lzdevnet.org/',
        },
    },
    [EndpointId.KLAYTN_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.KLAYTN_V2_MAINNET], DVNS.STG[EndpointId.KLAYTN_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.KLAYTN_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.KLAYTN_V2_MAINNET], DVNS.STG[EndpointId.KLAYTN_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.KLAYTN_V2_MAINNET],
            nativeDropAmount: parseEther('0.043').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x9e3c3BBC88DA6123BA09a660766260bB4c35b470',
            safeUrl: 'https://klaytn-tx.lzdevnet.org/',
        },
    },
    [EndpointId.MANTLE_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.MANTLE_V2_MAINNET], DVNS.STG[EndpointId.MANTLE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.MANTLE_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.MANTLE_V2_MAINNET], DVNS.STG[EndpointId.MANTLE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.MANTLE_V2_MAINNET],
            nativeDropAmount: parseEther('0.2').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x44acb81da0D81573Feb9d794422Be91914eDcD3d',
            safeUrl: 'https://mantle-tx.lzdevnet.org/',
        },
    },
    [EndpointId.METIS_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.METIS_V2_MAINNET], DVNS.STG[EndpointId.METIS_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.METIS_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.METIS_V2_MAINNET], DVNS.STG[EndpointId.METIS_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.METIS_V2_MAINNET],
            nativeDropAmount: parseEther('0.00813').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x90c3DFD4Ea593336DBB9F925f73413e6EE84c90E',
            safeUrl: 'https://metis-tx.lzdevnet.org/',
        },
    },
    [EndpointId.OPTIMISM_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.OPTIMISM_V2_MAINNET], DVNS.STG[EndpointId.OPTIMISM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.OPTIMISM_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.OPTIMISM_V2_MAINNET], DVNS.STG[EndpointId.OPTIMISM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.OPTIMISM_V2_MAINNET],
            nativeDropAmount: parseEther('0.00003').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x392AC17A9028515a3bFA6CCe51F8b70306C6bd43',
            safeUrl: 'https://safe-transaction-optimism.safe.global/',
        },
    },
    [EndpointId.POLYGON_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.POLYGON_V2_MAINNET], DVNS.STG[EndpointId.POLYGON_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.POLYGON_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.POLYGON_V2_MAINNET], DVNS.STG[EndpointId.POLYGON_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.POLYGON_V2_MAINNET],
            nativeDropAmount: parseEther('0.0324').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x47290DE56E71DC6f46C26e50776fe86cc8b21656',
            safeUrl: 'https://safe-transaction-polygon.safe.global/',
        },
    },
    [EndpointId.RARIBLE_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.RARIBLE_V2_MAINNET], DVNS.STG[EndpointId.RARIBLE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.RARIBLE_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.RARIBLE_V2_MAINNET], DVNS.STG[EndpointId.RARIBLE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.RARIBLE_V2_MAINNET],
            nativeDropAmount: parseEther('0.00015').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x0bB70602d48E1A681B6aCBC788712751A3f0b59d',
            safeUrl: 'https://rarible-tx.lzdevnet.org/',
            contractNetworks: {
                [1380012617]: {
                    multiSendAddress: '0xA5B0D16C5B126c58Fe0beD60dDA67Ffce37ad897',
                    multiSendCallOnlyAddress: '0xa1C6169264FC1157D919DAaA7367082334d8252E',
                    safeMasterCopyAddress: '0xd2C579a0f0Da63f55D52c3E74e256cae8C4373d8',
                    safeProxyFactoryAddress: '0x575758E1aBB97d4473709C56330433fa64BdcF00',
                    fallbackHandlerAddress: '0x58Da6D1445A907e7aF8c7b2ccf5c89EBD56495C5',
                    signMessageLibAddress: '0xE86ec9806064596DC023B6f9f560e33Ad7372eb8',
                    createCallAddress: '0x576FDeBAdfB09036Dcb3B3a4B34482A13b5a4407',
                    simulateTxAccessorAddress: '0xf96B7814BA740fd56511dc698257c41d52683517',
                },
            },
        },
    },
    [EndpointId.SCROLL_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SCROLL_V2_MAINNET], DVNS.STG[EndpointId.SCROLL_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SCROLL_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SCROLL_V2_MAINNET], DVNS.STG[EndpointId.SCROLL_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SCROLL_V2_MAINNET],
            nativeDropAmount: parseEther('0.00035').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xC02c4Ac2DBaA4eC11C306dDb0ABab5b421bd19fB',
            safeUrl: 'https://scroll-tx.lzdevnet.org/',
        },
    },
    [EndpointId.SEI_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SEI_V2_MAINNET], DVNS.STG[EndpointId.SEI_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SEI_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SEI_V2_MAINNET], DVNS.STG[EndpointId.SEI_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SEI_V2_MAINNET],
            nativeDropAmount: parseEther('0.0042').toBigInt(),
        },
        safeConfig: {
            // FIXME
            safeAddress: '0xwat',
            safeUrl: 'https://sei-tx.lzdevnet.org',
            contractNetworks: {
                [1329]: {
                    multiSendAddress: '0x84CDeb280870b531660087f347B2001775C9Ee0F',
                    multiSendCallOnlyAddress: '0xcE521F12AB380D9a5526410A66932F28f73Cc19B',
                    safeMasterCopyAddress: '0x1924A4c1C8C9e683E29f62737CfDFB933df1bE73',
                    safeProxyFactoryAddress: '0xedB7D71C889E00CDcC3838c72CAE8Fb2C46022c1',
                    fallbackHandlerAddress: '0x68cf966a4a97aD9604e314734260f82D3A9Be44D',
                    createCallAddress: '0x031473e1F6856C51a19789f3949caD2b9EA07780',
                    signMessageLibAddress: '0x4807FE023579a061D5fe7e863f953b62884dF1E1',
                    simulateTxAccessorAddress: '0x814E15f3F7D2a3A2a3f0304166D114cb21750756',
                },
            },
        },
    },
    [EndpointId.TAIKO_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.TAIKO_V2_MAINNET], DVNS.STG[EndpointId.TAIKO_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.TAIKO_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SEI_V2_MAINNET], DVNS.STG[EndpointId.TAIKO_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.TAIKO_V2_MAINNET],
            nativeDropAmount: parseEther('0.0042').toBigInt(),
        },
        safeConfig: {
            // FIXME
            safeAddress: '0xwat',
            safeUrl: 'https://taiko-tx.lzdevnet.org',
            contractNetworks: {
                [167000]: {
                    multiSendAddress: '0xA4FB0BAD56ed9741c9BA22065074660477C956e3',
                    multiSendCallOnlyAddress: '0x407ebA862aDdE622e6dFabC88e3E088adE8C4AeA',
                    safeMasterCopyAddress: '0x2337b4a88363D4834E68A019037868E0FF8E39Be',
                    safeProxyFactoryAddress: '0x8B0D2816befb572FD4569Dc33FEe4A4b71dCE70A',
                    fallbackHandlerAddress: '0x01af5e216Ec50e380f10E7cE604AD14b1d618961',
                    createCallAddress: '0xBF070E3aE1a137f3024b57DD81fc74C9DC99773F',
                    signMessageLibAddress: '0x3E0D5EEF8D229bE5D18368AC0a2c7C1a33eE3CDa',
                    simulateTxAccessorAddress: '0x355aF9BC540bec4586f5D7587b5a6EfD0296A540',
                },
            },
        },
    },
    [EndpointId.ZKCONSENSYS_V2_MAINNET]: {
        queueCapacity: 512,
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [
                DVNS.NETHERMIND[EndpointId.ZKCONSENSYS_V2_MAINNET],
                DVNS.STG[EndpointId.ZKCONSENSYS_V2_MAINNET],
            ],
            executor: EXECUTORS.LZ_LABS[EndpointId.ZKCONSENSYS_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [
                DVNS.NETHERMIND[EndpointId.ZKCONSENSYS_V2_MAINNET],
                DVNS.STG[EndpointId.ZKCONSENSYS_V2_MAINNET],
            ],
            executor: EXECUTORS.LZ_LABS[EndpointId.ZKCONSENSYS_V2_MAINNET],
            nativeDropAmount: parseEther('0.00005').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xdBd9E7f55C3a7A0F17cCAc06dD4f4cbf06f7AD5c',
            safeUrl: 'https://linea-tx.lzdevnet.org/',
        },
    },

    //
    // TESTNET
    //
    [EndpointId.ARBSEP_V2_TESTNET]: {
        queueCapacity: 512,
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.BSC_V2_TESTNET]: {
        queueCapacity: 512,
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.KLAYTN_V2_TESTNET]: {
        queueCapacity: 512,
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.OPTSEP_V2_TESTNET]: {
        queueCapacity: 512,
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.SEPOLIA_V2_TESTNET]: {
        queueCapacity: 512,
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },

    //
    // SANDBOX
    //
    [EndpointId.BSC_V2_SANDBOX]: {
        queueCapacity: 512,
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.ETHEREUM_V2_SANDBOX]: {
        queueCapacity: 512,
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.POLYGON_V2_SANDBOX]: {
        queueCapacity: 512,
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
}
