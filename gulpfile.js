var gulp = require('gulp')
var eslint = require('gulp-eslint')
var babel = require('gulp-babel')
var gulpIf = require('gulp-if')

function isFixed(file) {
  return file.eslint && file.eslint.output === 'string'
}

gulp.task('lint', function () {
  return gulp.src('src/**/*.js')
             .pipe(eslint({fix: true}))
             .pipe(eslint.format())
             .pipe(eslint.failAfterError())
             .pipe(gulpIf(isFixed, gulp.dest('src/')))
})

gulp.task('build:lib', function () {
  return gulp.src('src/**/*.js')
             .pipe(babel({presets: ['@babel/env']}))
             .pipe(gulp.dest('lib/'))
})

gulp.task('build', gulp.series('lint', 'build:lib'))

gulp.task('watch:just', function () {
  return gulp.watch('src/**/*.js', gulp.parallel('build'))
})

gulp.task('watch', gulp.series('build', 'watch:just'))
