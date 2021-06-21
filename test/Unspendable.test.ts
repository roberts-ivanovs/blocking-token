// Load dependencies
import { ethers, network } from 'hardhat';
import { ContractFactory } from '@ethersproject/contracts';
import chai, { expect } from 'chai';
import { BigNumber } from "@ethersproject/bignumber";
import { solidity } from 'ethereum-waffle';
import { autoMineOff, autoMineOn, mineBlocks } from './helper/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// inject domain specific assertion methods
chai.use(solidity);

import { Unspendable } from '../typechain/Unspendable';

describe('Unspendable', function () {
  let contract: Unspendable;
  let testContractFactory: ContractFactory;
  let owner: SignerWithAddress;
  let anotherUser: SignerWithAddress;

  beforeEach(async function () {
    // Deploy a new Unspendable contract for each test
    const unspendableFactory = await ethers.getContractFactory('Unspendable');
    testContractFactory = await ethers.getContractFactory('TestUnspendable');
    [owner, anotherUser] = await ethers.getSigners();
    contract = (await unspendableFactory.deploy(
      'BlockSpendersERC20',
      'asd',
    )) as Unspendable;
    await contract.owner();
  });

  afterEach(async () => {
    // Do not leak test states
    await autoMineOn();
    await network.provider.request({
      method: 'hardhat_reset',
      params: [],
    });
  });

  // Test case
  describe('Basic core', function () {
    it('Name correct', async function () {
      expect(await contract.name()).to.equal('BlockSpendersERC20');
      expect(await contract.symbol()).to.equal('asd');
    });
    it('Owner has the coins', async function () {
      expect(
        (await contract.balanceOf(await owner.getAddress())).toString(),
      ).to.equal('100000000000000000000');
    });
    it('Contract has storage coins', async function () {
      expect(
        (await contract.balanceOf(await owner.getAddress())).toString(),
      ).to.equal('100000000000000000000');
    });
    it('Tokens have a set price', async function () {
      expect((await contract.weiPerTokenSlice()).toString()).to.equal('1000');
    });
    it('Owner set', async function () {
      expect(await contract.owner()).to.equal(await owner.getAddress());
    });
  });

  describe('Blocking behaviour tests', function () {
    afterEach(async () => {
      // Do not leak test states
      await autoMineOn();
    });

    it('Successful transfer of tokens', async function () {
      // Send tokens: owner -> anotherUser -> owner
      // NOTE: Each contract call is it's own separate transaction
      await contract
        .connect(owner)
        .transfer(await anotherUser.getAddress(), '10');
      expect(
        (await contract.balanceOf(await owner.getAddress())).toString(),
      ).to.equal('99999999999999999990');
      expect(
        (await contract.balanceOf(await anotherUser.getAddress())).toString(),
      ).to.equal('10');
      await contract
        .connect(anotherUser)
        .transfer(await owner.getAddress(), '10');
      expect(
        (await contract.balanceOf(await owner.getAddress())).toString(),
      ).to.equal('100000000000000000000');
      expect(
        (await contract.balanceOf(await anotherUser.getAddress())).toString(),
      ).to.equal('0');
    });
    it('Owner cannot transfer when minting', async function () {
      const testContract = await testContractFactory.connect(owner).deploy();
      await expect(
        testContract.testOwnerMintingBlocker(
          await anotherUser.getAddress(),
          '10000',
        ),
      ).to.be.revertedWith(
        'Cannot transfer at the same transaction as when receiving!',
      );
    });
    it('Unsuccessful transfer of tokens because everything is one big transaction (constructed from TS)', async function () {
      await contract
        .connect(owner)
        .increaseAllowance(await anotherUser.getAddress(), '100');
      await autoMineOff();
      // -- Block start --
      await contract
        .connect(anotherUser)
        .transferFrom(
          await owner.getAddress(),
          await anotherUser.getAddress(),
          '5',
        );
      await contract
        .connect(anotherUser)
        .transferFrom(
          await owner.getAddress(),
          await anotherUser.getAddress(),
          '10',
        );
      await contract
        .connect(anotherUser)
        .transfer(await owner.getAddress(), '12'); // assume that this part failed
      // -- Block end --
      await mineBlocks(1);
      expect(
        (await contract.balanceOf(await anotherUser.getAddress())).toString(),
      ).to.equal('15');
    });
    it('Attempt to spend tokens in the same block as received them', async function () {
      const testContract = await testContractFactory.connect(owner).deploy();
      await contract
        .connect(owner)
        .increaseAllowance(testContract.address, '100');
      await expect(
        testContract
          .connect(owner)
          .testMoneyGrab(contract.address, owner.getAddress(), '10', '15'),
      ).to.be.revertedWith(
        'Cannot transfer at the same transaction as when receiving!',
      );
    });
    it('Attempt to spend past tokens in the same block as receiving new ones', async function () {
      const testContract = await testContractFactory.connect(owner).deploy();
      // increase allowance so the testContract can receive extra funds within `testMoneyGrab` call
      await contract
        .connect(owner)
        .increaseAllowance(testContract.address, '10');
      // Block X: give test contract 5 coins
      await contract.connect(owner).transfer(testContract.address, '5');
      // Block X+1: The smart contract gets new coins as well as transfers 5 coins
      // back(because 5 coins were already previously available).
      await testContract
        .connect(owner)
        .testMoneyGrab(contract.address, owner.getAddress(), '5', '5');
      expect(
        (await contract.balanceOf(testContract.address)).toString(),
      ).to.equal('10');
    });
  });

  it('A lot of users get money transfers, a lot of new blocks get created', async function () {
    // NOTE: This test only exists to "stress-test" the EVM and to better
    // evaluate and compare the gas consumption prices under high load.
    const signers = await ethers.getSigners();
    const signersWithoutOwner = signers.slice(1, 11);
    const totalMoneyTransferBlocks = 10;
    expect(
      (await contract.balanceOf(await owner.getAddress())).toString(),
    ).to.equal('100000000000000000000');

    // ---- send tokens ----
    for (let _ = 0; _ < totalMoneyTransferBlocks; _++) {
      for (let i = 0; i < signersWithoutOwner.length; i++) {
        await contract
          .connect(owner)
          .transfer(await signersWithoutOwner[i].getAddress(), '100');
      }
    }

    // ---- assert ----
    expect(
      (await contract.balanceOf(await owner.getAddress())).toString(),
    ).to.equal('99999999999999990000');
  });

  describe('Buying tokens with ether', function () {
    it('Normal behaviour: buy tokens for self, owner takes them', async function () {
      const provider = ethers.provider;
      //  ------------------- Initial ETH validations  -------------------
      // `anotherUser` initial ETH balance
      expect((await anotherUser.getBalance()).toString()).to.equal(
        '10000000000000000000000',
      );
      // `contract` initial ETH balance
      expect(
        (await provider.getBalance(contract.address.toString())).toString(),
      ).to.equal('0');

      //  ------------------- Buy tokens  -------------------
      await contract
        .connect(anotherUser)
        .buyTokensForAddress(await anotherUser.getAddress(), {
          value: 100000000,
        });
      // `anotherUser` now owns 100 tokens
      expect(
        (await contract.balanceOf(await anotherUser.getAddress())).toString(),
      ).to.equal('100000');
      // Check that token count for contract has gone down
      expect((await contract.balanceOf(contract.address)).toString()).to.equal(
        '99999999999999900000',
      );

      //  ------------------- Final ETH validations  -------------------
      // `anotherUser` ETH balance reduced
      expect((await anotherUser.getBalance()).toString()).to.equal(
        '9999999326959900000000',
      );
      // Check that ETH count has gone up for contract
      expect((await provider.getBalance(contract.address)).toString()).to.equal(
        '100000000',
      );

      //  ------------------- Owner withdraws funds  -------------------
      expect((await owner.getBalance()).toString()).to.equal( // before contract call
        '9999979929312000000000',
      );
      await contract
        .connect(owner)
        .grabEther();

      expect((await owner.getBalance()).toString()).to.equal( // After contract call
        '9999979675672100000000',
      );

      expect((await provider.getBalance(contract.address)).toString()).to.equal(
        '0',
      );
    });

    it('Change price of tokens', async function () {
      await contract.connect(owner).setTokenSliceRateInWei('0');
      expect((await contract.weiPerTokenSlice()).toString()).to.equal('0');
    });
    it('Increase total token supply', async function () {
      // Validate initial token count
      expect((await contract.balanceOf(contract.address)).toString()).to.equal(
        '100000000000000000000',
      );
      await contract.connect(owner).increaseStorageReserves('100000000000000');

      // Validate final token count
      expect((await contract.balanceOf(contract.address)).toString()).to.equal(
        '100000100000000000000',
      );
    });
  });
});
