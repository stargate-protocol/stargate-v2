// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { LibOFTFee } from "../libraries/LibOFTFee.sol";
import { AppStorage } from "../AppStorage.sol";
import { WrapperFeeWithdrawn } from "../interfaces/IOFTWrapper.sol";
import { IOFT as IOFTV1 } from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/interfaces/IOFT.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract OFTFeesFacet {
    using SafeERC20 for IOFTV1;

    AppStorage internal s;

    function defaultBps() public view returns (uint256) {
        return s.defaultBps;
    }

    function setDefaultBps(uint256 _defaultBps) external {
        LibDiamond.enforceIsContractOwner();
        require(_defaultBps < LibOFTFee.BPS_DENOMINATOR, "OFTWrapper: defaultBps >= 100%");
        s.defaultBps = _defaultBps;
    }

    function oftBps(address _token) public view returns (uint256) {
        return s.oftBps[_token];
    }

    function setOFTBps(address _token, uint256 _bps) external {
        LibDiamond.enforceIsContractOwner();
        require(_bps < LibOFTFee.BPS_DENOMINATOR || _bps == LibOFTFee.MAX_UINT, "OFTWrapper: oftBps[_oft] >= 100%");
        s.oftBps[_token] = _bps;
    }

    function withdrawFees(address _oft, address _to, uint256 _amount) external {
        LibDiamond.enforceIsContractOwner();
        IOFTV1(_oft).safeTransfer(_to, _amount);
        emit WrapperFeeWithdrawn(_oft, _to, _amount);
    }

    function getAmountAndFees(
        address _token,
        uint256 _amount,
        uint256 _callerBps
    ) public view returns (uint256 amount, uint256 wrapperFee, uint256 callerFee) {
        return LibOFTFee._getAmountAndFees(_token, _amount, _callerBps);
    }
}
