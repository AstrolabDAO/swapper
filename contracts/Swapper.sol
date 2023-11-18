// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libs/BitMask.sol";

/// @title Swapper
/// @dev Contract to proxy erc20 token swaps through a specified router
contract Swapper is Ownable {
	using SafeERC20 for IERC20;
	using BitMask for uint256;

	/// @notice restrictions bitmask, positions:
	// 0 = restrictCaller
	// 1 = restrictRouter
	// 2 = restrictInput
	// 3 = restrictOutput
	// 4 = approveMax
	// 5 = autoRevoke
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

	constructor() Ownable(msg.sender) {
		restrictions.setBit(1); // restrictRouter
		restrictions.setBit(4); // approveMax
	}

	/// @notice Toggles caller restriction (only whitelisted can swap)
	/// @param _restrictCaller Boolean value to set restrictCaller
	function setCallerRestriction(bool _restrictCaller) external onlyOwner {
		restrictions = _restrictCaller ? restrictions.setBit(0) : restrictions.resetBit(0);
	}

	/// @notice Toggles router restriction (only whitelisted can be used as router)
	/// @param _restrictRouter Boolean value to set restrictRouter
	function setRouterRestriction(bool _restrictRouter) external onlyOwner {
		restrictions = _restrictRouter ? restrictions.setBit(1) : restrictions.resetBit(1);
	}

	/// @notice Toggles input token restriction
	/// @param _inputRestiction Boolean value to set inputRestiction
	function setInputRestriction(bool _inputRestiction) external onlyOwner {
		restrictions = _inputRestiction ? restrictions.setBit(2) : restrictions.resetBit(2);
	}

	/// @notice Toggles output token restriction
	/// @param _outputRestiction Boolean value to set outputRestiction
	function setOutputRestriction(bool _outputRestiction) external onlyOwner {
		restrictions = _outputRestiction ? restrictions.setBit(3) : restrictions.resetBit(3);
	}

	/// @notice Toggles default max approval (approve max amount to router on first use)
	/// @param _approveMax Boolean value to set approveMax
	function setApproveMax(bool _approveMax) external onlyOwner {
		restrictions = _approveMax ? restrictions.setBit(4) : restrictions.resetBit(4);
	}

	/// @notice Toggles auto revoke approval (revoke router approval after every swap)
	/// @param _autoRevoke Boolean value to set autoRevoke
	function setAutoRevoke(bool _autoRevoke) external onlyOwner {
		restrictions = _autoRevoke ? restrictions.setBit(5) : restrictions.resetBit(5);
	}

	/// @notice Adds an address to the whitelist (caller/asset/router)
	/// @param _address Address to be added to the whitelist
	function addToWhitelist(address _address) external onlyOwner {
		whitelist[_address] = true;
		emit Whitelisted(_address);
	}

	/// @notice Removes an address from the whitelist (caller/asset/router)
	/// @param _address Address to be removed from the whitelist
	function removeFromWhitelist(address _address) external onlyOwner {
		whitelist[_address] = false;
		emit RemovedFromWhitelist(_address);
	}

	/// @notice Checks if an address is whitelisted (caller/asset/router)
	/// @param _address Address to check
	/// @return Boolean indicating whether the whitelisting is whitelisted
	function isWhitelisted(address _address) public view returns (bool) {
		return whitelist[_address];
	}

	function isCallerRestricted(address _caller) public view returns (bool) {
		return restrictions.getBit(0) && !isWhitelisted(_caller);
	}

	function isRouterRestricted(address _router) public view returns (bool) {
		return restrictions.getBit(1) && !isWhitelisted(_router);
	}

	function isInputRestricted(address _input) public view returns (bool) {
		return restrictions.getBit(2) && !isWhitelisted(_input);
	}

	function isOutputRestricted(address _output) public view returns (bool) {
		return restrictions.getBit(3) && !isWhitelisted(_output);
	}

	function isApproveMax() public view returns (bool) {
		return restrictions.getBit(4);
	}

	function isAutoRevoke() public view returns (bool) {
		return restrictions.getBit(5);
	}

	/// @notice executes a single swap
	/// @param _input Address of the input token
	/// @param _output Address of the output token
	/// @param _amountIn Amount of input tokens to swap
	/// @param _minAmountOut Minimum amount of output tokens to receive from the swap
	/// @param _targetRouter Address of the router to be used for the swap
	/// @param _callData Encoded routing data (built off-chain) to be passed to the router
	/// NOTE: Receiver should be msg.sender in calldata
	/// @return received Amount of output tokens received
	function _swap(
		address _input,
		address _output,
		uint256 _amountIn,
		uint256 _minAmountOut,
		address _targetRouter,
		bytes memory _callData
	) internal returns (uint256 received, uint256 spent) {
		if (isInputRestricted(_input)
			|| isOutputRestricted(_output)
			|| isRouterRestricted(_targetRouter)
			|| isCallerRestricted(msg.sender)
		) revert CallRestricted();

		(IERC20 input, IERC20 output) = (IERC20(_input), IERC20(_output));

        (uint256 inputBefore, uint256 outputBefore) = (
            input.balanceOf(address(this)),
            output.balanceOf(address(this))
        );

		input.safeTransferFrom(msg.sender, address(this), _amountIn);

		if (input.allowance(address(this), _targetRouter) < _amountIn)
			input.approve(_targetRouter, isApproveMax() ? type(uint256).max : _amountIn);

		(bool ok, ) = address(_targetRouter).call(_callData);
		if (!ok)
			revert RouterError();

		received = output.balanceOf(msg.sender) - outputBefore;
		spent = inputBefore - input.balanceOf(address(this));

		if (spent < 1 || received < 1)
			revert UnexpectedOutput();

		if (received < _minAmountOut)
			revert SlippageTooHigh();

		if (isAutoRevoke()) input.approve(_targetRouter, 0);
		emit Swapped(msg.sender, _input, _output, _amountIn, received);
	}

	/// @notice Executes a swap
	/// @dev Shares the same parameter descriptions as swap
	function swap(
		address _input,
		address _output,
		uint256 _amountIn,
		uint256 _minAmountOut,
		address _targetRouter,
		bytes memory _callData
	) external payable returns (uint256 received, uint256 spent) {
		return _swap(_input, _output, _amountIn, _minAmountOut, _targetRouter, _callData);
	}

	/// @notice Helper function to decode swap parameters (router+minAmountOut+callData)
	/// @param _params Encoded swap parameters
	/// @return target Router address
	/// @return minAmount Minimum output amount
	/// @return callData Encoded routing data (built off-chain) to be passed to the router
    function decodeSwapperParams(
        bytes memory _params
    )
        internal
        pure
        returns (address target, uint256 minAmount, bytes memory callData)
    {
        return abi.decode(_params, (address, uint256, bytes));
    }

    /// @notice Returns the swap output amount
    /// @dev we consider this (strat) to be the sole reciever of all swaps
    /// @param _input asset to be swapped into strategy input
    /// @param _output asset to invest
    /// @param _amount of _input to be swapped
    /// @param _params target router, minimum amount and generic callData (eg. SwapperParams)
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

        return _swap({
            _input: _input,
            _output: _output,
            _amountIn: _amount,
            _minAmountOut: minAmountReceived,
            _targetRouter: targetRouter,
            _callData: swapData
        });
    }

	/// @notice Helper function to execute multiple swaps
	/// @param _inputs Array of input token addresses
	/// @param _outputs Array of output token addresses
	/// @param _amountsIn Array of input token amounts for each swap
	/// @param _minAmountsOut Array of minimum output token amounts for each swap
	/// @param _targetRouters Array of router addresses to be used for each swap
	/// @param _params Array of encoded routing data (built off-chain) to be passed to the router
	/// @return received Array of output token amounts received for each swap
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
			(received[i], spent[i]) = _swap(
				_inputs[i],
				_outputs[i],
				_amountsIn[i],
				_minAmountsOut[i],
				_targetRouters[i],
				_params[i]
			);
	}

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
}
