'use strict'

const express = require('express')
const app = express()
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const compression = require('compression')

// Setup the view engine (jade)
const path = require('path')
app.set('views', path.join(__dirname, '../client/views'))
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
app.use(express.static(path.resolve(__dirname, '../client')))
app.use(favicon(path.resolve(__dirname, '../client/favicon/favicon-Cheshire-Cat-by-ichiibutt.ico')))

// compress all requests
app.use(compression())

app.get('/', (req, res, next) => {
  res.render('pages/index', {
    heroku: process.env.HEROKU
  })
})

app.get('/file-share', (req, res, next) => {
  res.render('pages/file-share', {
    heroku: process.env.HEROKU
  })
})

app.get('/photobooth', (req, res, next) => {
  res.render('pages/photobooth', {
    heroku: process.env.HEROKU
  })
})

app.get('/video-chat', (req, res, next) => {
  res.render('pages/video-chat', {
    heroku: process.env.HEROKU
  })
})

app.start = function() {
  // start the web app
  const port = process.env.PORT || 3000
  return app.listen(port, () => {
    app.emit('started')
    console.log('Web app listening at: localhost:' + port)
  })
}

// start the app if `$ node server.js`
if (require.main === module) {
  app.start()
}


//socket stuff
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 8888 });
let users = {}

function sendTo(conn, message) {
  conn.send(JSON.stringify(message));
}

wss.on('connection', function (connection) {
  console.log("User connected");

  connection.on('message', function (message) {
    var data;

    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log("Error parsing JSON");
      data = {};
    }

     switch (data.type) {
      case "login":
        console.log("User logged in as", data.name);
        if (users[data.name]) {
          sendTo(connection, {
            type: "login",
            success: false
          });
        } else {
          users[data.name] = connection;
          connection.name = data.name;
          sendTo(connection, {
            type: "login",
            success: true
          });
        }

        break;
      case "offer":
        console.log("Sending offer to "+ data.name);
        var conn = users[data.name];

        if (conn != null) {
          connection.otherName = data.name;
          sendTo(conn, {
            type: "offer",
            offer: data.offer,
            name: connection.name
          });
        }

        break;
      case "answer":
        console.log("Sending answer to", data.name);
        var conn = users[data.name];

        if (conn != null) {
          connection.otherName = data.name;
          sendTo(conn, {
            type: "answer",
            answer: data.answer
          });
        }

        break;
      case "candidate":
        console.log("Sending candidate to" + data.name);
        var conn = users[data.name];

        if (conn != null) {
          sendTo(conn, {
            type: "candidate",
            candidate: data.candidate
          });
        }

        break;

      case "leave":
        console.log("Disconnecting user from", data.name);
        var conn = users[data.name];
        conn.otherName = null;

        if (conn != null) {
          sendTo(conn, {
            type: "leave"
          });
        }

        break;
      default:
        sendTo(connection, {
          type: "error",
          message: "Unrecognized command: " + data.type
        });

        break;
    }
});

  connection.on('close', function () {
    if (connection.name) {
      delete users[connection.name];
      if (connection.otherName) {
        console.log("Disconnecting user from", connection.otherName);
        var conn = users[connection.otherName];
        conn.otherName = null;

        if (conn != null) {
          sendTo(conn, {
            type: "leave"
          });
        }
      }
    }
  });
});

wss.on('listening', function () {
    console.log("Server started...");
});
