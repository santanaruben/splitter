const Splitter = artifacts.require("Splitter.sol");
const bigInt = require('../src/js/BigInteger.min.js');

contract('Splitter', (accounts) => {
  it('should send wei to the contract', async () => {
    const splitterInstance = await Splitter.deployed();

    // Setup 2 accounts.
    const accountContract = splitterInstance.address;
    const accountAlice = accounts[0];

    // Calculate balance expected.
    const amount = 6;
    const balanceContractExpected = (bigInt((await web3.eth.getBalance(accountContract))).add(amount)).toString();

    // Transaction.
    await splitterInstance.sendAmount({
      value: amount,
      from: accountAlice
    });

    // Get balance after the transaction.
    const balanceContractAfterTx = (await web3.eth.getBalance(accountContract)).toString();

    // Check
    assert.equal(balanceContractAfterTx, balanceContractExpected, "Balance error in Contract account")
  });

  it('should split the even amount correctly', async () => {
    const splitterInstance = await Splitter.deployed();

    // Setup 3 accounts.
    const accountAlice = accounts[0];
    const accountBob = accounts[1];
    const accountCarol = accounts[2];

    // Calculate balances expected.
    const amount = 2;
    const amountSplitted = amount / 2;
    balanceBob = new web3.utils.BN(await splitterInstance.getBalance(accountBob));
    var balanceBobExpected = (balanceBob.add(new web3.utils.BN(amountSplitted))).toString();
    balanceCarol = new web3.utils.BN(await splitterInstance.getBalance(accountCarol));
    var balanceCarolExpected = (balanceCarol.add(new web3.utils.BN(amountSplitted))).toString();

    // Transaction.
    await splitterInstance.split(amount, accountBob, accountCarol, {
      from: accountAlice
    });

    // Get balances of first and second account after the transactions.
    balanceBobAfterTx = new web3.utils.BN(await splitterInstance.getBalance(accountBob));
    balanceCarolAfterTx = new web3.utils.BN(await splitterInstance.getBalance(accountCarol));

    // Check
    assert.equal(balanceBobAfterTx.toString(), balanceBobExpected, "Balance error in account 1")
    assert.equal(balanceCarolAfterTx.toString(), balanceCarolExpected, "Balance error in account 2")
  });

  it('should split the odd amount correctly', async () => {
    const splitterInstance = await Splitter.deployed();

    // Setup 3 accounts.
    const accountAlice = accounts[0];
    const accountBob = accounts[1];
    const accountCarol = accounts[2];

    // Calculate balances expected.
    const amount = 3;
    const amountSplitted = 1;
    balanceBob = new web3.utils.BN(await splitterInstance.getBalance(accountBob));
    var balanceBobExpected = (balanceBob.add(new web3.utils.BN(amountSplitted))).toString();
    balanceCarol = new web3.utils.BN(await splitterInstance.getBalance(accountCarol));
    var balanceCarolExpected = (balanceCarol.add(new web3.utils.BN(amountSplitted))).toString();

    // Transaction.
    await splitterInstance.split(amount, accountBob, accountCarol, {
      from: accountAlice
    });

    // Get balances of first and second account after the transactions.
    balanceBobAfterTx = new web3.utils.BN(await splitterInstance.getBalance(accountBob));
    balanceCarolAfterTx = new web3.utils.BN(await splitterInstance.getBalance(accountCarol));

    // Check
    assert.equal(balanceBobAfterTx.toString(), balanceBobExpected, "Balance error in account 1")
    assert.equal(balanceCarolAfterTx.toString(), balanceCarolExpected, "Balance error in account 2")
  });

  it('should withdraw the amount from the contract', async () => {
    const splitterInstance = await Splitter.deployed();

    // Setup 2 accounts.
    const accountContract = splitterInstance.address;
    const accountAlice = accounts[0];

    // Calculate balance expected.
    const amount = 2;
    balanceContract = new web3.utils.BN(await web3.eth.getBalance(accountContract));
    var balanceContractExpected = (balanceContract.sub(new web3.utils.BN(amount))).toString();

    // Transaction.
    await splitterInstance.withdraw(amount, {
      from: accountAlice
    });

    // Get balances after the transaction.
    balanceContractAfterTx = new web3.utils.BN(await web3.eth.getBalance(accountContract));

    // Check
    assert.equal(balanceContractAfterTx.toString(), balanceContractExpected, "Balance error in Contract account")
  });
});