pragma solidity ^0.5.8;

contract Ownable {
    address private _owner;
    event LogTransferredOwnership(address indexed oldOwner, address indexed newOwner);

    constructor () public {
        _owner = msg.sender;
    }

    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Not the owner");
        _;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Contract need an owner");
        require(newOwner != _owner, "Same owner");
        emit LogTransferredOwnership(_owner, newOwner);
        _owner = newOwner;
    }
}
