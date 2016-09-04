const bodyParser = require('body-parser')
const compression = require('compression')
const express = require('express')
const favicon = require('serve-favicon')

module.exports = app => {
  // Setup the view engine (jade)
  const path = require('path')
  app.set('views', path.join(__dirname, '../../client/views/pages'))
  app.set('view engine', 'pug');

  // to support JSON-encoded bodies
  app.use(bodyParser.json())
  // to support URL-encoded bodies
  app.use(bodyParser.urlencoded({
    extended: true
  }))

  // -- Mount static files here--
  // All static middleware should be registered at the end, as all requests
  // passing the static middleware are hitting the file system
  app.use(express.static(path.resolve(__dirname, '../../dist')))
  app.use(favicon(path.resolve(__dirname, '../../dist/favicon/favicon-Cheshire-Cat-by-ichiibutt.ico')))

  // compress all requests
  app.use(compression())
}
