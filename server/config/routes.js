module.exports = app => {
  const prod = process.env.NODE_ENV === 'production'

  app.get('/', (req, res, next) => {
    res.render('../pages/index', {})
  })

  app.get('/file-share', (req, res, next) => {
    res.render('../pages/file-share', {prod: prod})
  })

  app.get('/photobooth', (req, res, next) => {
    res.render('../pages/photobooth', {prod: prod})
  })

  app.get('/video-chat', (req, res, next) => {
    res.render('../pages/video-chat', {prod: prod})
  })
}
