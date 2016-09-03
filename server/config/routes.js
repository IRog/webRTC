module.exports = app => {
  app.get('/', (req, res, next) => {
    res.render('../pages/index', {})
  })

  app.get('/file-share', (req, res, next) => {
    res.render('../pages/file-share', {})
  })

  app.get('/photobooth', (req, res, next) => {
    res.render('../pages/photobooth', {})
  })

  app.get('/video-chat', (req, res, next) => {
    res.render('../pages/video-chat', {})
  })
}
