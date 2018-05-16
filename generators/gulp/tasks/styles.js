var gulp = require("gulp");
var gulpIf = require('gulp-if');
var runSequence = require('run-sequence');
var pump = require("pump");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");

gulp.task("styles", () => {
    runSequence(
        "sass",
        "minify-styles"
    )
});

gulp.task("sass", () => {
    return pump([
        gulp.src('./styles/*.scss'),
        sass().on('error', sass.logError),
        rename({
            basename: "main",
            suffix: ".min",
            extname: ".css"
        }),
        gulp.dest('./dist/styles')
    ]);
});

gulp.task("minify-styles", callback => {
    return pump([
        gulp.src("src/scripts/main.js"),
        uglify(),
        rename({
            basename: "main",
            suffix: ".min",
            extname: ".js"
        }),
        gulp.dest("dist/scripts")
    ], callback);
});


