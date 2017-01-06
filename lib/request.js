/**
 * lib/request.js - shopify-sample
 * Simplified HTTP requests.
 * 
 * Licensed under MIT license.
 * Copyright (C) 2017 Karim Alibhai.
 */

'use strict'

const http = require('https')
    , map = require('map-stream')
    , get = (url, resolve, reject) => {
      http.get(url, res => {
        if (res.statusCode !== 200) return reject(`Something went wrong. (code: ${res.statusCode})`)
        resolve(res)
      }).on('error', reject)
    }

module.exports = (url, resolve, reject) => {
  if (resolve) {
    get(url, res => {
      let data = ''

      res.setEncoding('utf8')
      res.on('data', datum => (data += datum))
      res.on('error', reject)
      res.on('end', _ => resolve(JSON.parse(data)))
    }, reject)
  } else {
    const stream = map((data, next) => next(null, data))
    get(url, res => {
      res.setEncoding('utf8')
      res.pipe(stream)
    }, err => stream.emit('error', err))
    return stream
  }
}