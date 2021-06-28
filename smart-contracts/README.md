# ERC20 with a catch: cannot spend tokens in the same block as when they were received

        yarn install
        yarn test
        npx hardhat run --network goerli scripts/deploy.ts
        npx hardhat flatten > FlattenedUnspendable.sol

## Important

Create a new file in the root of the project directory named `.env`. For the necessary key-value pairs, please refer to `.env.sample` file.
