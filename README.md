# price-monitoring [![NPM Version](https://img.shields.io/npm/v/price-monitoring.svg)](https://www.npmjs.com/package/price-monitoring) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Node.js price monitoring library, leveraging the power of x-ray and nightmare.

## Features

- [x] Leverage the power of [x-ray](https://github.com/lapwinglabs/x-ray), [nightmare](https://github.com/segmentio/nightmare) and [cheerio](https://github.com/cheeriojs/cheerio).
- [x] Electron based headless-engine that accepts JS and follows redirects.
- [x] Parse Products starting from a CSV file.
- [x] Modular structure for Website parser (`MyEcommerce` that extends `SiteParser`).
- [x] Bind every URL to an instance of the parsers. (A parser can handle multiple urls).
    - [x] Check wether an url got his parser.

## Install

    $ npm install --save price-monitoring

## Usage

### Product structure

```json
{
  "name": "Samsung Evo microSD 32GB",
  "link": "https://www.amazon.it/Samsung-MB-MP32DA-EU-Memoria-Adattatore/dp/B00J29BR3Y/",
  "price": 14.00,
  "variation": 10
}
```

- **name**: product name or identifier.
- **link**: absolute link to the product.
- **price**: base price.
- **variation**: price variation in % that triggers the `priceAlert` event.
- **customSelector**: [optional] provide a custom selector for a given product instead of using the one of your custom parser.

### Get it from a CSV

You can easily provide a CSV list of products.

```text
name, link, price, variation
Samsung Evo microSD 32GB,https://www.amazon.it/Samsung-MB-MP32DA-EU-Memoria-Adattatore/dp/B00J29BR3Y/,14.00,10
...
```

### Main flow

```javascript
var PriceMonitoring = require('price-monitoring')

var pm = new PriceMonitoring({
  parsersDir: path.join(__dirname, 'myParsers/'), // add parsers
  interval: 60 * 1000 // check prices every min
})

pm.on('priceAlert', function(product, newPrice){
  // do whatever you want
  // ...
})

/* Add the products from CSV */
pm.parseCSV(fileInput) // fileInput can be a csv file path or a Buffer
// or manually
pm.parseAndSubmit({
  name: 'Special price product',
  link: 'https://www.amazon.it/dp/B01MY76N2U?psc=1',
  price: 249.99,
  variation: 18
})

pm.watchPrices()

```

**Every parser works in Parallel, and products prices are fetched sequentially.**

The `parsersDir` property is mandatory.
Check out a fully-working sample in the `example/` dir.

## API

#### parseAndSubmit(`<Object>`, `<fn>`)

Parse and submit a product to his own parser instance. The product object should follow the structure explained above. The callback will return `true` or `false` depending on the submission outcome.

#### parseCSV(`<fileInput>`/`<Buffer>`)

Fetch and parse all the products from the provided CSV file or Buffer. It returns a Promise.

#### fetchAllPrices(cb)

The `cb` is called once all the prices for all the Parsers have been retrieved.

#### watchPrices(cb)

Start watching for Prices, the `callback` is called once all the parsers retrieved all the products prices. The callback returns the current round number. If called multiple times it will not take effect.

#### isWatchingPrices()

Returns `true` if the price watch operation is running, `false` otherwise.

#### stop()

Stop the prices' watch.

#### close()

Close all the nightmareDrivers from the parsers' instances. (This avoids zombie processes).

#### getParsersList()

Returns an Array of the all the Parsers loaded in the current instance of `PriceMonitoring` with all the submitted products.

#### getParsersCount()

Returns the number of site-parsers loaded.

#### getProductsCount()

Returns the number of products added.

#### getProducts()

Returns an array of all the inserted products.

#### isWebsiteCovered(`<Url>`)

Check wether a given website url has his own parser loaded or not.

## Events

#### .on('error', cb)

Triggered in case of error. `cb` accepts one param, `error`.

#### .on('submit', cb)

Triggered when a new product is submitted in a parser' instance.
The `cb` accepts one param, `product`. (The product being submitted).

#### .on('skip', cb)

Triggered when a product is skipped (no suitable parser found).
The `cb` accepts one param, `product`. (The product being skipped).

#### .on('priceFetched', cb)

Triggered when a new price has been fetched for a given product.
The `cb` accepts 2 params: `product`, `price`.

#### .on('priceAlert', cb)

Triggered when a product's price is outside the variation% threshold.
The `cb` accepts 2 params: `product`, `newPrice`.

#### .on('parserEnd', cb)

Called when a parser ends his price-fetch process for all his products.
The `cb` accepts 2 params: `site`, `nProducts`. Respectively the website and the number of products involved.


## Build a custom website parser

It's quick:

```javascript
const SiteParser = require('price-monitoring').SiteParser

/* Class */
class MyEcommerce extends SiteParser {
  constructor () {
    super(
      'https://www.my-ecommerce-website.com', // base url
      '.pricing .price@html | trim | slice:-5 | replaceComma | float' // price selector
    )
  }
}

module.exports = MyEcommerce
```

That's it. Then don't forget to put your parsers in a directory and give it as `parsersDir` property to your currente `PriceMonitoring` instance.

#### Available filters

- `trim`: trim the given string.

- `reverse`: reverse the given string.

- `join:<sep>`: join the string using the given `sep` separator.

- `slice:<start>,<end>`: split the string from `start` to `end` indexes.

- `split:<sep>,<index>`: split for the given `sep` separator and return the elem. at the `index`.

- `replaceComma`: Replace the `,` char with `.`, useful to make the price string parsable.

- `float`: Cast the given string to float.

### Test our website parser in an isolate-manner

```javascript

var p = new AmazonIT()

p.on('error', console.log)
p.on('submit', console.log)
p.on('priceFetched', function(product, currentPrice){
  console.log(product.name, 'got', currentPrice)
})
p.on('priceAlert', function(product, newPrice){
  console.log('Alert!', product.name, 'got', newPrice)
})
p.on('end', function(){
  console.log('End!')
})

p.addProduct({
    name: 'Special price product',
    link: 'https://www.amazon.it/dp/B01MY76N2U?psc=1',
    price: 20.5,
    variation: 15
  })
  .addProduct({
    name: 'Normal price product',
    link: 'https://www.amazon.it/Samsung-MB-MP32DA-EU-Memoria-Adattatore/dp/B00J29BR3Y/',
    price: 14.00,
    variation: 17
  })
  .fetchPrices()

```


## Notes

Still in Beta

## Author

Rocco Musolino

## License

MIT
