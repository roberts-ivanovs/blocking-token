// Load dependencies
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

// Load compiled artifacts
const Unspendable = contract.fromArtifact('Unspendable');
const TestUnspendable = contract.fromArtifact('TestUnspendable');

// Start test block
describe('Unspendable', function () {
  const [owner, anotherUser] = accounts;

  beforeEach(async function () {
    // Deploy a new Unspendable contract for each test
    this.contract = await Unspendable.new('BlockSpendersERC20', 'asd', {
      from: owner,
    });
  });

  // Test case
  it('Name correct', async function () {
    expect(await this.contract.name()).to.equal('BlockSpendersERC20');
    expect(await this.contract.symbol()).to.equal('asd');
  });
  it('Owner has the coins', async function () {
    expect((await this.contract.balanceOf(owner)).toString()).to.equal(
      '100000000000000000000',
    );
  });
  it('Successful transfer of tokens', async function () {
    // Send tokens: owner -> anotherUser -> owner
    // NOTE: Each contract call is it's own separate transaction
    await this.contract.transfer(anotherUser, '10', { from: owner });
    expect((await this.contract.balanceOf(owner)).toString()).to.equal(
      '99999999999999999990',
    );
    expect((await this.contract.balanceOf(anotherUser)).toString()).to.equal(
      '10',
    );
    await this.contract.transfer(owner, '10', { from: anotherUser });
    expect((await this.contract.balanceOf(owner)).toString()).to.equal(
      '100000000000000000000',
    );
    expect((await this.contract.balanceOf(anotherUser)).toString()).to.equal(
      '0',
    );
  });
  it('Attempt to spend tokens in the same block as received them', async function () {
    testContract = await TestUnspendable.new({ from: owner });
    await this.contract.increaseAllowance(testContract.address, '100', {
      from: owner,
    });
    await expectRevert(
      testContract.testMoneyGrab(this.contract.address, owner, '10', '15', {
        from: owner,
      }),
      'Cannot transfer at the same transaction as when receiving!',
    );
  });
  it('Attempt to spend past tokens in the same block as receiving new ones', async function () {
    testContract = await TestUnspendable.new({ from: owner });
    // increase allowance so the testContract can receive extra funds within `testMoneyGrab` call
    await this.contract.increaseAllowance(testContract.address, '10', {
      from: owner,
    });
    // Block X: give test contract 5 coins
    await this.contract.transfer(testContract.address, '5', { from: owner });
    // Block X+1: The smart contract gets new coins as well as transfers 5 coins
    // back(because 5 coins were already previously available).
    await testContract.testMoneyGrab(this.contract.address, owner, '5', '5', {
      from: owner,
    });
  });
});
