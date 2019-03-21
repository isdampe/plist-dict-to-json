const fs = require("fs");
const XML_EXT = ["xml", "plist"], JSON_EXT = ["json"];

const FORMAT_XML = "xml", FORMAT_JSON = "json", FORMAT_UNKNOWN = "unknown";

class Convertor 
{
	constructor(inputFp) {
		this.inputFp = inputFp;
		this.inputType = this._determineType(this.inputFp);
		if (this.inputType == FORMAT_UNKNOWN)
			throw(`Unknown input type on file ${this.inputFp}`);

		this.outputType = (this.inputType == FORMAT_JSON ? FORMAT_XML : FORMAT_JSON);
		this.outputFp = this._guessOutputFp();
	}

	_guessOutputFp() {
		return `${this.inputFp}.${this.outputType}`;
	}

	_determineType(fileName) {
		const ext = fileName.substr(fileName.lastIndexOf(".") +1);
		if (XML_EXT.indexOf(ext) > -1)
			return FORMAT_XML;
		else if (JSON_EXT.indexOf(ext) > -1)
			return FORMAT_JSON;

		return FORMAT_UNKNOWN;
	}

	process() {
		if (this.inputType == FORMAT_XML)
			this._convertFromXml();
		else
			this._convertFromJson();
	}

	_convertFromJson() {
		throw("Conversion from JSON to XML is not implemented.");
	}

	_convertFromXml() {

		const rawFiles = fs.readFileSync(this.inputFp, {encoding: "utf8"});
		if (! rawFiles)	
			throw(`Couldn't read input file or it's empty ${this.inputFp}`);

		const json = [];
		let inDict = false;
		const lines = rawFiles.split("\n");
		let result = {};
		let key = null;
		let val = null;
		for (let i=0; i<lines.length; ++i) {
			let line = lines[i].trim();
			if (! inDict) {
				if (line == "<dict>")
					inDict = true;
			} else {
				if (line == "</dict>") {
					inDict = false;
					key = null;
					val = null;
					json.push(result);
					result = {}
					continue;
				}

				if (line.substr(1,1) == "k") {
					key = line.replace(/<key>/g, "").replace(/<\/key>/g, "");
					result[key] = val;
				} else if (line.substr(1,1) == "s") {
					val = line.replace(/<string>/g, "").replace(/<\/string>/g, "");
					if (val && ! isNaN(val)) {
						if (parseFloat(val) % 1 === 0)
							val = parseInt(val);
					}
					if (key)
						result[key] = val;
				}
			}
		}

		fs.writeFileSync(this.outputFp, JSON.stringify(json), {encoding: "utf8"});
		console.log(`Wrote ${json.length} entries to ${this.outputFp}.`);

	}
}

if (process.argv.length < 3) {
	console.log("Usage: convert.js input_file");
	process.exit(1);
}

new Convertor(process.argv[2]).process();
