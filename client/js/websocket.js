export default (send, onLeave, dataChannel, stream, yourConnection) => {
  const connection = new WebSocket('ws://localhost:8888')

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
      loginPage.style.display = "none"
      callPage.style.display = "block"

      // Get the plumbing ready for a call
      startConnection()
    }
  }

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
        yourVideo.src = window.URL.createObjectURL(stream)

        if (hasRTCPeerConnection()) {
          setupPeerConnection(stream)
        } else {
          alert("Sorry, your browser does not support WebRTC.")
        }
      }, function (error) {
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
    yourConnection.onaddstream = function (e) {
      theirVideo.src = window.URL.createObjectURL(e.stream)
    }

    // Setup ice handling
    yourConnection.onicecandidate = function (event) {
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
      console.log('sfffsdffdf')

      received.innerHTML += "recv: " + event.data + "<br />"
      received.scrollTop = received.scrollHeight
    }

    dataChannel.onopen = function () {
      console.log('wtffff')
      console.log(dataChannel)
      dataChannel.send(name + " has connected.")
    }

    dataChannel.onclose = function () {
      console.log("The Data Channel is Closed")
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
}
