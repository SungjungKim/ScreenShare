'use strict';

var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minifycss = require('gulp-minify-css'),
    minifyhtml = require('gulp-minify-html'),
    nodemon = require('gulp-nodemon');

gulp.task('minifyhtml', function () {
    return gulp.src('src/dualrtc.html')
        .pipe(minifyhtml())
        .pipe(gulp.dest('dist'));
});

gulp.task('uglify', function () {
    return gulp.src('src/dualrtc/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('minifycss', function () {
    return gulp.src('src/css/style.css')
        .pipe(minifycss())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('nodemon', ['uglify', 'minifycss', 'minifyhtml'], function (cb) {

    var started = false;

    return nodemon({
        script: 'app.js'
    }).on('start', function () {
        // to avoid nodemon being started multiple times
        if (!started) {
            cb();
            started = true;
        }
    });
});

gulp.task('watch', function () {
    gulp.watch('src/dualrtc.html', ['minifyhtml']);
    gulp.watch('src/dualrtc/*.js', ['uglify']);
    gulp.watch('src/css/*.css', ['minifycss']);
});

gulp.task('default', ['nodemon', 'watch']);