var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat');

gulp.task('js', function() {
    return gulp.src('src/js/*.js')
    	 .pipe(jshint())
	 .pipe(jshint.reporter('default'))
    	 .pipe(uglify())
	 .pipe(concat('app.js')
	 .pipe(gulp.dest('dist/js'))
});
