'use strict'
var debug = require('debug')('price-monitoring:SiteParser')
var url = require('url')
var _ = require('lodash')
var eachSeries = require('async').eachSeries
var NightmareElectron = require('x-ray-nightmare')
var Xray = require('x-ray')
var EventEmitter = require('events').EventEmitter

class SiteParser extends EventEmitter {
  constructor (baseUrl, selector) { // optional params
    super()
    // instantiate driver for later shutdown
    this.timeout = 25 * 1000
    this.nightmareDriver = NightmareElectron({
      waitTimeout: this.timeout,
      gotoTimeout: this.timeout,
      loadTimeout: this.timeout,
      executionTimeout: this.timeout
    })

    this.x = Xray({
      filters: {
        trim: function (value) {
	  // Replace also white char ascii code 160
          return typeof value === 'string' ? value.replace(/\xA0/g, ' ').trim() : value
        },
        reverse: function (value) {
          return typeof value === 'string' ? value.split('').reverse().join('') : value
        },
        join: function (value, sep) {
          return typeof value === 'string' ? value.split('').join(sep) : value
        },
        slice: function (value, start, end) {
          debug('slice on value:', value)
          return typeof value === 'string' ? value.slice(start, end) : value
        },
        split: function (value, sep, index) {
          debug('split on value:', value, 'sep:', sep, 'index:', index)
          return typeof value === 'string' ? value.split(sep)[index] : value
        },
        replaceComma: function (value) {
          debug('Replacing comma in:', value)
          return typeof value === 'string' ? value.replace(',', '.') : value
        },
        float: function (value) {
          debug('Casting', value, 'to float')
          return typeof value === 'string' ? parseFloat(value) : value
        }
      }
    }).driver(this.nightmareDriver)

    this.products = []
    this.url = url.parse(baseUrl).hostname
    this.selector = selector
  }

  doUrlMatch (link) {
    var productBase = url.parse(link).hostname
    return productBase === this.url
  }

  addProduct (product) {
    if (!_.every(['name', 'link', 'price', 'variation'], _.partial(_.has, product))) {
      this.emit('error', 'Fields missing in ' + JSON.stringify(product))
      return this
    }

    if (!this.doUrlMatch(product.link)) {
      this.emit('error', url.parse(product.link).hostname + ' mismatch ' + this.url)
      return this
    }

    this.products.push(product)
    debug('Product', product.name, 'added')
    this.emit('submit', product)
    return this /* for method chaining */
  }

  delProduct (product) {
    // remove product and emit event
    var pLink = typeof product === 'object' ? product.link : product

    _.remove(this.products, function(p) {
      return p.link === pLink
    })
    debug('Product removed:', pLink)
    this.emit('remove', product)
  }

  getProducts () {
    return this.products
  }

  _isPriceValid (product, newPrice) {
    var delta = ((product.price * product.variation) / 100).toFixed(2)
    var allowed = product.price - delta
    return (newPrice > allowed)
  }

  fetchPrices (cb) {
    cb = typeof cb === 'function' ? cb : function () {}
    var self = this
    var productsFetched = 0

    var endFn = function (err) {
      if (err) self.emit('error', err)
      debug('END parsing for', self.url, '- Products fetched:', productsFetched)
      self.emit('end', self.url, productsFetched)
      cb(self.url, productsFetched)
      // shutdown driver
      // self.close()
    }
    eachSeries(this.products, function (product, done) {
      var _endTimeout = setTimeout(function(){
          // timeout
          done('Timeout for '+ product.link)
      }, self.timeout+2000)
      self.x(product.link, {price: product.customSelector || self.selector})(function (err, obj) {
        clearTimeout(_endTimeout)
        if (err) return done(err)
        if (!obj.price) {
          debug('Parsing error:', obj)
          self.emit('error', 'price parsing error for ' + product.link)
          return done()
        }
        var newPrice = obj.price
        self.emit('priceFetched', product, newPrice)
        if (!self._isPriceValid(product, newPrice)) {
          debug('priceAlert for', product, '\ngot new price:', newPrice)
          self.emit('priceAlert', product, newPrice)
        }
        productsFetched++
        done()
      })
    }, endFn)
  }

  close () {
    // gracefully shutdown driver.
    debug('Closing nightmareDriver')
    this.nightmareDriver()
  }
}

module.exports = SiteParser
