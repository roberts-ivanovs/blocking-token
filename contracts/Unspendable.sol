// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

// import "./erc20-utils/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Unspendable is ERC20 {

    struct FrozenTokens {
        uint256 blockNumber;
        uint256 amount;
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
        if (from != address(0) && to != address(0)) {
            if (_volitalteFrozen[from].blockNumber != block.number) {
                _volitalteFrozen[from].amount = 0;
            }

            // Make sure that the user is not transfering tokens at the same
            // block as he had received them
            require(
                amount <=
                    (this.balanceOf(from) -
                        _volitalteFrozen[from].amount),
                "Cannot transfer at the same transaction as when receiving!"
            );
            if (_volitalteFrozen[to].blockNumber == block.number) {
                _volitalteFrozen[to].amount += amount;
            } else {
                _volitalteFrozen[to].amount = amount;
            }
            _volitalteFrozen[to].blockNumber = block.number;
        }
    }
}
