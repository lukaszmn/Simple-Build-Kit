const fs = require('fs');

let silence = false;

/**
 * Enables or disabled silent mode.
 * In silent mode no messages with the progress are printed to the console.
 * @param {boolean} silent Whether messages should be suppressed.
 */
function setSilent(silent) {
	silence = silent;
}

function log(msg) {
	if (!silence)
		console.log('[simple-build-kit] ' + msg);
}


/**
 * Recursively deletes a folder.
 * There is a check if the folder exists first, so it's safe to call this method always.
 * @param {string} folder Path to a folder, e.g. `assets` or `~/projects/first`.
 */
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


/**
 * First deletes the folder if it exists, then creates the folder.
 * @param {string} folder Path to a folder, e.g. `assets` or `~/projects/first`.
 */
function cleanFolder(folder) {
	_deleteFolder(folder, false);
	_createFolders(folder + '/', false);
	log(`Cleaned folder [${folder}]`);
}


/**
 * Reads the file and returns its contents.
 * @param {string} path Path to the file, e.g. `./file.js` or `/project/lib/file.js`.
 */
function read(path) {
	return _read(path, true);
}
function _read(path, writeLog) {
	const res = fs.readFileSync(path, 'utf-8');
	if (writeLog)
		log(`Read file [${path}]`);
	return res;
}


/**
 * Reads all files and returns their content concatented.
 * @param {string[]} paths Array of paths to the file, e.g. `['./file.js', '/project/lib/file.js']`.
 */
function concat(paths) {
	let res = '';
	for (const path of paths)
		res += _read(path, false);

	log('Concatened files: ' + paths.map(p => `[${p}]`).join(', '));

	return res;
}


/**
 * Writes the contents to the file.
 * If the destination folder doesn't exists, it will be created.
 * @param {string} path Path to the file, e.g. `./file.js` or `/project/lib/file.js`.
 * @param {string} contents Data to write.
 */
function save(path, contents) {
	_createFolders(path, false);
	fs.writeFileSync(path, contents);
	log(`Saved to file [${path}]`);
}


/**
 * Creates all missing folders for given path.
 * @param {string} destination Path to a folder if it ends with `/`, and path to file otherwise , e.g. `./file.js` or `dest/`.
 */
function createFolders(destination) {
	_createFolders(destination, true);
}
function _createFolders(destination, writeLog) {
	function recursiveCreate(root, part) {
		const pos = part.indexOf('/');
		if (pos < 0) {
			const newRoot = (root ? root + '/' : '') + part;
			if (!fs.existsSync(newRoot))
				fs.mkdirSync(newRoot);
		} else {
			const prefix = part.substr(0, pos);
			const suffix = part.substr(pos + 1);

			const newRoot = (root ? root + '/' : '') + prefix;
			if (!fs.existsSync(newRoot))
				fs.mkdirSync(newRoot);
			if (suffix.length > 0)
				recursiveCreate(newRoot, suffix);
		}
	}

	destination = destination.replace(/\\/g, '/');
	const root = (destination.includes(':') || destination.startsWith('/'))
		? '' : '.';

	if (destination.endsWith('/'))
		recursiveCreate(root, destination);
	else if (destination.includes('/')) {
		const folder = destination.replace(/\/[^\/]+$/, '/');
		recursiveCreate(root, folder);
	}

	if (writeLog)
		log(`Created folder [${destination}]`);
}


/**
 * Copies source file(s) to the destination.
 * If the `destination` folder does not exist, it will be created.
 * @param {string} source File, folder or pattern of files to copy, e.g. `src/file.js`, `src/`, `src/*.js`.
 * @param {string} destination Path to a folder if it ends with `/`, and path to file otherwise , e.g. `./file.js` or `dest/`.
 */
function copy(source, destination) {
	function internalCopy(src) {
		const relativePath = folder === '.' ? src : src.substr(folder.length + 1); // +1 for slash
		const dest = destination.endsWith('/') ? destination + relativePath : destination;
		// console.log({folder, src, relativePath, destination, dest});
		_createFolders(dest, false);
		fs.copyFileSync(src, dest);

		log(`Copied file [${src}] -> [${dest}]`);
	}

	source = source.replace(/\\/g, '/');
	destination = destination.replace(/\\/g, '/');

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


/**
 * Lists files matching a pattern
 * @param {string} path File, folder or pattern of files to find, e.g. `src/file.js`, `src/`, `src/*.js`.
 */
function list(path) {
	path = path.replace(/\\/g, '/');
	if (path.endsWith('/'))
		path += '*';

	const pos = path.lastIndexOf('/');
	const folder = pos < 0 ? '.' : path.substr(0, pos);
	const pattern = pos < 0 ? path : path.substr(pos + 1);

	const files = [];

	if (pattern.indexOf('*') < 0 && pattern.indexOf('?') < 0) {
		files.push(path);
		return files;
	}

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
				files.push(src);
		}
	}

	return files;
}

function escapeRegExp(string) {
	// (C) https://stackoverflow.com/a/6969486/1454656
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


module.exports = { setSilent, deleteFolder, cleanFolder, read, concat, save, createFolders, copy, list };
