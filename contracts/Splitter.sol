pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

contract Splitter is Ownable, Pausable {

    event LogSplitted(uint value, address indexed alice, address indexed bob, address indexed carol);
    event LogWithdrawn(uint value, address indexed account);
    event LogEmergencyWithdrawn(uint value, address indexed account);
    event LogRefunded(uint value, address indexed account);

    using SafeMath for uint256;
    
    mapping(address => uint) public balances;
    
    function getBalance(address account) public view returns (uint) {
        return balances[account];
    }

    function withdraw(uint amount) public whenNotPaused {
        uint balance = balances[msg.sender];
        require(balance >= amount, "Not enough money to withdraw");
        balances[msg.sender] = balance.sub(amount);
        msg.sender.transfer(amount);
        emit LogWithdrawn(amount, msg.sender);
    }

    function split(address bob, address carol) public payable whenNotPaused {
        uint value = msg.value;
        require((value > 1), "Value must be greater than 1");
        uint balance = address(msg.sender).balance;
        require(balance >= value, "Not enough money to split");
        uint valueSplited = value.div(2);
        balances[bob] = balances[bob].add(valueSplited);
        balances[carol] = balances[carol].add(value.sub(valueSplited));
        emit LogSplitted(value, msg.sender, bob, carol);
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
        emit LogEmergencyWithdrawn(amount, msg.sender);
    }

    function refund() public payable onlyOwner whenPaused {
        uint amount = msg.value;
        emit LogRefunded(amount, msg.sender);
    }
}