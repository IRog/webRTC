const babel = require('gulp-babel')
const browserify = require('browserify')
const closureCompiler = require('google-closure-compiler').gulp()
const del = require('del')
const es = require('event-stream')
const glob = require('glob')
const gulp = require('gulp')
const livereload = require('gulp-livereload')
const notify = require('gulp-notify')
const rename = require('gulp-rename')
const runSequence = require('run-sequence')
const source = require('vinyl-source-stream')
const transform = require('vinyl-transform')

function handleError(err) {
  console.log(err.toString())
  return 'Gulp Error! ' + err.toString()
}

gulp.task('browserify', done => {
  glob('./dist/js/**.js', (err, files) => {
    if(err) done(err);

    const tasks = files.map(entry => {
      return browserify({ entries: [entry] })
          .bundle()
          .on('error', notify.onError(handleError))
          .pipe(source(entry))
          .on('error', notify.onError(handleError))
          .pipe(rename({
              extname: '.bundle.js'
          }))
          .pipe(gulp.dest(''))
      })
    es.merge(tasks).on('end', done)
  })
})

gulp.task('js-compile', () => {
  return gulp.src('./dist/js/**/*.bundle.js', {base: './'})
    .pipe(closureCompiler({
      compilation_level: 'SIMPLE',
      language_in: 'ECMASCRIPT6',
      language_out: 'ECMASCRIPT5_STRICT',
      output_wrapper: '(function(){\n%output%\n}).call(this)',
      js_output_file: 'build.min.js'
    }))
    .on('error', notify.onError(handleError))
    .pipe(gulp.dest('./dist/build/js'))
})

gulp.task('babel', () =>
  gulp.src('./client/js/**/*.js')
  .pipe(babel({
    presets: ['es2015'],
    "plugins": [
      "transform-decorators-legacy",
      "transform-object-rest-spread",
      "transform-class-properties"
    ]
  }))
  .on('error', notify.onError(handleError))
  .pipe(gulp.dest('./dist/js'))
)

gulp.task('reload-js', input => {
 return gulp.src('./dist/**/*.js').pipe(livereload()).on('error', notify.onError(handleError))
})

gulp.task('reload-pug', input => {
 return gulp.src('./client/views/pages/*.pug').pipe(livereload()).on('error', notify.onError(handleError))
})

gulp.task('clean', () => {
  return del([
    './dist/js/**/*.js',
  ])
})

gulp.task('js-pipeline', callback => {
  runSequence('clean', 'babel', 'browserify', 'reload-js', callback)
})

gulp.task('watch', () => {
  livereload.listen()
  gulp.watch('./client/js/*.js', ['js-pipeline'])
  gulp.watch('./client/js/*.js', ['js-pipeline'])
  gulp.watch('./client/views/pages/*.pug', ['reload-pug'])
})

gulp.task('default', ['watch'], () => {})
