// function hasUserMedia() {
//   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
//   return !!navigator.getUserMedia;
// }

// function hasRTCPeerConnection() {
//   window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
//   return !!window.RTCPeerConnection;
// }

// var yourVideo = document.querySelector('#yours'),
//     theirVideo = document.querySelector('#theirs'),
//     yourConnection, theirConnection;

// if (hasUserMedia()) {
//   navigator.getUserMedia({ video: true, audio: false }, function (stream) {
//     yourVideo.src = window.URL.createObjectURL(stream);

//     if (hasRTCPeerConnection()) {
//       startPeerConnection(stream);
//     } else {
//       alert("Sorry, your browser does not support WebRTC.");
//     }
//   }, function (error) {
//     alert("Sorry, we failed to capture your camera, please try again.");
//   });
// } else {
//   alert("Sorry, your browser does not support WebRTC.");
// }

// function startPeerConnection(stream) {
//   var configuration = {
//     // Uncomment this code to add custom iceServers
//     "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
//   };
//   yourConnection = new webkitRTCPeerConnection(configuration);
//   theirConnection = new webkitRTCPeerConnection(configuration);

//   // Setup stream listening
//   yourConnection.addStream(stream);
//   theirConnection.onaddstream = function (e) {
//     theirVideo.src = window.URL.createObjectURL(e.stream);
//   };

//   // Setup ice handling
//   yourConnection.onicecandidate = function (event) {
//     if (event.candidate) {
//       theirConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
//     }
//   };

//   theirConnection.onicecandidate = function (event) {
//     if (event.candidate) {
//       yourConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
//     }
//   };

//   // Begin the offer
//   yourConnection.createOffer().then(function (offer) {
//     yourConnection.setLocalDescription(offer);
//     theirConnection.setRemoteDescription(offer);

//     theirConnection.createAnswer().then(function (offer) {
//       theirConnection.setLocalDescription(offer);
//       yourConnection.setRemoteDescription(offer);
//     });
//   });
// };