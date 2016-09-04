const babel = require('gulp-babel')
const browserify = require('browserify')
const closureCompiler = require('google-closure-compiler').gulp()
const es = require('event-stream')
const glob = require('glob')
const gulp = require('gulp')
const livereload = require('gulp-livereload')
const rename = require('gulp-rename')
const runSequence = require('run-sequence')
const source = require('vinyl-source-stream')
const transform = require('vinyl-transform')

gulp.task('browserify', function(done) {
  glob('./dist/js/**.js', function(err, files) {
    if(err) done(err);

    const tasks = files.map(function(entry) {
        return browserify({ entries: [entry] })
            .bundle()
            .pipe(source(entry))
            .pipe(rename({
                extname: '.bundle.js'
            }))
            .pipe(gulp.dest('./dist/bundle'))
        })
    es.merge(tasks).on('end', done)
  })
})

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
      "transform-decorators-legacy",
      "transform-object-rest-spread",
      "transform-class-properties"
    ]
  }))
  .pipe(gulp.dest('./dist/js'))
)

gulp.task('reload-js', input => {
 return gulp.src('./dist/**/*.js').pipe(livereload())
})

gulp.task('reload-pug', input => {
 return gulp.src('./client/views/pages/*.pug').pipe(livereload())
})

gulp.task('js-pipeline', function(callback) {
  runSequence('babel', 'browserify', 'reload-js', callback);
})

gulp.task('watch', () => {
  livereload.listen()
  gulp.watch('./client/js/*.js', ['js-pipeline'])
  gulp.watch('./client/js/*.js', ['js-pipeline'])
  gulp.watch('./client/views/pages/*.pug', ['reload-pug'])
})

gulp.task('default', ['watch'], () => {})