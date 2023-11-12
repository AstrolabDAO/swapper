// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ISwapper {
    // State Variables
    function restrictCaller() external view returns (bool); // View restrictCaller state
    function restrictRouter() external view returns (bool); // View restrictRouter state
    function approveMax() external view returns (bool); // View approveMax state
    function autoRevoke() external view returns (bool); // View autoRevoke state
    function isWhitelisted(address _address) external view returns (bool); // Checks if an address is whitelisted

    // Events
    event Swapped(
        address indexed user,
        address indexed assetIn,
        address indexed assetOut,
        uint256 amountIn,
        uint256 amountOut
    ); // Emitted after a successful swap
    event Whitelisted(address indexed account); // Emitted when an address is added to the whitelist
    event RemovedFromWhitelist(address indexed account); // Emitted when an address is removed from the whitelist

    // Functions
    function setCallerRestriction(bool _restrictCaller) external; // Toggle caller restriction
    function setRouterRestriction(bool _restrictRouter) external; // Toggle router restriction
    function setApproveMax(bool _approveMax) external; // Toggle default max approval
    function setAutoRevoke(bool _autoRevoke) external; // Toggle auto revoke approval
    function addToWhitelist(address _address) external; // Add address to whitelist
    function removeFromWhitelist(address _address) external; // Remove address from whitelist
    function swap(
        address _input,
        address _output,
        uint256 _amountIn,
        uint256 _minAmountOut,
        address _targetRouter,
        bytes memory _callData
    ) external returns (uint256 received); // Execute a swap
    function multiSwap(
        address[] memory _inputs,
        address[] memory _outputs,
        uint256[] memory _amountsIn,
        uint256[] memory _minAmountsOut,
        address[] memory _targetRouters,
        bytes[] memory _callDataList
    ) external returns (uint256[] memory received); // Execute multiple swaps
}
