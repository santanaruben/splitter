pragma solidity ^0.5.8;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Splitter.sol";

contract TestSplitter {

    uint public initialBalance = 0.0001 ether;
    Splitter s = Splitter(DeployedAddresses.Splitter());
    address payable bob = 0x1862e9E67BD603Bb795E8D6c59849eB5394db9bb;
    address payable carol = 0xcA4Dcd5E1D31D6EDFD51863B91e39920a8DD7B78;

    function testSplit() public payable returns(address) {
        uint balanceBobBefore = address(bob).balance;
        uint balanceCarolBefore = address(carol).balance;
        uint balanceBobAfter = balanceBobBefore + 1;
        uint balanceCarolAfter = balanceCarolBefore + 1;
        s.split.value(2)(bob, carol);

        Assert.equal(address(bob).balance, balanceBobAfter, "Bob should have 1 wei more");
        Assert.equal(address(carol).balance, balanceCarolAfter, "Carol should have 1 wei more");
    }
}
