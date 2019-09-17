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

      App.updateTxStatus();
    })
    return App.bindEvents();
  },

  currentAccount: function () {
    callback();
    //web3.currentProvider.publicConfigStore.on('update', callback);
    var account = web3.eth.accounts[0];
    var accountInterval = setInterval(function () {
      if (web3.eth.accounts[0] !== account) {
        account = web3.eth.accounts[0];
        callback();
      }
    }, 100);

    function callback() {
      var userAccount = web3.eth.accounts[0];
      web3.eth.getBalance(userAccount, function (err, result) {
        if (err) {
          console.log(err)
        } else {
          document.getElementById("aliceAddress").innerHTML = userAccount;
          document.getElementById("aliceBalance").innerHTML = result + " WEI";
          document.getElementById("aliceBalanceEth").innerHTML = web3.fromWei(result, "ether") + " ETH";
        }
      })
    }
  },

  bindEvents: function () {
    $(document).on('click', '#splitAmount', App.splitAmount);
  },

  splitAmount: function () {
    $(".spinnerCube").empty();
    $("#txStatusUp").empty();
    if (($('#amount').val() == "") || ($('#bobAddress').val() == "") || ($('#carolAddress').val() == "")) {
      showAlert(txStatusUp, 'Fill in all fields');
    } else {
      var account = web3.eth.accounts[0];
      var amount = $('#amount').val();
      let amountEth = web3.fromWei(amount, "ether") + " ETH";
      var bobAddress = $('#bobAddress').val();
      var carolAddress = $('#carolAddress').val();
      cubeSpinner('#txStatusUp');
      App.decoredSplitter.split(bobAddress, carolAddress, {
          from: account,
          value: amount
        })
        .then(async function () {
          await App.minedTransaction().then(function (response) {
            if (response == true) {
              $(".spinnerCube").empty();
              App.currentAccount();
              App.updateBalanceBob();
              App.updateBalanceCarol();
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
    }
  },

  updateTxStatus: function () {
    $("#txStatusUp").empty();
    $("#txStatus").empty();
    var cont = 1;
    var SplitterInstance;
    App.contracts.Splitter.deployed().then(function (instance) {
      SplitterInstance = instance;
      var eventoMostrar = SplitterInstance.LogSplit({}, {
        fromBlock: 0,
        toBlock: "latest"
      })

      $("#txStatus").append(`
        <table style=" width:100%; font-size: 11px;" id="tableLogs" class="scene_element fadeInDownB table bordered table-light table-hover table-striped table-bordered rounded">
          <tr>
            <th class="text-center">#</th> 
            <th class="text-center">Amount</th> 
            <th class="text-center">Alice</th>
            <th class="text-center">Bob</th>
            <th class="text-center">Carol</th>
          </tr>
          <div id="tbody"></div>
        </table>`);
      eventoMostrar.watch(function (error, result) {
        if (!error) {
          let datosEvento = result.args;
          let amount = datosEvento.value;
          let amountEth = web3.fromWei(amount, "ether") + " ETH";
          let alice = datosEvento.alice;
          let bob = datosEvento.bob;
          let carol = datosEvento.carol;
          $("#tableLogs tbody").after(`           
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

  updateBalanceBob: function () {
    var bobAddress = $('#bobAddress').val();
    web3.eth.getBalance(bobAddress, function (err, result) {
      document.getElementById("bobBalance").innerHTML = result + " WEI";
      document.getElementById("bobBalanceEth").innerHTML = web3.fromWei(result, "ether") + " ETH";
    })
  },

  updateBalanceCarol: function () {
    var carolAddress = $('#carolAddress').val()
    web3.eth.getBalance(carolAddress, function (err, result) {
      document.getElementById("carolBalance").innerHTML = result + " WEI";
      document.getElementById("carolBalanceEth").innerHTML = web3.fromWei(result, "ether") + " ETH";
    })
  },

  changeAmount: function () {
    var amount = $('#amount').val();
    document.getElementById("amountEth").innerHTML = web3.fromWei(amount, "ether") + " ETH";
  },

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

          function result(valor) {
            if (valor == true) {
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