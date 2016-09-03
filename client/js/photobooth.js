function hasSupportedUserMedia() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
}

let streaming = false
let video = document.querySelector('video')
let canvas = document.querySelector('canvas')

if (hasSupportedUserMedia()) {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia

  navigator.getUserMedia({
    video: true,
    audio: false
  }, stream => {
    video.src = window.URL.createObjectURL(stream)
    streaming = true
  }, error => {
    console.log("Raised an error when capturing:", error)
  })
  document.querySelector('#capture').addEventListener('click', event => {
    if (streaming) {
      canvas.width = video.clientWidth
      canvas.height = video.clientHeight
      let context = canvas.getContext('2d')
      context.drawImage(video, 0, 0)
    }
  })
} else {
  alert("Sorry, your browser does not support getUserMedia.")
}

const filters = ['', 'grayscale', 'sepia', 'invert']
let currentFilter = 0

document.querySelector('canvas').addEventListener('click', event => {
  if (streaming) {
    canvas.width = video.clientWidth
    canvas.height = video.clientHeight

    let context = canvas.getContext('2d')
    context.drawImage(video, 0, 0)

    currentFilter++
    if(currentFilter > filters.length - 1) currentFilter = 0
    canvas.className = filters[currentFilter]
  }
})