const gulp = require('gulp')
const livereload = require('gulp-livereload')
const babel = require('gulp-babel')
const closureCompiler = require('google-closure-compiler').gulp()
 
gulp.task('js-compile', function () {
  return gulp.src('./client/js/**/*.js', {base: './'})
    .pipe(closureCompiler({
      compilation_level: 'SIMPLE',
      language_in: 'ECMASCRIPT6',
      language_out: 'ECMASCRIPT5_STRICT',
      output_wrapper: '(function(){\n%output%\n}).call(this)',
      js_output_file: 'build.min.js'
    }))
    .pipe(gulp.dest('./dist/js'))
})

gulp.task('babel', () =>
  gulp.src('./dist/js/build.min.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('/dist/js'))
)

gulp.task('reload-js', input => {
 return gulp.src('./client/js/*.js').pipe(livereload())
})

gulp.task('reload-pug', input => {
 return gulp.src('./client/views/pages/*.pug').pipe(livereload())
})

gulp.task('watch', () => {
  livereload.listen()
  gulp.watch('./client/js/*.js', ['js-compile', 'reload-js'])
  gulp.watch('./client/views/pages/*.pug', ['reload-pug'])
})

gulp.task('default', ['watch'], () => {})