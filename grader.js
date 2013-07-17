#!/usr/bin/env node
/*
 * Automatically grade files for the presence of specified HTML tags/attributes.
 * Uses commander.js and cheerio. Teaches command line application development
 * and basic DOM parsing.
 *
 * References:
 *
 *  + cheerio
 *		- https://github.com/MatthewMueller/cheerio
 *		- http://encosia.com/cheerio-faster- windows-friendly-alternative-jsdom/
 *		- http://maxogden.com/scraping-with-node.html
 *  + commander.js
 *      - https://github.com/visionmedia/commander.js
 *      - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy
 *  + JSON
 *      - http://en.wikipedia.org/wiki/JSON
 *      - https://developer.mozilla.org/en-US/docs/JSON
 *      - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 */

var fs                 = require('fs');
var program            = require('commander');
var cheerio            = require('cheerio');
var rest               = require('restler');
var HTMLFILE_DEFAULT   = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
	var instr = infile.toString();
	if(!fs.existsSync(instr)) {
		console.log("%s does not exist.  Exiting.", instr);
		process.exit(1);
	}
	return instr;
};


var cheerioHtmlFile = function(htmlfile) {
	return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
	return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(html, checksfile) {
	$ = html;
	var checks = loadChecks(checksfile).sort();
	var out    = {};
	for( var ii in checks) {
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	}
	return out;
};

var checkHtmlFile = function(htmlfile, checksfile) {
	html  = cheerioHtmlFile(htmlfile);
	return checkHtml(html, checksfile);
};

var checkHtmlString = function(htmlstring, checksfile) {
	html = cheerio.load(htmlstring);
    return checkHtml(html, checksfile);
};	

var displayOutput = function(out) {
	var outJson = JSON.stringify(out, null, 4);
	console.log(outJson);
};

var clone = function(fn) {
	/* workaround for commander.js issue */
	return fn.bind({});
};

if (require.main == module) {
	program
		.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
		.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url <url>', 'URL to read from')
		.parse(process.argv);
	var checkJson;
	if (program.url) {
		rest.get(program.url).on('complete', function(result) {
			checkJson = checkHtmlString(result, program.checks);
			displayOutput(checkJson);
		});
	}
	else if (program.file) { 
		checkJson = checkHtmlFile(program.file, program.checks);
		displayOutput(checkJson);
	}
} else {
	exports.checkHtmlFile = checkHtmlFile;
}
