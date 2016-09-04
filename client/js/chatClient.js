let callButton = document.querySelector('#call')
let hangUpButton = document.querySelector('#hang-up')
let loginButton = document.querySelector('#login')
let messageInput = document.querySelector('#message')
let received = document.querySelector('#received')
let sendButton = document.querySelector('#send')
let theirUsernameInput = document.querySelector('#their-username')
let usernameInput = document.querySelector('#username')
const connection = new WebSocket('ws://localhost:8888')

let connectedUser
let dataChannel
let stream
let yourConnection

connection.onopen = function () {
  console.log("Connected")
}

// Alias for sending messages in JSON format
function send(message) {
  if (connectedUser) {
    message.name = connectedUser
  }

  connection.send(JSON.stringify(message))
}

  connection.onopen = function () {
    console.log("Connected")
  }

  // Handle all messages through this callback
  connection.onmessage = function (message) {
    console.log("Got message", message.data)

    const data = JSON.parse(message.data)

    switch(data.type) {
      case "login":
        onLogin(data.success)
        break
      case "offer":
        onOffer(data.offer, data.name)
        break
      case "answer":
        onAnswer(data.answer)
        break
      case "candidate":
        onCandidate(data.candidate)
        break
      case "leave":
        onLeave()
        break
      default:
        break
    }
  }

  connection.onerror = function (err) {
    console.log("Got error", err)
  }

  function onLogin(success) {
    if (success === false) {
      alert("Login unsuccessful, please try a different name.")
    } else {
      let callPage = document.querySelector('#call-page')
      let loginPage = document.querySelector('#login-page')

      loginPage.style.display = "none"
      callPage.style.display = "block"
      
      // Get the plumbing ready for a call
      startConnection(stream, dataChannel, yourConnection)
    }
  }

  function onOffer(offer, name) {
    connectedUser = name
    yourConnection.setRemoteDescription(new RTCSessionDescription(offer))

    yourConnection.createAnswer().then(function (answer) {
      yourConnection.setLocalDescription(answer)
      send({
        type: "answer",
        answer: answer
      })
    }, function (error) {
      alert("An error has occurred")
    })
  }

  function onAnswer(answer) {
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer))
  }

  function onCandidate(candidate) {
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate))
  }

function startPeerConnection(user) {
  connectedUser = user

  // Begin the offer
  console.log(yourConnection)
  yourConnection.createOffer().then(function (offer) {
    send({
      type: "offer",
      offer: offer
    })
    yourConnection.setLocalDescription(offer)
  }, function (error) {
    alert("An error has occurred.")
  })
}

// Login when the user clicks the button
loginButton.addEventListener("click", function (event) {
  const name = usernameInput.value

  if (name.length > 0) {
    send({
      type: "login",
      name: name
    })
  }
})

callButton.addEventListener("click", function () {
  const theirUsername = theirUsernameInput.value

  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername)
  }
})


hangUpButton.addEventListener("click", function () {
  send({
    type: "leave"
  })

  onLeave()
})

function onLeave() {
  let yourVideo = document.querySelector('#yours')

  connectedUser = null
  theirVideo.src = null
  yourConnection.close()
  yourConnection.onicecandidate = null
  yourConnection.onaddstream = null
  setupPeerConnection(stream)
}

// Bind our text input and received area
sendButton.addEventListener("click", function (event) {
  const val = messageInput.value
  received.innerHTML += "send: " + val + "<br />"
  received.scrollTop = received.scrollHeight
  dataChannel.send(val)
  console.log(dataChannel)
})

  function hasUserMedia() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
    return !!navigator.getUserMedia
  }

  function hasRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection
    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription
    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate
    return !!window.RTCPeerConnection
  }

  function startConnection() {
    if (hasUserMedia()) {
      navigator.getUserMedia({ video: true, audio: false }, function (myStream) {
        stream = myStream
        let yourVideo = document.querySelector('#yours')
        yourVideo.src = window.URL.createObjectURL(stream)

        if (hasRTCPeerConnection()) {
          setupPeerConnection(stream)
        } else {
          alert("Sorry, your browser does not support WebRTC.")
        }
      }, error => {
        console.log(error)
      })
    } else {
      alert("Sorry, your browser does not support WebRTC.")
    }
  }

  function setupPeerConnection(stream) {
    var configuration = {
      "iceServers": [{ "url": "stun:stun.1.google.com:19302 " }]
    }
    yourConnection = new RTCPeerConnection(configuration, {optional: []})

    // Setup stream listening
    yourConnection.addStream(stream)
    yourConnection.onaddstream = e => {
      theirVideo.src = window.URL.createObjectURL(e.stream)
    }

    // Setup ice handling
    yourConnection.onicecandidate = event => {
      if (event.candidate) {
        send({
          type: "candidate",
          candidate: event.candidate
        })
      }
    }
    openDataChannel()
  }

  function openDataChannel() {
    const dataChannelOptions = {
      reliable: true,
      negotiated: true,
      id: "myChannel"
    }
    dataChannel = yourConnection.createDataChannel("myLabel", dataChannelOptions)

    console.log(dataChannel)
    dataChannel.onerror = function (error) {
      console.log("Data Channel Error:", error)
    }

    dataChannel.onmessage = function (event) {
      console.log("Got Data Channel Message:", event.data)
      let received = document.querySelector('#received')
      
      received.innerHTML += "recv: " + event.data + "<br />"
      received.scrollTop = received.scrollHeight
    }

    dataChannel.onopen = function () {
      console.log(dataChannel)
      dataChannel.send(name + " has connected.")
    }

    dataChannel.onclose = function () {
      console.log("The Data Channel is Closed")
    }
  }