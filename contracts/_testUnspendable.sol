// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./Unspendable.sol";

contract TestUnspendable {
    // NOTE: `address(this)` needs to have externally set allowance that can be
    // taken from `_tokenOwnerAddress`.
    function testMoneyGrab(
        address _unspendableBlockAddress,
        address _tokenOwnerAddress,
        uint256 _amount1,
        uint256 _amount2
    ) public {
        Unspendable _unspendableBlock = Unspendable(_unspendableBlockAddress);
        // Grab moeny attempt 1 (successful)
        _unspendableBlock.transferFrom(
            _tokenOwnerAddress,
            address(this),
            _amount1
        );
        // Grab moeny attempt 2 (successful)
        _unspendableBlock.transferFrom(
            _tokenOwnerAddress,
            address(this),
            _amount2
        );
        // Return back the received tokens (expected failure here)
        _unspendableBlock.transferFrom(
            address(this),
            _tokenOwnerAddress,
            _amount1
        );
    }
}
