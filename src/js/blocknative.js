var bncAssistConfig = {
  dappId: '697c5329-5ae1-47c7-bc6e-c8f9db213ece', // [String] The API key created by step one above
  networkId: 5777, // [Integer] The Ethereum network ID your dapp uses.
  //web3: web3Instance,
  messages: {
    txRequest: function (data) {
      return 'Confirm the transaction in the MetaMask window.'
    },
    txSent: function (data) {
      return 'Your transaction has been sent to the network.'
    },
    txPending: function (data) {
      return 'It´s being mined.'
    },
    txSendFail: function (data) {
      return 'The transaction has not been sent to the network.'
    },
    txStall: function (data) {
      return 'It´s taking a while.';
    },
    txRepeat: function (data) {
      return 'Mmm, I think you might be repeating the same transaction.'
    },
    txAwaitingApproval: function (data) {
      return 'The current transaction has not been mined.'
    },
    txConfirmReminder: function (data) {
      return 'You still have a pending transaction to confirm.'
    },
    txConfirmed: function (data) {
      return 'Confirmed transaction.'
    },
    txFailed: function (data) {
      return 'Transaction rejected.'
    },
  },
  handleNotificationEvent: //handleNotification
    data => {
      handleNotification(data);
      if (data.eventCode == 'txConfirmedClient') {
        App.received = true;
        return true;
      }
      if (data.eventCode == 'txFailed') {
        App.received = false;
        return true;
      }
      if (data.eventCode == 'txSendFail') {
        App.received = false;
        return true;
      }
      if (data) {
        return true;
      }
    },
};

var assistInstance = assist.init(bncAssistConfig);

assistInstance.onboard()
  .then(function (success) {})
  .catch(function (error) {
    console.log(error.message);
  })

const style = {
  darkMode: true,
  notificationsPosition: 'topRight',
  css: `.bn-notifications-scroll {margin-top: 220px;}`,
}
assistInstance.updateStyle(style)

function handleNotification(d) {
  // console.log(d)
  return true
}