const Generator = require("yeoman-generator");
const colors = require("colors");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const os = require("os");

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument("name", { type: String, required: false });

        this.option("bootstrap");
    }

    initializing() {

        function processAnswers(answers) {
            this.project = {
                name: answers.name,
                path: `${ this.destinationRoot() }/${ answers.name }`
            };

            if ( answers.bootstrap ) {
                this.integrations.push("jquery");
                this.integrations.push("bootstrap");
            }
            if ( answers.gulp ) {
                this.integrations.push("gulp");
                this.composeWith(require.resolve("../gulp"), { projectName: this.project.name, fresh: true });
            }
            done();
        }

        function handleError(error) {
            this.log(error);
            this._abort(`An error occurred while accepting your requirements. Please try again.`);
        }

        var done = this.async();

        processAnswers = processAnswers.bind(this);
        handleError = handleError.bind(this);

        var promptOptions = this._definePromptOptions();

        this.project = {
            name: "",
            path: ""
        };

        this.integrations = [];

        return this.prompt(promptOptions)
            .then(processAnswers)
            .catch(handleError);
    }

    configuring() {
        
        function handleError(error) {
            this.log(error);
            this._abort(`Error creating directories`);
        }

        function createSubDirectories() {
            fs.mkdirSync(`${ this.project.path }/temp`);
            fs.mkdirSync(`${ this.project.path }/scripts`);
            fs.mkdirSync(`${ this.project.path }/styles`);
        }

        function createProjectDirectory() {
            fs.mkdirSync(this.project.path);
        }

        var done = this.async();
        handleError = handleError.bind(this);
        createProjectDirectory = createProjectDirectory.bind(this);
        createSubDirectories = createSubDirectories.bind(this);

        try {
            if ( !fs.existsSync(this.project.path) ) {
                createProjectDirectory();
                createSubDirectories();
                done();
            } else {
                rimraf(`${ this.project.path }/*`, err => {
                    if ( err ) {
                        throw err;
                    }
                    createSubDirectories();
                    done();
                })
            }
        } catch ( error ) {
            handleError(error);
        }
    }

    install() {
        var packages = this.integrations;
        
        this.npmInstall(packages, { /*"prefer-online": true*/ }, { cwd: `${ this.project.path }/temp`, stdio: "ignore" });
    }

    end() {
        function handleError(error) {
            this.log(error);
            this._abort(`Error installing dependencies`);
        }

        function afterInstall() {

            return new Promise(( resolve, reject ) => {

                function checkIfComplete(callback) {
                    if ( promisesToBeResolved === promisesResolved ) {
                        callback();        
                    }
                }

                var packages = ["bootstrap"],
                    promisesToBeResolved = 0,
                    promisesResolved = 0;
                
                if ( packages.indexOf("bootstrap") > -1 ) { 
                    promisesToBeResolved++;
                    setupBootstrap()
                        .then(() => { 
                            promisesResolved++;
                            checkIfComplete(resolve);
                        })
                        .catch(handleError);
                }
                if ( packages.indexOf("jquery") > -1 ) {
                    if ( packages.indexOf("bootstrap") === -1 ) {
                        promisesToBeResolved++;
                        setupJquery()
                            .then(() => {
                                promisesResolved++;
                                checkIfComplete(resolve);
                            })
                            .catch(handleError);
                    }
                }
            });
        }

        function setupJquery() {
            var jQueryPath = path.join(this.project.path, "temp", "node_modules", "jquery");

            return new Promise(( resolve, reject ) => {
                if ( !fs.existsSync(jQueryPath) ) {
                    reject();
                }
                try {
                    fs.readFile(path.join(jQueryPath, "package.json"), "utf-8", (err, data) => {
                        if ( err ) {
                            throw err;
                        } else {
                            var packageJSON = JSON.parse(data);
                            var jQueryFilePath = path.join(jQueryPath, packageJSON.main);
                            fs.copyFile(jQueryFilePath, path.join(this.project.path, "scripts", "jquery.js"), err => {
                                if (err) {
                                    throw err;
                                } else {
                                    resolve();
                                }
                            });
                        }
                    })
                } catch ( error ) {
                    rimraf(`${ this.project.path }scripts/jquery.js`);
                    reject(error);
                }
            });
        }

        function setupBootstrap() {

            var bootstrapPath = path.join(this.project.path, "temp", "node_modules", "bootstrap");
            var promisesCount = 0;

            return new Promise(( resolve, reject ) => {

                function checkIfComplete() {
                    if ( promisesCount === 2 ) {
                        resolve();
                    }
                }

                if ( !fs.existsSync(bootstrapPath) ) {
                    reject();
                }

                setupJquery().then(() => {
                    promisesCount++;
                    checkIfComplete(); 
                }).catch(handleError);

                try {
                    fs.readFile(path.join(bootstrapPath, "package.json"), "utf-8", ( err, data ) => {
                        if ( err ) {
                            throw err;
                        }

                        var packageJSON = JSON.parse(data);
                        var bootstrapScriptPath = path.join(bootstrapPath, `${ packageJSON.main }.bundle.js`);
                        var bootstrapStylesPath = path.join(bootstrapPath, `${ this.integrations.indexOf("sass") > -1 ? packageJSON.sass : packageJSON.style }`);
                        var bootstrapStylesDestinationPath = path.join(this.project.path, "styles", this.integrations.indexOf("sass") > -1 ? "bootstrap.scss" : "bootstrap.css");

                        fs.copyFile(bootstrapScriptPath, path.join(this.project.path, "scripts", "bootstrap.bundle.js"), err => {
                            if (err) {
                                throw err;
                            } else {
                                fs.copyFile(bootstrapStylesPath, bootstrapStylesDestinationPath, err => {
                                    if (err) {
                                        throw err;
                                    } else {
                                        promisesCount++;
                                        checkIfComplete();
                                    }
                                });
                            }
                        });
                        resolve();
                    });
                } catch ( error ) {
                    rimraf(`${ this.project.path }/{styles,scripts}/{bootstrap.{scss,css},bootstrap.bundle.js}`);
                    reject(error);
                    /** TODO: Handle integration fail */
                }
            });
        }

        function writeEntryFile() {
            return new Promise(( resolve, reject ) => {
                try {
                    /** TODO: Beautify generated HTML */
                    var scripts = [],
                        styles = [];
                    if ( this.integrations.indexOf("barbajs") > -1 ) {
                        scripts.push(`<script src="scripts/barba.js">`);
                    }
                    if ( this.integrations.indexOf("bootstrap") > -1 ) {
                        styles.push(`<link rel="stylesheet" href="styles/bootstrap.css" />`);
                        scripts.push(`<script src="scripts/bootstrap.bundle.js">`);
                    }
                    if ( this.integrations.indexOf("jquery") > -1 ) {
                        scripts.push(`<script src="scripts/jquery.js">`);
                    }
                    
                    fs.readFile(path.join(__dirname, "index.html"), "utf-8", (err, data) => {
                        if (err) {
                            throw err;
                        }
                        data = data.replace("<!-- Stylesheets here -->", styles.join(os.EOL));
                        data = data.replace("<!-- Scripts here -->", scripts.join(os.EOL));
                        fs.writeFile(path.join(this.project.name, "index.html"), data, "utf-8", err => {
                            resolve();
                        });
                    });
                } catch (error) {
                    reject(error);
                }
            });
        }

        handleError = handleError.bind(this);
        afterInstall = afterInstall.bind(this);
        setupBootstrap = setupBootstrap.bind(this);
        setupJquery = setupJquery.bind(this);
        writeEntryFile = writeEntryFile.bind(this);

        var done = this.async();

        afterInstall()
            .then(writeEntryFile)
            .then(() => {
                this.log(`Finished setup`);
                done();
            })
            .catch(err => {
                this.log(err);
                this._abort(`Error installing packages`);
            });
    }

    _definePromptOptions() {
        return [
            {
                type: "input",
                name: "name",
                message: "Project Name".bold.white,
                default: "my-html5-webapp"
            },
            {
                type: "confirm",
                name: "bootstrap",
                message: "Do you want to use Bootstrap?",
                default: false
            },
            {
                type: "confirm",
                name: "gulp",
                message: "Would you like to set Gulp as your build tool?",
                default: true
            }
        ];
    }

    _abort(message) {
        this.log(message.red);
        process.exit(0);
    }
};