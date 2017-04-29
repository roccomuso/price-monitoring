'use strict'
const SiteParser = require('../../lib/PriceMonitoring').SiteParser

/* Class */
class BestBuy extends SiteParser {
  constructor () {
    super(
      'http://www.bestbuy.com', // base url
      '.item-price@text | trim | split:" ",0 | split:$,1 | replaceComma | float' // price selector
    )
  }
}

module.exports = BestBuy
