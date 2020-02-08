const fs = require('fs');

function deleteFolder(folder) {
	if (fs.existsSync(folder)) {
		const files = fs.readdirSync(folder);
		files.forEach(file => {
			const child = folder + '/' + file;
			if (fs.lstatSync(child).isDirectory())
				deleteFolder(child);
			else
				fs.unlinkSync(child);
		});
		fs.rmdirSync(folder);
	}
};

function cleanFolder(folder) {
	deleteFolder(folder);
	fs.mkdirSync(folder);
}

function read(path) {
	return fs.readFileSync(path, 'utf-8');
}

function concat(paths) {
	let res = '';
	for (const path of paths)
		res += read(path);
	return res;
}

function save(path, contents) {
	createFolders(path);
	fs.writeFileSync(path, contents);
}

function createFolders(destination) {
	if (destination.endsWith('/'))
		fs.mkdirSync(destination, { recursive: true});
	else {
		const folder = destination.replace(/\/[^\/]+$/, '');
		fs.mkdirSync(folder, { recursive: true});
	}
}


function copy(source, destination) {
	function escapeRegExp(string) {
		// (C) https://stackoverflow.com/a/6969486/1454656
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	function internalCopy(src) {
		const relativePath = folder === '.' ? src : src.substr(folder.length);
		const dest = destination + relativePath;
		createFolders(dest);
		fs.copyFileSync(src, dest);
	}

	if (source.endsWith('/'))
		source += '*';

	const pos = source.lastIndexOf('/');
	const folder = pos < 0 ? '.' : source.substr(0, pos);
	const pattern = pos < 0 ? source : source.substr(pos + 1);

	if (pattern.indexOf('*') < 0 && pattern.indexOf('?') < 0) {
		internalCopy(source);
		return;
	} else if (destination.endsWith('/'))
		throw new Error('Cannot use folder destination for multiple source files');

	let patternRe = '^';
	for (const part of pattern.split(/(\?|\*)/)) {
		if (part === '?')
			patternRe += '.';
		else if (part === '*')
			patternRe += '.*';
		else
			patternRe += escapeRegExp(part);
	}
	patternRe += '$';
	const re = new RegExp(patternRe);

	const folders = [folder];
	while (folders.length > 0) {
		const currentFolder = folders.shift();

		for (const file of fs.readdirSync(currentFolder)) {
			const src = currentFolder + '/' + file;
			if (fs.lstatSync(src).isDirectory())
				folders.push(src);
			else if (re.test(file))
				internalCopy(src);
		}
	}
}


module.exports = { deleteFolder, cleanFolder, read, concat, save, createFolders, copy };
