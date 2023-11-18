// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Swapper
/// @dev Contract to proxy erc20 token swaps through a specified router
interface ISwapper {
    // Errors
    error CallRestricted();
    error RouterError();
    error UnexpectedOutput();
    error SlippageTooHigh();

    // Events
    event Swapped(
        address indexed user,
        address indexed assetIn,
        address indexed assetOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event Whitelisted(address indexed account);
    event RemovedFromWhitelist(address indexed account);

    // Views
    function isWhitelisted(address _address) external view returns (bool);
    function isCallerRestricted(address _caller) external view returns (bool);
    function isRouterRestricted(address _router) external view returns (bool);
    function isInputRestricted(address _input) external view returns (bool);
    function isOutputRestricted(address _output) external view returns (bool);
    function isApproveMax() external view returns (bool);
    function isAutoRevoke() external view returns (bool);

    // Functions
    function setCallerRestriction(bool _restrictCaller) external;
    function setRouterRestriction(bool _restrictRouter) external;
    function setInputRestriction(bool _inputRestiction) external;
    function setOutputRestriction(bool _outputRestiction) external;
    function setApproveMax(bool _approveMax) external;
    function setAutoRevoke(bool _autoRevoke) external;
    function addToWhitelist(address _address) external;
    function removeFromWhitelist(address _address) external;
    function swap(
        address _input,
        address _output,
        uint256 _amountIn,
        uint256 _minAmountOut,
        address _targetRouter,
        bytes calldata _callData
    ) external payable returns (uint256 received, uint256 spent);

    function decodeAndSwap(
        IERC20 _input,
        IERC20 _output,
        uint256 _amount,
        bytes calldata _params
    ) external returns (uint256 received, uint256 spent);

    function multiSwap(
        address[] calldata _inputs,
        address[] calldata _outputs,
        uint256[] calldata _amountsIn,
        uint256[] calldata _minAmountsOut,
        address[] calldata _targetRouters,
        bytes[] calldata _params
    ) external returns (uint256[] memory received, uint256[] memory spent);

    function decodeAndMultiSwap(
        address[] calldata _inputs,
        address[] calldata _outputs,
        uint256[] calldata _amountsIn,
        bytes[] calldata _params
    ) external returns (uint256[] memory received, uint256[] memory spent);
}
