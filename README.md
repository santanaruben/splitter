# Splitter Project
Amount splitter application for ethereum - Project 1 - Ethereum Developer Course - B9lab Academy

## What

There are 3 people: Alice, Bob and Carol.

We can see the balance of the Splitter contract on the Web page.

Whenever Alice sends ether to the contract for it to be split, half of it goes to Bob and the other half to Carol.

We can see the balances of Alice, Bob and Carol on the Web page.

Alice can use the Web page to split her ether.

## Installation

Install [ganache](https://github.com/trufflesuite/ganache) running on 127.0.0.1:7545 
or [geth](https://geth.ethereum.org/) to have blockchain access.

Install [MetaMask](https://metamask.io)

Clone or download the repo and use npm to install the required dependencies (truffle and lite-server).

```bash
npm install
```

## Compile and migrate the contracts

```bash
truffle compile
truffle migrate
```

## Usage

```bash
npm run dev
```

## Test

```bash
npm run test
```
or

```bash
truffle test
```

## Contributing
Pull requests are welcome. Be free to discuss what you would like to change.

## License
[Apache-2.0](https://choosealicense.com/licenses/apache-2.0/)