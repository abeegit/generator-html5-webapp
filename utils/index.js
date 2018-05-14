const fs = require("fs");
const rimraf = require("rimraf");
const path = require("path");
const { spawn } = require("child_process")

module.exports = Utility = {
    setupJquery: (projectPath) => {
        var jQueryPath = path.join(projectPath, "temp", "node_modules", "jquery");

            return new Promise(( resolve, reject ) => {
                if ( !fs.existsSync(jQueryPath) ) {
                    reject(`Error setting up jQuery`);
                }
                try {
                    fs.readFile(path.join(jQueryPath, "package.json"), "utf-8", (err, data) => {
                        if ( err ) {
                            throw err;
                        }
                        var packageJSON = JSON.parse(data);
                        var jQueryFilePath = path.join(jQueryPath, packageJSON.main);
                        fs.copyFile(jQueryFilePath, path.join(projectPath, "scripts", "jquery.js"), err => {
                            if (err) {
                                throw err;
                            }
                            resolve();
                        });
                    })
                } catch ( error ) {
                    rimraf(`${ projectPath }scripts/jquery.js`);
                    reject(error);
                }
            });
    },

    setupBootstrap: (projectPath) => {

        var bootstrapPath = path.join(projectPath, "temp", "node_modules", "bootstrap");
        var promisesCount = 0;

        return new Promise(( resolve, reject ) => {

            function checkIfComplete() {
                if ( promisesCount === 2 ) {
                    resolve();
                }
            }

            if ( !fs.existsSync(bootstrapPath) ) {
                reject(`Error setting up bootstrap`);
            }

            Utility.setupJquery(projectPath).then(() => {
                promisesCount++;
                checkIfComplete(); 
            }).catch(reject);

            try {
                fs.readFile(path.join(bootstrapPath, "package.json"), "utf-8", ( err, data ) => {
                    if ( err ) {
                        throw err;
                    }

                    var packageJSON = JSON.parse(data);
                    var bootstrapScriptPath = path.join(bootstrapPath, `${ packageJSON.main }.bundle.js`);
                    var bootstrapStylesPath = path.join(bootstrapPath, `${ packageJSON.style }`);
                    var bootstrapStylesDestinationPath = path.join(projectPath, "styles", "bootstrap.css");

                    fs.copyFile(bootstrapScriptPath, path.join(projectPath, "scripts", "bootstrap.bundle.js"), err => {
                        if (err) {
                            throw err;
                        } else {
                            fs.copyFile(bootstrapStylesPath, bootstrapStylesDestinationPath, err => {
                                if (err) {
                                    throw err;
                                }
                                promisesCount++;
                                checkIfComplete();
                            });
                        }
                    });
                    resolve();
                });
            } catch ( error ) {
                rimraf(`${ projectPath }/{styles,scripts}/{bootstrap.{scss,css},bootstrap.bundle.js}`);
                reject(error);
                /** TODO: Handle integration fail */
            }
        });
    },

    setupSlick: projectPath => {
        var slickPath = path.join(projectPath, "temp", "node_modules", "slick-carousel");

        return new Promise(( resolve, reject ) => {
            if ( !fs.existsSync(slickPath) ) {
                reject(`Error setting up slick`);
            }
            try {
                fs.readFile(path.join(slickPath, "package.json"), "utf-8", (err, data) => {
                    if (err) {
                        throw err;
                    }

                    var packageJSON = JSON.parse(data);
                    var slickScriptPath = path.join(slickPath, packageJSON.main);
                    var slickStylePath = path.join(slickPath, "slick", "slick.css");

                    fs.copyFile(slickScriptPath, path.join(projectPath, "scripts", "slick.js"), err => {
                        if ( err ) {
                            throw err;
                        }
                        fs.copyFile(slickStylePath, path.join(projectPath, "styles", "slick.css"), err => {
                            if (err) {
                                throw err;
                            }
                            resolve();
                        });
                    });
                });
            } catch (error) {
                /** TODO: rollback */
                reject(error);
            }
        });
    },

    setupBarbajs: projectPath => {
        var barbajsPath = path.join(projectPath, "temp", "node_modules", "barba.js");

        return new Promise(( resolve, reject ) => {
            if ( !fs.existsSync(barbajsPath) ) {
                reject(`Error setting up barba.js`);
            }
            try {
                fs.readFile(path.join(barbajsPath, "package.json"), "utf-8", (err, data) => {
                    if (err) {
                        throw err;
                    }
                    var packageJSON = JSON.parse(data);
                    var barbajsFilePath = path.join(barbajsPath, packageJSON.main);
                    fs.copyFile(barbajsFilePath, path.join(projectPath, "scripts", "barba.js"), err => {
                        if (err) {
                            throw err;
                        }
                        resolve();
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    setupModernizr: projectPath => {
        var modernizrPath = path.join(projectPath, "temp", "node_modules", "modernizr");

        return new Promise(( resolve, reject ) => {
            if ( !fs.existsSync(modernizrPath) ) {
                reject(`Error setting up modernizr`);
            }
            try {
                fs.readFile(path.join(modernizrPath, "package.json"), "utf-8", (err, data) => {
                    if (err) {
                        throw err;
                    }
                    var packageJSON = JSON.parse(data);
                    var modernizrBinary = path.join(modernizrPath, packageJSON.bin.modernizr);

                    var modernizrBuild = spawn(modernizrBinary, ["-c", `${ modernizrPath }/lib/config-all.json`], { cwd: path.join(projectPath, "scripts") });

                    modernizrBuild.stderr.on("data", data => {
                        reject(data.toString());
                    });

                    modernizrBuild.on("exit", code => {
                        resolve();
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    registerInterruptSignal: (process, path) => {
        process.on("SIGINT", () => {
            if ( path ) {
                rimraf(path, err => {
                    if ( err ) {
                        
                    }
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        })
    }
};