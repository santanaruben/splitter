const Splitter = artifacts.require("Splitter");
const bigInt = require('../src/js/BigInteger.min.js');

contract('Splitter', (accounts) => {
  it('should split the amount and send wei correctly', async () => {
    const splitterInstance = await Splitter.deployed();

    // Setup 3 accounts.
    const accountAlice = accounts[0];
    const accountBob = accounts[1];
    const accountCarol = accounts[2];

    // Calculate balances expected.
    const amount = 2;
    const amountSplitted = amount/2;
    const balanceBobExpected = (bigInt((await web3.eth.getBalance(accountBob))).add(amountSplitted)).toString();
    const balanceCarolExpected = (bigInt((await web3.eth.getBalance(accountCarol))).add(amountSplitted)).toString();
    
    // Transaction.
    await splitterInstance.split(accountBob, accountCarol, { value: amount, from: accountAlice });

    // Get balances of first and second account after the transactions.
    const balanceBobAfterTx = (await web3.eth.getBalance(accountBob)).toString();
    const balanceCarolAfterTx = (await web3.eth.getBalance(accountCarol)).toString();

    // Check
    assert.equal(balanceBobAfterTx, balanceBobExpected, "Balance error in account 1")
    assert.equal(balanceCarolAfterTx, balanceCarolExpected, "Balance error in account 2")
  });
});
