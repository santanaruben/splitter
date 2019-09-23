const Splitter = artifacts.require("Splitter.sol");

contract('Splitter', (accounts) => {
  const BN = web3.utils.toBN;
  let splitterInstance, alice, bob, carol;
  [alice, bob, carol] = accounts;
  beforeEach("deploy new Splitter", function () {
    return Splitter.new(false,{
        from: alice
      })
      .then(instance => splitterInstance = instance);
  });

  it('should split the even amount correctly', async () => {
    // Calculate balances expected.
    const amount = 2;
    const amountSplitted = amount / 2;
    balanceBob = new BN(await splitterInstance.getBalance(bob));
    const balanceBobExpected = balanceBob.add(new BN(amountSplitted));
    balanceCarol = new BN(await splitterInstance.getBalance(carol));
    const balanceCarolExpected = balanceCarol.add(new BN(amountSplitted));

    // Transaction.
    await splitterInstance.split(bob, carol, {
      value: amount,
      from: alice
    });

    // Get balances of first and second account after the transactions.
    const balanceBobAfterTx = await splitterInstance.getBalance(bob);
    const balanceCarolAfterTx = await splitterInstance.getBalance(carol);

    // Check
    assert.equal(balanceBobAfterTx.toString(10), balanceBobExpected.toString(10), "Balance error in account 1")
    assert.equal(balanceCarolAfterTx.toString(10), balanceCarolExpected.toString(10), "Balance error in account 2")
  });

  it('should split the odd amount correctly', async () => {
    // Calculate balances expected.
    const amount = 3;
    const amountSplitted = Math.floor(amount/2);
    const remainder = amount % 2;
    balanceAlice = new BN(await splitterInstance.getBalance(alice));
    const balanceAliceExpected = balanceAlice.add(new BN(remainder));
    balanceBob = new BN(await splitterInstance.getBalance(bob));
    const balanceBobExpected = balanceBob.add(new BN(amountSplitted));
    balanceCarol = new BN(await splitterInstance.getBalance(carol));
    const balanceCarolExpected = balanceCarol.add(new BN(amountSplitted));
    // Alice Ethereum balance without value and transaction gas
    const balanceAliceEthereum = new BN(await web3.eth.getBalance(alice));

    // Transaction.
    const tx = await splitterInstance.split(bob, carol, {
      value: amount,
      from: alice
    });

    // Calculate Alice balance expected.
    gasUsed = new BN(tx.receipt.gasUsed);
    const gasPrice = await web3.eth.getGasPrice();
    gas = gasUsed.mul(new BN(gasPrice));
    const gasAndAmount = gas.add(new BN(amount));
    balanceAliceEthereumExpected = balanceAliceEthereum.sub(new BN(gasAndAmount));

    // Get balances after the transactions.
    const balanceAliceAfterTx = await splitterInstance.getBalance(alice);
    const balanceBobAfterTx = await splitterInstance.getBalance(bob);
    const balanceCarolAfterTx = await splitterInstance.getBalance(carol);
    const balanceAliceEthereumAfterTx = await web3.eth.getBalance(alice);

    // Check
    assert.equal(balanceAliceAfterTx.toString(10), balanceAliceExpected.toString(10), "Balance error in sender account")
    assert.equal(balanceBobAfterTx.toString(10), balanceBobExpected.toString(10), "Balance error in account 1")
    assert.equal(balanceCarolAfterTx.toString(10), balanceCarolExpected.toString(10), "Balance error in account 2")
    assert.equal(balanceAliceEthereumAfterTx.toString(10), balanceAliceEthereumExpected.toString(10), "Balance error in Alice Ethereum account")
  });

  it('should withdraw the amount from the contract', async () => {
    // Setup the contract account.
    const accountContract = splitterInstance.address;

    // Setup the amount.
    const amount = 20000;
    const amountSplitted = amount / 2;

    // Transaction1.
    await splitterInstance.split(alice, carol, {
      value: amount,
      from: bob
    });

    // Calculate balances expected.
    balanceContract = new BN(await web3.eth.getBalance(accountContract));
    const balanceContractExpected = balanceContract.sub(new BN(amountSplitted));
    balanceAlice = new BN(await splitterInstance.getBalance(alice));
    const balanceAliceExpected = balanceAlice.sub(new BN(amountSplitted));
    // Alice Ethereum balance without value and transaction gas
    const balanceAliceEthereum = new BN(await web3.eth.getBalance(alice));

    // Transaction2.
    const tx = await splitterInstance.withdraw(amountSplitted, {
      from: alice
    });

    // Calculate Alice balance expected.
    gasUsed = new BN(tx.receipt.gasUsed);
    const gasPrice = await web3.eth.getGasPrice();
    gas = gasUsed.mul(new BN(gasPrice));
    const gasAndAmount = gas.sub(new BN(amountSplitted));
    balanceAliceEthereumExpected = balanceAliceEthereum.sub(new BN(gasAndAmount));

    // Get balances after the transaction.
    const balanceContractAfterTx = await web3.eth.getBalance(accountContract);
    const balanceAliceAfterTx = await splitterInstance.getBalance(alice);
    const balanceAliceEthereumAfterTx = await web3.eth.getBalance(alice);

    // Check
    assert.equal(balanceContractAfterTx.toString(10), balanceContractExpected.toString(10), "Balance error in Contract account")
    assert.equal(balanceAliceAfterTx.toString(10), balanceAliceExpected.toString(10), "Balance error in Alice account")
    assert.equal(balanceAliceEthereumAfterTx.toString(10), balanceAliceEthereumExpected.toString(10), "Balance error in Alice Ethereum account")
  });
});