'use strict'
const SiteParser = require('../../lib/PriceMonitoring').SiteParser

/* Class */
class Ikea extends SiteParser {
  constructor () {
    super(
      'https://www.ikea.com', // base url
      '#prodPrice .packagePrice@html | trim | split:"&#xA0;",1 | replaceComma | float' // price selector
    )
  }
}

module.exports = Ikea

/* Single Example */
if (!module.parent) {
  console.log('Ikea example running...')

  var p = new Ikea()

  p.on('error', console.log)
  p.on('submit', console.log)
  p.on('priceFetched', function (product, currentPrice) {
    console.log(product.name, 'got', currentPrice)
  })
  p.on('priceAlert', function (product, newPrice) {
    console.log('Alert!', product.name, 'got', newPrice)
  })
  p.on('end', function () {
    console.log('End!')
    p.close() // shutdown driver
  })

  p
  .addProduct({
    name: 'BJURSTA',
    link: 'http://www.ikea.com/it/it/catalog/products/50116847/',
    price: 89.99,
    variation: 15
  })
  .fetchPrices()
}
