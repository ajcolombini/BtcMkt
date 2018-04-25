/*** BlinkTrade API ***/

var BlinkTradeRest = require("blinktrade").BlinkTradeRest;

var blinktrade = new BlinkTradeRest({
  prod: false,
  key: process.env.KEY, 
  secret: process.env.SECRET, 
  currency: "BRL",
});

blinktrade.ticker().then(function(ticker) {
  console.log(ticker);
});

blinktrade.balance().then(function(balance) {
  console.log(balance);
});