pragma solidity ^0.5.8;

import "./SafeMath.sol";
import "./Killable.sol";

contract Splitter is Killable {

    event LogSplitted(uint value, address indexed alice, address indexed bob, address indexed carol);
    event LogWithdrawn(uint value, address indexed account);
    event LogEmergencyWithdrawn(uint value, address indexed account);
    event LogRefunded(uint value, address indexed account);

    using SafeMath for uint256;
    
    mapping(address => uint) public balances;

    constructor(bool _paused) Pausable(_paused) public {
    }
    
    function getBalance(address account) public view returns (uint) {
        return balances[account];
    }

    function withdraw(uint amount) public whenRunning whenAlive {
        uint balance = balances[msg.sender];
        require(balance >= amount, "Not enough money to withdraw");
        balances[msg.sender] = balance.sub(amount);
        emit LogWithdrawn(amount, msg.sender);
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "Transfer failed.");
    }

    function split(address bob, address carol) public payable whenRunning whenAlive {
        require(msg.value > 1, "Value must be greater than 1");
        uint valueSplited = msg.value.div(2);
        balances[msg.sender] = balances[msg.sender].add(msg.value.mod(2));
        balances[bob] = balances[bob].add(valueSplited);
        balances[carol] = balances[carol].add(valueSplited);
        emit LogSplitted(msg.value, msg.sender, bob, carol);
    }

    function emergencyWithdraw() public onlyOwner whenDead {
        uint amount = address(this).balance;
        emit LogWithdrawn(amount, msg.sender);
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success, "Transfer failed.");
    }
}