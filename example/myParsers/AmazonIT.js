'use strict'
const SiteParser = require('../../lib/PriceMonitoring').SiteParser

/* Class */
class AmazonIT extends SiteParser {
  constructor () {
    super(
      'https://www.amazon.it', // base url
      '#priceblock_saleprice, #priceblock_ourprice @html | trim | split:" ",1 | replaceComma | float' // price selector
    )
  }
}

module.exports = AmazonIT

/* Single Example */
if (!module.parent) {
  console.log('AmazonIT example running...')

  var p = new AmazonIT()

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
    name: 'Special price product',
    link: 'https://www.amazon.it/dp/B01MY76N2U?psc=1',
    price: 249.99,
    variation: 18
  })
  .addProduct({
    name: 'Normal price product',
    link: 'https://www.amazon.it/Samsung-MB-MP32DA-EU-Memoria-Adattatore/dp/B00J29BR3Y/',
    price: 14.00,
    variation: 18
  })
  .fetchPrices()
}
