const gulp = require('gulp')
const livereload = require('gulp-livereload')
const babel = require('gulp-babel')
const closureCompiler = require('google-closure-compiler').gulp()
 
gulp.task('js-compile', function () {
  return gulp.src('./dist/js/**/*.js', {base: './'})
    .pipe(closureCompiler({
      compilation_level: 'SIMPLE',
      language_in: 'ECMASCRIPT6',
      language_out: 'ECMASCRIPT5_STRICT',
      output_wrapper: '(function(){\n%output%\n}).call(this)',
      js_output_file: 'build.min.js'
    }))
    .pipe(gulp.dest('./dist/build/js'))
})

gulp.task('babel', () =>
  gulp.src('./client/js/**/*.js')
  .pipe(babel({
    presets: ['es2015'],
    "plugins": [
      "transform-object-rest-spread",
      "transform-class-properties"
    ]
  }))
  .pipe(gulp.dest('./dist/js'))
)

gulp.task('reload-js', input => {
 return gulp.src('./client/js/*.js').pipe(livereload())
})

gulp.task('reload-pug', input => {
 return gulp.src('./client/views/pages/*.pug').pipe(livereload())
})

gulp.task('watch', () => {
  livereload.listen()
  gulp.watch('./client/js/*.js', ['reload-js'])
  gulp.watch('./client/views/pages/*.pug', ['reload-pug'])
})

gulp.task('default', ['watch'], () => {})