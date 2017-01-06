/**
 * app.js - shopify-sample
 * 
 * Licensed under MIT.
 * Copyright (C) 2017 Karim Alibhai.
 */

'use strict';

const fs = require('fs')
    , path = require('path')
    , getOrders = require('./lib/orders')

require('next-port')().then(port => {
  require('http')
    .createServer((req, res) => {
      if (req.url === '/orders') {
        let data = ''

        req.on('data', datum => (data += datum))
        req.on('end', _ => {
          try {
            getOrders(JSON.parse(data))
              .then(
                orders => res.end(JSON.stringify(orders)),
                err => res.end(String(err))
              )
          } catch (err) {
            res.statusCode = 500
            res.end(String(err))
          }
        })
      } else {
        const url = path.resolve(__dirname, '.' + (req.url.substr(-1) === '/' ? req.url + 'index.html' : req.url))
        fs.createReadStream(fs.existsSync(url) ? url : './404.html').pipe(res)
      }
    })
    .on('error', console.log)
    .listen(port, () => console.log('listening :%s', port))
}, console.log)