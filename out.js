const figlet = require('figlet');
const chalk = require('chalk');

const colorize = (msg, color) => {
    if(typeof color !== "undefined"){
        msg = chalk[color].bold(msg);
    }
    return msg
};

const log = (msg, color) => {
    console.log(colorize(msg, color));
};

const biglog = (msg, color) => {
    log(figlet.textSync(msg), color);
};

const errorlog = (msg) => {
    console.log(`[${colorize("idError", "red")}] ${colorize(msg, "red")}`);
};

exports = module.exports = {
	colorize,
	log,
	biglog,
	errorlog
};
