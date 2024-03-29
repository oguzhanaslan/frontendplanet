var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    notify = require('gulp-notify'),
    del = require('del'),
    uglify = require('gulp-uglify'),
    runSequence = require('run-sequence'),
    concat = require('gulp-concat'),
    minifyCss = require('gulp-minify-css'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync').create();

var config = {
    jsPath: './assets/js',
    sassPath: './assets/sass',
    nodePath: './node_modules',
    tempPath: './temp_dir',
    sassCachePath: './.sass-cache',
    bowerPath: './bower_components',
    public: {
        fontPath: './public/fonts',
        cssPath: './public/css',
        jsPath: './public/js'
    }
};

var cssFiles = [
    '/bootstrap/dist/css/bootstrap.css',
    '/fontawesome/css/font-awesome.css',
    '/sweetalert/dist/sweetalert.css'

];
cssFiles = cssFiles.map(function (el) {
    return config.bowerPath + el;
});

var javaScripts = [
    '/respond/src/respond.js',
    '/jquery/dist/jquery.min.js',
    '/bootstrap/dist/js/bootstrap.min.js',
    '/sweetalert/sweetalert.min.js'
];
javaScripts = javaScripts.map(function (el) {
    return config.bowerPath + el;
});


gulp.task('build-fonts', function () {
    return gulp.src([config.bowerPath + '/fontawesome/fonts/**.*', config.bowerPath + '/bootstrap/fonts/**.*'])
        .on('error', notify.onError(function (error) {
            return 'Error: ' + error.message;
        }))
        .pipe(gulp.dest(config.public.fontPath));
});

gulp.task('vendor-js', function () {
    return gulp.src(javaScripts)
        .on('error', notify.onError(function (error) {
            return 'Error: ' + error.message;
        }))
        .pipe(concat('vendor.min.js'))
        .pipe(gulp.dest(config.tempPath));
});

gulp.task('app-js', function () {
    return gulp.src(config.jsPath + '/**/*.js')
        .on('error', notify.onError(function (error) {
            return 'Error: ' + error.message;
        }))
        .pipe(concat('app-specific.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(config.tempPath));
});

gulp.task('merge-scripts', function () {
    return gulp.src([config.tempPath + '/vendor.min.js', config.tempPath + '/app-specific.min.js']) //To make sure they are set in order we give paths, so not wildcards
        .pipe(concat('app.min.js'))
        .on('error', notify.onError(function (error) {
            return 'Error: ' + error.message;
        }))
        .pipe(gulp.dest(config.public.jsPath));
});

gulp.task('build-scripts', function () {
    return runSequence('vendor-js', 'app-js', 'merge-scripts');
});

gulp.task('vendor-css', function () {
    return gulp.src(cssFiles)
        .on('error', notify.onError(function (error) {
            return 'Error: ' + error.message;
        }))
        .pipe(concat('vendor.min.css'))
        .pipe(minifyCss({
            compatibility: 'ie8'
        })) //because bootstrap-tagsinput css is not minified
        .pipe(gulp.dest(config.tempPath));
});

gulp.task('app-css', function () {
    return sass(config.sassPath + '/app.scss', { //We are including other sass files from this CSS
        container: config.tempPath,
        style: 'compressed',
        stopOnError: true
    })
        .on('error', notify.onError(function (error) {
            return 'Error: ' + error.message;
        }))
        .pipe(concat('app-specific.min.css'))
        .pipe(gulp.dest(config.tempPath));
});

gulp.task('merge-css', function () {
    return gulp.src([config.tempPath + '/vendor.min.css', config.tempPath + '/app-specific.min.css'])
        .on('error', notify.onError(function (error) {
            return 'Error: ' + error.message;
        }))
        .pipe(concat('app.min.css'))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(config.public.cssPath));
});

gulp.task('build-css', function () {
    return runSequence('vendor-css', 'app-css', 'merge-css');
});

gulp.task('browser-sync', function () {
    browserSync.init(["./"], {
        server: {
            baseDir: "./"
        }
    });
});


gulp.task('watch', function () {
    gulp.watch(config.sassPath + '**/*.scss', ['build-css']);
    gulp.watch(config.jsPath + '**/*.js', ['build-scripts']);
});

gulp.task('clean', function (cb) {
    del([
        config.tempPath + '/', config.sassCachePath + '/'
    ], cb);
});

gulp.task('default', ['clean', 'build-fonts', 'build-css', 'build-scripts', 'browser-sync'], function () {
    gulp.watch(config.sassPath + '**/*.scss', ['build-css']);
    gulp.watch(config.jsPath + '**/*.js', ['build-scripts']);
});