'use strict'
const SiteParser = require('../../lib/PriceMonitoring').SiteParser

/* Class */
class EbayIT extends SiteParser {
  constructor () {
    super(
      'https://www.ebay.it', // base url
      '#prcIsum@html | trim | split:" ",1 | replaceComma | float' // price selector
    )
  }
}

module.exports = EbayIT

/* Single Example */
if (!module.parent) {
  console.log('EbayIT example running...')

  var p = new EbayIT()

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
    name: 'Asus Zenpad 3S 64GB',
    link: 'http://www.ebay.it/itm/ASUS-ZENPAD-3S-10-9-7-64GB-WI-FI-ANDROID-6-0-ITALIA-GRIGIO-/291880815786?',
    price: 249.99,
    variation: 18
  })
  .addProduct({
    name: 'Orologio + occhiale Aviator donna/uomo',
    link: 'http://www.ebay.it/itm/Coppia-orologio-occhiale-TWIG-BOX-HARING-AVIATOR-uomo-donna-/201883789822',
    price: 29.99,
    variation: 18
  })
  .fetchPrices()
}
