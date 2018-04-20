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

setInterval(() => 
   //infoApi.ticker((tick) => console.log(tick.ticker)),
   getBalance('BCH', 0, false, (balance) => {console.log(balance)}),
   process.env.CRAWLER_INTERVAL
)

function getBalance(coin, price, isBuying, callback){
    price = parseFloat(price)
    coin = isBuying ? 'BRL' : coin.toLowerCase()

    tradeApi.getAccountInfo((response_data) => {
        var balance = parseFloat(response_data.balance[coin].available).toFixed(5)
		balance = parseFloat(balance)
        if(isBuying && balance < 50) 
			return console.log('Sem saldo disponível em BRL para comprar!')
        
        if(isBuying) 
		{
			balance = parseFloat((balance / price).tofixed(5))
			
			//tira a diferença que se ganha no arredondamento
			var finalBalance = (parseFloat(balance) - 0.00001);
			console.log(`Saldo disponível de ${coin.toUpperCase()}: ${finalBalance}`)
			callback(finalBalance);
		} 
			
		console.log(`Saldo total disponível de ${coin.toUpperCase()}: ${balance}`);
		
    }, 
    (data) => console.log(data))
}

function tradeCoin(coin, qty, price) {
	
	var infoApi = new MercadoBitcoin({ currency: coin })
	var tradeApi = new MercadoBitcoinTrade({ 
		currency: coin, 
		key: process.env.KEY, 
		secret: process.env.SECRET, 
		pin: process.env.PIN 
	})
	
	setInterval(() => 
	    infoApi.ticker((response) => {
		    console.log(response.ticker)
		    if(response.ticker.sell <= price) //Se valor de venda menor ou igual ao preço definido para compra
		    {
				getBalance('BRL', response.ticker.sell, true, (balance) => {
					 var qtyToBuy = balance / 2; //Metade do saldo disponivel
					 tradeApi.placeBuyOrder(qtyToBuy, response.ticker.sell, 
						 (data) => {
							 console.log('Ordem de compra de ' + qtyToBuy + ' ' + coin + ',  por '  + price + ', inserida no livro. ' + data)
							 //operando em STOP com lucro de <env.PROFITABILITY>%
							 tradeApi.placeSellOrder(data.quantity, response.ticker.sell * parseFloat(process.env.PROFITABILITY), 
								 (data) => console.log('Ordem de venda de ' + data.quantity + '  ' + coin + ',  por '  + response.ticker.sell + ',  inserida no livro. ' + data),
								 (data) => console.log('Erro ao inserir ordem de venda  de ' + data.quantity + '  ' + coin + ',  por '  + response.ticker.sell + ' >> '  + data))
						 },
						 (data) => console.log('Erro ao inserir ordem de compra  de ' + qtyToBuy + '  ' + coin + ',  por '  + response.ticker.sell + ' >> ' + data));
				})
			}
			else
				console.log('Preço muito alto (' + response.ticker.sell + '), vamos esperar pra comprar depois...' + data)
	    }),
	    process.env.CRAWLER_INTERVAL
	)
}