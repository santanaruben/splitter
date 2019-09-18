pragma solidity ^0.5.2;

import "./SafeMath.sol";

contract Splitter {

    event LogSplit(uint value, address indexed alice, address indexed bob, address indexed carol);
    event LogSendAmount(uint value, address indexed alice);
    event LogWithdraw(uint value, address indexed account);

    using SafeMath for uint256;
    
    mapping(address => uint) public balances;
    
    function getBalance(address account) public view returns (uint) {
        return balances[account];
    }
    
    function sendAmount() public payable {
        balances[msg.sender] = balances[msg.sender].add(msg.value);
        emit LogSendAmount(msg.value, msg.sender);
    }

    function withdraw(uint amount) public {
        require(tx.origin == msg.sender);
        require(balances[msg.sender] >= amount, "Not enough money to withdraw");
        balances[msg.sender] = balances[msg.sender].sub(amount);
        msg.sender.transfer(amount);
        emit LogWithdraw(amount, msg.sender);
    }

    function split(uint value, address payable bob, address payable carol) public {
        require(balances[msg.sender] >= value, "Not enough money to split");
        require((value > 1), "Value must be greater than 1");
        if (value.mod(2) == 0) {
            balances[msg.sender] = balances[msg.sender].sub(value);
        }
        else {
            balances[msg.sender] = balances[msg.sender].sub(value.sub(1));
        }
        uint valueSplited = value.div(2);
        balances[bob] = balances[bob].add(valueSplited);
        balances[carol] = balances[carol].add(valueSplited);
        emit LogSplit(value, msg.sender, bob, carol);
    }
}