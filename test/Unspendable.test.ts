// Load dependencies
import { ethers, network } from 'hardhat';
import { Signer, providers } from 'ethers';
import chai from 'chai';
import { expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { autoMineOff, autoMineOn, mineBlocks } from './helper/utils';
// inject domain specific assertion methods
chai.use(solidity);

describe('Unspendable', function () {
  beforeEach(async function () {
    // Deploy a new Unspendable contract for each test
    this.UnspendableFactory = await ethers.getContractFactory('Unspendable');
    this.TestUnspendableFactory = await ethers.getContractFactory(
      'TestUnspendable',
    );
    [this.owner, this.anotherUser] = await ethers.getSigners();
    this.contract = await this.UnspendableFactory.deploy(
      'BlockSpendersERC20',
      'asd',
    );
  });

  afterEach(async () => {
    // Do not leak test states
    await autoMineOn();
  });

  // Test case
  describe('Basic core', function () {
    it('Name correct', async function () {
      expect(await this.contract.name()).to.equal('BlockSpendersERC20');
      expect(await this.contract.symbol()).to.equal('asd');
    });
    it('Owner has the coins', async function () {
      expect(
        (await this.contract.balanceOf(this.owner.getAddress())).toString(),
      ).to.equal('100000000000000000000');
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
      await this.contract
        .connect(this.owner)
        .transfer(this.anotherUser.getAddress(), '10');
      expect(
        (await this.contract.balanceOf(this.owner.getAddress())).toString(),
      ).to.equal('99999999999999999990');
      expect(
        (
          await this.contract.balanceOf(this.anotherUser.getAddress())
        ).toString(),
      ).to.equal('10');
      await this.contract
        .connect(this.anotherUser)
        .transfer(this.owner.getAddress(), '10');
      expect(
        (await this.contract.balanceOf(this.owner.getAddress())).toString(),
      ).to.equal('100000000000000000000');
      expect(
        (
          await this.contract.balanceOf(this.anotherUser.getAddress())
        ).toString(),
      ).to.equal('0');
    });
    it('Owner cannot transfer when minting', async function () {
      const testContract = await this.TestUnspendableFactory.connect(
        this.owner,
      ).deploy();
      await expect(
        testContract.testOwnerMintingBlocker(
          this.anotherUser.getAddress(),
          '10000',
        ),
      ).to.be.revertedWith(
        'Cannot transfer at the same transaction as when receiving!',
      );
    });
    it('Unsuccessful transfer of tokens because everything is one big transaction (constructed from TS)', async function () {
      await this.contract
        .connect(this.owner)
        .increaseAllowance(this.anotherUser.getAddress(), '100');
      await autoMineOff();
      // -- Block start --
      await this.contract
        .connect(this.anotherUser)
        .transferFrom(
          this.owner.getAddress(),
          this.anotherUser.getAddress(),
          '5',
        );
      await this.contract
        .connect(this.anotherUser)
        .transferFrom(
          this.owner.getAddress(),
          this.anotherUser.getAddress(),
          '10',
        );
      await this.contract
        .connect(this.anotherUser)
        .transfer(this.owner.getAddress(), '12'); // assume that this part failed
      // -- Block end --
      await mineBlocks(1);
      expect(
        (
          await this.contract.balanceOf(this.anotherUser.getAddress())
        ).toString(),
      ).to.equal('15');
    });
    it('Attempt to spend tokens in the same block as received them', async function () {
      const testContract = await this.TestUnspendableFactory.connect(
        this.owner,
      ).deploy();
      await this.contract
        .connect(this.owner)
        .increaseAllowance(testContract.address, '100');
      await expect(
        testContract
          .connect(this.owner)
          .testMoneyGrab(
            this.contract.address,
            this.owner.getAddress(),
            '10',
            '15',
          ),
      ).to.be.revertedWith(
        'Cannot transfer at the same transaction as when receiving!',
      );
    });
    it('Attempt to spend past tokens in the same block as receiving new ones', async function () {
      const testContract = await this.TestUnspendableFactory.connect(
        this.owner,
      ).deploy();
      // increase allowance so the testContract can receive extra funds within `testMoneyGrab` call
      await this.contract
        .connect(this.owner)
        .increaseAllowance(testContract.address, '10');
      // Block X: give test contract 5 coins
      await this.contract
        .connect(this.owner)
        .transfer(testContract.address, '5');
      // Block X+1: The smart contract gets new coins as well as transfers 5 coins
      // back(because 5 coins were already previously available).
      await testContract
        .connect(this.owner)
        .testMoneyGrab(
          this.contract.address,
          this.owner.getAddress(),
          '5',
          '5',
        );
      expect(
        (await this.contract.balanceOf(testContract.address)).toString(),
      ).to.equal('10');
    });
  });

  it('A lot of users get money transfers, a lot of new blocks get created', async function () {
    // NOTE: This test only exists to "stress-test" the EVM and to better
    // evaluate and compare the gas consumption prices under high load.
    const signers = await ethers.getSigners();
    const signersWithoutOwner = signers.slice(1, 11);
    const totalMoneyTransferBlocks = 100;
    for (let _ = 0; _ < totalMoneyTransferBlocks; _++) {
      signersWithoutOwner.forEach(async (a) => {
        // In total: 1000 new `transfer` calls
        await this.contract.connect(this.owner).transfer(a.getAddress(), '100');
      });
    }
    expect(
      (await this.contract.balanceOf(this.owner.getAddress())).toString(),
    ).to.equal('99999999999999900000');
  });
});
