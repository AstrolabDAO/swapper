// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libs/BitMask.sol";

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
contract Swapper is Ownable {
    using SafeERC20 for IERC20;
    using BitMask for uint256;

    /**
     * @notice Restrictions bitmask, positions:
     * 0 = restrictCaller
     * 1 = restrictRouter
     * 2 = restrictInput
     * 3 = restrictOutput
     * 4 = approveMax
     * 5 = autoRevoke
     */
    uint256 private restrictions = 0;
    mapping(address => bool) private whitelist; // whitelisted addresses (for tokens and callers)

    // Events
    event Swapped(
        address indexed user,
        address indexed assetIn,
        address indexed assetOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event Whitelisted(address indexed account); // caller/asset/router whitelist
    event RemovedFromWhitelist(address indexed account);

    error CallRestricted();
    error RouterError();
    error UnexpectedOutput();
    error SlippageTooHigh();

    constructor() Ownable() {
        restrictions.setBit(1); // restrictRouter
        restrictions.setBit(4); // approveMax
    }

    /**
     * @notice Toggles caller restriction (only whitelisted can swap)
     * @param _restrictCaller Boolean value to set restrictCaller
     */
    function setCallerRestriction(bool _restrictCaller) external onlyOwner {
        restrictions = _restrictCaller
            ? restrictions.setBit(0)
            : restrictions.resetBit(0);
    }

    /**
     * @notice Toggles router restriction (only whitelisted can be used as router)
     * @param _restrictRouter Boolean value to set restrictRouter
     */
    function setRouterRestriction(bool _restrictRouter) external onlyOwner {
        restrictions = _restrictRouter
            ? restrictions.setBit(1)
            : restrictions.resetBit(1);
    }

    /**
     * @notice Toggles input token restriction
     * @param _inputRestiction Boolean value to set inputRestiction
     */
    function setInputRestriction(bool _inputRestiction) external onlyOwner {
        restrictions = _inputRestiction
            ? restrictions.setBit(2)
            : restrictions.resetBit(2);
    }

    /**
     * @notice Toggles output token restriction
     * @param _outputRestiction Boolean value to set outputRestiction
     */
    function setOutputRestriction(bool _outputRestiction) external onlyOwner {
        restrictions = _outputRestiction
            ? restrictions.setBit(3)
            : restrictions.resetBit(3);
    }

    /**
     * @notice Toggles default max approval (approve max amount to router on first use)
     * @param _approveMax Boolean value to set approveMax
     */
    function setApproveMax(bool _approveMax) external onlyOwner {
        restrictions = _approveMax
            ? restrictions.setBit(4)
            : restrictions.resetBit(4);
    }

    /**
     * @notice Toggles auto revoke approval (revoke router approval after every swap)
     * @param _autoRevoke Boolean value to set autoRevoke
     */
    function setAutoRevoke(bool _autoRevoke) external onlyOwner {
        restrictions = _autoRevoke
            ? restrictions.setBit(5)
            : restrictions.resetBit(5);
    }

    /**
     * @notice Adds an address to the whitelist (caller/asset/router)
     * @param _address Address to be added to the whitelist
     */
    function addToWhitelist(address _address) external onlyOwner {
        whitelist[_address] = true;
        emit Whitelisted(_address);
    }

    /**
     * @notice Removes an address from the whitelist (caller/asset/router)
     * @param _address Address to be removed from the whitelist
     */
    function removeFromWhitelist(address _address) external onlyOwner {
        whitelist[_address] = false;
        emit RemovedFromWhitelist(_address);
    }

    /**
     * @notice Checks if an address is whitelisted (caller/asset/router)
     * @param _address Address to check
     * @return Boolean indicating whether the whitelisting is whitelisted
     */
    function isWhitelisted(address _address) public view returns (bool) {
        return whitelist[_address];
    }

    /**
     * @notice Returns true if the caller is restricted for the given address
     * @param _caller Address to check for caller restriction
     * @return Boolean indicating whether the caller is restricted
     */
    function isCallerRestricted(address _caller) public view returns (bool) {
        return restrictions.getBit(0) && !isWhitelisted(_caller);
    }

    /**
     * @notice Returns true if the router is restricted for the given address
     * @param _router Address to check for router restriction
     * @return Boolean indicating whether the router is restricted
     */
    function isRouterRestricted(address _router) public view returns (bool) {
        return restrictions.getBit(1) && !isWhitelisted(_router);
    }

    /**
     * @notice Returns true if the input token is restricted for the given address
     * @param _input Address to check for input token restriction
     * @return Boolean indicating whether the input token is restricted
     */
    function isInputRestricted(address _input) public view returns (bool) {
        return restrictions.getBit(2) && !isWhitelisted(_input);
    }

    /**
     * @notice Returns true if the output token is restricted for the given address
     * @param _output Address to check for output token restriction
     * @return Boolean indicating whether the output token is restricted
     */
    function isOutputRestricted(address _output) public view returns (bool) {
        return restrictions.getBit(3) && !isWhitelisted(_output);
    }

    /**
     * @notice Returns true if the contract is set to approve the maximum amount to the router on the first use
     * @return Boolean indicating whether the contract is set to approve the maximum amount
     */
    function isApproveMax() public view returns (bool) {
        return restrictions.getBit(4);
    }

    /**
     * @notice Returns true if the contract is set to automatically revoke router approval after every swap
     * @return Boolean indicating whether the contract is set to automatically revoke approval
     */
    function isAutoRevoke() public view returns (bool) {
        return restrictions.getBit(5);
    }

    /**
     * @notice Executes a single swap
     * @param _input Address of the input token
     * @param _output Address of the output token
     * @param _amountIn Amount of input tokens to swap
     * @param _minAmountOut Minimum amount of output tokens to receive from the swap
     * @param _targetRouter Address of the router to be used for the swap
     * @param _callData Encoded routing data (built off-chain) to be passed to the router
     * NOTE: Receiver should be msg.sender in calldata
     * @return received Amount of output tokens received
     * @return spent Amount of input tokens spent
     */
    function swap(
        address _input,
        address _output,
        uint256 _amountIn,
        uint256 _minAmountOut,
        address _targetRouter,
        bytes memory _callData
    ) public payable returns (uint256 received, uint256 spent) {
        if (
            isInputRestricted(_input) ||
            isOutputRestricted(_output) ||
            isRouterRestricted(_targetRouter) ||
            isCallerRestricted(msg.sender)
        ) revert CallRestricted();

        (IERC20 input, IERC20 output) = (IERC20(_input), IERC20(_output));

        (uint256 inputBefore, uint256 outputBefore) = (
            input.balanceOf(msg.sender),
            output.balanceOf(msg.sender)
        );

        input.safeTransferFrom(msg.sender, address(this), _amountIn);

        if (input.allowance(address(this), _targetRouter) < _amountIn)
            input.approve(
                _targetRouter,
                isApproveMax() ? type(uint256).max : _amountIn
            );

        (bool ok, ) = address(_targetRouter).call(_callData);
        if (!ok) revert RouterError();

        received = output.balanceOf(msg.sender) - outputBefore;
        spent = inputBefore - input.balanceOf(msg.sender);

        if (spent < 1 || received < 1) revert UnexpectedOutput();

        if (received < _minAmountOut) revert SlippageTooHigh();

        if (isAutoRevoke()) input.approve(_targetRouter, 0);
        emit Swapped(msg.sender, _input, _output, _amountIn, received);
    }

    /**
     * @notice Executes a single swap using the entire balance of the input token
     * @param _input Address of the input token
     * @param _output Address of the output token
     * @param _minAmountOut Minimum amount of output tokens to receive from the swap
     * @param _targetRouter Address of the router to be used for the swap
     * @param _callData Encoded routing data (built off-chain) to be passed to the router
     * @return received Amount of output tokens received
     * @return spent Amount of input tokens spent
     */
    function swapBalance(
        address _input,
        address _output,
        uint256 _minAmountOut,
        address _targetRouter,
        bytes memory _callData
    ) public payable returns (uint256 received, uint256 spent) {
        return
            swap(
                _input,
                _output,
                IERC20(_input).balanceOf(msg.sender),
                _minAmountOut,
                _targetRouter,
                _callData
            );
    }

    /**
     * @notice Helper function to decode swap parameters (router+minAmountOut+callData)
     * @param _params Encoded swap parameters
     * @return target Router address
     * @return minAmount Minimum output amount
     * @return callData Encoded routing data (built off-chain) to be passed to the router
     */
    function decodeSwapperParams(
        bytes memory _params
    )
        internal
        pure
        returns (address target, uint256 minAmount, bytes memory callData)
    {
        return abi.decode(_params, (address, uint256, bytes));
    }

    /**
     * @notice Returns the swap output amount
     * @dev We consider this (strat) to be the sole receiver of all swaps
     * @param _input Asset to be swapped into strategy input
     * @param _output Asset to invest
     * @param _amount Amount of _input to be swapped
     * @param _params Encoded swap parameters
     * @return received Amount of output tokens received
     * @return spent Amount of input tokens spent
     */
    function decodeAndSwap(
        address _input,
        address _output,
        uint256 _amount,
        bytes memory _params
    ) public returns (uint256 received, uint256 spent) {
        (
            address targetRouter,
            uint256 minAmountReceived,
            bytes memory swapData
        ) = decodeSwapperParams(_params);

        return
            swap({
                _input: _input,
                _output: _output,
                _amountIn: _amount,
                _minAmountOut: minAmountReceived,
                _targetRouter: targetRouter,
                _callData: swapData
            });
    }

    /**
     * @notice Executes a single swap using the entire balance of the input token
     * @param _input Address of the input token
     * @param _output Address of the output token
     * @param _params Encoded swap parameters
     * @return received Amount of output tokens received
     * @return spent Amount of input tokens spent
     */
    function decodeAndSwapBalance(
        address _input,
        address _output,
        bytes memory _params
    ) public returns (uint256 received, uint256 spent) {
        return
            decodeAndSwap(
                _input,
                _output,
                IERC20(_input).balanceOf(msg.sender),
                _params
            );
    }

    /**
     * @notice Helper function to execute multiple swaps
     * @param _inputs Array of input token addresses
     * @param _outputs Array of output token addresses
     * @param _amountsIn Array of input token amounts for each swap
     * @param _minAmountsOut Array of minimum output token amounts for each swap
     * @param _targetRouters Array of router addresses to be used for each swap
     * @param _params Array of encoded routing data (built off-chain) to be passed to the router
     * @return received Array of output token amounts received for each swap
     * @return spent Array of input token amounts spent for each swap
     */
    function multiSwap(
        address[] memory _inputs,
        address[] memory _outputs,
        uint256[] memory _amountsIn,
        uint256[] memory _minAmountsOut,
        address[] memory _targetRouters,
        bytes[] memory _params
    ) public returns (uint256[] memory received, uint256[] memory spent) {
        require(
            _inputs.length == _outputs.length &&
                _inputs.length == _amountsIn.length &&
                _inputs.length == _minAmountsOut.length &&
                _inputs.length == _params.length,
            "invalid input"
        );
        received = new uint256[](_inputs.length);
        spent = new uint256[](_inputs.length);
        for (uint256 i = 0; i < _inputs.length; i++)
            (received[i], spent[i]) = swap(
                _inputs[i],
                _outputs[i],
                _amountsIn[i],
                _minAmountsOut[i],
                _targetRouters[i],
                _params[i]
            );
    }

    /**
     * @notice Executes multiple swaps using the entire balance of the input token for each swap
     * @param _inputs Array of input token addresses
     * @param _outputs Array of output token addresses
     * @param _minAmountsOut Array of minimum output token amounts for each swap
     * @param _targetRouters Array of router addresses to be used for each swap
     * @param _params Array of encoded routing data (built off-chain) to be passed to the router
     * @return received Array of output token amounts received for each swap
     * @return spent Array of input token amounts spent for each swap
     */
    function multiSwapBalances(
        address[] memory _inputs,
        address[] memory _outputs,
        uint256[] memory _minAmountsOut,
        address[] memory _targetRouters,
        bytes[] memory _params
    ) public returns (uint256[] memory received, uint256[] memory spent) {
        require(
            _inputs.length == _outputs.length &&
                _inputs.length == _minAmountsOut.length &&
                _inputs.length == _targetRouters.length &&
                _inputs.length == _params.length,
            "invalid input"
        );
        received = new uint256[](_inputs.length);
        spent = new uint256[](_inputs.length);
        for (uint256 i = 0; i < _inputs.length; i++)
            (received[i], spent[i]) = swapBalance(
                _inputs[i],
                _outputs[i],
                _minAmountsOut[i],
                _targetRouters[i],
                _params[i]
            );
    }

    /**
     * @notice Executes multiple swaps using the entire balance of the input token for each swap
     * @param _inputs Array of input token addresses
     * @param _outputs Array of output token addresses
     * @param _amountsIn Array of input token amounts for each swap
     * @param _params Array of encoded routing data (built off-chain) to be passed to the router
     * @return received Array of output token amounts received for each swap
     * @return spent Array of input token amounts spent for each swap
     */
    function decodeAndMultiSwap(
        address[] memory _inputs,
        address[] memory _outputs,
        uint256[] memory _amountsIn,
        bytes[] memory _params
    ) public returns (uint256[] memory received, uint256[] memory spent) {
        require(
            _inputs.length == _outputs.length &&
                _inputs.length == _amountsIn.length &&
                _inputs.length == _params.length,
            "invalid input"
        );
        received = new uint256[](_inputs.length);
        spent = new uint256[](_inputs.length);
        for (uint256 i = 0; i < _inputs.length; i++)
            (received[i], spent[i]) = decodeAndSwap(
                _inputs[i],
                _outputs[i],
                _amountsIn[i],
                _params[i]
            );
    }

    /**
     * @notice Executes multiple swaps using the entire balance of the input token for each swap
     * @param _inputs Array of input token addresses
     * @param _outputs Array of output token addresses
     * @param _params Array of encoded routing data (built off-chain) to be passed to the router
     * @return received Array of output token amounts received for each swap
     * @return spent Array of input token amounts spent for each swap
     */
    function decodeAndMultiSwapBalances(
        address[] memory _inputs,
        address[] memory _outputs,
        bytes[] memory _params
    ) public returns (uint256[] memory received, uint256[] memory spent) {
        require(
            _inputs.length == _outputs.length &&
                _inputs.length == _params.length,
            "invalid input"
        );
        received = new uint256[](_inputs.length);
        spent = new uint256[](_inputs.length);
        for (uint256 i = 0; i < _inputs.length; i++)
            (received[i], spent[i]) = decodeAndSwapBalance(
                _inputs[i],
                _outputs[i],
                _params[i]
            );
    }
}
