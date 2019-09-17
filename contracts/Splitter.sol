pragma solidity ^0.5.8;

contract Splitter {

    event LogSplit(uint value, address alice, address bob, address carol);

    function split(address payable bob, address payable carol) public payable {
        uint value = msg.value;
        require((value > 0) && (value % 2 == 0), "Value must be greater than 0 and must be even");
        bob.transfer(value/2);
        carol.transfer(value/2);
        emit LogSplit(value, msg.sender, bob, carol);
    }
}