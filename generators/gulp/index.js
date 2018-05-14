const Generator = require("yeoman-generator");
const colors = require("colors");
const fs = require("fs");
const rimraf = require("rimraf");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const Utility = require("./../../utils");

module.exports = class GulpGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);
        
        this.integrations = {
            sass: opts.sass,
            babel: opts.babel,
            jquery: opts.jquery,
            modernizr: opts.modernizr,
            slick: opts.slick,

        }

        this.freshInstallation = opts.fresh;

        this.projectName = opts.projectName ? opts.projectName : "my-html5-webapp";
        this.projectRoot = path.join(this.destinationRoot(), this.projectName);
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
        if ( this.integrations.sass ) {
            this.packages.push("gulp-sass");
        }
        if ( this.integrations.babel ) {
            this.packages.push("gulp-babel");
        }
        if ( this.integrations.bootstrap) {
            this.packages.push("jquery");
            this.packages.push("bootstrap");
        }
        if ( this.integrations.jquery && !this.integrations.bootstrap ) {
            this.packages.push("jquery");
        }
        if ( this.integrations.barbajs ) {
            this.packages.push("barba.js");
        }
        if ( this.integrations.slick ) {
            this.packages.push("slick-carousel");
        }
        if ( this.integrations.modernizr ) {
            this.packages.push("modernizr");
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
                await createScaffold();
                done();
            } catch ( err ) {
                done(err);
            }
        } else {
            if ( !this.freshInstallation ) {
                var answers = await this.prompt({
                    type: "confirm",
                    name: "delete",
                    message: `A folder by the name ${ this.projectName } exists. Would you like to replace its contents?`
                });
                if ( answers.delete ) {
                    try {
                        rimraf(`${ this.projectRoot }/*`, async err => {
                            await createScaffold();
                            done();
                        });
                    } catch (err) {
                        done(err);
                    }
                }
            } else {
                await createScaffold();
                done();
            }
        }
    }

    /**
     * @function
     * @name install
     * @description 
     * Runs after {@link GulpGenerator.writing GulpGenerator.writing} in the Yeoman run loop
     */
    install() {
        process.chdir(this.projectRoot);

        this.installDependencies({ npm: true, yarn: false, bower: false })
            .then(() => {
                // afterInstall()
                //     .then(writeEntryFile)
                //     .then(

                //     )
                //     .catch(err => {
                //         /** TODO: Handle error */
                //     })
                process.chdir(this.destinationPath());
            })
            .catch(err => {
                this.log(err);
            })

        this.npmInstall(this.packages, {}, { cwd: path.join(this.projectRoot) });
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
                this._writePackage()
                    .then(() => {
                        done();
                    })
                    .catch(err => {
                        this.log("ending")
                        done(err);
                    })
            })
            .catch(err => {
                this.log("ending2")
                this.log(err);
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

        function afterInstall() {
            
            function checkIfComplete(callback) {
                if ( promisesToBeResolved === promisesResolved ) {
                    rimraf(`${ path.join(this.project.path, "temp") }`, err => {
                        callback(); 
                    });        
                }
            }

            checkIfComplete = checkIfComplete.bind(this);

            var packages = this.integrations,
                promisesToBeResolved = 0,
                promisesResolved = 0;
            
            if ( packages.indexOf("bootstrap") > -1 ) { 
                promisesToBeResolved++;
                Utility.setupBootstrap(this.project.path)
                    .then(() => { 
                        promisesResolved++;
                        checkIfComplete(resolve);
                    })
                    .catch(handleError);
            }
            if ( packages.indexOf("jquery") > -1 ) {
                if ( packages.indexOf("bootstrap") === -1 ) {
                    promisesToBeResolved++;
                    Utility.setupJquery(this.project.path)
                        .then(() => {
                            promisesResolved++;
                            checkIfComplete(resolve);
                        })
                        .catch(handleError);
                }
            }
            if ( packages.indexOf("barba.js") > -1 ) {
                promisesToBeResolved++;
                Utility.setupBarbajs()
                    .then(() => {
                        promisesResolved++;
                        checkIfComplete(resolve);
                    })
                    .catch(handleError);
            }
            if ( packages.indexOf("modernizr") > -1 ) {
                promisesToBeResolved++;
                Utility.setupModernizr()
                    .then(() => {
                        promisesResolved++;
                        checkIfComplete(resolve);
                    })
                    .catch(handleError);
            }
            if ( packages.indexOf("slick-carousel") > -1 ) {
                promisesToBeResolved++;
                Utility.setupSlick()
                    .then(() => {
                        promisesResolved++;
                        checkIfComplete(resolve);
                    })
                    .catch(handleError);
            }
            
        }
        this.log(`Finished setting up gulp`);``
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

    _writePackage() {
        var dependencies = {};
        this.packages.forEach(aPackage => {
            dependencies[aPackage] = "*";
        });
        const packageJSON = {
            "name": this.projectName,
            "version": "1.0.0",
            "description": "",
            "main": "",
            "author": "",
            "license": "ISC",
            "dependencies": dependencies
        };

        return new Promise((resolve, reject) => {
            fs.writeFile(path.join(this.projectRoot, "package.json"), JSON.stringify(packageJSON, null, 4), "utf-8", err => {``
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
        });
    }

    async _writeGulpFile() {
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

        return new Promise(( resolve, reject ) => {
            fs.writeFile(path.join(this.projectRoot, "gulpfile.js"), content, "utf-8", err => {
                if (err) {
                   reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}