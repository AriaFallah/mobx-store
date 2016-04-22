const gulp = require('gulp')
const babel = require('gulp-babel')

gulp.task('default', function() {
  gulp.src('src/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'))
})

gulp.task('watch', function() {
  gulp.watch('src/*.js', ['default'])
})
