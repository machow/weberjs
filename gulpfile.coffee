gulp = require 'gulp'
coffee = require 'gulp-coffee'
concat = require 'gulp-concat'
uglify = require 'gulp-uglify'
sourcemaps = require 'gulp-sourcemaps'
jasmine = require 'gulp-jasmine'
mainBowerFiles = require 'main-bower-files'
cson = require 'gulp-cson'
shell = require 'gulp-shell'
es = require 'event-stream'
del = require 'del'

paths = 
    scripts: ['./coffee/*.coffee']
    images: 'img/*'
    tests: 'tests/*'
    cson: ['docs/docs/examples/*.cson']

gulp.task 'clean', (cb) ->
    del('js/*', cb)

gulp.task 'build', ['clean'], () ->
    gulp.src(paths.scripts)
        .pipe(sourcemaps.init())
            .pipe(coffee())
            .pipe(concat('weber.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('js'))
        .pipe(gulp.dest('docs/docs/assets/js'))

gulp.task 'cson', () ->
    gulp.src('docs/docs/examples/*.cson')
        .pipe(cson())
        .pipe(gulp.dest('docs/docs/examples'))

gulp.task 'install-ui', () ->
    gulp.src('bower_components/weber-ui/dist/*')
        .pipe(gulp.dest('docs/docs/assets/weber-ui'))

gulp.task 'copy-bower', () ->
    gulp.src(mainBowerFiles())
        .pipe(gulp.dest('docs/js'))

gulp.task 'docs', ['copy-bower', 'cson', 'install-ui']

gulp.task 'watch-build', () ->
    gulp.watch(paths.scripts, ['build'])

gulp.task 'watch-cson', () ->
    gulp.watch(paths.cson, ['cson'])

gulp.task 'watch', ['watch-cson', 'watch-build']

gulp.task('default', ['cson', 'build'])


# TODO this is broken
# should use requirejs, then require libraries for tests in test scripts
gulp.task 'test', () ->
    gulp.src(paths.tests)
        .pipe(jasmine())
