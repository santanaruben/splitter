pragma solidity ^0.5.8;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Splitter.sol";

contract TestSplitter {

    event TestLogWitdraw(uint balanceBefore, uint BalanceExpected);

    uint public initialBalance = 0.00000001 ether;
    //Splitter s = Splitter(DeployedAddresses.Splitter());
    Splitter s = new Splitter(false);
    address payable bob = 0xd1Ca626Ec4f22303fe2a39b4433bb2966fbfB960;
    address payable carol = 0x694531ee726aEd7Aee986bFD47d13E98c67087e1;

    function testSplitEven() public {
        uint balanceBobBefore = s.getBalance(bob);
        uint balanceCarolBefore = s.getBalance(carol);
        uint balanceBobExpected = balanceBobBefore + uint(1);
        uint balanceCarolExpected = balanceCarolBefore + uint(1);
        s.split.value(2)(bob, carol);
        uint balanceBobAfter = s.getBalance(bob);
        uint balanceCarolAfter = s.getBalance(carol);
        Assert.equal(balanceBobAfter, balanceBobExpected, "Bob should have 1 wei more");
        Assert.equal(balanceCarolAfter, balanceCarolExpected, "Carol should have 1 wei more");
    }

    function testSplitOdd() public {
        uint balanceBobBefore = s.getBalance(bob);
        uint balanceCarolBefore = s.getBalance(carol);
        uint balanceBobExpected = balanceBobBefore + uint(1);
        uint balanceCarolExpected = balanceCarolBefore + uint(1);
        s.split.value(3)(bob, carol);
        uint balanceBobAfter = s.getBalance(bob);
        uint balanceCarolAfter = s.getBalance(carol);
        Assert.equal(balanceBobAfter, balanceBobExpected, "Bob should have 1 wei more");
        Assert.equal(balanceCarolAfter, balanceCarolExpected, "Carol should have 1 wei more");
    }
}
