var fs = require('fs');
var path = require ('path');
var  xml2js = require('xml2js');
var builder = new xml2js.Builder();
var parser = new xml2js.Parser();
var util = require('util');

require('shelljs/global');

var rootPath = 'd:\\calibre\\calibre\\cal\\Henri Loevenbruck\\';
var tempPath = 'd:\\temp\\epubeditortempdir\\';

var count = 0;
var filelist = ls('-R', rootPath);
for (var f = 0; f < filelist.length; f++) {
	var file = filelist[f];
	if (path.extname(file) == '.epub') {
		file = path.join(rootPath, file);
		var dir = path.dirname(file);
		// get the author name
		var shortPath = dir.replace(rootPath, '');
		var parts = shortPath.split(path.sep);
		var authorName = parts[0];
	
		console.log('--- ' + file + ' - [' + authorName + ']');
/*		
		// copy a backup and work on it
		cp('-f', file, file + '.work');
		file += '.work';
*/		
		var retCode = exec('unzip -uo "' + file + '" *.opf', {async:false}).code;
		if (retCode === 0 || retCode == 1) {
			// try to find the opf file
			var contentFile;
			var list = ls('-R', __dirname);
			for (var i = 0; i < list.length; i++) {
				if (path.extname(list[i]) == '.opf') {
					contentFile = path.relative(__dirname, list[i]);
					break;
				}
			}
//			console.log('content : ' + contentFile);
			if (!contentFile) {
				console.log('no content.opf here !!!!! ');
			} else {
				var fullContentPath = path.join(__dirname, contentFile);
				var data = fs.readFileSync(fullContentPath);
				parser.parseString(data, function (err, result) {
					var root = result.package.metadata;
					if (!root) {
						// try another 
						root = result.package['opf:metadata']
						if (!root) {
							root = result.metadata;
						}
					}
					 //console.log(util.inspect(root, false, null));
					// console.log(util.inspect(root[0]['dc:creator'], false, null));
					
					if(root instanceof Array) {
						if (!root[0]['dc:creator'] ) {
							root[0]['dc:creator'] = { _ : 'toto'};
						}
						if(root[0]['dc:creator'] instanceof Array) {
							root = root[0]['dc:creator'][0];
						} else {
							root = root[0]['dc:creator'];
						}
					} else {
						if (!root['dc:creator'] ) {
							root['dc:creator'] = { _ : 'toto'};
						}
						if(root['dc:creator'] instanceof Array) {
							root = root['dc:creator'][0];
						} else {
							root = root['dc:creator'];
						}
						//console.log(util.inspect(root, false, null));
					}
					if (root._ != authorName || (root.$['opf:file-as'] && root.$['opf:file-as'] != authorName)) {
						root._ = authorName;
						try {
							root.$['opf:file-as'] = authorName;
						} catch(ex) {
							//console.log('No opf:file-as');
						}
						var xml = builder.buildObject(result);
						fs.writeFileSync(fullContentPath, xml);
						// zip -f file content.opf
						if (exec('zip -d "' + file + '" ' + contentFile).code !== 0) {
							echo('Error: 2 for ' + file);
						}
						if (exec('zip -u "' + file + '" "' + contentFile + '"').code !== 0) {
							echo('Error: 3 for ' + file);
						}
					} else {
						// console.log('Already done : SKIPPING');
					}
					// cleanup
					rm('-f', fullContentPath);
					rm('-fr', path.join(__dirname, 'OPS')); // for case problem
					rm('-fr', path.join(__dirname, 'OEBPS')); // for case problem
					count++;
				});
			}
		}
	}
	
}
console.log(count + ' epub file processed');
 