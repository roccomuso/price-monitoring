'use strict'
/* autoload all the parsers. */
var debug = require('debug')('price-monitoring:util')
var fs = require('fs')
var path = require('path')
var glob = require('glob')
var parse = require('csv-parse')
var stream = require('stream')

module.exports = {
  autoload: function (directory) {
    try {
      var dir = fs.lstatSync(directory)
    } catch (e) {
      debug(e)
      throw Error('given parsersDir directory does not exists')
    }
    if (!dir.isDirectory()) throw Error('Please provide a valid directory for parsersDir')

    var loaded = {}
    var files = glob.sync('**/!(index).js', {cwd: directory})

    files.forEach(function (file) {
      var moduleName = path.basename(file, '.js')
      loaded[moduleName] = require(path.join(directory, file))
      debug('autoloader - Parser loaded', moduleName + ':', path.join(directory, file))
    })

    return loaded
  },
  csvParser: function (fileInput, cb) {
    debug('csvParser - Reading input file/buffer:', fileInput)

    var parser = parse({
      delimiter: ',',
      auto_parse: true,
      columns: true,
      trim: true,
      skip_empty_lines: true
    }, function (err, data) {
      if (err) return cb(err)
      cb(null, data)
    })

    if (typeof fileInput === 'string') {
      // File
      fs.createReadStream(fileInput).pipe(parser)
    } else {
      // Buffer data
      if (!Buffer.isBuffer(fileInput)) throw Error('Provide a file path or a Buffer to parse CSV')
      var bufferStream = new stream.PassThrough()
      // Write your buffer
      bufferStream.end(fileInput)
      // Pipe it to csv parser
      bufferStream.pipe(parser)
    }

  }
}
