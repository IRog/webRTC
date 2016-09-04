import websocketConfig from './websocket'

var name
let connectedUser;

var connection = new WebSocket('ws://localhost:8888');

connection.onopen = function () {
  console.log("Connected");
};

// Handle all messages through this callback
connection.onmessage = function (message) {
  console.log("Got message", message.data);

  var data = JSON.parse(message.data);

  switch(data.type) {
    case "login":
      onLogin(data.success);
      break;
    case "offer":
      onOffer(data.offer, data.name);
      break;
    case "answer":
      onAnswer(data.answer);
      break;
    case "candidate":
      onCandidate(data.candidate);
      break;
    case "leave":
      onLeave();
      break;
    default:
      break;
  }
};

connection.onerror = function (err) {
  console.log("Got error", err);
};

// Alias for sending messages in JSON format
function send(message) {
  if (connectedUser) {
    message.name = connectedUser;
  }

  connection.send(JSON.stringify(message));
};

let loginPage = document.querySelector('#login-page')
let usernameInput = document.querySelector('#username')
let loginButton = document.querySelector('#login')
let callPage = document.querySelector('#call-page')
let theirUsernameInput = document.querySelector('#their-username')
let callButton = document.querySelector('#call')
let sendButton = document.querySelector('#send')
let messageInput = document.querySelector('#message')
let hangUpButton = document.querySelector('#hang-up')
let received = document.querySelector('#received')

callPage.style.display = "none";

// Login when the user clicks the button
loginButton.addEventListener("click", function (event) {
  name = usernameInput.value;

  if (name.length > 0) {
    send({
      type: "login",
      name: name
    });
  }
});

function onLogin(success) {
  if (success === false) {
    alert("Login unsuccessful, please try a different name.");
  } else {
    loginPage.style.display = "none";
    callPage.style.display = "block";

    // Get the plumbing ready for a call
    startConnection();
  }
};

var yourVideo = document.querySelector('#yours')
let theirVideo = document.querySelector('#theirs')
let yourConnection
let stream
let dataChannel;

function startConnection() {
  if (hasUserMedia()) {
    navigator.getUserMedia({ video: true, audio: false }, function (myStream) {
      stream = myStream;
      yourVideo.src = window.URL.createObjectURL(stream);

      if (hasRTCPeerConnection()) {
        setupPeerConnection(stream);
      } else {
        alert("Sorry, your browser does not support WebRTC.");
      }
    }, function (error) {
      console.log(error);
    });
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}

function setupPeerConnection(stream) {
  var configuration = {
    "iceServers": [{ "url": "stun:stun.1.google.com:19302 " }]
  };
  yourConnection = new RTCPeerConnection(configuration, {optional: []});

  // Setup stream listening
  yourConnection.addStream(stream);
  yourConnection.onaddstream = function (e) {
    theirVideo.src = window.URL.createObjectURL(e.stream);
  };

  // Setup ice handling
  yourConnection.onicecandidate = function (event) {
    if (event.candidate) {
      send({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };
  openDataChannel()
}

function hasUserMedia() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  return !!navigator.getUserMedia;
}

function hasRTCPeerConnection() {
  window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
  window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
  return !!window.RTCPeerConnection;
}

callButton.addEventListener("click", function () {
  var theirUsername = theirUsernameInput.value;

  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername);
  }
});

function startPeerConnection(user) {
  connectedUser = user;

  // Begin the offer
  yourConnection.createOffer().then(function (offer) {
    send({
      type: "offer",
      offer: offer
    });
    yourConnection.setLocalDescription(offer);
  }, function (error) {
    alert("An error has occurred.");
  });
};

function onOffer(offer, name) {
  connectedUser = name;
  yourConnection.setRemoteDescription(new RTCSessionDescription(offer));

  yourConnection.createAnswer().then(function (answer) {
    yourConnection.setLocalDescription(answer);
    send({
      type: "answer",
      answer: answer
    });
  }, function (error) {
    alert("An error has occurred");
  });
};

function onAnswer(answer) {
  yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

function onCandidate(candidate) {
  yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

hangUpButton.addEventListener("click", function () {
  send({
    type: "leave"
  });

  onLeave();
});

function onLeave() {
  connectedUser = null;
  theirVideo.src = null;
  yourConnection.close();
  yourConnection.onicecandidate = null;
  yourConnection.onaddstream = null;
  setupPeerConnection(stream);
};

// Bind our text input and received area
sendButton.addEventListener("click", function (event) {
  var val = messageInput.value;
  received.innerHTML += "send: " + val + "<br />";
  received.scrollTop = received.scrollHeight;
  dataChannel.send(val);
  console.log(dataChannel)
});


function openDataChannel() {
    var dataChannelOptions = {
    reliable: true,
    negotiated: true,
    id: "myChannel"
  };
  dataChannel = yourConnection.createDataChannel("myLabel", dataChannelOptions);

  console.log(dataChannel)
  dataChannel.onerror = function (error) {
    console.log("Data Channel Error:", error);
  };

  dataChannel.onmessage = function (event) {
    console.log("Got Data Channel Message:", event.data);
    console.log('sfffsdffdf')

    received.innerHTML += "recv: " + event.data + "<br />";
    received.scrollTop = received.scrollHeight;
  };

  dataChannel.onopen = function () {
    console.log('wtffff')
    console.log(dataChannel)
    dataChannel.send(name + " has connected.");
  };

  dataChannel.onclose = function () {
    console.log("The Data Channel is Closed");
  };
}
