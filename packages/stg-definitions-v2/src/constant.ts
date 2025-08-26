import { parseEther, parseUnits } from '@ethersproject/units'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import {
    type AssetConfig,
    CreditMessagingNetworkConfig,
    NetworksConfig,
    OftWrapperConfig,
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
        [EndpointId.ABSTRACT_V2_MAINNET]: '0xc4a1f52fda034a9a5e1b3b27d14451d15776fef6',
        [EndpointId.APE_V2_MAINNET]: '0x07653d28b0f53d4c54b70eb1f9025795b23a9d6e',
        [EndpointId.ARBITRUM_V2_MAINNET]: '0xa7b5189bcA84Cd304D8553977c7C614329750d99',
        [EndpointId.AURORA_V2_MAINNET]: '0x34730f2570e6cff8b1c91faabf37d0dd917c4367',
        [EndpointId.AVALANCHE_V2_MAINNET]: '0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5',
        [EndpointId.BASE_V2_MAINNET]: '0xcd37CA043f8479064e10635020c65FfC005d36f6',
        [EndpointId.BERA_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.BOTANIX_V2_MAINNET]: '0xa4281c1c88f0278ff696edeb517052153190fc9e',
        [EndpointId.BSC_V2_MAINNET]: '0x31F748a368a893Bdb5aBB67ec95F232507601A73',
        [EndpointId.CODEX_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.COREDAO_V2_MAINNET]: '0x7fe673201724925b5c477d4e1a4bd3e954688cf5',
        [EndpointId.CRONOSEVM_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.CRONOSZKEVM_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.DEGEN_V2_MAINNET]: '0x8d77d35604a9f37f488e41d1d916b2a0088f82dd',
        [EndpointId.EBI_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.EDU_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.ETHEREUM_V2_MAINNET]: '0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5',
        [EndpointId.FLARE_V2_MAINNET]: '0x9bcd17a654bffaa6f8fea38d19661a7210e22196',
        [EndpointId.FLOW_V2_MAINNET]: '0x3c61aad6d402d867c653f603558f4b8f91abe952',
        [EndpointId.FUSE_V2_MAINNET]: '0x809cde2afcf8627312e87a6a7bbffab3f8f347c7',
        [EndpointId.GLUE_V2_MAINNET]: '0xaa3099f91912e07976c2dd1598dc740d81bd3fea',
        [EndpointId.GNOSIS_V2_MAINNET]: '0x7fe673201724925b5c477d4e1a4bd3e954688cf5',
        [EndpointId.GOAT_V2_MAINNET]: '0xe6cd8c2e46ef396df88048449e5b1c75172b40c3',
        [EndpointId.GRAVITY_V2_MAINNET]: '0x4b92bc2a7d681bf5230472c80d92acfe9a6b9435',
        [EndpointId.HEDERA_V2_MAINNET]: '0xecc3dc1cc45b1934ce713f8fb0d3d3852c01a5c1',
        [EndpointId.HEMI_V2_MAINNET]: '0x07c05eab7716acb6f83ebf6268f8eecda8892ba1',
        [EndpointId.INK_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.IOTA_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.ISLANDER_V2_MAINNET]: '0x70bf42c69173d6e33b834f59630dac592c70b369',
        [EndpointId.KAVA_V2_MAINNET]: '0x6a4C9096F162f0ab3C0517B0a40dc1CE44785e16',
        [EndpointId.KLAYTN_V2_MAINNET]: '0x6a4C9096F162f0ab3C0517B0a40dc1CE44785e16',
        [EndpointId.LIGHTLINK_V2_MAINNET]: '0x18f76f0d8ccd176bbe59b3870fa486d1fff87026',
        [EndpointId.MANTA_V2_MAINNET]: '0x247624e2143504730aec22912ed41f092498bef2',
        [EndpointId.MANTLE_V2_MAINNET]: '0xB19A9370D404308040A9760678c8Ca28aFfbbb76',
        [EndpointId.METIS_V2_MAINNET]: '0x6ABdb569Dc985504cCcB541ADE8445E5266e7388',
        [EndpointId.NIBIRU_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0xa7b5189bcA84Cd304D8553977c7C614329750d99',
        [EndpointId.ORDERLY_V2_MAINNET]: '0x6a4c9096f162f0ab3c0517b0a40dc1ce44785e16',
        [EndpointId.PEAQ_V2_MAINNET]: '0x725fafe20b74ff6f88daea0c506190a8f1037635',
        [EndpointId.PLUME_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.PLUMEPHOENIX_V2_MAINNET]: '0x882a1ee8891c7d22310dedf032ef9653785532b8',
        [EndpointId.POLYGON_V2_MAINNET]: '0x31F748a368a893Bdb5aBB67ec95F232507601A73',
        [EndpointId.RARIBLE_V2_MAINNET]: '0xb53648ca1aa054a80159c1175c03679fdc76bf88',
        [EndpointId.ROOTSTOCK_V2_MAINNET]: '0x05aaefdf9db6e0f7d27fa3b6ee099edb33da029e',
        [EndpointId.SCROLL_V2_MAINNET]: '0x446755349101cB20c582C224462c3912d3584dCE',
        [EndpointId.SEI_V2_MAINNET]: '0xd24972c11f91c1bb9eaee97ec96bb9c33cf7af24',
        [EndpointId.SOPHON_V2_MAINNET]: '0xa1a31d9ddf919e87a23a1416b0aa0b600d32435d',
        [EndpointId.SOMNIA_V2_MAINNET]: '0x5fa12ebc08e183c1f5d44678cf897edefe68738b',
        [EndpointId.SONEIUM_V2_MAINNET]: '0x5cc4e4d2cdf15795dc5ea383b8768ec91a587719',
        [EndpointId.SONIC_V2_MAINNET]: '0x05aaefdf9db6e0f7d27fa3b6ee099edb33da029e',
        [EndpointId.STORY_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.SUPERPOSITION_V2_MAINNET]: '0x07c05eab7716acb6f83ebf6268f8eecda8892ba1',
        [EndpointId.SWELL_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.TAIKO_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.TELOS_V2_MAINNET]: '0x809cde2afcf8627312e87a6a7bbffab3f8f347c7',
        [EndpointId.UNICHAIN_V2_MAINNET]: '0x25e0e650a78e6304a3983fc4b7ffc6544b1beea6',
        [EndpointId.XCHAIN_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.XDC_V2_MAINNET]: '0x1294e3347ec64fd63e1d0594dc1294247cd237c7',
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: '0xDd7B5E1dB4AaFd5C8EC3b764eFB8ed265Aa5445B',
        // [EndpointId.ZKSYNC_V2_MAINNET]: '0xb183c2b91cf76cAd13602b32ADa2Fd273f19009C',
    } satisfies Partial<Record<EndpointId, string>>,
    LZ_LABS: {
        [EndpointId.ARBITRUM_V2_MAINNET]: '0x2f55C492897526677C5B68fb199ea31E2c126416',
        [EndpointId.AURORA_V2_MAINNET]: '0xD4a903930f2c9085586cda0b11D9681EECb20D2f',
        [EndpointId.AVALANCHE_V2_MAINNET]: '0x962F502A63F5FBeB44DC9ab932122648E8352959',
        [EndpointId.BASE_V2_MAINNET]: '0x9e059a54699a285714207b43B055483E78FAac25',
        [EndpointId.BSC_V2_MAINNET]: '0xfD6865c841c2d64565562fCc7e05e619A30615f0',
        [EndpointId.EBI_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
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
        [EndpointId.ABSTRACT_V2_MAINNET]: '0xcec9f0a49073ac4a1c439d06cb9448512389a64e',
        [EndpointId.APE_V2_MAINNET]: '0x794c0b0071d4a926c443468f027912e693678151',
        [EndpointId.ARBITRUM_V2_MAINNET]: '0x5756a74e8e18d8392605ba667171962b2b2826b5',
        [EndpointId.AURORA_V2_MAINNET]: '0xe11c808bc6099abc9be566c9017aa2ab0f131d35',
        [EndpointId.AVALANCHE_V2_MAINNET]: '0x252b234545e154543ad2784c7111eb90406be836',
        [EndpointId.BASE_V2_MAINNET]: '0xcdf31d62140204c08853b547e64707110fbc6680',
        [EndpointId.BERA_V2_MAINNET]: '0x6e70fcdc42d3d63748b7d8883399dcb16bbb5c8c',
        [EndpointId.BOTANIX_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.BSC_V2_MAINNET]: '0xac8de74ce0a44a5e73bbc709fe800406f58431e0',
        [EndpointId.CODEX_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.COREDAO_V2_MAINNET]: '0xe6cd8c2e46ef396df88048449e5b1c75172b40c3',
        [EndpointId.CRONOSEVM_V2_MAINNET]: '0x2ae36a544b904f2f2960f6fd1a6084b4b11ba334',
        [EndpointId.CRONOSZKEVM_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.DEGEN_V2_MAINNET]: '0x80442151791bbdd89117719e508115ebc1ce2d93',
        [EndpointId.EBI_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.EDU_V2_MAINNET]: '0x97f930a15172f38b7e947778889424e37b5df316',
        [EndpointId.ETHEREUM_V2_MAINNET]: '0x8fafae7dd957044088b3d0f67359c327c6200d18',
        [EndpointId.FLARE_V2_MAINNET]: '0x8d77d35604a9f37f488e41d1d916b2a0088f82dd',
        [EndpointId.FLOW_V2_MAINNET]: '0xd1c70192cc0eb9a89e3d9032b9facab259a0a1e9',
        [EndpointId.FUSE_V2_MAINNET]: '0x9f45834f0c8042e36935781b944443e906886a87',
        [EndpointId.GLUE_V2_MAINNET]: '0xd1c70192cc0eb9a89e3d9032b9facab259a0a1e9',
        [EndpointId.GNOSIS_V2_MAINNET]: '0xfcea5cef8b1ae3a454577c9444cdd95c1284b0cf',
        [EndpointId.GOAT_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.GRAVITY_V2_MAINNET]: '0x70bf42c69173d6e33b834f59630dac592c70b369',
        [EndpointId.HEDERA_V2_MAINNET]: '0x178d9517fc35633afda67b8c236e568997a3ae03',
        [EndpointId.HEMI_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.INK_V2_MAINNET]: '0xe900e073badafdc6f72541f34e6b701bde835487',
        [EndpointId.IOTA_V2_MAINNET]: '0xf18a7d86917653725afb7c215e47a24f9d784718',
        [EndpointId.ISLANDER_V2_MAINNET]: '0x9eeee79f5dbc4d99354b5cb547c138af432f937b',
        [EndpointId.KAVA_V2_MAINNET]: '0x9cbaf815ed62ef45c59e9f2cb05106babb4d31d3',
        [EndpointId.KLAYTN_V2_MAINNET]: '0x17720e3f361dcc2f70871a2ce3ac51b0eaa5c2e4',
        [EndpointId.LIGHTLINK_V2_MAINNET]: '0x0e95cf21ad9376a26997c97f326c5a0a267bb8ff',
        [EndpointId.MANTA_V2_MAINNET]: '0xca848bcb059e33adb260d793ee360924b6aa8e86',
        [EndpointId.MANTLE_V2_MAINNET]: '0xfe809470016196573d64a8d17a745bebea4ecc41',
        [EndpointId.METIS_V2_MAINNET]: '0x61a1b61a1087be03abedc04900cfcc1c14187237',
        [EndpointId.NIBIRU_V2_MAINNET]: '0x06d99ffd7c09ea72e962a06b6e311e513d7c3d20',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0xfe6507f094155cabb4784403cd784c2df04122dd',
        [EndpointId.ORDERLY_V2_MAINNET]: '0xd074b6bbcbec2f2b4c4265de3d95e521f82bf669',
        [EndpointId.PEAQ_V2_MAINNET]: '0x18f76f0d8ccd176bbe59b3870fa486d1fff87026',
        [EndpointId.PLUME_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.PLUMEPHOENIX_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.POLYGON_V2_MAINNET]: '0xc79f0b1bcb7cdae9f9ba547dcfc57cbfcd2993a5',
        [EndpointId.RARIBLE_V2_MAINNET]: '0x2fa870cee4da57de84d1db36759d4716ad7e5038',
        [EndpointId.ROOTSTOCK_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.SCROLL_V2_MAINNET]: '0xb87591d8b0b93fae8b631a073577c40e8dd46a62',
        [EndpointId.SEI_V2_MAINNET]: '0xbd00c87850416db0995ef8030b104f875e1bdd15',
        [EndpointId.SOPHON_V2_MAINNET]: '0x7cc1a4a700aab8fba8160a4e09b04a9a68c6d914',
        [EndpointId.SOMNIA_V2_MAINNET]: '0xa83a87a0bdce466edfbb6794404e1d7f556b8f20',
        [EndpointId.SONEIUM_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.SONIC_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.STORY_V2_MAINNET]: '0xa80aa110f05c9c6140018aae0c4e08a70f43350d',
        [EndpointId.SUPERPOSITION_V2_MAINNET]: '0xdd7b5e1db4aafd5c8ec3b764efb8ed265aa5445b',
        [EndpointId.SWELL_V2_MAINNET]: '0x7976b969a8e9560c483229ffbb855e8440898c9d',
        [EndpointId.TAIKO_V2_MAINNET]: '0x37473676ff697f2eba29c8a3105309abf00ba013',
        [EndpointId.TELOS_V2_MAINNET]: '0xa80aa110f05c9c6140018aae0c4e08a70f43350d',
        [EndpointId.UNICHAIN_V2_MAINNET]: '0x9885110b909e88bb94f7f767a68ec2558b2afa73',
        [EndpointId.XCHAIN_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.XDC_V2_MAINNET]: '0x4fe90e0f2a99e464d6e97b161d72101cd03c20fe',
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: '0xef269bbadb81de86e4b3278fa1dae1723545268b',
        // [EndpointId.ZKSYNC_V2_MAINNET]: '0x62aa89bad332788021f6f4f4fb196d5fe59c27a6',
    } satisfies Partial<Record<EndpointId, string>>,
}

export const EXECUTORS = {
    //
    // MAINNET
    //
    LZ_LABS: {
        [EndpointId.ABSTRACT_V2_MAINNET]: '0x643E1471f37c4680Df30cF0C540Cd379a0fF58A5',
        [EndpointId.APE_V2_MAINNET]: '0xcCE466a522984415bC91338c232d98869193D46e',
        [EndpointId.ARBITRUM_V2_MAINNET]: '0x31CAe3B7fB82d847621859fb1585353c5720660D',
        [EndpointId.AURORA_V2_MAINNET]: '0xA2b402FFE8dd7460a8b425644B6B9f50667f0A61',
        [EndpointId.AVALANCHE_V2_MAINNET]: '0x90E595783E43eb89fF07f63d27B8430e6B44bD9c',
        [EndpointId.BASE_V2_MAINNET]: '0x2CCA08ae69E0C44b18a57Ab2A87644234dAebaE4',
        [EndpointId.BERA_V2_MAINNET]: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
        [EndpointId.BOTANIX_V2_MAINNET]: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
        [EndpointId.BSC_V2_MAINNET]: '0x3ebD570ed38B1b3b4BC886999fcF507e9D584859',
        [EndpointId.CODEX_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.COREDAO_V2_MAINNET]: '0x1785c94d31E3E3Ab1079e7ca8a9fbDf33EEf9dd5',
        [EndpointId.CRONOSEVM_V2_MAINNET]: '0x4b80F7d25c451D204b1C93D9bdf2aB3B04f3EA4a',
        [EndpointId.CRONOSZKEVM_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.DEGEN_V2_MAINNET]: '0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f',
        [EndpointId.EBI_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.EDU_V2_MAINNET]: '0x41Bdb4aa4A63a5b2Efc531858d3118392B1A1C3d',
        [EndpointId.ETHEREUM_V2_MAINNET]: '0x173272739Bd7Aa6e4e214714048a9fE699453059',
        [EndpointId.FLARE_V2_MAINNET]: '0xcCE466a522984415bC91338c232d98869193D46e',
        [EndpointId.FLOW_V2_MAINNET]: '0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e',
        [EndpointId.FUSE_V2_MAINNET]: '0xc905E74BEb8229E258c3C6E5bC0D6Cc54C534688',
        [EndpointId.GLUE_V2_MAINNET]: '0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e',
        [EndpointId.GNOSIS_V2_MAINNET]: '0x38340337f9ADF5D76029Ab3A667d34E5a032F7BA',
        [EndpointId.GOAT_V2_MAINNET]: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
        [EndpointId.GRAVITY_V2_MAINNET]: '0xcCE466a522984415bC91338c232d98869193D46e',
        [EndpointId.HEDERA_V2_MAINNET]: '0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e',
        [EndpointId.HEMI_V2_MAINNET]: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
        [EndpointId.INK_V2_MAINNET]: '0xFEbCF17b11376C724AB5a5229803C6e838b6eAe5',
        [EndpointId.IOTA_V2_MAINNET]: '0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f',
        [EndpointId.ISLANDER_V2_MAINNET]: '0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e',
        [EndpointId.KAVA_V2_MAINNET]: '0x41ED8065dd9bC6c0caF21c39766eDCBA0F21851c',
        [EndpointId.KLAYTN_V2_MAINNET]: '0xe149187a987F129FD3d397ED04a60b0b89D1669f',
        [EndpointId.LIGHTLINK_V2_MAINNET]: '0xcCE466a522984415bC91338c232d98869193D46e',
        [EndpointId.MANTA_V2_MAINNET]: '0x8DD9197E51dC6082853aD71D35912C53339777A7',
        [EndpointId.MANTLE_V2_MAINNET]: '0x4Fc3f4A38Acd6E4cC0ccBc04B3Dd1CCAeFd7F3Cd',
        [EndpointId.METIS_V2_MAINNET]: '0xE6AB3B3E632f3C65c3cb4c250DcC42f5E915A1cf',
        [EndpointId.NIBIRU_V2_MAINNET]: '0x6A02D83e8d433304bba74EF1c427913958187142',
        [EndpointId.OPTIMISM_V2_MAINNET]: '0x2D2ea0697bdbede3F01553D2Ae4B8d0c486B666e',
        [EndpointId.ORDERLY_V2_MAINNET]: '0x1aCe9DD1BC743aD036eF2D92Af42Ca70A1159df5',
        [EndpointId.PEAQ_V2_MAINNET]: '0xcCE466a522984415bC91338c232d98869193D46e',
        [EndpointId.PLUME_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.PLUMEPHOENIX_V2_MAINNET]: '0x41Bdb4aa4A63a5b2Efc531858d3118392B1A1C3d',
        [EndpointId.POLYGON_V2_MAINNET]: '0xCd3F213AD101472e1713C72B1697E727C803885b',
        [EndpointId.RARIBLE_V2_MAINNET]: '0x1E4CAc6c2c955cAED779ef24d5B8C5EE90b1f914',
        [EndpointId.ROOTSTOCK_V2_MAINNET]: '0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e',
        [EndpointId.SCROLL_V2_MAINNET]: '0x581b26F362AD383f7B51eF8A165Efa13DDe398a4',
        [EndpointId.SEI_V2_MAINNET]: '0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f',
        [EndpointId.SOPHON_V2_MAINNET]: '0x553313dB58dEeFa3D55B1457D27EAB3Fe5EC87E8',
        [EndpointId.SOMNIA_V2_MAINNET]: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
        [EndpointId.SONEIUM_V2_MAINNET]: '0xAE3C661292bb4D0AEEe0588b4404778DF1799EE6',
        [EndpointId.SONIC_V2_MAINNET]: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
        [EndpointId.STORY_V2_MAINNET]: '0x41Bdb4aa4A63a5b2Efc531858d3118392B1A1C3d',
        [EndpointId.SUPERPOSITION_V2_MAINNET]: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
        [EndpointId.SWELL_V2_MAINNET]: '0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e',
        [EndpointId.TAIKO_V2_MAINNET]: '0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e',
        [EndpointId.TELOS_V2_MAINNET]: '0x1785c94d31E3E3Ab1079e7ca8a9fbDf33EEf9dd5',
        [EndpointId.UNICHAIN_V2_MAINNET]: '0x4208D6E27538189bB48E603D6123A94b8Abe0A0b',
        [EndpointId.XCHAIN_V2_MAINNET]: '0x0000000000000000000000000000000000000000',
        [EndpointId.XDC_V2_MAINNET]: '0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e',
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: '0x0408804C5dcD9796F22558464E6fE5bDdF16A7c7',
        // [EndpointId.ZKSYNC_V2_MAINNET]: '0x664e390e672A811c12091db8426cBb7d68D5D8A6',
    } satisfies Partial<Record<EndpointId, string>>,
}

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
    busRideGasLimit: 60000n,
    nativeDropGasLimit: 25000n,
    maxPassengerCount: 20,
    queueCapacity: 512,
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
            [EndpointId.ABSTRACT_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.APE_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.ARBITRUM_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.BASE_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.BERA_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.BOTANIX_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.CRONOSEVM_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.DEGEN_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.FLARE_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.FLOW_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.FUSE_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.GLUE_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.GNOSIS_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Pool,
                address: '0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1',
            },
            [EndpointId.GOAT_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.GRAVITY_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.HEDERA_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.HEMI_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.IOTA_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.ISLANDER_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.KLAYTN_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.LIGHTLINK_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.MANTA_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Pool,
                address: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
            },
            [EndpointId.METIS_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Pool,
                address: '0x420000000000000000000000000000000000000a',
            },
            [EndpointId.NIBIRU_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.PEAQ_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.PLUMEPHOENIX_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.ROOTSTOCK_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.SCROLL_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.SEI_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.SOPHON_V2_MAINNET]: {
                symbol: 'ETH',
                name: 'Ether',
                type: StargateType.Pool,
                address: '0x72af9F169B619D85A47Dfa8fefbCD39dE55c567D',
            },
            [EndpointId.SOMNIA_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.SONEIUM_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.STORY_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.SWELL_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.TELOS_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.UNICHAIN_V2_MAINNET]: {
                type: StargateType.Native,
            },
            [EndpointId.XDC_V2_MAINNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.ZKCONSENSYS_V2_MAINNET]: {
                type: StargateType.Native,
            },

            //
            // TESTNET
            //
            [EndpointId.ARBSEP_V2_TESTNET]: {
                type: StargateType.Native,
            },
            [EndpointId.KLAYTN_V2_TESTNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Oft,
            },
            [EndpointId.MANTLESEP_V2_TESTNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Pool,
                address: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
            },
            [EndpointId.MONAD_V2_TESTNET]: {
                symbol: 'WETH',
                name: 'WETH',
                type: StargateType.Pool,
                address: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
            },
            [EndpointId.OPTSEP_V2_TESTNET]: {
                type: StargateType.Native,
            },
            [EndpointId.SEPOLIA_V2_TESTNET]: {
                type: StargateType.Native,
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

            /*
                EXAMPLE:
                    [EndpointId.ABC_V2_MAINNET]: {
                        type: StargateType.Oft,
                        address: '0xABC123',
                    },
             */

            [EndpointId.ABSTRACT_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x0709f39376deee2a2dfc94a58edeb2eb9df012bd',
            },
            [EndpointId.APE_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8',
            },
            [EndpointId.ARBITRUM_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
            },
            [EndpointId.AVALANCHE_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            },
            [EndpointId.BSC_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x55d398326f99059fF775485246999027B3197955',
            },
            [EndpointId.COREDAO_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x900101d06a7426441ae63e9ab3b9b0f63be145f1',
            },
            [EndpointId.DEGEN_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8',
            },
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            },
            [EndpointId.FLARE_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.FLOW_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8',
            },
            [EndpointId.FUSE_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x3695Dd1D1D43B794C0B13eb8be8419Eb3ac22bf7',
            },
            [EndpointId.GLUE_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xE1AD845D93853fff44990aE0DcecD8575293681e',
            },
            [EndpointId.GOAT_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xE1AD845D93853fff44990aE0DcecD8575293681e',
            },
            [EndpointId.GRAVITY_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.HEMI_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e',
            },
            [EndpointId.IOTA_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.ISLANDER_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x88853D410299BCBfE5fCC9Eef93c03115E908279',
            },
            [EndpointId.KAVA_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x919C1c267BC06a7039e03fcc2eF738525769109c',
            },
            [EndpointId.KLAYTN_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.LIGHTLINK_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
            },
            [EndpointId.METIS_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xbB06DCA3AE6887fAbF931640f67cab3e3a16F4dC',
            },
            [EndpointId.NIBIRU_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x43F2376D5D03553aE72F4A8093bbe9de4336EB08',
            },
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
            },
            [EndpointId.PEAQ_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xf4D9235269a96aaDaFc9aDAe454a0618eBE37949',
            },
            [EndpointId.POLYGON_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            },
            [EndpointId.PLUMEPHOENIX_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xda6087E69C51E7D31b6DBAD276a3c44703DFdCAd',
            },
            [EndpointId.RARIBLE_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.ROOTSTOCK_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xaf368c91793cb22739386dfcbbb2f1a9e4bcbebf',
            },
            [EndpointId.SEI_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0xB75D0B03c06A926e488e2659DF1A861F860bD3d1',
            },
            [EndpointId.SOMNIA_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x67B302E35Aef5EEE8c32D934F5856869EF428330',
            },
            [EndpointId.STORY_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8',
            },
            [EndpointId.TAIKO_V2_MAINNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.TELOS_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x674843C06FF83502ddb4D37c2E09C01cdA38cbc8',
            },

            [EndpointId.XDC_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xcdA5b77E2E2268D9E09c874c1b9A4c3F07b37555',
            },

            //
            // TESTNET
            //
            [EndpointId.ARBSEP_V2_TESTNET]: {
                type: StargateType.Pool,
            },
            [EndpointId.BSC_V2_TESTNET]: {
                address: '0xe37Bdc6F09DAB6ce6E4eBC4d2E72792994Ef3765',
                type: StargateType.Pool,
            },
            [EndpointId.AVALANCHE_V2_TESTNET]: {
                type: StargateType.Pool,
            },
            [EndpointId.KLAYTN_V2_TESTNET]: {
                type: StargateType.Oft,
            },
            [EndpointId.MANTLESEP_V2_TESTNET]: {
                address: '0xcC4Ac915857532ADa58D69493554C6d869932Fe6',
                type: StargateType.Pool,
            },
            [EndpointId.MONAD_V2_TESTNET]: {
                address: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
                type: StargateType.Pool,
            },
            [EndpointId.OPTSEP_V2_TESTNET]: {
                type: StargateType.Pool,
            },
            [EndpointId.SEPOLIA_V2_TESTNET]: {
                type: StargateType.Pool,
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
            [EndpointId.ABSTRACT_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1',
            },
            [EndpointId.APE_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
            },
            [EndpointId.ARBITRUM_V2_MAINNET]: {
                address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                type: StargateType.Pool,
            },
            [EndpointId.AURORA_V2_MAINNET]: {
                address: '0x368ebb46aca6b8d0787c96b2b20bd3cc3f2c45f7',
                type: StargateType.Pool,
            },
            [EndpointId.AVALANCHE_V2_MAINNET]: {
                address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
                type: StargateType.Pool,
            },
            [EndpointId.BASE_V2_MAINNET]: {
                address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                type: StargateType.Pool,
            },
            [EndpointId.BERA_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x549943e04f40284185054145c6E4e9568C1D3241',
            },
            [EndpointId.BOTANIX_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x29ee6138dd4c9815f46d34a4a1ed48f46758a402',
            },
            [EndpointId.BSC_V2_MAINNET]: {
                address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
                type: StargateType.Pool,
            },
            [EndpointId.COREDAO_V2_MAINNET]: {
                address: '0xa4151b2b3e269645181dccf2d426ce75fcbdeca9',
                type: StargateType.Pool,
            },
            [EndpointId.CRONOSEVM_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C',
            },
            [EndpointId.DEGEN_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
            },
            [EndpointId.EDU_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x12a272A581feE5577A5dFa371afEB4b2F3a8C2F8',
            },
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                type: StargateType.Pool,
            },
            [EndpointId.FLARE_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.FLOW_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
            },
            [EndpointId.FUSE_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xc6Bc407706B7140EE8Eef2f86F9504651b63e7f9',
            },
            [EndpointId.GLUE_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xEe45ed3f6c675F319BB9de62991C1E78B484e0B8',
            },
            [EndpointId.GNOSIS_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x2a22f9c3b484c3629090feed35f17ff8f88f76f0',
            },
            [EndpointId.GOAT_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x3022b87ac063DE95b1570F46f5e470F8B53112D8',
            },
            [EndpointId.GRAVITY_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.HEMI_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA',
            },
            [EndpointId.INK_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
            },
            [EndpointId.IOTA_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.ISLANDER_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
            },
            [EndpointId.KLAYTN_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.LIGHTLINK_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
                type: StargateType.Pool,
            },
            [EndpointId.NIBIRU_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x0829F361A05D993d5CEb035cA6DF3446b060970b',
            },
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
                type: StargateType.Pool,
            },
            [EndpointId.ORDERLY_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xda6087E69C51E7D31b6DBAD276a3c44703DFdCAd',
            },
            [EndpointId.PEAQ_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xbbA60da06c2c5424f03f7434542280FCAd453d10',
            },
            [EndpointId.PLUMEPHOENIX_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x78adD880A697070c1e765Ac44D65323a0DcCE913',
            },
            [EndpointId.POLYGON_V2_MAINNET]: {
                address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
                type: StargateType.Pool,
            },
            [EndpointId.RARIBLE_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.ROOTSTOCK_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x74c9f2b00581f1b11aa7ff05aa9f608b7389de67',
            },
            [EndpointId.SCROLL_V2_MAINNET]: {
                address: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
                type: StargateType.Pool,
                symbol: 'USDC.e',
            },
            [EndpointId.SEI_V2_MAINNET]: {
                address: '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1',
                type: StargateType.Pool,
            },
            [EndpointId.SOPHON_V2_MAINNET]: {
                type: StargateType.Pool,
                address: '0x9Aa0F72392B5784Ad86c6f3E899bCc053D00Db4F',
            },
            [EndpointId.SOMNIA_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x28bec7e30e6faee657a03e19bf1128aad7632a00',
            },
            [EndpointId.SONEIUM_V2_MAINNET]: {
                address: '0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369',
                type: StargateType.Pool,
            },
            [EndpointId.SONIC_V2_MAINNET]: {
                address: '0x29219dd400f2bf60e5a23d13be72b486d4038894',
                type: StargateType.Pool,
            },
            [EndpointId.STORY_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
            },
            [EndpointId.SUPERPOSITION_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0x6c030c5CC283F791B26816f325b9C632d964F8A1',
            },
            [EndpointId.TAIKO_V2_MAINNET]: {
                type: StargateType.Oft,
                name: 'Bridged USDC (Stargate)',
                symbol: 'USDC.e',
            },
            [EndpointId.TELOS_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
            },
            [EndpointId.XDC_V2_MAINNET]: {
                type: StargateType.Oft,
                address: '0xCc0587aeBDa397146cc828b445dB130a94486e74',
            },

            //
            // TESTNET
            //
            [EndpointId.ARBSEP_V2_TESTNET]: {
                address: '0x3253a335E7bFfB4790Aa4C25C4250d206E9b9773',
                type: StargateType.Pool,
            },
            [EndpointId.KLAYTN_V2_TESTNET]: {
                symbol: 'USDC.e',
                type: StargateType.Oft,
            },
            [EndpointId.MANTLESEP_V2_TESTNET]: {
                address: '0xAcab8129E2cE587fD203FD770ec9ECAFA2C88080',
                type: StargateType.Pool,
            },
            [EndpointId.MONAD_V2_TESTNET]: {
                address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
                type: StargateType.Pool,
            },
            [EndpointId.OPTSEP_V2_TESTNET]: {
                address: '0x488327236B65C61A6c083e8d811a4E0D3d1D4268',
                type: StargateType.Pool,
            },
            [EndpointId.SEPOLIA_V2_TESTNET]: {
                address: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590',
                type: StargateType.Pool,
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
    [TokenName.EURC]: {
        name: 'EURC',
        symbol: 'EURC',
        assetId: 23,
        sharedDecimals: 6,
        localDecimals: 6,
        networks: {
            //
            // MAINNET
            //

            //
            // TESTNET
            //
            [EndpointId.SEPOLIA_V2_TESTNET]: {
                address: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
                type: StargateType.Pool,
            },
            [EndpointId.AVALANCHE_V2_TESTNET]: {
                address: '0x5e44db7996c682e92a960b65ac713a54ad815c6b',
                type: StargateType.Pool,
            },
            [EndpointId.ARBSEP_V2_TESTNET]: {
                address: '0xa6f01ccc347f07256bec0dc7d1a3b62adc3f1a68',
                type: StargateType.Oft,
            },
        },
    },
}

export const OFT_WRAPPER: OftWrapperConfig = {
    bps: 2n,
    callerBpsCap: 300n,
    // Any networks defined here will be picked up by the deploy script
    networks: {
        //
        // MAINNET
        //
        [EndpointId.ABSTRACT_V2_MAINNET]: {},
        [EndpointId.APE_V2_MAINNET]: {},
        [EndpointId.ARBITRUM_V2_MAINNET]: {},
        [EndpointId.ASTAR_V2_MAINNET]: {},
        [EndpointId.AURORA_V2_MAINNET]: {},
        [EndpointId.AVALANCHE_V2_MAINNET]: {},
        [EndpointId.BASE_V2_MAINNET]: {},
        [EndpointId.BERA_V2_MAINNET]: {},
        [EndpointId.BLAST_V2_MAINNET]: {},
        [EndpointId.BOTANIX_V2_MAINNET]: {},
        [EndpointId.BSC_V2_MAINNET]: {},
        [EndpointId.COREDAO_V2_MAINNET]: {},
        [EndpointId.CRONOSEVM_V2_MAINNET]: {},
        [EndpointId.DEGEN_V2_MAINNET]: {},
        [EndpointId.EDU_V2_MAINNET]: {},
        [EndpointId.ETHEREUM_V2_MAINNET]: {},
        [EndpointId.ETHERLINK_V2_MAINNET]: {},
        [EndpointId.FANTOM_V2_MAINNET]: {},
        [EndpointId.FLARE_V2_MAINNET]: {},
        [EndpointId.FLOW_V2_MAINNET]: {},
        [EndpointId.FUSE_V2_MAINNET]: {},
        [EndpointId.FRAXTAL_V2_MAINNET]: {},
        [EndpointId.GLUE_V2_MAINNET]: {},
        [EndpointId.GNOSIS_V2_MAINNET]: {},
        [EndpointId.GOAT_V2_MAINNET]: {},
        [EndpointId.GRAVITY_V2_MAINNET]: {},
        [EndpointId.HEDERA_V2_MAINNET]: {},
        [EndpointId.HEMI_V2_MAINNET]: {},
        [EndpointId.INK_V2_MAINNET]: {},
        [EndpointId.IOTA_V2_MAINNET]: {},
        [EndpointId.ISLANDER_V2_MAINNET]: {},
        [EndpointId.KAVA_V2_MAINNET]: {},
        [EndpointId.KLAYTN_V2_MAINNET]: {},
        [EndpointId.LIGHTLINK_V2_MAINNET]: {},
        [EndpointId.MANTA_V2_MAINNET]: {},
        [EndpointId.MANTLE_V2_MAINNET]: {},
        [EndpointId.METIS_V2_MAINNET]: {},
        [EndpointId.MODE_V2_MAINNET]: {},
        [EndpointId.MOONBEAM_V2_MAINNET]: {},
        [EndpointId.MOONRIVER_V2_MAINNET]: {},
        [EndpointId.NIBIRU_V2_MAINNET]: {},
        [EndpointId.OPBNB_V2_MAINNET]: {},
        [EndpointId.OPTIMISM_V2_MAINNET]: {},
        [EndpointId.ORDERLY_V2_MAINNET]: {},
        [EndpointId.PEAQ_V2_MAINNET]: {},
        [EndpointId.PLUMEPHOENIX_V2_MAINNET]: {},
        [EndpointId.POLYGON_V2_MAINNET]: {},
        [EndpointId.RARIBLE_V2_MAINNET]: {},
        [EndpointId.ROOTSTOCK_V2_MAINNET]: {},
        [EndpointId.SCROLL_V2_MAINNET]: {},
        [EndpointId.SEI_V2_MAINNET]: {},
        [EndpointId.SHIMMER_V2_MAINNET]: {},
        [EndpointId.SOPHON_V2_MAINNET]: {},
        [EndpointId.SOMNIA_V2_MAINNET]: {},
        [EndpointId.SONEIUM_V2_MAINNET]: {},
        [EndpointId.SONIC_V2_MAINNET]: {},
        [EndpointId.STORY_V2_MAINNET]: {},
        [EndpointId.SUPERPOSITION_V2_MAINNET]: {},
        [EndpointId.SWELL_V2_MAINNET]: {},
        [EndpointId.TAIKO_V2_MAINNET]: {},
        [EndpointId.TELOS_V2_MAINNET]: {},
        [EndpointId.UNICHAIN_V2_MAINNET]: {},
        [EndpointId.XDC_V2_MAINNET]: {},
        [EndpointId.ZKCONSENSYS_V2_MAINNET]: {},
        [EndpointId.ZKPOLYGON_V2_MAINNET]: {},
        [EndpointId.ZKSYNC_V2_MAINNET]: {},

        //
        // TESTNET
        //
        [EndpointId.ARBSEP_V2_TESTNET]: {},
        [EndpointId.AVALANCHE_V2_TESTNET]: {},
        [EndpointId.BSC_V2_TESTNET]: {},
        [EndpointId.KLAYTN_V2_TESTNET]: {},
        [EndpointId.MANTLESEP_V2_TESTNET]: {},
        [EndpointId.MONAD_V2_TESTNET]: {},
        [EndpointId.OPTSEP_V2_TESTNET]: {},
        [EndpointId.SEPOLIA_V2_TESTNET]: {},

        //
        // SANDBOX
        //
        [EndpointId.BSC_V2_SANDBOX]: {},
        [EndpointId.ETHEREUM_V2_SANDBOX]: {},
        [EndpointId.POLYGON_V2_SANDBOX]: {},
    },
}

export const REWARDS: RewardsConfig = {
    [RewardTokenName.MOCK_A]: {
        name: 'RewardTokenMock',
        networks: {
            //
            // Testnet
            //
            // We don't deploy the token on testnet since there are no farms
            //
            [EndpointId.ARBSEP_V2_TESTNET]: {},
            [EndpointId.AVALANCHE_V2_TESTNET]: {},
            [EndpointId.BSC_V2_TESTNET]: {},
            [EndpointId.OPTSEP_V2_TESTNET]: {},
            [EndpointId.MANTLESEP_V2_TESTNET]: {},
            [EndpointId.MONAD_V2_TESTNET]: {},
            [EndpointId.SEPOLIA_V2_TESTNET]: {},

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
            [EndpointId.AVALANCHE_V2_MAINNET]: {
                address: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590',
            },
            [EndpointId.BASE_V2_MAINNET]: {
                address: '0xE3B53AF74a4BF62Ae5511055290838050bf764Df',
            },
            [EndpointId.BSC_V2_MAINNET]: {
                address: '0xB0D502E938ed5f4df2E681fE6E419ff29631d62b',
            },
            [EndpointId.ETHEREUM_V2_MAINNET]: {
                address: '0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6',
            },
            [EndpointId.MANTLE_V2_MAINNET]: {
                address: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
            },
            [EndpointId.OPTIMISM_V2_MAINNET]: {
                address: '0x296F55F8Fb28E498B858d0BcDA06D955B2Cb3f97',
            },
            [EndpointId.POLYGON_V2_MAINNET]: {
                address: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590',
            },
            [EndpointId.SCROLL_V2_MAINNET]: {
                address: '0x8731d54e9d02c286767d56ac03e8037c07e01e98',
            },
            [EndpointId.ZKCONSENSYS_V2_MAINNET]: {
                address: '0x808d7c71ad2ba3FA531b068a2417C63106BC0949',
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
    [RewardTokenName.SEI]: {
        name: 'SEI',
        networks: {
            //
            // Mainnet
            [EndpointId.SEI_V2_MAINNET]: {
                address: '0x0000000000000000000000000000000000000000',
            },
        },
    },
    [RewardTokenName.CORE]: {
        name: 'CORE',
        networks: {
            //
            // Mainnet
            [EndpointId.COREDAO_V2_MAINNET]: {
                address: '0x0000000000000000000000000000000000000000',
            },
        },
    },
    [RewardTokenName.LLE]: {
        name: 'LLE',
        networks: {
            //
            // Mainnet
            [EndpointId.LIGHTLINK_V2_MAINNET]: {
                address: '0xd9d7123552fA2bEdB2348bB562576D67f6E8e96E',
            },
        },
    },
    [RewardTokenName.WETH]: {
        name: 'WETH',
        networks: {
            //
            // Mainnet
            [EndpointId.HEMI_V2_MAINNET]: {
                address: '0x4200000000000000000000000000000000000006',
            },
            [EndpointId.SONEIUM_V2_MAINNET]: {
                address: '0x4200000000000000000000000000000000000006',
            },
        },
    },
    [RewardTokenName.ETH]: {
        name: 'ETH',
        networks: {
            //
            // Mainnet
            [EndpointId.ABSTRACT_V2_MAINNET]: {
                address: '0x0000000000000000000000000000000000000000',
            },
        },
    },
    [RewardTokenName.S]: {
        name: 'S',
        networks: {
            //
            // Mainnet
            [EndpointId.SONIC_V2_MAINNET]: {
                address: '0x0000000000000000000000000000000000000000',
            },
        },
    },
    [RewardTokenName.MANTA]: {
        name: 'MANTA',
        networks: {
            //
            // Mainnet
            [EndpointId.MANTA_V2_MAINNET]: {
                address: '0x95CeF13441Be50d20cA4558CC0a27B601aC544E5',
            },
        },
    },
    [RewardTokenName.USDC]: {
        name: 'USDC',
        networks: {
            //
            // Mainnet
            [EndpointId.SOPHON_V2_MAINNET]: {
                address: '0x9Aa0F72392B5784Ad86c6f3E899bCc053D00Db4F',
            },
        },
    },
    [RewardTokenName.EURC]: {
        name: 'EURC',
        networks: {},
    },
}

export const NETWORKS: NetworksConfig = {
    //
    // MAINNET
    //
    [EndpointId.ABSTRACT_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ABSTRACT_V2_MAINNET], DVNS.STG[EndpointId.ABSTRACT_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ABSTRACT_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ABSTRACT_V2_MAINNET], DVNS.STG[EndpointId.ABSTRACT_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ABSTRACT_V2_MAINNET],
            nativeDropAmount: parseEther('0.0008').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xaF0B7759f24AA346a857dc17E9Ef965b023D5c8E',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/abstract`,
            contractNetworks: {
                [2741]: {
                    multiSendAddress: '0x6dF2A06dF3D40381031456912f5333FbA3cFd471',
                    multiSendCallOnlyAddress: '0xe550e10beBFA7602E5E481fd77AA7Ec7FE299840',
                    safeMasterCopyAddress: '0x68c1B65211c0d2d39Ed04b2b4F0B6f743A168320',
                    safeProxyFactoryAddress: '0xeF1505D46Ab6c6282D91885fF652daed5D5eCE7d',
                    fallbackHandlerAddress: '0xeaa8d1D0E736C59F7F0211C272d25f7AEC9FCB51',
                    createCallAddress: '0xfBa3c4698e99307496CE94D7FAe2ed69169c85f7',
                    signMessageLibAddress: '0xC205b5856F78044882048B961e2fb4180D35f443',
                    simulateTxAccessorAddress: '0xe0Af8a33FCad3DbD1B6bE03E7c5d38Fbf753F6e7',
                },
            },
        },
    },
    [EndpointId.APE_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.APE_V2_MAINNET], DVNS.STG[EndpointId.APE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.APE_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.APE_V2_MAINNET], DVNS.STG[EndpointId.APE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.APE_V2_MAINNET],
            nativeDropAmount: parseEther('0.1').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x4a43eCB40A35795545192875E2Bb6866F6f91da8',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/ape`,
            contractNetworks: {
                [33139]: {
                    multiSendAddress: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
                    multiSendCallOnlyAddress: '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
                    safeMasterCopyAddress: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA',
                    safeProxyFactoryAddress: '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC',
                    fallbackHandlerAddress: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
                    createCallAddress: '0xB19D6FFc2182150F8Eb585b79D4ABcd7C5640A9d',
                    signMessageLibAddress: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
                    simulateTxAccessorAddress: '0x727a77a074D1E6c4530e814F89E618a3298FC044',
                },
            },
        },
    },
    [EndpointId.ARBITRUM_V2_MAINNET]: {
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
            busGasLimit: 60000n,
            busRideGasLimit: 55000n,
        },
        safeConfig: {
            safeAddress: '0x9CD50907aeb5D16F29Bddf7e1aBb10018Ee8717d',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/arbitrum`,
        },
    },
    [EndpointId.ASTAR_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x5d3917b47e963ec703ed66da6637c701365ff500',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/astar`,
        },
    },
    [EndpointId.AURORA_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/aurora`,
        },
    },
    [EndpointId.AVALANCHE_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/avalanche`,
        },
    },
    [EndpointId.BASE_V2_MAINNET]: {
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
            busGasLimit: 60000n,
            busRideGasLimit: 55000n,
        },
        safeConfig: {
            safeAddress: '0x81EAb64E630C4a2E3E849268A6B64cb76D1C8109',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/base`,
        },
    },
    [EndpointId.BERA_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.BERA_V2_MAINNET], DVNS.STG[EndpointId.BERA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.BERA_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.BERA_V2_MAINNET], DVNS.STG[EndpointId.BERA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.BERA_V2_MAINNET],
            nativeDropAmount: parseEther('0.001').toBigInt(),
            busGasLimit: 60000n,
            nativeDropGasLimit: 30000n,
        },
        safeConfig: {
            safeAddress: '0x5A185C81AFa796a753dd662343cbF911254f796e',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/bera`,
            contractNetworks: {
                [80094]: {
                    multiSendAddress: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
                    multiSendCallOnlyAddress: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
                    safeMasterCopyAddress: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
                    safeProxyFactoryAddress: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
                    fallbackHandlerAddress: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
                    createCallAddress: '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
                    signMessageLibAddress: '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
                    simulateTxAccessorAddress: '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
                },
            },
        },
    },
    [EndpointId.BLAST_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0xc53329FD24f3a446b7c3a804Ebc53515c0244012',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/blast`,
        },
    },
    [EndpointId.BOTANIX_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.BOTANIX_V2_MAINNET], DVNS.STG[EndpointId.BOTANIX_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.BOTANIX_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.BOTANIX_V2_MAINNET], DVNS.STG[EndpointId.BOTANIX_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.BOTANIX_V2_MAINNET],
            nativeDropAmount: parseEther('0.000000000003').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xAC9DFe100F75DC72b68155e99861ECe5A05f72ec',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/botanix`,
            contractNetworks: {
                [3637]: {
                    multiSendAddress: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
                    multiSendCallOnlyAddress: '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
                    safeMasterCopyAddress: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA',
                    safeProxyFactoryAddress: '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC',
                    fallbackHandlerAddress: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
                    createCallAddress: '0xB19D6FFc2182150F8Eb585b79D4ABcd7C5640A9d',
                    signMessageLibAddress: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
                    simulateTxAccessorAddress: '0x727a77a074D1E6c4530e814F89E618a3298FC044',
                },
            },
        },
    },
    [EndpointId.BSC_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/bsc`,
        },
    },
    [EndpointId.CODEX_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.CODEX_V2_MAINNET], DVNS.STG[EndpointId.CODEX_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.CODEX_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.CODEX_V2_MAINNET], DVNS.STG[EndpointId.CODEX_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.CODEX_V2_MAINNET],
            nativeDropAmount: parseEther('0.001').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x539bd5B55eBFb8EfEDc51f115d96FE9705027621',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/codex`,
            contractNetworks: {
                [81224]: {
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
    [EndpointId.COREDAO_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.COREDAO_V2_MAINNET], DVNS.STG[EndpointId.COREDAO_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.COREDAO_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.COREDAO_V2_MAINNET], DVNS.STG[EndpointId.COREDAO_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.COREDAO_V2_MAINNET],
            nativeDropAmount: parseEther('0.1').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x43303706f215A53220291F0B8a896BCDA5EB709E',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/coredao`,
        },
    },
    [EndpointId.CRONOSEVM_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.CRONOSEVM_V2_MAINNET], DVNS.STG[EndpointId.CRONOSEVM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.CRONOSEVM_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.CRONOSEVM_V2_MAINNET], DVNS.STG[EndpointId.CRONOSEVM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.CRONOSEVM_V2_MAINNET],
            nativeDropAmount: parseEther('5').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x7F433ac60E7400479a734e8264Eb0B772E6fD2Ad',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/cronosevm`,
            contractNetworks: {
                [25]: {
                    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
                    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
                    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
                    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
                    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
                    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
                    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
                },
            },
        },
    },
    [EndpointId.CRONOSZKEVM_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [
                DVNS.NETHERMIND[EndpointId.CRONOSZKEVM_V2_MAINNET],
                DVNS.STG[EndpointId.CRONOSZKEVM_V2_MAINNET],
            ],
            executor: EXECUTORS.LZ_LABS[EndpointId.CRONOSZKEVM_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [
                DVNS.NETHERMIND[EndpointId.CRONOSZKEVM_V2_MAINNET],
                DVNS.STG[EndpointId.CRONOSZKEVM_V2_MAINNET],
            ],
            executor: EXECUTORS.LZ_LABS[EndpointId.CRONOSZKEVM_V2_MAINNET],
            nativeDropAmount: parseEther('2').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x3cC43e322FE7CCd49F0cc5dB3FE35e5Ee8359b06',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/cronoszkevm`,
            contractNetworks: {
                [388]: {
                    multiSendAddress: '0x0dFcccB95225ffB03c6FBB2559B530C2B7C8A912',
                    multiSendCallOnlyAddress: '0xf220D3b4DFb23C4ade8C88E526C1353AbAcbC38F',
                    safeMasterCopyAddress: '0x1727c2c531cf966f902E5927b98490fDFb3b2b70',
                    safeProxyFactoryAddress: '0xDAec33641865E4651fB43181C6DB6f7232Ee91c2',
                    fallbackHandlerAddress: '0x2f870a80647BbC554F3a0EBD093f11B4d2a7492A',
                    createCallAddress: '0xcB8e5E438c5c2b45FbE17B02Ca9aF91509a8ad56',
                    signMessageLibAddress: '0x357147caf9C0cCa67DfA0CF5369318d8193c8407',
                    simulateTxAccessorAddress: '0x4191E2e12E8BC5002424CE0c51f9947b02675a44',
                },
            },
        },
    },
    [EndpointId.DEGEN_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.DEGEN_V2_MAINNET], DVNS.STG[EndpointId.DEGEN_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.DEGEN_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.DEGEN_V2_MAINNET], DVNS.STG[EndpointId.DEGEN_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.DEGEN_V2_MAINNET],
            nativeDropAmount: parseEther('5').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x2F2F0C7097926e66a31A72BA956cf99DB6aeAe4A',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/degen`,
            contractNetworks: {
                [666666666]: {
                    multiSendAddress: '0xb952cFF2Bfb2939C8f1410966AC580cEEa9654Cd',
                    multiSendCallOnlyAddress: '0x1E19eF7e15FfC6737b837BA398927847dA3d75f8',
                    safeMasterCopyAddress: '0xd159BB62645f6e951cE6eF59b8da409a404f681F',
                    safeProxyFactoryAddress: '0xEe830749c04334D9cC650a9320a9E72fcb540cA0',
                    fallbackHandlerAddress: '0x67E086c9dc7F670428766355271a1638f7abC022',
                    createCallAddress: '0x1E71241E5e7D8677868b19B3dFe87d2681Cf7185',
                    signMessageLibAddress: '0x95A09f1142Afe3Ca316ea424224333bA7810f12A',
                    simulateTxAccessorAddress: '0x63db1940eac4647dde9aA753DeF013a8eB52F39a',
                },
            },
        },
    },
    [EndpointId.EDU_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.EDU_V2_MAINNET], DVNS.STG[EndpointId.EDU_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.EDU_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.EDU_V2_MAINNET], DVNS.STG[EndpointId.EDU_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.EDU_V2_MAINNET],
            nativeDropAmount: parseEther('0.5').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x720573EcD27d279a28812347B2fd73dF857EB774',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/edu`,
            contractNetworks: {
                [41923]: {
                    multiSendAddress: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
                    multiSendCallOnlyAddress: '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
                    safeMasterCopyAddress: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA',
                    safeProxyFactoryAddress: '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC',
                    fallbackHandlerAddress: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
                    createCallAddress: '0xB19D6FFc2182150F8Eb585b79D4ABcd7C5640A9d',
                    signMessageLibAddress: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
                    simulateTxAccessorAddress: '0x727a77a074D1E6c4530e814F89E618a3298FC044',
                },
            },
        },
    },
    [EndpointId.EBI_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/ebi`,
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/ethereum`,
        },
    },
    [EndpointId.ETHERLINK_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x757A404a44C9fC75136e8901E561ac2bcc9FCE8D',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/etherlink`,
        },
    },
    [EndpointId.FANTOM_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x2351BBCb7cF7Ee9D18AF2Be0d106BFc5D47A9E85',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/fantom`,
        },
    },
    [EndpointId.FLARE_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.FLARE_V2_MAINNET], DVNS.STG[EndpointId.FLARE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.FLARE_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.FLARE_V2_MAINNET], DVNS.STG[EndpointId.FLARE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.FLARE_V2_MAINNET],
            nativeDropAmount: parseEther('3').toBigInt(),
            busGasLimit: 60000n,
            nativeDropGasLimit: 30000n,
        },
        safeConfig: {
            safeAddress: '0x61820502d20a11e90AC0D59305947E177E52d1E9',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/flare`,
            contractNetworks: {
                ['14']: {
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
    [EndpointId.FLOW_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.FLOW_V2_MAINNET], DVNS.STG[EndpointId.FLOW_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.FLOW_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.FLOW_V2_MAINNET], DVNS.STG[EndpointId.FLOW_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.FLOW_V2_MAINNET],
            nativeDropAmount: parseEther('0.1').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xce578Ad2a804BfD2a999a9911609f551B2a940bb',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/flow`,
            contractNetworks: {
                ['747']: {
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
    [EndpointId.FRAXTAL_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x62B5F0B624301A1F5C0DD998A40Ea7297B26FB90',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/fraxtal`,
        },
    },
    [EndpointId.FUSE_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.FUSE_V2_MAINNET], DVNS.STG[EndpointId.FUSE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.FUSE_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.FUSE_V2_MAINNET], DVNS.STG[EndpointId.FUSE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.FUSE_V2_MAINNET],
            nativeDropAmount: parseEther('0.1').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x10fE9418bc6bf06C849c070AE341238B45F8B805',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/fuse`,
            contractNetworks: {
                ['122']: {
                    multiSendAddress: '0x13D863F99B511c6B0aA9b279Dfbb8CEd03a67443',
                    multiSendCallOnlyAddress: '0x657cC5bB95cFe05FcB87315a884Ab2b46F8DF893',
                    safeMasterCopyAddress: '0x8E141E7EAF0d2100c13EfCb7371ECfbCFCcb6755',
                    safeProxyFactoryAddress: '0x4e667200683d0b84CbB6dEEEa821d6B8b1cbE50e',
                    fallbackHandlerAddress: '0xC216cd825eCb640BB17b4f63dbe49b3cA28bEEE3',
                    createCallAddress: '0xe434357848A9b57C640055427238397ad2a14b81',
                    signMessageLibAddress: '0x590a2737c8EF1C2e52F81624ea8dBFa7deA0565B',
                    simulateTxAccessorAddress: '0x5a864A828a401E4eDa8756A15e48819963f9DAAC',
                },
            },
        },
    },
    [EndpointId.GLUE_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.GLUE_V2_MAINNET], DVNS.STG[EndpointId.GLUE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.GLUE_V2_MAINNET],
            sendCreditGasLimit: 255000n,
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.GLUE_V2_MAINNET], DVNS.STG[EndpointId.GLUE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.GLUE_V2_MAINNET],
            nativeDropAmount: parseEther('0.5').toBigInt(),
            taxiGasLimit: 350000n,
            busGasLimit: 2200000n,
            busRideGasLimit: 145000n,
            nativeDropGasLimit: 145000n,
        },
        safeConfig: {
            safeAddress: '0x6C0d029292f48068f576515c79Fc6bCDec5F58DA',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/glue`,
            contractNetworks: {
                ['1300']: {
                    multiSendAddress: '0x1E999A606771577f10AFee9111b6263cCF176a1D',
                    multiSendCallOnlyAddress: '0x3BE538f8E6a8809892a1a9618bda69C518a14a8a',
                    safeMasterCopyAddress: '0xB79F7E683E365E21B150812b86f1e0D60512D168',
                    safeProxyFactoryAddress: '0x73aFaC05744f1246Ac94d5Ee92d56be5a7298ecC',
                    fallbackHandlerAddress: '0x1B01E51e3ff9D83DD245D8320c5007b6a3dBF91c',
                    createCallAddress: '0xF83E45c8575b7317686d4bbeE489bB6a93E6C4E3',
                    signMessageLibAddress: '0x34A62CbF94d5dF170CA67C4ECB335453117d4515',
                    simulateTxAccessorAddress: '0x9D59A44Ae2BF3A5A9751463BD4EC77b172eFa9B0',
                },
            },
        },
    },
    [EndpointId.GNOSIS_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.GNOSIS_V2_MAINNET], DVNS.STG[EndpointId.GNOSIS_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.GNOSIS_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.GNOSIS_V2_MAINNET], DVNS.STG[EndpointId.GNOSIS_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.GNOSIS_V2_MAINNET],
            nativeDropAmount: parseEther('0.0001').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x92f4BA1931E1A03f5486228502C5f2A2b622dd17',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/gnosis`,
        },
    },
    [EndpointId.GOAT_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.GOAT_V2_MAINNET], DVNS.STG[EndpointId.GOAT_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.GOAT_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.GOAT_V2_MAINNET], DVNS.STG[EndpointId.GOAT_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.GOAT_V2_MAINNET],
            nativeDropAmount: parseEther('0.00001').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x93fC2AffA2633C873A74876B76C8e4154579E8Ef',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/goat`,
            contractNetworks: {
                ['2345']: {
                    multiSendAddress: '0x8a6e7041bf6bee63796248D55f7f8539B93e6392',
                    multiSendCallOnlyAddress: '0xC9A6781b600b76Cc1c9b3Ad4111924d5e6dF3928',
                    safeMasterCopyAddress: '0xf74Bd2417160FcabB7d02bA7672409d28dDF1967',
                    safeProxyFactoryAddress: '0x1C9A3476021f6fAd683F37601F222eB7DD30eC1e',
                    fallbackHandlerAddress: '0x4e7B97aaaA57f55586982E56A882054f8Ba9cA3C',
                    createCallAddress: '0x0dCD7594D2cC5Ca28174c9CCAf31bAF555e6c897',
                    signMessageLibAddress: '0x5C6B04D0F934c7E6710eFAaA52dbCfc9e84A96Ac',
                    simulateTxAccessorAddress: '0xe6c71861cCCEe52980B8cdeFA76A0c844aC22ceE',
                },
            },
        },
    },
    [EndpointId.GRAVITY_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.GRAVITY_V2_MAINNET], DVNS.STG[EndpointId.GRAVITY_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.GRAVITY_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.GRAVITY_V2_MAINNET], DVNS.STG[EndpointId.GRAVITY_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.GRAVITY_V2_MAINNET],
            nativeDropAmount: parseEther('2').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xB3e401A59571D4BF5996B0f5FfFE377FbfE71359',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/gravity`,
            contractNetworks: {
                ['1625']: {
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
    [EndpointId.HEDERA_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.HEDERA_V2_MAINNET], DVNS.STG[EndpointId.HEDERA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.HEDERA_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.HEDERA_V2_MAINNET], DVNS.STG[EndpointId.HEDERA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.HEDERA_V2_MAINNET],
            nativeDropAmount: parseUnits('0.5', 8).toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xc2cf2825Eb027D8EE8Feb3003d19c466887d9cD4',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/hedera`,
            contractNetworks: {
                [295]: {
                    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
                    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
                    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
                    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
                    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
                    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
                    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
                },
            },
        },
    },
    [EndpointId.HEMI_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.HEMI_V2_MAINNET], DVNS.STG[EndpointId.HEMI_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.HEMI_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.HEMI_V2_MAINNET], DVNS.STG[EndpointId.HEMI_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.HEMI_V2_MAINNET],
            nativeDropAmount: parseEther('0.005').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x012c45ab17B7c2AE53CA68046a50bcDf77b46Ad7',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/hemi`,
            contractNetworks: {
                [43111]: {
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
    [EndpointId.INK_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.INK_V2_MAINNET], DVNS.STG[EndpointId.INK_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.INK_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.INK_V2_MAINNET], DVNS.STG[EndpointId.INK_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.INK_V2_MAINNET],
            nativeDropAmount: parseEther('0.0003').toBigInt(),
            busGasLimit: 60000n,
            busRideGasLimit: 60000n,
            nativeDropGasLimit: 25000n,
        },
        safeConfig: {
            safeAddress: '0xD4B757c44aC3e849DE1DBd2c9b27CBCDAB3809C3',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/ink`,
            contractNetworks: {
                [57073]: {
                    multiSendAddress: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
                    multiSendCallOnlyAddress: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
                    safeMasterCopyAddress: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
                    safeProxyFactoryAddress: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
                    fallbackHandlerAddress: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
                    createCallAddress: '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
                    signMessageLibAddress: '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
                    simulateTxAccessorAddress: '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
                },
            },
        },
    },
    [EndpointId.IOTA_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.IOTA_V2_MAINNET], DVNS.STG[EndpointId.IOTA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.IOTA_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.IOTA_V2_MAINNET], DVNS.STG[EndpointId.IOTA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.IOTA_V2_MAINNET],
            nativeDropAmount: parseEther('0.01').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x61F36B8575ED9e363a131838dD02b69230253702',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/iota`,
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
    [EndpointId.ISLANDER_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ISLANDER_V2_MAINNET], DVNS.STG[EndpointId.ISLANDER_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ISLANDER_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ISLANDER_V2_MAINNET], DVNS.STG[EndpointId.ISLANDER_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ISLANDER_V2_MAINNET],
            nativeDropAmount: parseEther('0.01').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xce578Ad2a804BfD2a999a9911609f551B2a940bb',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/islander`,
            contractNetworks: {
                [1480]: {
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
    [EndpointId.KAVA_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/kava`,
        },
    },
    [EndpointId.KLAYTN_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/klaytn`,
        },
    },
    [EndpointId.LIGHTLINK_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.LIGHTLINK_V2_MAINNET], DVNS.STG[EndpointId.LIGHTLINK_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.LIGHTLINK_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.LIGHTLINK_V2_MAINNET], DVNS.STG[EndpointId.LIGHTLINK_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.LIGHTLINK_V2_MAINNET],
            nativeDropAmount: parseEther('0.0001').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xfa6D0b19CE28656079D822f6BBE3714ab1FDd44b',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/lightlink`,
            contractNetworks: {
                [1890]: {
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
    [EndpointId.MANTA_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.MANTA_V2_MAINNET], DVNS.STG[EndpointId.MANTA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.MANTA_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.MANTA_V2_MAINNET], DVNS.STG[EndpointId.MANTA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.MANTA_V2_MAINNET],
            nativeDropAmount: parseEther('0.0001').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x3f0DFccF4f7BBc0ed52A212e4d981435a7f27Cc6',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/manta`,
            contractNetworks: {
                [169]: {
                    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
                    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
                    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
                    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
                    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
                    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
                    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
                },
            },
        },
    },
    [EndpointId.MANTLE_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/mantle`,
        },
    },
    [EndpointId.METIS_V2_MAINNET]: {
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
            busGasLimit: 50000n,
        },
        safeConfig: {
            safeAddress: '0x90c3DFD4Ea593336DBB9F925f73413e6EE84c90E',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/metis`,
        },
    },
    [EndpointId.MODE_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x9BD292C0f5D95686481A8af9b8694654B25aE1AC',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/mode`,
        },
    },
    [EndpointId.MOONBEAM_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x40533743FC0F3cCb01ca2196d45dd7958dc89f89',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/moonbeam`,
        },
    },
    [EndpointId.MOONRIVER_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0xBAc08c612a791033BC20D991FB9b1892Cb49A39f',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/moonriver`,
        },
    },
    [EndpointId.NIBIRU_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.NIBIRU_V2_MAINNET], DVNS.STG[EndpointId.NIBIRU_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.NIBIRU_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.NIBIRU_V2_MAINNET], DVNS.STG[EndpointId.NIBIRU_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.NIBIRU_V2_MAINNET],
            nativeDropAmount: parseEther('2').toBigInt(),
            busGasLimit: 50000n,
        },
        safeConfig: {
            safeAddress: '0xF9d173F325035b4A9654EA21a798b9C8b7a0B4fE',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/nibiru`,
            contractNetworks: {
                [6900]: {
                    multiSendAddress: '0x998739BFdAAdde7C933B942a68053933098f9EDa',
                    multiSendCallOnlyAddress: '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
                    safeMasterCopyAddress: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA',
                    safeProxyFactoryAddress: '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC',
                    fallbackHandlerAddress: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
                    createCallAddress: '0xB19D6FFc2182150F8Eb585b79D4ABcd7C5640A9d',
                    signMessageLibAddress: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
                    simulateTxAccessorAddress: '0x727a77a074D1E6c4530e814F89E618a3298FC044',
                },
            },
        },
    },
    [EndpointId.OPBNB_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0xD6578c1C35ee901d01D99e17593E25B13994090b',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/opbnb`,
        },
    },
    [EndpointId.OPTIMISM_V2_MAINNET]: {
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
            busGasLimit: 50000n,
            busRideGasLimit: 55000n,
        },
        safeConfig: {
            safeAddress: '0x392AC17A9028515a3bFA6CCe51F8b70306C6bd43',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/optimism`,
        },
    },
    [EndpointId.ORDERLY_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ORDERLY_V2_MAINNET], DVNS.STG[EndpointId.ORDERLY_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ORDERLY_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ORDERLY_V2_MAINNET], DVNS.STG[EndpointId.ORDERLY_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ORDERLY_V2_MAINNET],
            nativeDropAmount: parseEther('0.0005').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xEdA49b9301b4310F6E4a4b42857906f8732a78dF',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/orderly`,
            contractNetworks: {
                [291]: {
                    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
                    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
                    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
                    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
                    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
                    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
                    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
                },
            },
        },
    },

    [EndpointId.PEAQ_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.PEAQ_V2_MAINNET], DVNS.STG[EndpointId.PEAQ_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.PEAQ_V2_MAINNET],
            sendCreditGasLimit: 90000n,
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.PEAQ_V2_MAINNET], DVNS.STG[EndpointId.PEAQ_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.PEAQ_V2_MAINNET],
            nativeDropAmount: parseEther('0.1').toBigInt(),
            taxiGasLimit: 190000n,
            busGasLimit: 70000n,
            busRideGasLimit: 65000n,
            nativeDropGasLimit: 45000n,
        },
        safeConfig: {
            safeAddress: '0xB2687F7F6290aBa4ED3290ffFF6cB2e1cc30686D',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/peaq`,
            contractNetworks: {
                [3338]: {
                    multiSendAddress: '0x3150DF8a991204d541AD13988B609C6f50af0B7b',
                    multiSendCallOnlyAddress: '0x6E5df01a1bEFe75bb01FCC20d3a8cCbF6c8f0356',
                    safeMasterCopyAddress: '0xEFABd4B65F9E7097Dc7bf69de6FC9CbA2C227b9C',
                    safeProxyFactoryAddress: '0xF545Fd55CeB06365f660AD8cC45A838eDAcBa6dC',
                    fallbackHandlerAddress: '0xE3AfD9dDd88F10355C51197A350855B9c3FdC9d5',
                    createCallAddress: '0x3fde1294F61A6f70e5eA7A4E4f3a4047E0C0eC11',
                    signMessageLibAddress: '0xde261fCa19e0C85A46308D268C9968D001AF4d72',
                    simulateTxAccessorAddress: '0x2023FD9E5d626425b55B8Beb62Ae5934e27a9f5e',
                },
            },
        },
    },
    [EndpointId.PLUME_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.PLUME_V2_MAINNET], DVNS.STG[EndpointId.PLUME_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.PLUME_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.PLUME_V2_MAINNET], DVNS.STG[EndpointId.PLUME_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.PLUME_V2_MAINNET],
            nativeDropAmount: parseEther('0.001').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x30b1Ca299577f70bc456Fa37C6822d9088069d31',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/plume`,
            contractNetworks: {
                [98865]: {
                    multiSendAddress: '0x1E999A606771577f10AFee9111b6263cCF176a1D',
                    multiSendCallOnlyAddress: '0x3BE538f8E6a8809892a1a9618bda69C518a14a8a',
                    safeMasterCopyAddress: '0xB79F7E683E365E21B150812b86f1e0D60512D168',
                    safeProxyFactoryAddress: '0x73aFaC05744f1246Ac94d5Ee92d56be5a7298ecC',
                    fallbackHandlerAddress: '0x1B01E51e3ff9D83DD245D8320c5007b6a3dBF91c',
                    createCallAddress: '0xF83E45c8575b7317686d4bbeE489bB6a93E6C4E3',
                    signMessageLibAddress: '0x34A62CbF94d5dF170CA67C4ECB335453117d4515',
                    simulateTxAccessorAddress: '0x9D59A44Ae2BF3A5A9751463BD4EC77b172eFa9B0',
                },
            },
        },
    },
    [EndpointId.PLUMEPHOENIX_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [
                DVNS.NETHERMIND[EndpointId.PLUMEPHOENIX_V2_MAINNET],
                DVNS.STG[EndpointId.PLUMEPHOENIX_V2_MAINNET],
            ],
            executor: EXECUTORS.LZ_LABS[EndpointId.PLUMEPHOENIX_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [
                DVNS.NETHERMIND[EndpointId.PLUMEPHOENIX_V2_MAINNET],
                DVNS.STG[EndpointId.PLUMEPHOENIX_V2_MAINNET],
            ],
            executor: EXECUTORS.LZ_LABS[EndpointId.PLUMEPHOENIX_V2_MAINNET],
            nativeDropAmount: parseEther('0.05').toBigInt(),
            taxiGasLimit: 230000n,
        },
        safeConfig: {
            safeAddress: '0xb8ce2bE5c3c13712b4da61722EAd9d64bB57AbC9',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/plumephoenix`,
            contractNetworks: {
                [98866]: {
                    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
                    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
                    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
                    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
                    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
                    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
                    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
                },
            },
        },
    },
    [EndpointId.POLYGON_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/polygon`,
        },
    },
    [EndpointId.RARIBLE_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.RARIBLE_V2_MAINNET], DVNS.STG[EndpointId.RARIBLE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.RARIBLE_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.RARIBLE_V2_MAINNET], DVNS.STG[EndpointId.RARIBLE_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.RARIBLE_V2_MAINNET],
            nativeDropAmount: parseEther('0.00003').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x0bB70602d48E1A681B6aCBC788712751A3f0b59d',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/rarible`,
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
    [EndpointId.ROOTSTOCK_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ROOTSTOCK_V2_MAINNET], DVNS.STG[EndpointId.ROOTSTOCK_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ROOTSTOCK_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.ROOTSTOCK_V2_MAINNET], DVNS.STG[EndpointId.ROOTSTOCK_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.ROOTSTOCK_V2_MAINNET],
            nativeDropAmount: parseEther('0.000055').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x12BF73dADeaFAD42C0293752617C3cDc0b14A364',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/rootstock`,
            contractNetworks: {
                [30]: {
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
    [EndpointId.SCROLL_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/scroll`,
        },
    },
    [EndpointId.SHIMMER_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x3ae59e4cffaad28e6588a269e2142e4a434d5a94',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/shimmer`,
        },
    },
    [EndpointId.SEI_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SEI_V2_MAINNET], DVNS.STG[EndpointId.SEI_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SEI_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SEI_V2_MAINNET], DVNS.STG[EndpointId.SEI_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SEI_V2_MAINNET],
            nativeDropAmount: parseEther('0.0006').toBigInt(),
            busGasLimit: 60000n,
            nativeDropGasLimit: 30000n,
        },
        safeConfig: {
            safeAddress: '0x196009FbeD5825a4Fe7443b5a1908E359d051769',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/sei`,
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
    [EndpointId.STORY_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.STORY_V2_MAINNET], DVNS.STG[EndpointId.STORY_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.STORY_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.STORY_V2_MAINNET], DVNS.STG[EndpointId.STORY_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.STORY_V2_MAINNET],
            nativeDropAmount: parseEther('0.05').toBigInt(),
            busGasLimit: 75000n,
            nativeDropGasLimit: 45000n,
        },
        safeConfig: {
            safeAddress: '0x720573EcD27d279a28812347B2fd73dF857EB774',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/story`,
            contractNetworks: {
                [1514]: {
                    multiSendAddress: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
                    multiSendCallOnlyAddress: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
                    safeMasterCopyAddress: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
                    safeProxyFactoryAddress: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
                    fallbackHandlerAddress: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
                    createCallAddress: '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
                    signMessageLibAddress: '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
                    simulateTxAccessorAddress: '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
                },
            },
        },
    },
    [EndpointId.SOPHON_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SOPHON_V2_MAINNET], DVNS.STG[EndpointId.SOPHON_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SOPHON_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SOPHON_V2_MAINNET], DVNS.STG[EndpointId.SOPHON_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SOPHON_V2_MAINNET],
            nativeDropAmount: parseEther('3').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x676e341775964245f414149D1d343F75E9b5B887',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/sophon`,
            contractNetworks: {
                [50104]: {
                    multiSendAddress: '0x0dFcccB95225ffB03c6FBB2559B530C2B7C8A912',
                    multiSendCallOnlyAddress: '0xf220D3b4DFb23C4ade8C88E526C1353AbAcbC38F',
                    safeMasterCopyAddress: '0x1727c2c531cf966f902E5927b98490fDFb3b2b70',
                    safeProxyFactoryAddress: '0xDAec33641865E4651fB43181C6DB6f7232Ee91c2',
                    fallbackHandlerAddress: '0x2f870a80647BbC554F3a0EBD093f11B4d2a7492A',
                    createCallAddress: '0xcB8e5E438c5c2b45FbE17B02Ca9aF91509a8ad56',
                    signMessageLibAddress: '0x357147caf9C0cCa67DfA0CF5369318d8193c8407',
                    simulateTxAccessorAddress: '0x4191E2e12E8BC5002424CE0c51f9947b02675a44',
                },
            },
        },
    },
    [EndpointId.SOMNIA_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SOMNIA_V2_MAINNET], DVNS.STG[EndpointId.SOMNIA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SOMNIA_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SOMNIA_V2_MAINNET], DVNS.STG[EndpointId.SOMNIA_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SOMNIA_V2_MAINNET],
            nativeDropAmount: parseEther('0.01').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xf6a997990Fe12B2489bF3f56bBbc442e4cb185A7',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/somnia`,
            contractNetworks: {
                [5031]: {
                    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
                    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
                    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
                    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
                    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
                    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
                    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
                },
            },
        },
    },
    [EndpointId.SONEIUM_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SONEIUM_V2_MAINNET], DVNS.STG[EndpointId.SONEIUM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SONEIUM_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SONEIUM_V2_MAINNET], DVNS.STG[EndpointId.SONEIUM_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SONEIUM_V2_MAINNET],
            nativeDropAmount: parseEther('0.0005').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xea4645d254A9E3C67595EaF3AFaaf3E0DaA4fa0e',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/soneium`,
            contractNetworks: {
                [1868]: {
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
    [EndpointId.SONIC_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SONIC_V2_MAINNET], DVNS.STG[EndpointId.SONIC_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SONIC_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SONIC_V2_MAINNET], DVNS.STG[EndpointId.SONIC_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SONIC_V2_MAINNET],
            nativeDropAmount: parseEther('0.5').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x347eD93cA2F7aDCe6B1629590cC9717A8904e73A',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/sonic`,
            contractNetworks: {
                [146]: {
                    multiSendAddress: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
                    multiSendCallOnlyAddress: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
                    safeMasterCopyAddress: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
                    safeProxyFactoryAddress: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
                    fallbackHandlerAddress: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
                    createCallAddress: '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
                    signMessageLibAddress: '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
                    simulateTxAccessorAddress: '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
                },
            },
        },
    },
    [EndpointId.SUPERPOSITION_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [
                DVNS.NETHERMIND[EndpointId.SUPERPOSITION_V2_MAINNET],
                DVNS.STG[EndpointId.SUPERPOSITION_V2_MAINNET],
            ],
            executor: EXECUTORS.LZ_LABS[EndpointId.SUPERPOSITION_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [
                DVNS.NETHERMIND[EndpointId.SUPERPOSITION_V2_MAINNET],
                DVNS.STG[EndpointId.SUPERPOSITION_V2_MAINNET],
            ],
            executor: EXECUTORS.LZ_LABS[EndpointId.SUPERPOSITION_V2_MAINNET],
            nativeDropAmount: parseEther('0.001').toBigInt(),
            busGasLimit: 60000n,
            busRideGasLimit: 60000n,
            nativeDropGasLimit: 25000n,
        },
        safeConfig: {
            safeAddress: '0x670c49578aFd9644ceF7BFc43b399E11c4ba7837',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/superposition`,
            contractNetworks: {
                [55244]: {
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
    [EndpointId.SWELL_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SWELL_V2_MAINNET], DVNS.STG[EndpointId.SWELL_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SWELL_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.SWELL_V2_MAINNET], DVNS.STG[EndpointId.SWELL_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.SWELL_V2_MAINNET],
            nativeDropAmount: parseEther('0.0003').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x4565E255dbA625fDf7bF1229ED6C280915740aA8',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/swell`,
            contractNetworks: {
                [1923]: {
                    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
                    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
                    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
                    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
                    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
                    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
                    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
                },
            },
        },
    },
    [EndpointId.TAIKO_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.TAIKO_V2_MAINNET], DVNS.STG[EndpointId.TAIKO_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.TAIKO_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.TAIKO_V2_MAINNET], DVNS.STG[EndpointId.TAIKO_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.TAIKO_V2_MAINNET],
            nativeDropAmount: parseEther('0.0008').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xB3e401A59571D4BF5996B0f5FfFE377FbfE71359',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/taiko`,
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
    [EndpointId.TELOS_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.TELOS_V2_MAINNET], DVNS.STG[EndpointId.TELOS_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.TELOS_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.TELOS_V2_MAINNET], DVNS.STG[EndpointId.TELOS_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.TELOS_V2_MAINNET],
            nativeDropAmount: parseEther('1').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x8421259dda5CE973680a1aAC7EFf45589A515B55',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/telos`,
            contractNetworks: {
                [40]: {
                    multiSendAddress: '0xcCf6684d2d2E788C81e7D608c7f48456Af2AD31E',
                    multiSendCallOnlyAddress: '0x9FfC5769005618a25E8BBBDe30AE90A0539F3BFd',
                    safeMasterCopyAddress: '0x6df82166C61b3a48C8799aE938f7e5e74dD84E32',
                    safeProxyFactoryAddress: '0xeF1020c42DF001c7218D7b8F05B7BD04e8CFC9D0',
                    fallbackHandlerAddress: '0x6946bFb85475a8BaD9f43ed7C7B14F35102CeD4f',
                    createCallAddress: '0x8cF8eb579421E90e0C705405f5716f2F651eEb3e',
                    signMessageLibAddress: '0xbb2BB33d947BB94ce21cF09e584FF0f62Dc78D91',
                    simulateTxAccessorAddress: '0x8283a2A5016755776C911458f87356DbC2AE9c1b',
                },
            },
        },
    },
    [EndpointId.UNICHAIN_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.UNICHAIN_V2_MAINNET], DVNS.STG[EndpointId.UNICHAIN_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.UNICHAIN_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.UNICHAIN_V2_MAINNET], DVNS.STG[EndpointId.UNICHAIN_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.UNICHAIN_V2_MAINNET],
            nativeDropAmount: parseEther('0.005').toBigInt(),
            taxiGasLimit: 350000n,
        },
        safeConfig: {
            safeAddress: '0x60049009F2c54E50f93739Ffa2B1896b4594292B',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/unichain`,
            contractNetworks: {
                [130]: {
                    multiSendAddress: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
                    multiSendCallOnlyAddress: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
                    safeMasterCopyAddress: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
                    safeProxyFactoryAddress: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
                    fallbackHandlerAddress: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
                    createCallAddress: '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
                    signMessageLibAddress: '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
                    simulateTxAccessorAddress: '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
                },
            },
        },
    },
    [EndpointId.XCHAIN_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.XCHAIN_V2_MAINNET], DVNS.STG[EndpointId.XCHAIN_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.XCHAIN_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.XCHAIN_V2_MAINNET], DVNS.STG[EndpointId.XCHAIN_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.XCHAIN_V2_MAINNET],
            nativeDropAmount: parseEther('0.00004').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0xdC20E4cDf9C1bF75dF848D4e8F4E3B9B767840C8',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/xchain`,
            contractNetworks: {
                [94524]: {
                    multiSendAddress: '0xD7e873F871032f8F2B581F1A92fbfd7F5cC0DB87',
                    multiSendCallOnlyAddress: '0x0a61F43687FB5389A191b60688A878D8c230518C',
                    safeMasterCopyAddress: '0x7D3e29Fe34eA9f0f061ca1793698BB31227B539c',
                    safeProxyFactoryAddress: '0xCe2a317b5E866fb4a88d2d1AD5b62791504e6294',
                    fallbackHandlerAddress: '0x1808829ca983697d33CD2BaD30c1EaAF51a89E07',
                    createCallAddress: '0xcaA28451125C3c355C8a5596C99B0360Cdd2F928',
                    signMessageLibAddress: '0x298E98C8DeCa852438b2Df6Bc4bD05BC18D6E7D3',
                    simulateTxAccessorAddress: '0xECeBABaaDe81E90524F64426FF76BBdD6683739C',
                },
            },
        },
    },
    [EndpointId.XDC_V2_MAINNET]: {
        creditMessaging: {
            ...DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.XDC_V2_MAINNET], DVNS.STG[EndpointId.XDC_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.XDC_V2_MAINNET],
        },
        tokenMessaging: {
            ...DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
            requiredDVNs: [DVNS.NETHERMIND[EndpointId.XDC_V2_MAINNET], DVNS.STG[EndpointId.XDC_V2_MAINNET]],
            executor: EXECUTORS.LZ_LABS[EndpointId.XDC_V2_MAINNET],
            nativeDropAmount: parseEther('0.01').toBigInt(),
        },
        safeConfig: {
            safeAddress: '0x5A185C81AFa796a753dd662343cbF911254f796e',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/xdc`,
            contractNetworks: {
                [50]: {
                    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
                    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
                    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
                    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
                    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
                    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
                    signMessageLibAddress: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
                    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
                },
            },
        },
    },
    [EndpointId.ZKCONSENSYS_V2_MAINNET]: {
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
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/zkconsensys`,
        },
    },
    [EndpointId.ZKPOLYGON_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x5D3917b47E963eC703eD66Da6637C701365fF500',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/zkpolygon`,
        },
    },
    [EndpointId.ZKSYNC_V2_MAINNET]: {
        safeConfig: {
            safeAddress: '0x026756AB43866eCd92289663E91CCa8afb20414B',
            safeUrl: `${process.env.BASE_SAFE_URL_MAINNET}/zksync`,
        },
    },

    //
    // TESTNET
    //
    [EndpointId.ARBSEP_V2_TESTNET]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.AVALANCHE_V2_TESTNET]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.BSC_V2_TESTNET]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.KLAYTN_V2_TESTNET]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.MANTLESEP_V2_TESTNET]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.MONAD_V2_TESTNET]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.OPTSEP_V2_TESTNET]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.SEPOLIA_V2_TESTNET]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },

    //
    // SANDBOX
    //
    [EndpointId.BSC_V2_SANDBOX]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.ETHEREUM_V2_SANDBOX]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
    [EndpointId.POLYGON_V2_SANDBOX]: {
        creditMessaging: DEFAULT_CREDIT_MESSAGING_NETWORK_CONFIG,
        tokenMessaging: DEFAULT_TOKEN_MESSAGING_NETWORK_CONFIG,
    },
}
