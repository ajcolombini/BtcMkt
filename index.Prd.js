//index.js
require("dotenv-safe").load();
var fs = require('fs');

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
   //infoApi.ticker((tick) => log(tick.ticker)),
   //getBalance('BCH', 0, false, (balance) => {log(balance)})
		//,process.env.CRAWLER_INTERVAL
//)

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  //var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  var year = a.getFullYear();
  var month = a.getMonth() + 1 ;  //months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();
  var sec = a.getSeconds() < 10 ? '0' + a.getSeconds() : a.getSeconds();
  var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

function displayDateTime() {
    var str = "";

    var currentTime = new Date()
	
	var day = currentTime.getDate();
	var month = currentTime.getMonth()+1;
	var year = currentTime.getFullYear();
	
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()

    if (minutes < 10) {
        minutes = "0" + minutes
    }
    if (seconds < 10) {
        seconds = "0" + seconds
    }
    str += day + "-" + month + "-" + year + "  " + hours + ":" + minutes + ":" + seconds + " ";
    if(hours > 11){
        str += "PM"
    } else {
        str += "AM"
    }
    return str;
}

function getBalance(coin, price, isBuying, callback){
    price = parseFloat(price)
    var usedCoin = isBuying ? 'brl' : coin.toLowerCase()
		
    tradeApi.getAccountInfo((response_data) => {

		var ret = JSON.parse(JSON.stringify(response_data));

        var balanceCoin = parseFloat(eval('ret.balance.' + coin.toLowerCase() + '.available')).toFixed(5); 
		var balanceBRL  = parseFloat(eval('ret.balance.brl.available')).toFixed(5); 
		
		//balance = parseFloat(balance);
		
        if(isBuying && balanceBRL < 50) 
			return log('Sem saldo disponível para comprar!  BRL ' + balanceBRL)
        
		var finalBalance;
		
        if(isBuying) 
		{
			finalBalance = parseFloat((balanceBRL / price).toFixed(5))
		} else {
			finalBalance = balanceCoin;
		}
		
		//tira a diferença que se ganha no arredondamento
		finalBalance = finalBalance > 0 ? (parseFloat(finalBalance) - 0.00001) : finalBalance;
			
		log(`Saldo disponível de ${coin}: ${balanceCoin}`);
		log(`Saldo disponível de BRL: ${balanceBRL}`);
		
		callback(finalBalance);
    }, 
    (data) => log(data))
}

function tradeCoin(coin, priceToBuy, priceToSell, useStopProfit, useStopLoss) {
	
	var infoApi = new MercadoBitcoin({ currency: coin })
	var tradeApi = new MercadoBitcoinTrade({ 
		currency: coin, 
		key: process.env.KEY, 
		secret: process.env.SECRET, 
		pin: process.env.PIN 
	})
	var buyPrice = 0;
	var sellPrice = 0;
	
	log('Moeda: ' + coin);
	log('Preço desejado para compra: ' + priceToBuy);
	if(!useStopProfit)
		log('Preço desejado para venda : ' + priceToSell);
	log('Usando Stop Profit? : ' + (useStopProfit ? 'Sim  (' + (parseFloat(process.env.PROFITABILITY) - 1).toFixed(2)* 100  + '%)': 'Não'));
	log('Usando Stop Loss?   : ' + (useStopLoss ?   'Sim  (' + (1- parseFloat(process.env.STOPLOSSPERCENT)).toFixed(2) + '%)': 'Não'));
	
	setInterval(() => 
	    infoApi.ticker((response) => {
			
			log('');
			log(displayDateTime());
			log('');
			
		    if(response.ticker.sell <= priceToBuy) //Se valor de venda menor ou igual ao preço definido para compra
		    {
				 getBalance(coin, response.ticker.sell, true, (balance) => {
					 var qtyToBuy = balance;
					 
					 buyPrice = response.ticker.sell;
					 
					 ////teste
					 //log('Ordem de compra de ' + qtyToBuy + ' ' + coin + ',  por '  + buyPrice + ', inserida no livro.');
					 
					 tradeApi.placeBuyOrder(qtyToBuy, response.ticker.sell, 
						 (data) => {
							 log('Ordem de compra de ' + qtyToBuy + ' ' + coin + ',  por '  + buyPrice + ', inserida no livro. >> ' + data);
							
							 if(useStopProfit) {							
								//operando em STOP com lucro de <env.PROFITABILITY>%
								tradeApi.placeSellOrder(data.quantity, response.ticker.sell * parseFloat(process.env.PROFITABILITY), 
															(data) => log('Ordem de venda de ' + data.quantity + '  ' + coin + ',  por '  + response.ticker.sell * parseFloat(process.env.PROFITABILITY) + ',  inserida no livro. >> ' + data),
															(data) => log('Erro ao inserir ordem de venda de ' + data.quantity + '  ' + coin + ',  por '  + response.ticker.sell * parseFloat(process.env.PROFITABILITY) + ' >> '  + data)
													    );
								 
								////teste
								//log('Ordem de venda de ' + qtyToBuy + '  ' + coin + ',  por '  + response.ticker.sell * parseFloat(process.env.PROFITABILITY) + ',  inserida no livro.');
								sellPrice = response.ticker.sell * parseFloat(process.env.PROFITABILITY);
							 }								
						 },
						 (data) => log('Erro ao inserir ordem de compra  de ' + qtyToBuy + '  ' + coin + ',  por '  + response.ticker.sell + ' >> ' + data));
				 });
			}
			else
				log('Preço muito alto (' + response.ticker.sell + '), vamos comprar depois...');
			
			//Atingiu valor para venda?
			if(!useStopProfit)
			{
				if( response.ticker.buy >= priceToSell || (response.ticker.buy >= (response.ticker.high * 0.99)) ) 
				{
					getBalance(coin, response.ticker.buy, false, (balance) => {
						 
						 var qtyToSell = balance; 
						 
						 if(balance > 0)
						 {
								tradeApi.placeSellOrder(qtyToSell, response.ticker.buy, 
									(data) => {
									  (data) => log('Ordem de venda de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.buy + ',  inserida no livro. ' + data),
									  (data) => log('Erro ao inserir ordem de venda  de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.buy + ' >> '  + data)
									});
							// //teste
							// log('Ordem de venda de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.buy + ',  inserida no livro. ');
							sellPrice = response.ticker.buy;
						 }
						 else
							 log('Sem saldo em ' + coin + ' para vender...');
					});
				}
				else
					log('Não é hora de vender por valor fixado: ' + priceToSell + ' ( actual:' + response.ticker.buy + ' / higher:' +  response.ticker.high + ')...');
			}
			
			
			//Stop Loss - Minimizar perdar
			if (useStopLoss)
			{
				if(response.ticker.buy <= (buyPrice * process.env.STOPLOSSPERCENT))
				{
					getBalance(coin, response.ticker.buy, false, (balance) => {
						 var qtyToSell = balance; 
						 
						 if(balance > 0)
						 {

							tradeApi.placeSellOrder(qtyToSell, response.ticker.buy, 
							(data) => {
							  (data) => log('Ordem de venda de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.buy + ',  inserida no livro. ' + data),
							  (data) => log('Erro ao inserir ordem de venda  de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.buy + ' >> '  + data)
							});
							
							// //teste
							// log('STOP LOSS: Ordem de venda de ' + qtyToSell + '  ' + coin + ',  por '  + response.ticker.buy + ',  inserida no livro. ');
							sellPrice = response.ticker.buy;
						 }
					});
				}
			}
			
	    }),
	    process.env.CRAWLER_INTERVAL);
}

function log(info)
{
	console.log(info);
	fs.appendFile('debug.log', info + '\r\n',
	(err) => {
		if (err) throw err;
		//log('The info was appended to file!');
	});
}

//chama funcao trader
tradeCoin('BCH', '4400', '4840', true, true);

