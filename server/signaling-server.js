module.exports = () => {
  const WebSocketServer = require('ws').Server
  const wss = new WebSocketServer({ port: 8888 })
  let users = {}

  function sendTo(conn, message) {
    conn.send(JSON.stringify(message))
  }

  wss.on('connection',  connection => {
    console.log("User connected")

    connection.on('message',  message => {
      let data

      try {
        data = JSON.parse(message)
      } catch (e) {
        console.log("Error parsing JSON")
        data = {}
      }

       switch (data.type) {
        case "login":
          console.log("User logged in as", data.name)
          if (users[data.name]) {
            sendTo(connection, {
              type: "login",
              success: false
            })
          } else {
            users[data.name] = connection
            connection.name = data.name
            sendTo(connection, {
              type: "login",
              success: true
            })
          }

          break
        case "offer":
          console.log("Sending offer to "+ data.name)
          var conn = users[data.name]

          if (conn != null) {
            connection.otherName = data.name
            sendTo(conn, {
              type: "offer",
              offer: data.offer,
              name: connection.name
            })
          }

          break
        case "answer":
          console.log("Sending answer to ", data.name)
          var conn = users[data.name]

          if (conn != null) {
            connection.otherName = data.name
            sendTo(conn, {
              type: "answer",
              answer: data.answer
            })
          }

          break
        case "candidate":
          console.log("Sending candidate to " + data.name)
          var conn = users[data.name]

          if (conn != null) {
            sendTo(conn, {
              type: "candidate",
              candidate: data.candidate
            })
          }

          break

        case "leave":
          console.log("Disconnecting user from ", data.name)
          var conn = users[data.name]
          conn.otherName = null

          if (conn != null) {
            sendTo(conn, {
              type: "leave"
            })
          }

          break
        default:
          sendTo(connection, {
            type: "error",
            message: "Unrecognized command: " + data.type
          })

          break
      }
  })

    connection.on('close', () => {
      if (connection.name) {
        delete users[connection.name]
        if (connection.otherName) {
          console.log("Disconnecting user from", connection.otherName)
          let conn = users[connection.otherName]
          conn.otherName = null

          if (conn != null) {
            sendTo(conn, {
              type: "leave"
            })
          }
        }
      }
    })
  })

  wss.on('listening', () => {
    console.log("Server started...")
  })
}