const gi

module.exports = {
    scripts: class ScriptsTask {
        constructor() {
            this.content = `
                var gulp = require("gulp");
                var gulpIf = require('gulp-if');
                var runSequence = require('run-sequence');
                var pump = require("pump");
                var uglify = require("gulp-uglify");

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
                        gulp.dest("dist/scripts")
                    ], callback);
                });
            `;
        }

            
    }
};