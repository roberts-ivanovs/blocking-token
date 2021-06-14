// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

// import "./erc20-utils/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Unspendable is ERC20 {
    // `value` represents the block number of when the user had received his
    // last "gains"
    mapping(address => uint256) private _volitaleBlocked;

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
            // Make sure that the user is not transfering tokens at the same
            // block as he had received them
            require(
                _volitaleBlocked[from] > (block.number - 1),
                "Cannot transfer at the same transaction as when receiving!"
            );
            _volitaleBlocked[to] = block.number;
        }
    }
}
