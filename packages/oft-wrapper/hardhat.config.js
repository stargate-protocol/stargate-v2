require("dotenv").config();

require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('./tasks');
require('@matterlabs/hardhat-zksync-deploy');
require('@matterlabs/hardhat-zksync-solc');
require ("@matterlabs/hardhat-zksync-verify");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function getMnemonic(networkName) {
  if (networkName) {
    const mnemonic = process.env['MNEMONIC_' + networkName.toUpperCase()]
    if (mnemonic && mnemonic !== '') {
      return mnemonic
    }
  }

  const mnemonic = process.env.MNEMONIC
  if (!mnemonic || mnemonic === '') {
    return 'test test test test test test test test test test test junk'
  }

  return mnemonic
}

function accounts(chainKey) {
  return { mnemonic: getMnemonic(chainKey) }
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  zksolc: {
    version: '1.3.10',
    compilerSource: 'binary',
    settings: {},
  },
  defaultNetwork: "zksync-mainnet",

  solidity: {
    version: "0.8.8",
  },

  namedAccounts: {
    deployer: {
      default: 2,    // wallet address 0, of the mnemonic in .env
    },
    proxyOwner: {
      default: 1,
    },
  },

  networks: {
    ethereum: {
      url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // public infura endpoint
      chainId: 1,
      accounts: accounts(),
    },
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: accounts(),
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: accounts(),
    },
    polygon: {
      url: "https://rpc-mainnet.maticvigil.com",
      chainId: 137,
      accounts: accounts(),
    },
    arbitrum: {
      url: `https://arbitrum-one.public.blastapi.io`,
      chainId: 42161,
      accounts: accounts(),
    },
    optimism: {
      url: `https://mainnet.optimism.io`,
      chainId: 10,
      accounts: accounts(),
    },
    fantom: {
      url: `https://rpcapi.fantom.network`,
      chainId: 250,
      accounts: accounts(),
    },
    metis: {
      url: `https://andromeda.metis.io/?owner=1088`,
      chainId: 1088,
      accounts: accounts(),
    },
    moonbeam: {
      url: `https://rpc.api.moonbeam.network`,
      chainId: 1284,
      accounts: accounts(),
    },
    'base-mainnet': {
      url: `https://base.blockpi.network/v1/rpc/public\t`,
      chainId: 8453,
      accounts: accounts(),
    },
    'zk-evm': {
      url: "https://zkevm-rpc.com",
      chainId: 1101,
      accounts: accounts(),
    },
    'kava': {
      url: "https://kava-evm.publicnode.com",
      chainId: 2222,
      accounts: accounts(),
    },

    'linea': {
      url: "https://rpc.linea.build",
      chainId: 59144,
      accounts: accounts(),
    },
    'zksync-mainnet': {
      url: 'https://zksync2-mainnet.zksync.io',
      ethNetwork: 'https://eth-mainnet.public.blastapi.io', // Can also be the RPC URL of the Ethereum network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      zksync: true,
      // accounts: evmPrivateKeysFromKeys(Stage.MAINNET),
      verifyURL: 'https://zksync2-mainnet-explorer.zksync.io/contract_verification'
    },

    'dfk': {
      url: "https://dfkchain.api.onfinality.io/public",
      chainId: 53935,
      accounts: accounts(),
    },
    'harmony': {
      url: "https://a.api.s0.t.hmny.io",
      chainId: 1666600000,
      accounts: accounts(),
    },
    'dexalot': {
      url: "https://subnets.avax.network/dexalot/mainnet/rpc",
      chainId: 432204,
      accounts: accounts(),
    },
    'celo': {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: accounts(),
    },
    'fuse': {
      url: "https://fuse-mainnet.chainstacklabs.com",
      chainId: 122,
      accounts: accounts(),
    },
    'gnosis': {
      url: "https://rpc.ankr.com/gnosis\t",
      chainId: 100,
      accounts: accounts(),
    },
    'klaytn': {
      url: "https://public-node-api.klaytnapi.com/v1/cypress",
      chainId: 8217,
      accounts: accounts(),
    },
    'coredao': {
      url: "https://rpc-core.icecreamswap.com",
      chainId: 1116,
      accounts: accounts(),
    },
    'okx': {
      url: "https://oktc-mainnet.public.blastapi.io",
      chainId: 66,
      accounts: accounts(),
    },
    'canto': {
      url: "https://mainnode.plexnode.org:8545",
      chainId: 7700,
      accounts: accounts(),
    },
    'moonriver': {
      url: "https://moonriver.unitedbloc.com:2000",
      chainId: 1285,
      accounts: accounts(),
    },
    'tenet': {
      url: "https://tenet-evm.publicnode.com",
      chainId: 1559,
      accounts: accounts(),
    },
    'nova': {
      url: "https://dev.rpc.novanetwork.io",
      chainId: 87,
      accounts: accounts(),
    },
    'meter': {
      url: "https://rpc.meter.io",
      chainId: 82,
      accounts: accounts(),
    },
    'mantle': {
      url: "https://rpc.mantle.xyz",
      chainId: 5000,
      accounts: accounts(),
    },
    'zora': {
      url: "https://rpc.zora.energy",
      chainId: 7777777,
      accounts: accounts(),
    },
    'tomo': {
      url: "https://tomo.blockpi.network/v1/rpc/public",
      chainId: 88,
      accounts: accounts(),
    },
    'loot': {
      url: "https://rpc.lootchain.com/http",
      chainId: 5151706,
      accounts: accounts(),
    },
    'meritcircle': {
      url: "https://subnets.avax.network/beam/mainnet/rpc",
      chainId: 4337,
      accounts: accounts(),
    },
    'telos': {
      url: "https://mainnet.telos.net/evm",
      chainId: 40,
      accounts: accounts(),
    },
    'scroll': {
      url: "https://rpc.scroll.io",
      chainId: 534352,
      accounts: accounts()
    },


    "ethereum-goerli": {
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // public infura endpoint
      chainId: 5,
      accounts: accounts(),
    },
    'bsc-testnet': {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97,
      accounts: accounts(),
    },
    fuji: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      chainId: 43113,
      accounts: accounts(),
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com/",
      chainId: 80001,
      accounts: accounts(),
    },
    'arbitrum-goerli': {
      url: `https://goerli-rollup.arbitrum.io/rpc/`,
      chainId: 421613,
      accounts: accounts(),
    },
    'optimism-goerli': {
      url: `https://goerli.optimism.io/`,
      chainId: 420,
      accounts: accounts(),
    },
    'fantom-testnet': {
      url: `https://rpc.ankr.com/fantom_testnet`,
      chainId: 4002,
      accounts: accounts(),
    }
  }
};
