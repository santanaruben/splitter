App = {
  web3Provider: null,
  contracts: {},
  web3Instance: null,
  SplitterAbi: null,
  SplitterAddress: null,
  received: null,
  Splitter: null,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3(Web3.givenProvider || "ws://localhost:7545");
    }
    web3 = new Web3(App.web3Provider);
    App.web3Instance = web3;
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('Splitter.json', async function (data) {
      var SplitterArtifact = data;
      App.contracts.Splitter = TruffleContract(SplitterArtifact);
      App.contracts.Splitter.setProvider(App.web3Provider);
      App.SplitterAbi = SplitterArtifact.abi;
      var networkID = await web3.eth.net.getId();
      App.SplitterAddress = SplitterArtifact.networks[networkID].address;
      App.Splitter = new web3.eth.Contract(App.SplitterAbi, App.SplitterAddress);
      App.currentAccount();
      App.checkActivity();
      App.updateBalanceContract();
      App.updateLogSplit();
      App.updateLogWithdraw();
    })
    return App.bindEvents();
  },

  currentAccount: async function () {
    App.checkAdmin();
    var accounts = await web3.eth.getAccounts();
    var account = accounts[0];
    document.getElementById("aliceAddress").innerHTML = account;
    App.updateBalanceAlice();
    App.updateBalanceYours();
    window.ethereum.on('accountsChanged', function (accounts) {
      document.getElementById("aliceAddress").innerHTML = accounts[0];
      App.updateBalanceAlice();
      App.updateBalanceYours();
      App.checkAdmin();
    })
  },

  checkAdmin: function () {
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      return SplitterInstance.isOwner()
    }).then(function (admin) {
      if (admin == true) {
        document.getElementById("buttonAdmin").setAttribute("style", "display:true");
      } else {
        document.getElementById("buttonAdmin").setAttribute("style", "display:none");
      }
    }).catch(function (err) {});
  },

  checkActivity: function () {
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      return SplitterInstance.isKilled()
    }).then(function (isKilled) {
      if (isKilled) {
        $("#activity").empty();
        $("#activity").append(`<span class="badge badge-pill badge-danger">contract is dead</span>`);
        $("#adminButtons").empty();
        $("#adminButtons").append(`<button class="dropdown-item btn btn-success" type="button" id="emergencyWithdraw" onclick="App.emergencyWithdraw()">Withdraw all the funds from the contract</button>
          `);
        document.getElementById('splitAmount').disabled = true;
        document.getElementById('withdraw').disabled = true;
      } else {
        return SplitterInstance.isPaused().then(function (isPaused) {
          if (isPaused == true) {
            $("#activity").empty();
            $("#activity").append(`<span class="badge badge-pill badge-warning">contract in pause</span>`);
            $("#adminButtons").empty();
            $("#adminButtons").append(`<button class="dropdown-item btn btn-success" type="button" id="resume" onclick="App.pauseResume()">Activate the contract</button>
          <button class="dropdown-item btn btn-danger" type="button" id="kill" onclick="App.kill()">Kill the Contract</button>
          `);
            document.getElementById('splitAmount').disabled = true;
            document.getElementById('withdraw').disabled = true;
          } else {
            $("#activity").empty();
            $("#activity").append(`<span class="badge badge-pill badge-success">contract active</span>`);
            $("#adminButtons").empty();
            $("#adminButtons").append(`<button class="dropdown-item btn btn-warning" type="button" id="pause" onclick="App.pauseResume()">Pause the contract</button>`);
            document.getElementById('splitAmount').disabled = false;
            document.getElementById('withdraw').disabled = false;
          }
        }).catch(function (err) {
          console.log(err);
        });
      }
    }).catch(function () {
    });
  },

  kill: async function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    cubeSpinner('#txStatusUp');
    var accounts = await web3.eth.getAccounts();
    var account = accounts[0];
    const success = await App.Splitter.methods.kill().call({
      from: account
    })
    if (!success) {
      $("#txStatusUp").empty();
      $(".spinnerCube").empty();
      $("#txStatusUp").append(`The transaction will fail, not sending`);
      throw new Error("The transaction will fail, not sending");
    }
    const txObj = await App.Splitter.methods.kill().send({
        from: account
      })
      .on('transactionHash', function (hash) {
        outSpinner();
        $("#txStatusUp").prepend(`<div style="overflow-wrap: break-word;">Transact on the way ` + hash + `</div>`);
      })
      .on('receipt', function (receipt) {
        if (!receipt.status) {
          $("#txStatusUp").empty();
          throw new Error("The transaction failed");
        }
        console.log(receipt);
        $("#txStatusUp").empty();
        $(".spinnerCube").empty();
        showSuccess(txStatusUp, "You just killed the contract", 100);
        App.updateBalanceContract();
        App.updateBalanceAlice();
        App.checkActivity();
      })
      .on('error', function (err) {
        $("#txStatusUp").empty();
        $("#txStatusUp").append(`Error: ` + err);
      });
  },

  emergencyWithdraw: async function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    cubeSpinner('#txStatusUp');
    var accounts = await web3.eth.getAccounts();
    var account = accounts[0];
    const success = await App.Splitter.methods.emergencyWithdraw().call({
      from: account
    })
    if (!success) {
      $("#txStatusUp").empty();
      $(".spinnerCube").empty();
      $("#txStatusUp").append(`The transaction will fail, not sending`);
      throw new Error("The transaction will fail, not sending");
    }
    const txObj = await App.Splitter.methods.emergencyWithdraw().send({
        from: account
      })
      .on('transactionHash', function (hash) {
        outSpinner();
        $("#txStatusUp").prepend(`<div style="overflow-wrap: break-word;">Transact on the way ` + hash + `</div>`);
      })
      .on('receipt', function (receipt) {
        if (!receipt.status) {
          $("#txStatusUp").empty();
          throw new Error("The transaction failed");
        }
        console.log(receipt);
        $("#txStatusUp").empty();
        $(".spinnerCube").empty();
        showSuccess(txStatusUp, "You just withdrew all the funds from the contract", 100);
        App.updateBalanceContract();
        App.updateBalanceAlice();
      })
      .on('error', function (err) {
        $("#txStatusUp").empty();
        $("#txStatusUp").append(`Error: ` + err);
      });
  },

  pauseResume: async function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    cubeSpinner('#txStatusUp');
    var accounts = await web3.eth.getAccounts();
    var account = accounts[0];
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      return SplitterInstance.isPaused()
    }).then(async function (isPaused) {
      if (isPaused) {
        const success = await App.Splitter.methods.resume().call({
          from: account
        })
        if (!success) {
          $("#txStatusUp").empty();
          $(".spinnerCube").empty();
          $("#txStatusUp").append(`The transaction will fail, not sending`);
          throw new Error("The transaction will fail, not sending");
        }
        const txObj = await App.Splitter.methods.resume().send({
            from: account
          })
          .on('transactionHash', function (hash) {
            outSpinner();
            $("#txStatusUp").prepend(`<div style="overflow-wrap: break-word;">Transact on the way ` + hash + `</div>`);
          })
          .on('receipt', function (receipt) {
            if (!receipt.status) {
              $("#txStatusUp").empty();
              throw new Error("The transaction failed");
            }
            console.log(receipt);
            $("#txStatusUp").empty();
            $(".spinnerCube").empty();
            showSuccess(txStatusUp, "You just reactivated the contract", 100);
            App.checkActivity();
          })
          .on('error', function (err) {
            $("#txStatusUp").empty();
            $("#txStatusUp").append(`Error: ` + err);
          });
      } else {
        const success = await App.Splitter.methods.pause().call({
          from: account
        })
        if (!success) {
          $("#txStatusUp").empty();
          $(".spinnerCube").empty();
          $("#txStatusUp").append(`The transaction will fail, not sending`);
          throw new Error("The transaction will fail, not sending");
        }
        const txObj = await App.Splitter.methods.pause().send({
            from: account
          })
          .on('transactionHash', function (hash) {
            outSpinner();
            $("#txStatusUp").prepend(`<div style="overflow-wrap: break-word;">Transact on the way ` + hash + `</div>`);
          })
          .on('receipt', function (receipt) {
            if (!receipt.status) {
              $("#txStatusUp").empty();
              throw new Error("The transaction failed");
            }
            console.log(receipt);
            $("#txStatusUp").empty();
            $(".spinnerCube").empty();
            showSuccess(txStatusUp, "You just paused the contract", 100);
            App.checkActivity();
          })
          .on('error', function (err) {
            $("#txStatusUp").empty();
            $("#txStatusUp").append(`Error: ` + err);
          });
      }

    }).catch(function (err) {
      $(".spinnerCube").empty();
      console.log(err.message);
      showAlert(txStatusUp, 'Transaction rejected: ' + err.message);
    });
  },

  bindEvents: function () {
    $(document).on('click', '#splitAmount', App.splitAmount);
    $(document).on('click', '#withdraw', App.withdraw);
  },

  withdraw: async function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    cubeSpinner('#txStatusUp');
    var accounts = await web3.eth.getAccounts();
    var account = accounts[0];
    var amount = $('#amountWithdraw').val();
    var amountEth = App.weiToEth(amount);
    const success = await App.Splitter.methods.withdraw(amount).call({
      from: account
    })
    if (!success) {
      $("#txStatusUp").empty();
      $(".spinnerCube").empty();
      $("#txStatusUp").append(`The transaction will fail, not sending`);
      throw new Error("The transaction will fail, not sending");
    }
    const txObj = await App.Splitter.methods.withdraw(amount).send({
        from: account
      })
      .on('transactionHash', function (hash) {
        outSpinner();
        $("#txStatusUp").prepend(`<div style="overflow-wrap: break-word;">Transact on the way ` + hash + `</div>`);
      })
      .on('receipt', function (receipt) {
        if (!receipt.status) {
          $("#txStatusUp").empty();
          throw new Error("The transaction failed");
        }
        console.log(receipt);
        $("#txStatusUp").empty();
        App.updateBalanceAlice();
        App.updateBalanceYours();
        App.updateBalanceContract();
        showSuccess(txStatusUp, "You just made a withdraw from your account for the value of: " + amountEth, 100);
      })
      .on('error', function (err) {
        $("#txStatusUp").empty();
        $("#txStatusUp").append(`Error: ` + err);
      });
  },

  splitAmount: async function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    cubeSpinner('#txStatusUp');
    var accounts = await web3.eth.getAccounts();
    var account = accounts[0];
    var amount = $('#amountSplit').val();
    var amountEth = App.weiToEth(amount);
    var bobAddress = $('#bobAddress').val();
    var carolAddress = $('#carolAddress').val();
    const success = await App.Splitter.methods.split(
      bobAddress,
      carolAddress).call({
      from: account,
      value: amount
    })
    if (!success) {
      throw new Error("The transaction will fail, not sending");
    }
    const txObj = await App.Splitter.methods.split(bobAddress, carolAddress).send({
        from: account,
        value: amount
      })
      .on('transactionHash', function (hash) {
        outSpinner();
        $("#txStatusUp").prepend(`<div style="overflow-wrap: break-word;">Transact on the way ` + hash + `</div>`);
      })
      .on('receipt', function (receipt) {
        if (!receipt.status) {
          $("#txStatusUp").empty();
          throw new Error("The transaction failed");
        }
        console.log(receipt);
        $("#txStatusUp").empty();
        $("#txStatusUp").append(`
        <table style=" width:100%; font-size: 11px;" id="tableTxs" class="scene_element fadeInDownB table bordered table-light table-hover table-striped table-bordered rounded">
          <tr>
            <th class="text-center">Amount</th> 
            <th class="text-center">Alice</th>
            <th class="text-center">Bob</th>
            <th class="text-center">Carol</th>
          </tr>
          <tr>
            <td class="p-1 text-center tdLogs" title="${amount} WEI">${amountEth}</td>
            <td class="p-1 text-center tdLogs">${account}</td>
            <td class="p-1 text-center tdLogs">${bobAddress}</td>
            <td class="p-1 text-center tdLogs">${carolAddress}</td>
          </tr>
        </table>
      `);
        App.updateBalanceYours();
        App.updateBalanceAlice();
        App.updateBalanceBob();
        App.updateBalanceCarol();
        App.updateBalanceContract();
      })
      .on('error', function (err) {
        $("#txStatusUp").append(`Error ` + err);
      });
  },

  updateLogSplit: async function () {
    $("#txStatusUp").empty();
    $("#logSplit").empty();
    var cont = 1;
    $("#logSplit").append(`
      <table style=" width:100%; font-size: 11px;" id="tableLogSplit" class="scene_element scene_element--fadeindown table bordered table-light table-hover table-striped table-bordered rounded">
        <tr>
          <th class="text-center">#</th> 
          <th class="text-center">Amount</th> 
          <th class="text-center">Alice</th>
          <th class="text-center">Bob</th>
          <th class="text-center">Carol</th>
        </tr>
        <div id="tbody"></div>
      </table>
    `);
    var SplitterInstance = await App.contracts.Splitter.deployed();
    SplitterInstance.LogSplitted({
      fromBlock: 0
    }, function (error, event) {
      var datosEvento = event.args;
      var amount = datosEvento.value;
      var amountEth = web3.utils.fromWei(amount, "ether") + " ETH";
      var alice = datosEvento.alice;
      var bob = datosEvento.bob;
      var carol = datosEvento.carol;
      $("#tableLogSplit tbody").after(`           
        <tr class="table table-light table-hover table-striped table-bordered rounded">
          <td class="p-1 text-center tdLogs">${cont}</td>   
          <td class="p-1 text-center tdLogs" title="${amount} WEI">${amountEth}</td>
          <td class="p-1 text-center tdLogs">${alice}</td>
          <td class="p-1 text-center tdLogs">${bob}</td>
          <td class="p-1 text-center tdLogs">${carol}</td>
        </tr>               
      `);
      cont++;
    })
  },

  updateLogWithdraw: async function () {
    $("#txStatusUp").empty();
    $("#logWithdraw").empty();
    var cont = 1;
    $("#logWithdraw").append(`
    <table style=" width:100%; font-size: 11px;" id="tableLogWithdraw" class="scene_element scene_element--fadeindown table bordered table-light table-hover table-striped table-bordered rounded">
      <tr>
        <th class="text-center">#</th> 
        <th class="text-center">Amount</th> 
        <th class="text-center">Account</th>
      </tr>
      <div id="tbody"></div>
    </table>`);
    var SplitterInstance = await App.contracts.Splitter.deployed();
    SplitterInstance.LogWithdrawn({
      fromBlock: 0
    }, function (error, event) {
      var datosEvento = event.args;
      var amount = datosEvento.value;
      var amountEth = web3.utils.fromWei(amount, "ether") + " ETH";
      var account = datosEvento.account;
      $("#tableLogWithdraw tbody").after(`           
        <tr class="table table-light table-hover table-striped table-bordered rounded">
          <td class="p-1 text-center tdLogs">${cont}</td>   
          <td class="p-1 text-center tdLogs" title="${amount} WEI">${amountEth}</td>
          <td class="p-1 text-center tdLogs">${account}</td>
        </tr>               
      `);
      cont++;
    })
  },

  updateBalanceContract: function () {
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      var contractAddress = SplitterInstance.address;
      web3.eth.getBalance(contractAddress, function (err, result) {
        document.getElementById("amountContract").innerHTML = "Contract Balance " + web3.utils.fromWei(result, "ether") + " ETH";
      })
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  updateBalanceAlice: async function () {
    var accounts = await web3.eth.getAccounts();
    var aliceAddress = accounts[0];
    var result = await App.getBalance(aliceAddress);
    document.getElementById("aliceBalance").innerHTML = result + " WEI";
    document.getElementById("aliceBalanceEth").innerHTML = App.weiToEth(result);
  },

  updateBalanceYours: async function () {
    var accounts = await web3.eth.getAccounts();
    var aliceAddress = accounts[0];
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      return SplitterInstance.getBalance(aliceAddress)
    }).then(function (result) {
      document.getElementById("yourBalance").innerHTML = result + " WEI";
      document.getElementById("yourBalanceEth").innerHTML = App.weiToEth(result);
    }).catch(function () {
    });
  },

  updateBalanceBob: function () {
    var bobAddress = $('#bobAddress').val();
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      return SplitterInstance.getBalance(bobAddress)
    }).then(function (result) {
      document.getElementById("bobBalance").innerHTML = result + " WEI";
      document.getElementById("bobBalanceEth").innerHTML = App.weiToEth(result);
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  updateBalanceCarol: function () {
    var carolAddress = $('#carolAddress').val()
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      return SplitterInstance.getBalance(carolAddress)
    }).then(function (result) {
      document.getElementById("carolBalance").innerHTML = result + " WEI";
      document.getElementById("carolBalanceEth").innerHTML = App.weiToEth(result);
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  weiToEth: function (amount) {
    return web3.utils.fromWei(amount, "ether") + " ETH";
  },

  getBalance: async function (address) {
    balance = promisify(cb => web3.eth.getBalance(address, cb))
    try {
      return balance
    } catch (error) {
      showAlert(txStatusUp, 'Transaction rejected: ' + error);
    }
  },

};

$(function () {
  $(window).on('load', function () {
    App.init();
  });
});