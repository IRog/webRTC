let username
let connectedPerson
const socket = new WebSocket('ws://localhost:8888')

socket.onopen = () => {
  console.log("Connected")
}

// Handle all messages through this callback
socket.onmessage = message => {
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

socket.onerror = err => {
  console.log("Got error", err)
}

// Alias for sending messages in JSON format
function send(message) {
  if (connectedPerson) {
    message.name = connectedPerson
  }

  socket.send(JSON.stringify(message))
}

let loginPageElem = document.querySelector('#login-page')
let usernameInputElem = document.querySelector('#username')
let loginButtonElem = document.querySelector('#login')
let theirUsernameInputElem = document.querySelector('#their-username')
let connectButton = document.querySelector('#connect')
let sharePage = document.querySelector('#share-page')
let sendButtonElem = document.querySelector('#send')
let readyText = document.querySelector('#ready')
let statusText = document.querySelector('#status')

sharePage.style.display = "none"
readyText.style.display = "none"

// Login when the user clicks the button
loginButtonElem.addEventListener("click", event => {
  username = usernameInputElem.value

  if (username.length > 0) {
    send({
      type: "login",
      name: username
    })
  }
})

function onLogin(success) {
  if (success === false) {
    alert("Login unsuccessful, please try a different name.")
  } else {
    loginPageElem.style.display = "none"
    sharePage.style.display = "block"

    // Get the plumbing ready for a call
    startConnection()
  }
}

let thisConnection 
let dataChan
let currentFileSize = 0
let currentFile
let currentFileMeta

function startConnection() {
  if (hasRTCPeerConnection()) {
    setupPeerConnection()
  } else {
    alert("Sorry, your browser does not support WebRTC.")
  }
}

function setupPeerConnection() {
  const configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302 " }]
  }
  thisConnection = new RTCPeerConnection(configuration, {optional: []})

  // Setup ice handling
  thisConnection.onicecandidate = function (event) {
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
  var dataChannelOptions = {
    ordered: true,
    reliable: true,
    negotiated: true,
    id: "myChannel"
  }
  dataChan = thisConnection.createDataChannel("myLabel", dataChannelOptions)

  dataChan.onerror = error => {
    console.log("Data Channel Error:", error)
  }

  // Add this to the openDataChannel function
  dataChan.onmessage = event => {
    try {
      var message = JSON.parse(event.data)
      switch (message.type) {
        case "start":
          currentFile = []
          currentFileMeta = message.data
          document.querySelector('#file-name').innerHTML = message.name
          break
        case "end":
          saveFile(currentFileMeta, currentFile)
          break
      }
    } catch (e) {
      // Assume this is file content
      currentFile.push(window.atob(event.data))
      const fileLength = currentFile.length - 1
      currentFileSize += currentFile[fileLength].length

      const percentage = Math.floor((currentFileSize / currentFileMeta) * 100)
      statusText.innerHTML = "Receiving... " + percentage + "%"
    }
  }

  dataChan.onopen = () => {
    readyText.style.display = "inline-block"
  }

  dataChan.onclose = () => {
    readyText.style.display = "none"
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

function hasFileApi() {
  return window.File && window.FileReader && window.FileList && window.Blob
}

connectButton.addEventListener("click", () => {
  var theirUsername = theirUsernameInputElem.value

  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername)
  }
})

function startPeerConnection(user) {
  connectedPerson = user

  // Begin the offer
  thisConnection.createOffer(offer => {
    send({
      type: "offer",
      offer: offer
    })
    thisConnection.setLocalDescription(offer)
  }, error => {
    alert("An error has occurred.")
  })
}

function onOffer(offer, name) {
  connectedPerson = name
  thisConnection.setRemoteDescription(new RTCSessionDescription(offer))

  thisConnection.createAnswer(answer => {
    thisConnection.setLocalDescription(answer)

    send({
      type: "answer",
      answer: answer
    })
  }, error => {
    alert("An error has occurred")
  })
}

function onAnswer(answer) {
  thisConnection.setRemoteDescription(new RTCSessionDescription(answer))
}

function onCandidate(candidate) {
  thisConnection.addIceCandidate(new RTCIceCandidate(candidate))
}

function onLeave() {
  connectedPerson = null
  thisConnection.close()
  thisConnection.onicecandidate = null
  setupPeerConnection()
}

sendButtonElem.addEventListener("click", event => {
  const files = document.querySelector('#files').files

  if (files.length > 0) {
    dataChan.send(JSON.stringify({
      type: "start",
      data: files[0].size,
      name: files[0].name
    }))

    sendFile(files[0])
  }
})

function arrayBufferToBase64(buffer) {
    let binary = ''
    const bytes = new Uint8Array( buffer )
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] )
    }
    return btoa(binary)
}

function base64ToBlob(b64Data, contentType) {
    contentType = contentType || ''

    let byteArrays = [], byteNumbers, slice

    for (let i = 0; i < b64Data.length; i++) {
      slice = b64Data[i]

      byteNumbers = new Array(slice.length)
      for (let n = 0; n < slice.length; n++) {
          byteNumbers[n] = slice.charCodeAt(n)
      }

      const byteArray = new Uint8Array(byteNumbers)

      byteArrays.push(byteArray)
    }

    const blob = new Blob(byteArrays, {type: contentType})
    return blob
}

const CHUNK_MAX = 16000
function sendFile(file) {
  let reader = new FileReader()

  reader.onloadend = evt => {
    if (evt.target.readyState == FileReader.DONE) {
      const buffer = reader.result
      let start = 0
      let end = 0
      let last = false

      function sendChunk() {
        end = start + CHUNK_MAX

        if (end > file.size) {
           end = file.size
           last = true
        } // Code that already exists

        const percentage = Math.floor((end / file.size) * 100)
        statusText.innerHTML = "Sending... " + percentage + "%"

        dataChan.send(arrayBufferToBase64(buffer.slice(start, end)))

        // If this is the last chunk send our end message, otherwise keep sending
        if (last === true) {
          dataChan.send(JSON.stringify({
            type: "end"
          }))
        } else {
          start = end
          // Throttle the sending to avoid flooding
          setTimeout( () => {
            sendChunk()
          }, 100)
        }
      }

      sendChunk()
    }
  }

  reader.readAsArrayBuffer(file)
}

function saveFile(meta, data) {
  const blob = base64ToBlob(data, meta.type)

  let link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = meta.name
  link.click()
}
