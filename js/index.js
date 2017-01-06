/**
 * js/index.js - shopify-sample
 * 
 * Licensed under MIT.
 * Copyright (C) 2017 Karim Alibhai.
 */

~ function () {
  'use strict'

  var links = []

      /**
       * Links model to view or view to model.
       */
    , link = function (type, id, get, initial) {
        if (type === 'get') links.push({ id: id, elm: document.getElementById(id), get: get })
        else {
          var elm = document.getElementById(id)
          elm.value = initial
          elm.addEventListener('change', function () {
            data[id] = get(elm.value)
            updateData()
          })
        }
      }

      /**
       * Renders all links every time an animation frame is available.
       */
    , updateView = function () {
        links.forEach(function (link) {
          link.elm.innerText = link.get(data[link.id])
        })

        // the weird one
        total.setAttribute('data-post', 'Total (' + data.currency + ')')

        requestAnimationFrame(updateView)
      }

      /**
       * General state management.
       */
    , data = {
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        currency: 'CAD',

        created_at: { min: new Date(0), max: new Date() },
        updated_at: { min: new Date(0), max: new Date() },
        status: 'any', status_out: 'any',
        fstatus: 'any', fstatus_out: 'any',
        fulfillment_status: 'any', fulfillment_status_out: 'any'
      }

      /**
       * Converts data to options.
       */
    , options = function () {
        return {
          status: data.status,
          financial_status: data.fstatus,
          fulfillment_status: data.fulfillment_status,
          created_at_min: data.created_at.min.toISOString(),
          created_at_max: data.created_at.max.toISOString(),
          updated_at_min: data.updated_at.min.toISOString(),
          updated_at_max: data.updated_at.max.toISOString()
        }
      }

      /**
       * Fallbacks for requestAnimationFrame() handler.
       */
    , requestAnimationFrame = window.requestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
		                          window.mozRequestAnimationFrame ||
		                          window.oRequestAnimationFrame ||
		                          window.msRequestAnimationFrame ||
                              function (callback) { setTimeout(callback, 1000 / 60) }

      /**
       * Data formatters - Makes things look pretty.
       */
    , months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    , float = function (string) { return Math.floor(100 * parseFloat(string)) / 100 }
    , date = function (date) { return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() }
    , dateRange = function (range) { return date(range.min) + ' - ' + date(range.max) }
    , dateInput = function (d) {
        var month = 1 + d.getMonth()
          , day = d.getDate()
        
        if (month < 10) month = '0' + month
        if (day < 10) day = '0' + day
      
        return [d.getFullYear(), month, day].join('-')
      }

      /**
       * Fetches new data using current options.
       */
    , updateData = window.update = function () {
          // Based upon: https://gist.githubusercontent.com/Xeoncross/7663273/raw/90f45a6dd89614d2fb06ac87b366d0da11a2eb52/ajax.js
          var xhr = new (this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0')
          xhr.open('POST', '/orders', true)
		      xhr.onreadystatechange = function () {
            if (xhr.readyState > 3) {
              var res = JSON.parse(xhr.responseText)
                , index = -1
                , next = function () {
                    index += 1

                    // only while data exists
                    if (index === res.length) return;

                    // add the next one, just parse, not round
                    data.subtotal += parseFloat(res[index].subtotal_price)
                    data.shipping += parseFloat(res[index].shipping_total)
                    data.tax      += parseFloat(res[index].total_tax)
                    data.total    += parseFloat(res[index].total_price)

                    // animate movements
                    requestAnimationFrame(next)
                  }

              // reset all counts
              data.subtotal = data.shipping = data.tax = data.total = 0

              // if more than one result, update currency and count up
              if (res.length > 0) {
                data.currency = res[0].currency

                // slowly add things up
                next()
              }
            }
		      }
		      xhr.send(JSON.stringify(options()))
      }.bind(window)

  // link results to pretty results
  link('get', 'subtotal', float)
  link('get', 'shipping', float)
  link('get', 'tax',      float)
  link('get', 'total',    float)
  link('get', 'currency', String)

  // link up option previews
  link('get', 'created_at', dateRange)
  link('get', 'updated_at', dateRange)
  link('get', 'status_out', function (index) { return ({
    'open': 'Open orders',
    'closed': 'Only closed orders',
    'any': 'Any order status'
  })[index] })
  link('get', 'fstatus_out', function (index) { return ({
    'authorized': 'Only authorized orders',
    'pending': 'Only pending orders',
    'paid': 'Only paid orders',
    'refunded': 'Show only refunded orders',
    'voided': 'Show only voided orders',
    'any': 'All authorized, pending, and paid orders'
  })[index] })
  link('get', 'fulfillment_status_out', function (index) { return ({
    'shipped': 'Orders that have been shipped',
    'partial': 'Partially shipped orders',
    'unshipped': 'Orders that have not yet been shipped',
    'any': 'Orders with any fulfillment_status.'
  })[index] })

  // link inputs to data
  link('put', 'created_at_min',     function (d) { data.created_at.min = new Date(d) }, dateInput(data.created_at.min))
  link('put', 'created_at_max',     function (d) { data.created_at.max = new Date(d) }, dateInput(data.created_at.max))
  link('put', 'updated_at_min',     function (d) { data.updated_at.min = new Date(d) }, dateInput(data.updated_at.min))
  link('put', 'updated_at_max',     function (d) { data.updated_at.max = new Date(d) }, dateInput(data.updated_at.max))
  link('put', 'status',             function (d) { return (data.status_out = d) }, data.status)
  link('put', 'fstatus',            function (d) { return (data.fstatus_out = d) }, data.fstatus)
  link('put', 'fulfillment_status', function (d) { return (data.fulfillment_status_out = d) }, data.fulfillment_status)

  // create bindings for options
  ;[].forEach.call(document.getElementsByClassName('controls')[0].getElementsByTagName('li'), function (li) {
    li.getElementsByClassName('collapsed')[0].addEventListener('click', function (evt) {
      evt.preventDefault()

      if (li.classList.contains('expanded')) li.classList.remove('expanded')
      else li.classList.add('expanded')
    })

    li.getElementsByClassName('btn-close')[0].addEventListener('click', function (evt) {
      evt.preventDefault()
      li.classList.remove('expanded')
    })
  })

window.data=data
  // begin updates
  updateView()
  updateData()
}()