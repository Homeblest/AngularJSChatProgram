var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat');

var stylish = require('jshint-stylish');

gulp.task('js', function() {
    return gulp.src(['src/js/*.js', '!src/js/socket.io.min.js'])
        .pipe(jshint({
            curly: true,
            immed: true,
            newcap: true,
            noarg: true,
            sub: true,
            boss: true,
            eqnull: true,
            node: true,
            undef: true,
            globals: {
                _: false,
                jQuery: false,
                angular: false,
                moment: false,
                console: false,
                $: false
            }
        }))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'))
        .pipe(uglify())
        .pipe(concat('app.js'))
        .pipe(gulp.dest('dist/js'))
});