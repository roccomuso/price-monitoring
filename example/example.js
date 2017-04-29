'use strict'
var path = require('path')
var PriceMonitoring = require('../index')

var pm = new PriceMonitoring({
  parsersDir: path.join(__dirname, 'myParsers/'), // add parsers
  interval: 60 * 1000 // every min
})

/* get general info */
console.log('N. of Parsers loaded', pm.getParsersCount())

/* parse Products from CSV */
var fileInput = path.join(__dirname, 'input.csv')

/* First instatiate the listeners */
pm.on('error', console.log)
pm.on('submit', function (product) {
  console.log(product.name, 'submitted')
})
pm.on('skip', function (product) {
  console.log('No parser found for', product)
})
pm.on('priceFetched', function (product, currentPrice) {
  console.log(product.name, 'got', currentPrice)
})
pm.on('priceAlert', function (product, newPrice) {
  console.log('Alert!', product.name, 'got', newPrice)
})
pm.on('parserEnd', function (site, nProd) {
  console.log('End: fetched', nProd, 'from', site)
})

/* Add the products from CSV */
pm.parseCSV(fileInput)

/* Start watching prices */
pm.watchPrices(function (round) { // called once all the parsers retrieved all the products prices
  console.log('Starting', round + 'th', 'round')
})

/* gracefully shutdown */
process.on('SIGINT', function () {
  console.log('closing...')
  pm.close()
  setTimeout(function () {
    process.exit()
  }, 1000)
})
