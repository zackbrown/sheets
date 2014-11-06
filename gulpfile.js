// Load plugins
var gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  clean = require('gulp-clean'),
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  gutil = require('gulp-util'),
  ngAnnotate = require('gulp-ng-annotate'),
  pkg = require('./package.json');

// Clean
gulp.task('clean', function() {
  return gulp.src(['dist/'], {read: false})
  .pipe(clean());
});

// Build for dist
gulp.task('build', ['clean'], function(event) {
  var header = require('gulp-header');
  var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

  // Build the JS
  return gulp.src([
    'src/module.js',
    'src/services/**/*.js',
    'src/directives/**/*.js'
  ])
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter('default'))
  .pipe(concat('sheets.js'))
  .pipe(header(banner, { pkg : pkg } ))
  .pipe(ngAnnotate())
  .pipe(gulp.dest('dist/'))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(header(banner, { pkg : pkg } ))
  .pipe(gulp.dest('dist/'))
  .pipe(notify({ message: 'Build task complete' }));
});

gulp.task('jasmine', function() {
  var jasmine = require('gulp-jasmine');

  return gulp.src('test/**/*Test.js')
    .pipe(jasmine());
})
