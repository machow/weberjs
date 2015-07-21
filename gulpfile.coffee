gulp = require 'gulp'
coffee = require 'gulp-coffee'
concat = require 'gulp-concat'
uglify = require 'gulp-uglify'
sourcemaps = require 'gulp-sourcemaps'
jasmine = require 'gulp-jasmine'
mainBowerFiles = require 'main-bower-files'
cson = require 'gulp-cson'
del = require 'del'

paths = 
    scripts: ['./coffee/*.coffee']
    images: 'img/*'
    tests: 'tests/*'

gulp.task 'clean', (cb) ->
    del('js/*', cb)

gulp.task 'build', ['clean'], () ->
    gulp.src(paths.scripts)
        .pipe(sourcemaps.init())
            .pipe(coffee())
            .pipe(concat('weber.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('js'))

gulp.task 'cson', () ->
    gulp.src('docs/docs/examples/*.cson')
        .pipe(cson())
        .pipe(gulp.dest('docs/docs/examples'))

gulp.task 'docs', ['cson'], () ->
    gulp.src(mainBowerFiles())
        .pipe(gulp.dest('docs/js'))

gulp.task 'watch', () ->
    gulp.watch(paths.scripts, ['build'])

gulp.task('default', ['watch', 'build'])


# TODO this is broken
# should use requirejs, then require libraries for tests in test scripts
gulp.task 'test', () ->
    gulp.src(paths.tests)
        .pipe(jasmine())
