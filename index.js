//index.js
require("dotenv-safe").load();

const MercadoBitcoin = require("./api").MercadoBitcoin
const MercadoBitcoinTrade = require("./api").MercadoBitcoinTrade

var infoApi = new MercadoBitcoin({ currency: 'BCH' })
var tradeApi = new MercadoBitcoinTrade({ 
    currency: 'BCH', 
    key: process.env.KEY, 
    secret: process.env.SECRET, 
    pin: process.env.PIN 
})




//setInterval(() => 
   //infoApi.ticker((tick) => console.log(tick.ticker)),
   //getBalance('BCH', 0, false, (balance) => {console.log(balance)})
		//,process.env.CRAWLER_INTERVAL
//)

// function timeConverter(UNIX_timestamp){
  // var a = new Date(UNIX_timestamp * 1000);
  // //var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  // var year = a.getFullYear();
  // var month = a.getMonth() + 1 ;  //months[a.getMonth()];
  // var date = a.getDate();
  // var hour = a.getHours();
  // var min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();
  // var sec = a.getSeconds() < 10 ? '0' + a.getSeconds() : a.getSeconds();
  // var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec ;
  // return time;
// }

function getBalance(coin, price, isBuying, callback){
    price = parseFloat(price)
    var usedCoin = isBuying ? 'brl' : coin.toLowerCase()
		
    tradeApi.getAccountInfo((response_data) => {

		var ret = JSON.parse(JSON.stringify(response_data));

        var balanceCoin = parseFloat(eval('ret.balance.' + coin.toLowerCase() + '.available')).toFixed(5); 
		var balanceBRL  = parseFloat(eval('ret.balance.brl.available')).toFixed(5); 
		
		//balance = parseFloat(balance);
		
        if(isBuying && balanceBRL < 50) 
			return console.log('Sem saldo disponível para comprar!  BRL ' + balanceBRL)
        
		var finalBalance;
		
        if(isBuying) 
		{
			finalBalance = parseFloat((balanceBRL / price).toFixed(5))
		} else {
			finalBalance = balanceCoin;
		}
		
		//tira a diferença que se ganha no arredondamento
		finalBalance = finalBalance > 0 ? (parseFloat(finalBalance) - 0.00001) : finalBalance;
			
		console.log(`Saldo disponível de ${coin}: ${balanceCoin}`);
		console.log(`Saldo disponível de BRL: ${balanceBRL}`);
		
		callback(finalBalance);
    }, 
    (data) => console.log(data))
}

function tradeCoin(coin, priceToBuy, priceToSell, useStopProfit, useStopLoss) {
	
	var infoApi = new MercadoBitcoin({ currency: coin })
	var tradeApi = new MercadoBitcoinTrade({ 
		currency: coin, 
		key: process.env.KEY, 
		secret: process.env.SECRET, 
		pin: process.env.PIN 
	})
	console.log('Moeda: ' + coin);
	console.log('Preço desejado para compra: ' + priceToBuy);
	console.log('Preço desejado para venda : ' + priceToSell);
	console.log('Usando Stop Profit? : ' + (useStopProfit ? 'Sim': 'Não'));
	//console.log( useStopProfit ? 'Sim': 'Não');
	
	setInterval(() => 
	    infoApi.ticker((response) => {
			
		    //console.log('Comprar? ' + (response.ticker.sell <= priceToBuy ? 'sim':'não'));
			console.log('');
			
		    if(response.ticker.sell <= priceToBuy) //Se valor de venda menor ou igual ao preço definido para compra
		    {
			
				 getBalance(coin, response.ticker.sell, true, (balance) => {
					 var qtyToBuy = balance / 2; //Metade do saldo disponivel
					 
					 //teste
					 console.log('Ordem de compra de ' + qtyToBuy + ' ' + coin + ',  por '  + priceToBuy + ', inserida no livro.');
					 
					 // // tradeApi.placeBuyOrder(qtyToBuy, response.ticker.sell, 
						 // // (data) => {
							 //console.log('Ordem de compra de ' + qtyToBuy + ' ' + coin + ',  por '  + priceToBuy + ', inserida no livro. >> ' + data)
							
							 if(useStopProfit) {							
							 // ////operando em STOP com lucro de <env.PROFITABILITY>%
							 // // tradeApi.placeSellOrder(data.quantity, response.ticker.sell * parseFloat(process.env.PROFITABILITY), 
								 // //(data) => console.log('Ordem de venda de ' + data.quantity + '  ' + coin + ',  por '  + response.ticker.sell * parseFloat(process.env.PROFITABILITY + ',  inserida no livro. >> ' + data),
								 // // (data) => console.log('Erro ao inserir ordem de venda  de ' + data.quantity + '  ' + coin + ',  por '  + response.ticker.sell + ' >> '  + data))
							 
								// //teste
								 console.log('Ordem de venda de ' + qtyToBuy + '  ' + coin + ',  por '  + response.ticker.sell * parseFloat(process.env.PROFITABILITY) + ',  inserida no livro.');
							 }								
						 // // },
						 // // (data) => console.log('Erro ao inserir ordem de compra  de ' + qtyToBuy + '  ' + coin + ',  por '  + response.ticker.sell + ' >> ' + data));
				 });
			}
			else
				console.log('Preço muito alto (' + response.ticker.sell + '), vamos comprar depois...');
			
			//Hora de vender?
			if(!useStopProfit)
			{
				if( response.ticker.buy >= priceToSell || (response.ticker.buy >= (response.ticker.high * 0.99)) ) 
				{
					getBalance(coin, response.ticker.buy, false, (balance) => {
						 var qtyToSell = balance; 
						 
						 
						 if(balance > 0){
							// tradeApi.placeSellOrder(qtyToSell, response.ticker.last, 
							// (data) => {
							  // (data) => console.log('Ordem de venda de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.last + ',  inserida no livro. ' + data),
						 	  // (data) => console.log('Erro ao inserir ordem de venda  de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.last + ' >> '  + data))
							// }
							
							//teste
							console.log('Ordem de venda de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.buy + ',  inserida no livro. ');
						 }
					});
				}
				else
					console.log('Ainda não é hora de vender ( actual:' + response.ticker.buy + ' / higher:' +  response.ticker.high + ')...');
			}
			
			
			//Stop Loss
			getBalance(coin, response.ticker.buy, false, (balance) => {
				 var qtyToSell = balance; 
				 
				 if(balance > 0){
					 
					 
					 
					// tradeApi.placeSellOrder(qtyToSell, response.ticker.last, 
					// (data) => {
					  // (data) => console.log('Ordem de venda de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.last + ',  inserida no livro. ' + data),
					  // (data) => console.log('Erro ao inserir ordem de venda  de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.last + ' >> '  + data))
					// }
					
					//teste
					console.log('Ordem de venda de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.buy + ',  inserida no livro. ');
				 }
			});
			
	    }),
	    process.env.CRAWLER_INTERVAL);
}


//chama funcao trader
tradeCoin('BCH', '3500', '3900', false);

