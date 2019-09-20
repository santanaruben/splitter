pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

contract Splitter is Ownable, Pausable {

    event LogSplit(uint value, address indexed alice, address indexed bob, address indexed carol);
    event LogSendAmount(uint value, address indexed alice);
    event LogWithdraw(uint value, address indexed account);
    event LogEmergencyWithdraw(uint value, address indexed account);
    event LogRefund(uint value, address indexed account);

    using SafeMath for uint256;
    
    mapping(address => uint) public balances;
    
    function getBalance(address account) public view returns (uint) {
        return balances[account];
    }
    
    function sendAmount() public payable whenNotPaused {
        balances[msg.sender] = balances[msg.sender].add(msg.value);
        emit LogSendAmount(msg.value, msg.sender);
    }

    function withdraw(uint amount) public whenNotPaused {
        require(tx.origin == msg.sender);
        require(enoughBalance(amount), "Not enough money to withdraw");
        balances[msg.sender] = balances[msg.sender].sub(amount);
        msg.sender.transfer(amount);
        emit LogWithdraw(amount, msg.sender);
    }

    function split(uint value, address payable bob, address payable carol) public whenNotPaused {
        require(enoughBalance(value), "Not enough money to split");
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

    function enoughBalance(uint value) public view returns(bool) {
        if (balances[msg.sender] >= value)
            return true;
        else
            return false;
    }

    function emergencyWithdraw() public onlyOwner whenPaused {
        uint amount = address(this).balance;
        msg.sender.transfer(amount);
        emit LogEmergencyWithdraw(amount, msg.sender);
    }

    function refund() public payable onlyOwner whenPaused {
        uint amount = msg.value;
        emit LogRefund(amount, msg.sender);
    }
}