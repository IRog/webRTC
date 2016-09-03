const gulp = require('gulp')
const livereload = require('gulp-livereload')

gulp.task('reloadJs', input => {
 return gulp.src('./client/js/*.js').pipe(livereload())
})

gulp.task('reloadPug', input => {
 return gulp.src('./client/views/pages/*.pug').pipe(livereload())
})

gulp.task('watch', () => {
  livereload.listen()
  gulp.watch('./client/js/*.js', ['reloadJs'])
  gulp.watch('./client/views/pages/*.pug', ['reloadPug'])
})

gulp.task('default', ['watch'], () => {})