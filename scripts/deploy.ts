import { ethers } from 'hardhat';
import { Unspendable } from '../typechain/Unspendable';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  console.log('Account balance:', (await deployer.getBalance()).toString());

  // We get the contract to deploy
  const unspendableFactory = await ethers.getContractFactory('Unspendable');
  const contract = (await unspendableFactory.deploy(
    'BlockSpendersERC20',
    'asd',
  )) as Unspendable;

  console.log('Unspendable deployed to:', contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
