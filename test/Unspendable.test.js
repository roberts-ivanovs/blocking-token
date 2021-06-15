// Load dependencies
const { accounts, contract } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

// Load compiled artifacts
const Unspendable = contract.fromArtifact('Unspendable');

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
    expect(await this.contract.name()).to.equal("BlockSpendersERC20");
    expect(await this.contract.symbol()).to.equal("asd");
  });
  it('Owner has the coins', async function () {
    expect((await this.contract.balanceOf(owner)).toString()).to.equal("100000000000000000000");
  });
  it('Successful transfer of tokens', async function () {
    // Send tokens: owner -> anotherUser -> owner
    // NOTE: Each contract call is it's own separate transaction
    await this.contract.transfer(anotherUser, "10", {from: owner});
    expect((await this.contract.balanceOf(owner)).toString()).to.equal("99999999999999999990");
    expect((await this.contract.balanceOf(anotherUser)).toString()).to.equal("10");
    await this.contract.transfer(owner, "10", {from: anotherUser});
    expect((await this.contract.balanceOf(owner)).toString()).to.equal("100000000000000000000");
    expect((await this.contract.balanceOf(anotherUser)).toString()).to.equal("0");
  });
});
