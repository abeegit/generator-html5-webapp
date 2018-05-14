const Generator = require("yeoman-generator");
const colors = require("colors");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const os = require("os");
const { spawn } = require("child_process");
const Utility = require("./../../utils");
const Spinner = require("cli-spinner").Spinner;

spinner = new Spinner("%s  Starting..")
spinner.setSpinnerString("</>\\{?}");
spinner.start();
Utility.registerInterruptSignal(process);

module.exports = class HTML5WebappGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument("name", { type: String, required: false });

        this.option("bootstrap");

        this.spinner = spinner;
    }

    /**
     * @function
     * @name initializing
     * @description 
     * Runs with highest priority in the Yeoman run loop
     */
    initializing() {

        function processAnswers(answers) {
            if ( !this.spinner.isSpinning() ) {
                // this.spinner.setSpinnerTitle("Configuring your")
                // this.spinner.start();
            }

            this.project = {
                name: answers.name,
                path: `${ this.destinationRoot() }/${ answers.name }`
            };

            Utility.registerInterruptSignal(process, this.project.path);

            var hasGulp = false;
            if ( answers.gulp ) {
                if ( answers.gulp !== "no" ) {
                    hasGulp = true;
                    this.integrations.push("gulp");

                    this.composeWith(require.resolve("../gulp"), { 
                        projectName: this.project.name, 
                        sass: this.integrations.gulp !== "gulp" ? false : true,
                        bootstrap: answers.bootstrap ? true : false,
                        barbajs: answers.barbajs ? true : false,
                        jquery: answers.jquery ? true : false,
                        modernizr: answers.libraries && Array.isArray(answers.libraries) && answers.libraries.indexOf("modernizr") > -1 ? true : false,
                        slick: answers.libraries && Array.isArray(answers.libraries) && answers.libraries.indexOf("slick-carousel") > -1 ? true : false, 
                        fresh: true 
                    });
                }
            }
            if ( !hasGulp ) {
                if ( answers.bootstrap ) {
                    this.integrations.push("jquery");
                    this.integrations.push("bootstrap");
                }
                if ( answers.barbajs ) {
                    this.integrations.push("barba.js");
                }
                if ( answers.libraries && Array.isArray(answers.libraries) ) {
                    if ( answers.libraries.indexOf("jquery") > -1 && !answers.bootstrap ) {
                        this.integrations.push("jquery");
                    }
                    if ( answers.libraries.indexOf("modernizr") > -1 ) {
                        this.integrations.push("modernizr");
                    }
                    if ( answers.libraries.indexOf("slick-carousel") > -1 ) {
                        this.integrations.push("slick-carousel");
                    }
                }
            }
            done();
        }

        function handleError(error) {
            this.log(error);
            this._abort(`An error occurred while accepting your requirements. Please try again.`);
        }

        var done = this.async();

        if ( this.spinner.isSpinning() ) {
            this.spinner.stop(true);
        }

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

    /**
     * @function
     * @name configuring
     * @description
     * Runs after {@link HTML5WebappGenerator.configuring HTML5WebappGenerator.configuring}
     */
    configuring() {
        
        function handleError(error) {
            this.log(error);
            this._abort(`Error creating directories`);
        }

        function createSubDirectories() {
            fs.mkdirSync(`${ this.project.path }/temp`);
            fs.mkdirSync(`${ this.project.path }/scripts`);
            fs.mkdirSync(`${ this.project.path }/styles`);
            fs.writeFileSync(`${ this.project.path }/scripts/main.js`, "", "utf-8");
            fs.writeFileSync(`${ this.project.path }/styles/main.${ this.integrations.indexOf("sass") > -1  ? "scss" : "css" }`, "", "utf-8");
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

    /**
     * @function
     * @name install
     * @description
     * Runs after {@link HTML5WebappGenerator.install HTML5WebappGenerator.install } 
     * Installs all npm packages for the configuration chosen
     */
    install() {
        var packages = this.integrations;
        var gulpFound = packages.indexOf("gulp");

        /** Gulp will be installed by the gulp generator */
        if ( gulpFound > -1 ) {
            packages.splice(gulpFound, 1);
        }
        this.log("Installing packages");
        this.npmInstall(packages, {}, { cwd: `${ this.project.path }/temp`, stdio: "ignore" });
    }

    /**
     * @function
     * @name end
     * @description
     * Runs last in the Yeoman run loop
     */
    end() {
        function handleError(error) {
            this.log(error);
            this._abort(`Error installing dependencies`);
        }

        function afterInstall() {
            
            return new Promise(( resolve, reject ) => {

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
            });
        }

        function writeEntryFile() {
            return new Promise(( resolve, reject ) => {
                try {
                    /** TODO: Beautify generated HTML */
                    var scripts = [],
                        styles = [];
                    if ( this.integrations.indexOf("barba.js") > -1 ) {
                        scripts.push(`<script src="scripts/barba.js"></script>`);
                    }
                    if ( this.integrations.indexOf("jquery") > -1 ) {
                        scripts.push(`<script src="scripts/jquery.js"></script>`);
                    }
                    if ( this.integrations.indexOf("bootstrap") > -1 ) {
                        styles.push(`<link rel="stylesheet" href="styles/bootstrap.css" />`);
                        scripts.push(`<script src="scripts/bootstrap.bundle.js"></script>`);
                    }
                    if ( this.integrations.indexOf("modernizr") > -1 ) {
                        scripts.push(`<script src="scripts/modernizr.js"></script>`)
                    }
                    if ( this.integrations.indexOf("slick-carousel") > -1 ) {
                        styles.push(`<link rel="stylesheet" href="styles/slick.css" />`);
                        scripts.push(`<script src="scripts/slick.js"></script>`)
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
                message: `${ "Project Name".bold.white }`,
                default: "my-html5-webapp"
            },
            {
                type: "confirm",
                name: "bootstrap",
                message: `Do you want to use Bootstrap?`,
                default: false
            },
            {
                type: "list",
                name: "gulp",
                message: `Would you like to set Gulp as your build tool?`,
                default: "gulp",
                choices: [
                    {
                        name: `No`,
                        value: "no",
                        short: "No"
                    },
                    {
                        name: `I want Gulp with ${ "Babel".bold }`,
                        value: "sass",
                        short: "Gulp with Babel"
                    },
                    {
                        name: `I want Gulp with ${ "SASS".bold }`,
                        value: "sass",
                        short: "Gulp with SASS"
                    },
                    {
                        name: `I want Gulp with ${ "SASS".bold } and ${ "Babel".bold }`,
                        value: "sass",
                        short: "Gulp with SASS,Babel"
                    },
                    {
                        name: `${ "Gulp".bold } only`,
                        value: "gulp",
                        short: "Gulp"
                    }
                ]
            },
            {
                type: "confirm",
                name: "barbajs",
                message: `Do you want to use Barba.js to create smooth and fluid page transitions?`,
                default: false
            },
            {
                type: "checkbox",
                name: "libraries",
                message: `Which of these libraries do you want in your project?`,
                default: [],
                choices: [
                    {
                        name: `${ "jQuery".bold }`,
                        value: "jquery",
                        short: "jQuery"
                    },
                    {
                        name: `${ "Modernizr".bold }, a feature detection library for HTML5/CSS3`,
                        value: "modernizr",
                        short: "Modernizr"
                    },
                    {
                        name: `${ "Slick".bold }, a jQuery carousel`,
                        value: "slick-carousel",
                        short: "Slick"
                    }
                ]
            }
        ];
    }

    _abort(message) {
        this.log(message.red);
        process.exit(0);
    }
};