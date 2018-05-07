const Generator = require("yeoman-generator");
const colors = require("colors");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const os = require("os");
const Gulp = require("./gulp");

module.exports = class HTML5WebappGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);
        
        this.argument("name", { type: String, required: false });

        this.option("babel");
        this.option("jquery");
        this.option("barbajs");
        this.option("bootstrap");
        this.option("gulp");
        this.option("sass");

        this.configurations = {};

        this.promptOptions = [];

        this.paths = {
            temp: { folder: "temp", path: this.destinationPath("temp") },
            scripts: { folder: "scripts", path: this.destinationPath("scripts") },
            styles: { folder: "styles", path: this.destinationPath("styles") }
        };

        this.projectPath = "";

        this.errors = [];
    }

    /**
     * @function
     * @name initializing
     * @description 
     * This method has first priority in the Yeoman run loop
     * This method is for initialization methods (checking current project state, getting configs, etc)
     */
    initializing() {
        var integrations = [], defaults = [];
        this.configurations.name = this.options.name;
        this.configurations.integrations = {
            babel: this.options.babel,
            jquery: this.options.jquery,
            barbajs: this.options.barbajs,
            bootstrap: this.options.bootstrap,
            sass: this.options.sass,
            gulp: this.options.gulp
        };

        if ( !this.configurations.name ) {
            this.promptOptions.push({
                type: "input",
                name: "name",
                message: "Project Name".bold.white,
                default: "my-html5-webapp"
            });
        }
        if ( !this.configurations.integrations.babel ) {
            integrations.push("Babel");
        } else {
            defaults.push("Babel");
        }
        if ( !this.configurations.integrations.jquery ) {
            integrations.push("jQuery");
        } else {
            defaults.push("jQuery");
        }
        if ( !this.configurations.integrations.barbajs ) {
            integrations.push("Barba.js");
        } else {
            defaults.push("Barba.js");
        }
        if ( !this.configurations.integrations.gulp ) {
            integrations.push("Gulp");
        } else {
            defaults.push("gulp");
        }
        if ( !this.configurations.integrations.bootstrap ) {
            integrations.push("Bootstrap");
        } else {
            defaults.push("Bootstrap");
        }
        if ( !this.configurations.integrations.sass ) {
            integrations.push("SASS");
        } else {
            defaults.push("SASS");
        }
        if ( integrations.length > 0 ) {
            this.promptOptions.push({
                type: "checkbox",
                name: "integrations",
                message: "What integrations would you like to use?".bold.white,
                choices: integrations,
                default: defaults
            });
        }
        
        this.log(`Initializing your webapp${ this.configurations.name ? ` ${ this.configurations.name }` : "" }...`.yellow);
    }

    /**
     * @function
     * @name prompting
     * @description 
     * This method runs after {@link HTML5WebappGenerator.initializing HTML5WebappGenerator.initializing}
     * This method is where you prompt users for options (where you’d call this.prompt())
     */
    prompting() {
        return this.prompt(this.promptOptions).then(answers => {
            this.configurations.name = answers.name ? answers.name : this.configurations.name;
            this.configurations.integrations = answers.integrations ? this._processChosenIntegrations(answers.integrations) : null;
        });
    }

    /**
     * @function
     * @name configuring
     * @description
     * This method runs after {@link HTML5WebappGenerator.prompting HTML5WebappGenerator.prompting}
     * This method is for saving configurations and configure the project
     */
    configuring() {
        var integrations = this.configurations.integrations;
        var foldersCreated = 0;
        var foldersToBeCreated = 1;

        var startSetup = () => {
            if ( foldersCreated === foldersToBeCreated ) {
                this._setupIntegrations();
            }
        };
        
        fs.mkdir(path.join(this.destinationRoot(), "temp"), () => {
            this.log("Created temp folder");
            foldersCreated++;
            startSetup();
        });

        if ( integrations.babel || integrations.jquery || integrations.bootstrap || integrations.barbajs ) {
            foldersToBeCreated++;
            fs.mkdir(path.join(this.destinationRoot(), "scripts"), () => {
                this.log("Created scripts folder");
                foldersCreated++;
                startSetup();
            }); 
        }

        if ( integrations.bootstrap || integrations.sass ) {
            foldersToBeCreated++;
            fs.mkdir(path.join(this.destinationRoot(), "styles"), () => {
                this.log("Created styles folder");
                foldersCreated++;
                startSetup();
            });
        }
    }

    /**
     * @function
     * @name writing
     * @description
     * This method runs after all the `default` tasks in the Yeoman run loop
     * This is where generator-specific files are written (routes, controllers etc.)
     */
    writing() {
        /** TODO: Beautify generated HTML */
        var scripts = [],
            styles = [];
        var integrations = this.configurations.integrations;
        if ( integrations.barbajs ) {
            scripts.push(`<script src="scripts/barba.js">`);
        }
        if ( integrations.bootstrap ) {
            styles.push(`<link rel="stylesheet" href="styles/bootstrap.css" />`);
            scripts.push(`<script src="scripts/bootstrap.bundle.js">`);
        }
        if ( integrations.jquery ) {
            scripts.push(`<script src="scripts/jquery.js">`);
        }
        
        fs.readFile(path.join(__dirname, "index.html"), "utf-8", (err, data) => {
            if (err) {
                /** TODO: Handle error */
            }
            data = data.replace("<!-- Stylesheets here -->", styles.join(os.EOL));
            data = data.replace("<!-- Scripts here -->", scripts.join(os.EOL));
            fs.writeFile(path.join(this.destinationRoot(), "index.html"), data, "utf-8", err => {
                this.log("Created index.html");
            });
        });
    }

    /**
     * @function
     * @name install
     * @description
     * This method runs after {@link HTML5WebappGenerator.writing HTML5WebappGenerator.writing} in the Yeoman run loop
     * This method is where installations are run
     */
    install() {
        this.log("installing");
    }

    end() {
        rimraf(this.destinationPath("temp"), () => {
            this.log("Your HTML5 boilerplate is ready".green);
        });
    }

    /** Helper functions */

    /**
     * @function
     * @name _processChosenIntegrations
     * @description
     * This method is where the replies to the prompted questions are processed and added to the configurations of the generator
     */
    _processChosenIntegrations(integrations) {
        var configurations = this.configurations.integrations;
        if ( integrations.indexOf("Babel") > -1 ) {
            configurations.babel = true;
        }
        if ( integrations.indexOf("jQuery") > -1 ) {
            configurations.jquery = true;
        }
        if ( integrations.indexOf("Barba.js") > -1 ) {
            configurations.barbajs = true;
        }
        if ( integrations.indexOf("Bootstrap") > -1 ) {
            configurations.bootstrap = true;
        }
        if ( integrations.indexOf("SASS") > -1 ) {
            configurations.sass = true;
        }
        if ( integrations.indexOf("Gulp") > -1 ) {
            configurations.gulp = true;
        }

        return configurations;
    }

    /**
     * @function
     * @name _spitErrors
     * @description
     * This method spits errors that occured during the scaffold
     */
    _spitErrors() {

    }

    /**
     * @function
     * @name _setupIntegrations
     * @description
     * This method checks the chosen integrations for the scaffold and then sets them up
     */
    _setupIntegrations() {
        var integrations = this.configurations.integrations;

        if ( integrations.babel ) {
            this._setupBabel();
        }
        if ( integrations.barbajs ) {
            this._setupBarbajs();
        }
        if ( integrations.bootstrap ) {
            this._setupBootstrap();
        }
        if ( integrations.jquery ) {
            this._setupJquery();
        }
        if ( integrations.gulp ) {
            this.composeWith(require.resolve("../gulp"), { projectName: this.configurations.name, sass: true, babel: true });
        }
    }

    _setupBabel() {

    }

    /**
     * @function
     * @name _setupJquery
     * @description
     * This is a helper function that sets up jQuery and reverts its changes in case of any failures
     */
    _setupJquery() {
        var rollback = () => {
            rimraf("scripts/jquery.js");
        };

        this.log("Setting up jQuery");

        var done = this.async();
        var jQueryPath = path.join(this.paths.temp.path, "node_modules", "jquery");
        
        this.npmInstall("jquery", [], { stdio: "ignore", cwd: this.paths.temp.path })
            .then(response => {
                fs.readFile(path.join(jQueryPath, "package.json"), "utf-8", (err, data) => {
                    if ( err ) {
                        throw err;
                    } else {
                        var packageJSON = JSON.parse(data);
                        var jQueryFilePath = path.join(jQueryPath, packageJSON.main);
                        fs.copyFile(jQueryFilePath, path.join(this.paths.scripts.path, "jquery.js"), err => {
                            if (err) {
                                throw err;
                            } else {
                                this.log("jQuery ready");
                            }
                            done();
                        });
                    }
                })
            })
            .catch(err => {
                rollback();
                this.errors.push({
                    module: "jQuery",
                    reason: err
                });
            });
    }

    /**
     * @function
     * @name _setupBarbajs
     * @description
     * This is a helper function that sets up Barba.js and reverts its changes in case of any failures
     */
    _setupBarbajs() {
        var rollback = () => {
            rimraf("scripts/barba.js");
        };

        this.log("Setting up barbajs");

        var done = this.async();
        var barbaPath = path.join(this.paths.temp.path, "node_modules", "barba.js");
        
        this.npmInstall("barba.js", [], { stdio: "ignore", cwd: this.paths.temp.path })
            .then(response => {
                fs.readFile(path.join(barbaPath, "package.json"), "utf-8", (err, data) => {
                    if ( err ) {
                        throw err;
                    } else {
                        var packageJSON = JSON.parse(data);
                        var barbaFilePath = path.join(barbaPath, packageJSON.main);
                        fs.copyFile(barbaFilePath, path.join(this.paths.scripts.path, "barba.js"), err => {
                            if (err) {
                                throw err;
                            } else {
                                this.log("Barba.js ready");
                            }
                            done();
                        });
                    }
                })
            })
            .catch(err => {
                rollback();
                this.errors.push({
                    module: "barba.js",
                    reason: err
                });
            });
    }

    /**
     * @function
     * @name _setupBootstrap
     * @description
     * This is a helper function that sets up Bootstrap css and js and reverts its changes in case of any failures
     */
    _setupBootstrap() {
        var rollback = () => {
            rimraf("{styles,scripts}/{bootstrap.{scss,css},bootstrap.bundle.js}");
        };

        this.log("Setting up bootstrap");

        var done = this.async();
        var bootstrapPath = path.join(this.paths.temp.path, "node_modules", "bootstrap");
        
        this.npmInstall("bootstrap", [], { stdio: "ignore", cwd: this.paths.temp.path })
            .then(response => {
                fs.readFile(path.join(bootstrapPath, "package.json"), "utf-8", (err, data) => {
                    if ( err ) {
                        throw err;
                    } else {
                        var packageJSON = JSON.parse(data);
                        var bootstrapScriptPath = path.join(bootstrapPath, `${ packageJSON.main }.bundle.js`); // bootstrap.bundle.js contains popper + bootstrap but now jQuery
                        var bootstrapStylesPath = path.join(bootstrapPath, `${ this.configurations.integrations.sass ? packageJSON.sass : packageJSON.style }`);
                        var bootstrapStylesDestinationPath = path.join(this.paths.styles.path, this.configurations.integrations.sass ? "bootstrap.scss" : "bootstrap.css");

                        fs.copyFile(bootstrapScriptPath, path.join(this.paths.scripts.path, "bootstrap.bundle.js"), err => {
                            if (err) {
                                throw err;
                            } else {
                                fs.copyFile(bootstrapStylesPath, bootstrapStylesDestinationPath, err => {
                                    if (err) {
                                        throw err;
                                    } else {
                                        done();
                                    }
                                });
                            }
                        });
                    }
                })
            })
            .catch(err => {
                rollback();
                this.errors.push({
                    module: "bootstrap",
                    reason: err
                });
            });
    }
};