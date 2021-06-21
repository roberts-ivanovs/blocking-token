import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';

import { HardhatUserConfig } from 'hardhat/config';
import dotenv from 'dotenv';

const env = dotenv.config();
const { GOERLI_PRIVATE_KEY } = env.parsed!; // TODO read this from a .env variable (?)

const config: HardhatUserConfig = {
  solidity: '0.8.4',
  networks: {
    hardhat: {},
    goerli: {
      url: "https://rpc.goerli.mudit.blog",
      accounts: [GOERLI_PRIVATE_KEY]
    }
  }
};

export default config;
