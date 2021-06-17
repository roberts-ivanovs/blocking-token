// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

// import "./erc20-utils/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Unspendable is ERC20 {

    struct FrozenTokens {
        uint224 amount;
        uint32 blockNumber;
    }
    // `value` represents the mapping of `block ID` -> `frozen funds`
    mapping(address => FrozenTokens) private _volitalteFrozen;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 100 * 10**uint256(decimals()));
    }

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
        // Execute always (incl. minting)
        if (to != address(0)) {
            if (_volitalteFrozen[to].blockNumber == _castBlockNumber) {
                // NOTE: This can overflow!
                _volitalteFrozen[to].amount += _castAmoint;
            } else {
                _volitalteFrozen[to].amount = _castAmoint;
            }
            _volitalteFrozen[to].blockNumber = _castBlockNumber;
        }
    }
}
