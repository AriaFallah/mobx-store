const gulp = require('gulp')
const babel = require('gulp-babel')

gulp.task('transpile', function() {
  gulp.src('src/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'))
})

gulp.task('watch', ['transpile'], function() {
  gulp.watch('src/*.js', ['default'])
})

gulp.task('default', ['transpile'])
