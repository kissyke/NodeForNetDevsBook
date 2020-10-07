'use strict';

const eslint = require('gulp-eslint');
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const env = require('gulp-env');
const istanbul = require('gulp-istanbul');
const shell = require('gulp-shell');

gulp.task('lint-server', function() {
    return gulp.src(['src/**/*.js', '!src/public/**/*.js'])
        .pipe(eslint({
            envs: ['es6', 'node'],
            rules: {
                'no-unused-vars': [2, {'argsIgnorePattern': 'next'}]
            }
        }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('lint-client', function() {
    return gulp.src('src/public/**/*.js')
        .pipe(eslint({envs: ['browser', 'jquery']}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('lint-test', function() {
    return gulp.src('test/**/*.js')
        .pipe(eslint({envs: ['es6', 'node', 'mocha']}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('lint-integration-test', function() {
    return gulp.src('integration-test/**/*.js')
        .pipe(eslint({
            envs: ['browser', 'phantomjs', 'jquery'],
            rules: {'no-console': 0}
        }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('instrument', function() {
    return gulp.src('src/**/*.js')
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

gulp.task('test', gulp.series('lint-test', 'instrument', function() {
    env({ vars: { NODE_ENV: 'test' } });
    return gulp.src('test/**/*.js')
        .pipe(mocha())
        .pipe(istanbul.writeReports());
        // .pipe(istanbul.enforceThresholds({
        //     thresholds: {global:{
        //         statements: 70,
        //         branches: 50
        //     }}
        // }));
}));

gulp.task('lint', gulp.series(
    'lint-server', 'lint-client', 'lint-test', 'lint-integration-test'
));

gulp.task('integration-test', gulp.series('lint-integration-test', 'test', (done) => {
    const TEST_PORT = 5000;
    let server = require('http')
        .createServer(require('./src/app.js'))
        .listen(TEST_PORT, function() {
            gulp.src('integration-test/**/*.js')
                .pipe(shell('node node_modules/phantomjs-prebuilt/bin/phantomjs <%=file.path%>', {
                    env: { 'TEST_PORT': TEST_PORT }
                }))
                .on('error', () => server.close(done))
                .on('end', () => server.close(done));
        });
}));

gulp.task('default', gulp.series('lint', 'test'));
