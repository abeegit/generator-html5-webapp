const Generator = require("yeoman-generator");
const colors = require("colors");

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        
        this.argument("name", { type: String, required: false });

        this.option("babel");
        this.option("jquery");
        this.option("barbajs");
        this.option("gulp");
        this.option("sass");

        this.configurations = {};

        this.promptOptions = [];
    }

    initializing() {
        var integrations = [];
        this.configurations.name = this.options.name;
        this.configurations.integrations = {
            babel: this.options.babel,
            jquery: this.options.jquery,
            barbajs: this.options.barbajs,
            bootstrap: this.options.bootstrap,
            sass: this.options.sass,
        };

        if ( !this.configurations.name ) {
            this.promptOptions.push({
                type: "input",
                name: "name",
                message: "Project Name".bold.white,
                default: "my-html5-webapp"
            });
        }
        if ( !this.configurations.babel ) {
            integrations.push("Babel");
        }
        if ( !this.configurations.jquery ) {
            integrations.push("jQuery");
        }
        if ( !this.configurations.barbajs ) {
            integrations.push("Barba.js");
        }
        if ( !this.configurations.bootstrap ) {
            integrations.push("Bootstrap");
        }
        if ( !this.configurations.sass ) {
            integrations.push("SASS");
        }
        if ( integrations.length > 0 ) {
            this.promptOptions.push({
                type: "checkbox",
                name: "integrations",
                message: "What integrations would you like to use?".bold.white,
                choices: integrations
            });
        }
        
        this.log(`Initializing your webapp${ this.configurations.name ? ` ${ this.configurations.name }` : "" }...`.yellow);
    }

    prompting() {
        return this.prompt(this.promptOptions).then(answers => {
            this.configurations.name = answers.name ? answers.name : this.configurations.name;
            this.configurations.integrations = answers.integrations ? answers.integrations : null;
            console.log(this.configurations.integrations);
            console.log(this.configurations.name);
        });
    }

    writing() {
        console.log("writing");
    }

    end() {
        this.log("Your HTML5 boilerplate is ready".green);
    }
};