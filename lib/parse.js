/**
 * lib/parse.js - shopify-samples
 * Iteratively parse shopify stream.
 * 
 * Licensed under MIT.
 * Copyright (C) 2017 Karim Alibhai.
 */

'use strict'

const qs = require('querystring')
    , queue = require('streamqueue')
    , request = require('./request')
    , { createStore } = require('redux')

module.exports = (method, options, callback) => {
  // redux store to manage the parsed orders list
  const store = createStore((state = [], action) => {
    if (action.type === 'PARSED') {
      // replace shipping lines with total
      action.data.shipping_total = action.data.shipping_lines.reduce((a, b) => (a + b.price), 0)
      delete action.data.shipping_lines

      state.push(action.data)
    }

    return state
  })

  let parsedLength = 0
    , prevData = ''

  // override access token
  options.access_token = 'c32313df0d0ef512ca64d5b336a0d7c6'

  // force stream data into queue, so speed of parsing
  // does not throw off the order
  queue(request(`https://shopicruit.myshopify.com/admin${method}.json?` + qs.stringify(options))).on('data', chunk => {
    // stringify
    chunk = chunk.toString()

    // skip the object-ness
    if (parsedLength === 0) {
      chunk = chunk.substr(11)
    }

    // add up unparsed with current chunk
    chunk = prevData + chunk

    // iterative parse, attempt to figure out the
    // division of data
    let parsed = false
    do {
      // continue to parse until we can't anymore
      parsed = false

      for (let i = 1; i < chunk.length; i += 1) {
        try {
          let parsedChunk = JSON.parse(chunk.substr(0, i))

          // add to state
          store.dispatch({ type: 'PARSED', data: parsedChunk })

          // skip parsed chunk & comma
          chunk = chunk.substr(i + 1)

          // stop parsing attempt
          parsed = true
          break
        } catch (err) {}
      }
    } while (parsed);

    // update state
    parsedLength += chunk.length
    prevData = chunk
  })

  // create a subscription
  store.subscribe(() => callback(store.getState()))
}