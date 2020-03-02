const fs = require('fs');

let silence = false;

function setSilent(silent) {
	silence = silent;
}

function log(msg) {
	if (!silence)
		console.log('[simple-build-kit] ' + msg);
}


function deleteFolder(folder) {
	_deleteFolder(folder, true);
}
function _deleteFolder(folder, writeLog) {
	if (fs.existsSync(folder)) {
		const files = fs.readdirSync(folder);
		files.forEach(file => {
			const child = folder + '/' + file;
			if (fs.lstatSync(child).isDirectory())
				_deleteFolder(child, false);
			else
				fs.unlinkSync(child);
		});
		fs.rmdirSync(folder);
	}

	if (writeLog)
		log(`Deleted folder [${folder}]`);
};

function cleanFolder(folder) {
	_deleteFolder(folder, false);
	_createFolders(folder + '/', false);
	log(`Cleaned folder [${folder}]`);
}

function read(path) {
	return _read(path, true);
}
function _read(path, writeLog) {
	const res = fs.readFileSync(path, 'utf-8');
	if (writeLog)
		log(`Read file [${path}]`);
	return res;
}

function concat(paths) {
	let res = '';
	for (const path of paths)
		res += _read(path, false);

	log('Concatened files: ' + paths.map(p => `[${p}]`).join(', '));

	return res;
}

function save(path, contents) {
	_createFolders(path, false);
	fs.writeFileSync(path, contents);
	log(`Saved to file [${path}]`);
}

function createFolders(destination) {
	_createFolders(destination, true);
}
function _createFolders(destination, writeLog) {
	function recursiveCreate(root, part) {
		const pos = part.indexOf('/');
		if (pos < 0) {
			const newRoot = root + '/' + part;
			if (!fs.existsSync(newRoot))
				fs.mkdirSync(newRoot);
		} else {
			const prefix = part.substr(0, pos);
			const suffix = part.substr(pos + 1);

			const newRoot = root + '/' + prefix;
			if (!fs.existsSync(newRoot))
				fs.mkdirSync(newRoot);
			if (suffix.length > 0)
				recursiveCreate(newRoot, suffix);
		}
	}

	if (destination.endsWith('/'))
		recursiveCreate('.', destination);
	else if (destination.includes('/')) {
		const folder = destination.replace(/\/[^\/]+$/, '/');
		recursiveCreate('.', folder);
	}

	if (writeLog)
		log(`Created folder [${destination}]`);
}


function copy(source, destination) {
	function escapeRegExp(string) {
		// (C) https://stackoverflow.com/a/6969486/1454656
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	function internalCopy(src) {
		const relativePath = folder === '.' ? src : src.substr(folder.length + 1); // +1 for slash
		const dest = destination.endsWith('/') ? destination + relativePath : destination;
		// console.log({folder, src, relativePath, destination, dest});
		_createFolders(dest, false);
		fs.copyFileSync(src, dest);

		log(`Copied file [${src}] -> [${dest}]`);
	}

	if (source.endsWith('/'))
		source += '*';

	const pos = source.lastIndexOf('/');
	const folder = pos < 0 ? '.' : source.substr(0, pos);
	const pattern = pos < 0 ? source : source.substr(pos + 1);

	if (pattern.indexOf('*') < 0 && pattern.indexOf('?') < 0) {
		internalCopy(source);
		return;
	} else if (!destination.endsWith('/'))
		throw new Error('Cannot use destination file for multiple source files');

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


module.exports = { setSilent, deleteFolder, cleanFolder, read, concat, save, createFolders, copy };
