// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**            _             _       _
 *    __ _ ___| |_ _ __ ___ | | __ _| |__
 *   /  ` / __|  _| '__/   \| |/  ` | '  \
 *  |  O  \__ \ |_| | |  O  | |  O  |  O  |
 *   \__,_|___/.__|_|  \___/|_|\__,_|_.__/  ©️ 2023
 *
 * @title Swapper - On-chain swap calldata executor
 * @author Astrolab DAO
 * @notice This contract gatekeeps the execution of foreign swap calldata
 * @dev The swap calldata can be generated using the swapper SDK https://github.com/AstrolabDAO/swapper
 */
interface ISwapper {
    event Swapped(
        address indexed user,
        address indexed assetIn,
        address indexed assetOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event Whitelisted(address indexed account);
    event RemovedFromWhitelist(address indexed account);

    function setCallerRestriction(bool _restrictCaller) external;
    function setRouterRestriction(bool _restrictRouter) external;
    function setInputRestriction(bool _inputRestiction) external;
    function setOutputRestriction(bool _outputRestiction) external;
    function setApproveMax(bool _approveMax) external;
    function setAutoRevoke(bool _autoRevoke) external;
    function addToWhitelist(address _address) external;
    function removeFromWhitelist(address _address) external;
    function isWhitelisted(address _address) external view returns (bool);
    function isCallerRestricted(address _caller) external view returns (bool);
    function isRouterRestricted(address _router) external view returns (bool);
    function isInputRestricted(address _input) external view returns (bool);
    function isOutputRestricted(address _output) external view returns (bool);
    function isApproveMax() external view returns (bool);
    function isAutoRevoke() external view returns (bool);

    function swap(
        address _input,
        address _output,
        uint256 _amountIn,
        uint256 _minAmountOut,
        address _targetRouter,
        bytes memory _callData
    ) external payable returns (uint256 received, uint256 spent);

    function swapBalance(
        address _input,
        address _output,
        uint256 _minAmountOut,
        address _targetRouter,
        bytes memory _callData
    ) external payable returns (uint256 received, uint256 spent);

    function decodeSwapperParams(bytes memory _params)
        external
        pure
        returns (address target, uint256 minAmount, bytes memory callData);

    function decodeAndSwap(
        address _input,
        address _output,
        uint256 _amount,
        bytes memory _params
    ) external returns (uint256 received, uint256 spent);

    function decodeAndSwapBalance(
        address _input,
        address _output,
        bytes memory _params
    ) external returns (uint256 received, uint256 spent);

    function multiSwap(
        address[] memory _inputs,
        address[] memory _outputs,
        uint256[] memory _amountsIn,
        uint256[] memory _minAmountsOut,
        address[] memory _targetRouters,
        bytes[] memory _params
    ) external returns (uint256[] memory received, uint256[] memory spent);

    function multiSwapBalances(
        address[] memory _inputs,
        address[] memory _outputs,
        uint256[] memory _minAmountsOut,
        address[] memory _targetRouters,
        bytes[] memory _params
    ) external returns (uint256[] memory received, uint256[] memory spent);

    function decodeAndMultiSwap(
        address[] memory _inputs,
        address[] memory _outputs,
        uint256[] memory _amountsIn,
        bytes[] memory _params
    ) external returns (uint256[] memory received, uint256[] memory spent);

    function decodeAndMultiSwapBalances(
        address[] memory _inputs,
        address[] memory _outputs,
        bytes[] memory _params
    ) external returns (uint256[] memory received, uint256[] memory spent);
}
