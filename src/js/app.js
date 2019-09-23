App = {
  web3Provider: null,
  contracts: {},
  web3Instance: null,

  SplitterAbi: null,
  SplitterAddress: null,
  decoredSplitter: null,
  received: null,


  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    App.web3Instance = web3;

    return App.initContract();
  },

  initContract: function () {
    $.getJSON('Splitter.json', function (data2) {
      var SplitterArtifact = data2;
      App.contracts.Splitter = TruffleContract(SplitterArtifact);
      App.contracts.Splitter.setProvider(App.web3Provider);
      App.SplitterAbi = SplitterArtifact.abi;
      var networkID = web3.version.network;
      App.SplitterAddress = SplitterArtifact.networks[networkID].address;

      var instanciaSplitter = App.web3Instance.eth.contract(App.SplitterAbi).at(App.SplitterAddress);
      App.decoredSplitter = assistInstance.Contract(instanciaSplitter);
      App.currentAccount();
      App.checkActivity();
      App.updateBalanceContract();
      App.updateLogSplit();
      App.updateLogWithdraw();
    })
    return App.bindEvents();
  },

  currentAccount: function () {
    App.checkAdmin();
    var account = web3.eth.accounts[0];
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
      return SplitterInstance.isPaused()
    }).then(function (isPaused) {
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
  },

  kill: function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    cubeSpinner('#txStatusUp');
    return App.decoredSplitter.kill()
      .then(async function () {
        await App.minedTransaction().then(function (response) {
          if (response) {
            $(".spinnerCube").empty();
            showSuccess(txStatusUp, "You just killed the contract and withdrew all the funds", 100)
            App.updateBalanceContract();
            App.updateBalanceAlice();
          }
        }) // wait till the promise resolves (*)
      }).catch(function (err) {
        $(".spinnerCube").empty();
        console.log(err.message);
        showAlert(txStatusUp, 'Transaction rejected: ' + err.message);
      });
  },

  pauseResume: function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    cubeSpinner('#txStatusUp');
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      return SplitterInstance.isPaused()
    }).then(function (isPaused) {
      if (isPaused == true) {
        return App.decoredSplitter.resume()
        .then(async function () {
            await App.minedTransaction().then(function (response) {
              if (response) {
                $(".spinnerCube").empty();
                showSuccess(txStatusUp, "You just reactivated the contract", 100)
                App.checkActivity();
              }
            }) // wait till the promise resolves (*)
          }).catch(function (err) {
            $(".spinnerCube").empty();
            console.log(err.message);
            showAlert(txStatusUp, 'Transaction rejected: ' + err.message);
          });
      } else {
        return App.decoredSplitter.pause()
        .then(async function () {
            await App.minedTransaction().then(function (response) {
              if (response) {
                $(".spinnerCube").empty();
                showSuccess(txStatusUp, "You just paused the contract", 100)
                App.checkActivity();
              }
            }) // wait till the promise resolves (*)
          }).catch(function (err) {
            $(".spinnerCube").empty();
            console.log(err.message);
            showAlert(txStatusUp, 'Transaction rejected: ' + err.message);
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

  withdraw: function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    if ($('#amountWithdraw').val() == "") {
      showAlert(txStatusUp, 'Fill in the Amount field');
    } else {
      cubeSpinner('#txStatusUp');
      var account = web3.eth.accounts[0];
      var amount = $('#amountWithdraw').val();
      var amountEth = App.weiToEth(amount);
      var SplitterInstance;
      App.contracts.Splitter.deployed().then(function (instance) {
        SplitterInstance = instance;
        return SplitterInstance.getBalance(account)
      }).then(function (result) {
        var posible = bigInt(result.add(1)).gt(amount);
        if (posible) {
          return App.decoredSplitter.withdraw(amount, {
              from: account
            })
          .then(async function () {
              await App.minedTransaction().then(function (response) {
                if (response) {
                  $(".spinnerCube").empty();
                  App.updateBalanceAlice();
                  App.updateBalanceYours();
                  App.updateBalanceContract();
                  showSuccess(txStatusUp, "You just made a withdraw from your account for the value of: " + amountEth, 100)
                }
              }) // wait till the promise resolves (*)
            }).catch(function (err) {
              $(".spinnerCube").empty();
              console.log(err.message);
              showAlert(txStatusUp, 'Transaction rejected: ' + err.message);
            });
        } else {
          $(".spinnerCube").empty();
          showAlert(txStatusUp, 'Transaction rejected: User has insufficient balance to complete transaction');
        }
      }).catch(function (err) {
        console.log(err.message);
      });
    }
  },

  splitAmount: async function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    cubeSpinner('#txStatusUp');
    var account = web3.eth.accounts[0];
    var amount = $('#amountSplit').val();
    var amountEth = App.weiToEth(amount);
    var bobAddress = $('#bobAddress').val();
    var carolAddress = $('#carolAddress').val();
    var posible = bigInt((await App.getBalance(account)).add(1)).gt(amount);
    if (posible) {
      return App.decoredSplitter.split(bobAddress, carolAddress, {
          value: amount,
          from: account
        })
      .then(async function () {
          await App.minedTransaction().then(function (response) {
            if (response) {
              $(".spinnerCube").empty();
              App.updateBalanceYours();
              App.updateBalanceAlice();
              App.updateBalanceBob();
              App.updateBalanceCarol();
              App.updateBalanceContract();
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
              </table>`);
            }
          }) // wait till the promise resolves (*)
        }).catch(function (err) {
          $(".spinnerCube").empty();
          console.log(err.message);
          showAlert(txStatusUp, 'Transaction rejected: ' + err.message);
        });
    } else {
      $(".spinnerCube").empty();
      showAlert(txStatusUp, 'Transaction rejected: User has insufficient balance to complete transaction');
    }
  },

  updateLogSplit: function () {
    $("#txStatusUp").empty();
    $("#logSplit").empty();
    var eventBlocks = new Set();
    var cont = 1;
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      var eventSplit = SplitterInstance.LogSplitted({}, {
        fromBlock: 0,
        toBlock: "latest"
      })

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
        </table>`);
      eventSplit.watch(function (error, result) {
        if (!error) {
          let blockNumber = result.blockNumber;
          if (eventBlocks.has(blockNumber)) return;
          eventBlocks.add(blockNumber);
          var datosEvento = result.args;
          var amount = datosEvento.value;
          var amountEth = web3.fromWei(amount, "ether") + " ETH";
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
        }
      });
    })
  },

  updateLogWithdraw: function () {
    $("#txStatusUp").empty();
    $("#logWithdraw").empty();
    var eventBlocks = new Set();
    var cont = 1;
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      var eventWithdraw = SplitterInstance.LogWithdrawn({}, {
        fromBlock: 0,
        toBlock: "latest"
      })

      $("#logWithdraw").append(`
        <table style=" width:100%; font-size: 11px;" id="tableLogWithdraw" class="scene_element scene_element--fadeindown table bordered table-light table-hover table-striped table-bordered rounded">
          <tr>
            <th class="text-center">#</th> 
            <th class="text-center">Amount</th> 
            <th class="text-center">Account</th>
          </tr>
          <div id="tbody"></div>
        </table>`);
      eventWithdraw.watch(function (error, result) {
        if (!error) {
          let blockNumber = result.blockNumber;
          if (eventBlocks.has(blockNumber)) return;
          eventBlocks.add(blockNumber);
          var datosEvento = result.args;
          var amount = datosEvento.value;
          var amountEth = web3.fromWei(amount, "ether") + " ETH";
          var account = datosEvento.account;
          $("#tableLogWithdraw tbody").after(`           
            <tr class="table table-light table-hover table-striped table-bordered rounded">
              <td class="p-1 text-center tdLogs">${cont}</td>   
              <td class="p-1 text-center tdLogs" title="${amount} WEI">${amountEth}</td>
              <td class="p-1 text-center tdLogs">${account}</td>
            </tr>               
          `);
          cont++;
        }
      });
    })
  },

  updateBalanceContract: function () {
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;

      var contractAddress = SplitterInstance.address;
      web3.eth.getBalance(contractAddress, function (err, result) {
        document.getElementById("amountContract").innerHTML = "Contract Balance " + web3.fromWei(result, "ether") + " ETH";
      })
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  updateBalanceAlice: async function () {
    var aliceAddress = web3.eth.accounts[0];
    var result = await App.getBalance(aliceAddress);
    document.getElementById("aliceBalance").innerHTML = result + " WEI";
    document.getElementById("aliceBalanceEth").innerHTML = App.weiToEth(result);
  },

  updateBalanceYours: function () {
    var aliceAddress = web3.eth.accounts[0];
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      return SplitterInstance.getBalance(aliceAddress)
    }).then(function (result) {
      document.getElementById("yourBalance").innerHTML = result + " WEI";
      document.getElementById("yourBalanceEth").innerHTML = App.weiToEth(result);
    }).catch(function (err) {
      console.log(err.message);
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
    return web3.fromWei(amount, "ether") + " ETH";
  },

  getBalance: async function (address) {
    balance = promisify(cb => web3.eth.getBalance(address, cb))
    try {
      return balance
    } catch (error) {
      showAlert(txStatusUp, 'Transaction rejected: ' + error);
    }
  },

  // minedTransaction2: async function(func) {
  //   balance = promisify(cb => web3.eth.getBalance(address, cb))
  //   try {
  //     return balance
  //   } catch (error) {
  //     showAlert(txStatusUp, 'Transaction rejected: ' + error);
  //   }
  // },

  minedTransaction: async function () {
    try {
      var returnedValue = null;
      return new Promise((resolve, reject) => {
        var accountInterval = setInterval(function () {
          if (App.received !== null) {
            if (App.received == true) {
              App.received = null;
              result(true);
            } else {
              App.received = null;
              result(false);
            }
          }
        }, 2000);

        function result(success) {
          if (success) {
            clearInterval(accountInterval);
            returnedValue = true;
            show();
          } else {
            clearInterval(accountInterval);
            returnedValue = false;
            show();
          }
        }
        setTimeout(stall, 45000);

        function stall() {
          if (returnedValue == null) {
            assistInstance.notify('pending', 'It seems that the transaction has stalled, cancel it in metamask and resend it with a little more gas. You can close these notifications now.', {
              customTimeout: 50000
            });
            setTimeout(cancelTX, 50000);
          }

          function cancelTX() {
            clearInterval(accountInterval);
          }
        }

        function show() {
          return resolve(returnedValue);
        }
      }).then(function (result) {
        return result;
      })
    } catch (err) {
      alert(err); // TypeError: failed to fetch
    }
  },

};

$(function () {
  $(window).on('load', function () {
    App.init();
  });
});