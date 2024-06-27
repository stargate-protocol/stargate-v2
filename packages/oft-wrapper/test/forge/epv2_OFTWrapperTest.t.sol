// SPDX-LICENSE-Identifier: UNLICENSED

pragma solidity ^0.8.22;

import { IOFTWrapper } from "../../contracts/interfaces/IOFTWrapper.sol";
import { LzTestHelper } from "./layerzero/LzTestHelper.sol";
import { Test, console } from "@layerzerolabs/toolbox-foundry/lib/forge-std/Test.sol";
import { MockOFT } from "./mocks/MockOFT.sol";
import { OFTWrapper } from "../../contracts/OFTWrapper.sol";
import { IOFT as epv2_IOFT, MessagingFee as epv2_MessagingFee, SendParam as epv2_SendParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract epv2_OFTWrapperTest is Test, LzTestHelper {
    using OptionsBuilder for bytes;

    uint8 internal constant NUM_ENDPOINTS = 2;

    OFTWrapper internal oftWrapper;
    MockOFT internal oftA;
    MockOFT internal oftB;

    function setUp() public {
        setUpEndpoints(NUM_ENDPOINTS);

        oftWrapper = new OFTWrapper(1000);

        oftA = new MockOFT("OFT", "OFT", endpoints[1], address(this));
        oftB = new MockOFT("OFT", "OFT", endpoints[2], address(this));

        oftA.setPeer(2, _addressToBytes32(address(oftB)));
        oftB.setPeer(1, _addressToBytes32(address(oftA)));
    }

    function test_send() public {
        oftA.mint(address(this), 1e14);

        epv2_SendParam memory sendParam = epv2_SendParam(
            2,
            _addressToBytes32(address(this)),
            1e14,
            1e12,
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0),
            bytes(""),
            ""
        );

        epv2_MessagingFee memory fee = oftWrapper.epv2_estimateSendFee(address(oftA), sendParam, false);

        IOFTWrapper.FeeObj memory feeObj = IOFTWrapper.FeeObj({
            callerBps: 1000,
            caller: address(this),
            partnerId: bytes2(0x0001)
        });

        IERC20(oftA).approve(address(oftWrapper), 1e14);
        oftWrapper.epv2_sendOFT{ value: fee.nativeFee }(address(oftA), sendParam, fee, address(this), feeObj);

        verifyAndExecutePackets();

        assertEq(1_000_000, IERC20(oftB).balanceOf(address(this)));
    }

    function _addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}
