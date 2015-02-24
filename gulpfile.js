var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    ngAnnotate = require('gulp-ng-annotate');

var stylish = require('jshint-stylish');

gulp.task('js', function() {
    return gulp.src(['src/js/app.js', 'src/js/factory.js', 'src/js/loginController.js', 'src/js/MainController.js', 'src/js/roomController.js', 'src/js/filters.js', '!src/js/socket.io.min.js'])
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
                $: false,
                RuChat: true,
                io: true
            }
        }))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'))
        //.pipe(ngAnnotate())
        //.pipe(uglify())
        .pipe(concat('app.js'))
        .pipe(gulp.dest('dist/js'))
});