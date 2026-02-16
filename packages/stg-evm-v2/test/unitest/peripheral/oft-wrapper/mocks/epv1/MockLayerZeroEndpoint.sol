pragma solidity ^0.8.0;

contract MockLayerZeroEndpoint {
    uint16 private constant MOCK_SEND_VERSION = 1;
    uint64 private constant MOCK_BLOCK_CONFIRMATIONS = 2;

    function getSendVersion(address _userApplication) external view returns (uint16) {
        return MOCK_SEND_VERSION;
    }

    function getConfig(
        uint16 _version,
        uint16 _chainId,
        address _userApplication,
        uint _configType
    ) external view returns (bytes memory) {
        return abi.encode(MOCK_BLOCK_CONFIRMATIONS);
    }
}
