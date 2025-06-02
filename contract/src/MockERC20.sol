// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev A simple ERC20 token for testing purposes.
 * Mints an initial supply to the deployer.
 */
contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }

    /**
     * @dev Public function to mint tokens. Useful for testing.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint (in smallest unit, e.g., wei for 18 decimals).
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Public function to burn tokens. Useful for testing.
     * @param from The address to burn tokens from.
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
