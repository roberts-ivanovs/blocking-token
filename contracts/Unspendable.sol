// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Unspendable is ERC20, Ownable {

    struct FrozenTokens {
        uint224 amount;
        uint32 blockNumber;
    }
    // Track uers and their frozen funds
    mapping(address => FrozenTokens) private _volitalteFrozen;
    // The price per each ERC20 token
    uint256 private _weiPerToken;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 100 * 10**uint256(decimals()));
        _mint(address(this), 100 * 10**uint256(decimals())); // People will buy these tokens
        _weiPerToken = 1000;
    }

    // ---------------------- Internal logic ----------------------

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be to transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Bail explicitly if transfered amount overflows.
        assert(amount <= type(uint224).max);
        uint224 _castAmoint = uint224(amount);
        uint32 _castBlockNumber = uint32(block.number);

        // Exclude minting
        if (from != address(0) && to != address(0)) {
            if (_volitalteFrozen[from].blockNumber != _castBlockNumber) {
                _volitalteFrozen[from].amount = 0;
            }
            // Make sure that the user is not transfering tokens at the same
            // block as he had received them
            require(
                _castAmoint <=
                    (this.balanceOf(from) -
                        _volitalteFrozen[from].amount),
                "Cannot transfer at the same transaction as when receiving!"
            );
        }
        // Execute always (incl. minting), except when minting `address(this)`
        if (to != address(0) && to != address(this)) {
            if (_volitalteFrozen[to].blockNumber == _castBlockNumber) {
                // NOTE: This can overflow!
                _volitalteFrozen[to].amount += _castAmoint;
            } else {
                _volitalteFrozen[to].amount = _castAmoint;
            }
            _volitalteFrozen[to].blockNumber = _castBlockNumber;
        }
    }

    // ---------------------- Public interface ----------------------

    /* Set the new price per token
     */
    function setTokenRateInWei(uint256 _newPrice) public onlyOwner {
        _weiPerToken = _newPrice;
    }

    /* Increase the total supply of tokens for the address of THIS contract
     */
    function increaseStorageReserves(uint256 _deltaTokens) public onlyOwner {
        _mint(address(this), _deltaTokens);
    }

    /* Send all of the ether stored by this contract to the owner
     */
    function grabEther() public onlyOwner {
        payable(this.owner()).transfer(address(this).balance);
    }


    /* Buy tokens for someone (or yourself)
     */
    function buyTokensForAddress(address _tokenReceiver) public payable {
        uint256 tokensBeingBough = msg.value / _weiPerToken;
        // Using up the contracts own supply.
        // Will throw if not enoughs tokens available.
        this.transfer(_tokenReceiver, tokensBeingBough);
    }
}
