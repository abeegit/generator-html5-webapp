const Generator = require("yeoman-generator");
const colors = require("colors");
const fs = require("fs");
const rimraf = require("rimraf");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        
        this.sass = opts.sass;
        this.babel = opts.babel;
        this.projectName = opts.projectName;
        this.projectRoot = path.join(this.destinationRoot(), opts.projectName);
    }

    /**
     * @function
     * @name initializing
     * @description
     * Runs with highest priority in the Yeoman run loop
     */
    initializing() {
        this.packages = [
            "run-sequence",
            "require-dir",
            "gulp-rename",
            "gulp-minify",
            "gulp-if",
            "browser-sync",
            "gulp-concat",
        ];
        if ( this.sass ) {
            packages.push("gulp-sass");
        }
        if ( this.babel ) {
            packages.push("gulp-babel");
        }
    }

    /**
     * @function
     * @name scaffold
     * @description
     * This function is of the priority type `default`
     * Creates the tasks and configurations for gulp
     */
    async scaffold() {
        var done = this.async();

        var npmInit = async () => {
            var npm = spawn(`npm`, [`init`], { cwd: this.projectRoot });

            npm.stdout.on("data", data => {
                
            });

            npm.stdin.on("data", data => {
                this.log(data.toString());
            })

            npm.stderr.on("data", data => {
                done(data);
            });

            npm.on("close", data => {
                done();
            });
        };

        var createScaffold = async () => {
            fs.mkdir(path.join(this.projectRoot, "gulp"), err => {
                if ( err ) {
                    done(err);
                } else {
                    fs.mkdir(path.join(this.projectRoot, "gulp", "tasks"), err => {
                        done(err);
                    });
                }
            });
        };
        
        if ( !fs.existsSync(this.projectRoot) ) {
            try {
                await fs.mkdir(this.projectRoot);
                // await npmInit();
                await createScaffold();
                done();
            } catch ( err ) {
                done(err);
            }
        } else {
            var answers = await this.prompt({
                type: "confirm",
                name: "delete",
                message: `A folder by the name ${ this.projectName } exists. Would you like to replace its contents?`
            });
            if ( answers.delete ) {
                try {
                    // rimraf(`${ this.projectRoot }/*`, async err => {
                        // await npmInit();
                        await createScaffold();
                        done();
                    // });
                } catch (err) {
                    done(err);
                }
            }
        }
    }

    /**
     * @function
     * @name installing
     * @description
     * This function is of the priority type `default`
     * Installs all npm dependencies required for gulp
     */
    installing() {
        var done = this.async();
        this.log("Installing nodejs packages at " + this.projectRoot);
        this.npmInstall("barba.js", [], { cwd: this.projectRoot })
            .then(response => {
                this.log("Installed packages");
                done();
            })
            .catch(err => {
                this.log(err);
                this.errors.push({
                    module: "gulp",
                    reason: err
                });
            });
    }

    /**
     * @function
     * @name writing
     * @description
     * Runs after the `default` tasks in the Yeoman run loop
     * Writes the gulpfile.js and tasks for the project in the document root
     */
    writing() {
        var done = this.async();

        this._writeGulpFile()
            .then(() => {
                done();
            })
            .catch(err => {
                done(err);
            });
    }

    /**
     * @function
     * @name end
     * @description
     * This is the last method to run in the Yeoman run loop
     */
    end() {
        this.log("Done setting up gulp");
    }

    /**
     * @function
     * @name _writeTask
     * @description
     * Helper function that writes a gulp task into a file in the tasks folder
     * @param {String} name 
     * @param {String} content 
     */
    _writeTask(name, content) {
        return fs.writeFile(path.join(this.projectRoot, "gulp", "tasks", name), content, "utf-8", err => {
            if ( err ) {
                throw err;
            }
        });
    }

    _writeGulpFile() {
        var content = `
            var gulp = require("gulp");
            var gulpIf = require("gulp-if");
            var runSequence = require("run-sequence");
            var rename = require("gulp-rename");
            var concat = require("gulp-concat");

            gulp.task("default", callback => {
                return runSequence(
                    "scripts"
                    "styles"
                );
            });
        `;

        return fs.writeFile(path.join(this.projectRoot, "gulpfile.js"), content, "utf-8", err => {
            if (err) {
               throw err; 
            }
        })
    }

    
}