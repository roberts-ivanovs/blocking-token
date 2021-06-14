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
  it('Another user cannot re-transfer just received tokens', async function () {
    await this.contract.increaseAllowance(anotherUser, "10000", { from: owner });
    // TODO There's problems caused by this because each test case+contract deployment is a single transaction.
    // Maybe look into other test frameworks?
    expect((await this.contract.allowance(owner, anotherUser)).toString()).to.equal("10000");
    await this.contract.transfer(anotherUser, "10", {from: owner});
  });
});
