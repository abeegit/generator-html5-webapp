var gulp = require("gulp");
var gulpIf = require('gulp-if');
var runSequence = require('run-sequence');
var pump = require("pump");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");

gulp.task("scripts", () => {
    runSequence(
        "minify-scripts",
        "watch-scripts"
    )
});

gulp.task("minify-scripts", callback => {
    return pump([
        gulp.src("src/scripts/main.js"),
        uglify(),
        rename({
            dirname: "src/scripts",
            basename: "main",
            suffix: ".min",
            extname: ".js"
        }),
        gulp.dest("dist/scripts")
    ], callback);
});