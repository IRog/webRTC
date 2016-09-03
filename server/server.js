'use strict'

const express = require('express')
const app = express()
const configRoutes = require('./config/routes')
const expressConfig = require('./config/express')
const signalingServer = require('./signaling-server')

expressConfig(app)
configRoutes(app)
signalingServer()

const port = process.env.PORT || 3000

return app.listen(port, () => {
  app.emit('started')
  console.log('Web app listening at: localhost:' + port)
})
