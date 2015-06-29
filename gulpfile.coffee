gulp = require 'gulp'
coffee = require 'gulp-coffee'
concat = require 'gulp-concat'
uglify = require 'gulp-uglify'
sourcemaps = require 'gulp-sourcemaps'
del = require 'del'

paths = 
    scripts: ['./coffee/*.coffee']
    images: 'img/*'

gulp.task 'clean', (cb) ->
    del('js/*', cb)

gulp.task 'build', ['clean'], () ->
    gulp.src(paths.scripts)
        .pipe(sourcemaps.init())
            .pipe(coffee())
            .pipe(concat('weber.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('js'))


gulp.task 'watch', () ->
    gulp.watch(paths.scripts, ['build'])

gulp.task('default', ['watch', 'build'])
