/**
 * lib/orders.js - shopify-sample
 * 
 * Licensed under MIT.
 * Copyright (C) 2017 Karim Alibhai.
 */

'use strict'

const { EventEmitter } = require('events')
    , qs = require('querystring')
    , request = require('./request')
    , get = require('./parse')

module.exports = options => new Promise((resolve, reject) => {
  options.access_token = 'c32313df0d0ef512ca64d5b336a0d7c6'

  request('https://shopicruit.myshopify.com/admin/orders/count.json?' + qs.stringify(options), body => {
    // science to figure out number of pages with limit of 250
    // orders to query
    const expected = body.count
        , pages = Math.ceil(expected / 250)
        , pageSizes = [... new Array(pages).keys()]

    Promise.all(
      [... new Array(pages).keys()].map((_, index) => new Promise((resolve, reject) =>
        get('/orders', Object.assign(options, {
          page: index + 1,
          limit: 250,
          fields: [
            'total_price',
            'subtotal_price',
            'total_tax',
            'currency',
            'shipping_lines'
          ].join(',')
        }), state => {
          pageSizes[index] = state.length
          if (pageSizes.reduce((a, b) => (a + b), 0) === expected) resolve(state)
        })
      ))
    ).then(orders => resolve(orders.reduce((arr, sub) => arr.concat(sub), [])), reject)
  }, reject)
})