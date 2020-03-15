const { suite, spec } = require('titef');
const fs = require('fs');
const mock = require('mock-fs');
const assert = require('assert');
const recurse = require('fs-readdir-recursive');

const build = require('.');
build.setSilent(true);

suite('delete folder', {
	eachSetup() {
		mock.restore();
	},
}, () => {

	spec('missing', () => {
		mock({
			'empty-dir': {}
		});

		build.deleteFolder('nonexistent');
		assert.equal(fs.existsSync('empty-dir'), true);
	});

	spec('empty folder', () => {
		assert.equal(fs.existsSync('empty-dir'), false);

		mock({
			'empty-dir': {},
			'other-dir': {}
		});
		assert.equal(fs.existsSync('empty-dir'), true);

		build.deleteFolder('empty-dir');
		assert.equal(fs.existsSync('empty-dir'), false);
		assert.equal(fs.existsSync('other-dir'), true);
	});

	spec('full folder', () => {
		assert.equal(fs.existsSync('empty-dir'), false);

		mock({
			'dir': {
				'a': {},
				'b': 'test',
				'c': {
					'd': 'test'
				}
			},
			'empty-dir': {}
		});
		assert.equal(fs.existsSync('dir'), true);

		build.deleteFolder('dir');
		assert.equal(fs.existsSync('dir'), false);
		assert.equal(fs.existsSync('empty-dir'), true);
	});

});


suite('clean folder', {
	eachSetup() {
		mock.restore();
	},
}, () => {

	spec('missing', () => {
		mock({
			'empty-dir': {}
		});

		build.cleanFolder('nonexistent');
		assert.equal(fs.existsSync('empty-dir'), true);
		assert.equal(fs.existsSync('nonexistent'), true);
	});

	spec('empty folder', () => {
		assert.equal(fs.existsSync('empty-dir'), false);

		mock({
			'empty-dir': {},
			'other-dir': {}
		});
		assert.equal(fs.existsSync('empty-dir'), true);

		build.cleanFolder('empty-dir');
		assert.equal(fs.existsSync('empty-dir'), true);
		assert.equal(fs.existsSync('other-dir'), true);
	});

	spec('full folder', () => {
		assert.equal(fs.existsSync('empty-dir'), false);

		mock({
			'dir': {
				'a': {},
				'b': 'test',
				'c': {
					'd': 'test'
				}
			},
			'empty-dir': {}
		});
		assert.equal(fs.existsSync('dir'), true);
		assert.equal(fs.existsSync('dir/a'), true);

		build.cleanFolder('dir');
		assert.equal(fs.existsSync('dir'), true);
		assert.equal(fs.existsSync('dir/a'), false);
		assert.equal(fs.existsSync('empty-dir'), true);
	});

});


suite('read', {
	eachSetup() {
		mock.restore();
	},
}, () => {

	spec('a', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		const res = build.read('a');
		assert.equal(res, 'xyz');
	});

	spec('./a', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		const res = build.read('./a');
		assert.equal(res, 'xyz');
	});

	spec('dir/b', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		const res = build.read('dir/b');
		assert.equal(res, 'test');
	});

	spec('dir\\b', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		const res = build.read('dir/b');
		assert.equal(res, 'test');
	});

});


suite('save', {
	eachSetup() {
		mock.restore();
	},
}, () => {

	spec('c', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.save('c', 'abc');
		assert.equal(fs.readFileSync('a', 'utf-8'), 'xyz');
		assert.equal(fs.readFileSync('dir/b', 'utf-8'), 'test');
		assert.equal(fs.readFileSync('c', 'utf-8'), 'abc');
	});

	spec('./c', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.save('./c', 'abc');
		assert.equal(fs.readFileSync('a', 'utf-8'), 'xyz');
		assert.equal(fs.readFileSync('dir/b', 'utf-8'), 'test');
		assert.equal(fs.readFileSync('c', 'utf-8'), 'abc');
	});

	spec('dir/c', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.save('dir/c', 'abc');
		assert.equal(fs.readFileSync('a', 'utf-8'), 'xyz');
		assert.equal(fs.readFileSync('dir/b', 'utf-8'), 'test');
		assert.equal(fs.readFileSync('dir/c', 'utf-8'), 'abc');
		assert.equal(fs.existsSync('c'), false);
	});

	spec('dir\\c', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.save('dir\\c', 'abc');
		assert.equal(fs.readFileSync('a', 'utf-8'), 'xyz');
		assert.equal(fs.readFileSync('dir/b', 'utf-8'), 'test');
		assert.equal(fs.readFileSync('dir/c', 'utf-8'), 'abc');
		assert.equal(fs.existsSync('c'), false);
	});

	spec('dir2/c', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.save('dir2/c', 'abc');

		assert.equal(fs.existsSync('c'), false);
		assert.equal(fs.existsSync('dir2'), true);

		assert.equal(fs.readFileSync('a', 'utf-8'), 'xyz');
		assert.equal(fs.readFileSync('dir/b', 'utf-8'), 'test');
		assert.equal(fs.readFileSync('dir2/c', 'utf-8'), 'abc');
	});

});


suite('concat', {
	eachSetup() {
		mock.restore();
	},
}, () => {

	spec('concat /', () => {
		mock({
			'a': '1\n',
			'b': '2\n3',
			'dir': {
				'c': '4'
			}
		});

		const res = build.concat(['a', 'b', 'dir/c']);
		assert.equal(res, '1\n2\n34');
	});


	spec('concat \\', () => {
		mock({
			'a': '1\n',
			'b': '2\n3',
			'dir': {
				'c': '4'
			}
		});

		const res = build.concat(['a', 'b', 'dir\\c']);
		assert.equal(res, '1\n2\n34');
	});

});


suite('create folders', {
	eachSetup() {
		mock.restore();
	},
}, () => {

	spec('c', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.createFolders('c');
		assert.equal(fs.existsSync('c'), false);
	});

	spec('c/', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.createFolders('c/');
		assert.equal(fs.existsSync('c'), true);
	});

	spec('dir/c', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.createFolders('dir/c');
		assert.equal(fs.existsSync('dir/c'), false);
	});

	spec('dir/c/', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.createFolders('dir/c/');
		assert.equal(fs.existsSync('dir/c'), true);
	});

	spec('dir\\c', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.createFolders('dir\\c');
		assert.equal(fs.existsSync('dir/c'), false);
	});

	spec('dir\\c\\', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.createFolders('dir\\c\\');
		assert.equal(fs.existsSync('dir/c'), true);
	});

	spec('c/d/e', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.createFolders('c/d/e');
		assert.equal(fs.existsSync('c'), true);
		assert.equal(fs.existsSync('c/d'), true);
		assert.equal(fs.existsSync('c/d/e'), false);
	});

	spec('c/d/e/', () => {
		mock({
			'a': 'xyz',
			'dir': {
				'b': 'test',
			}
		});

		build.createFolders('c/d/e/');
		assert.equal(fs.existsSync('c'), true);
		assert.equal(fs.existsSync('c/d'), true);
		assert.equal(fs.existsSync('c/d/e'), true);
	});

});


suite('copy', {
	eachSetup() {
		mock.restore();
		mock({
			'a': 'file-a',
			'assets': {
				'b.png': 'file-b',
				'c.png': 'file-c',
				'd.png.gif': 'file-d',
				'e': 'file-e'
			}
		});
	},
}, () => {

	function getFiles() {
		return recurse('.')
			.map(s => s.replace(/\\/g, '/'));
	}

	spec('a -> dist/1/a', () => {
		build.copy('a', 'dist/1/a');

		const files = getFiles();
		assert.deepEqual(files, ['a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e', 'dist/1/a']);
		assert.equal(fs.readFileSync('dist/1/a', 'utf-8'), 'file-a');
	});

	spec('a -> dist/1/f', () => {
		build.copy('a', 'dist/1/f');

		const files = getFiles();
		assert.deepEqual(files, ['a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e', 'dist/1/f']);
		assert.equal(fs.readFileSync('dist/1/f', 'utf-8'), 'file-a');
	});

	spec('a -> dist/1/', () => {
		build.copy('a', 'dist/1/');

		const files = getFiles();
		assert.deepEqual(files, ['a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e', 'dist/1/a']);
		assert.equal(fs.readFileSync('dist/1/a', 'utf-8'), 'file-a');
	});

	spec('assets/ -> dist', () => {

		try {
			build.copy('assets/', 'dist');
			assert.fail();
		} catch (_) {}
	});

	spec('assets/ -> dist/', () => {
		build.copy('assets/', 'dist/');

		const files = getFiles();
		assert.deepEqual(files, [
			'a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e',
			'dist/b.png', 'dist/c.png', 'dist/d.png.gif', 'dist/e'
		]);

		assert.equal(fs.readFileSync('dist/b.png', 'utf-8'), 'file-b');
		assert.equal(fs.readFileSync('dist/c.png', 'utf-8'), 'file-c');
		assert.equal(fs.readFileSync('dist/d.png.gif', 'utf-8'), 'file-d');
		assert.equal(fs.readFileSync('dist/e', 'utf-8'), 'file-e');
	});

	spec('assets/*.png -> dist/', () => {
		build.copy('assets/*.png', 'dist/');

		const files = getFiles();
		assert.deepEqual(files, [
			'a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e',
			'dist/b.png', 'dist/c.png'
		]);

		assert.equal(fs.readFileSync('dist/b.png', 'utf-8'), 'file-b');
		assert.equal(fs.readFileSync('dist/c.png', 'utf-8'), 'file-c');
	});

	spec('assets\\*.png -> dist\\', () => {
		build.copy('assets\\*.png', 'dist\\');

		const files = getFiles();
		assert.deepEqual(files, [
			'a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e',
			'dist/b.png', 'dist/c.png'
		]);

		assert.equal(fs.readFileSync('dist/b.png', 'utf-8'), 'file-b');
		assert.equal(fs.readFileSync('dist/c.png', 'utf-8'), 'file-c');
	});

	spec('assets/? -> dist/', () => {
		build.copy('assets/?', 'dist/');

		const files = getFiles();
		assert.deepEqual(files, [
			'a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e',
			'dist/e'
		]);

		assert.equal(fs.readFileSync('dist/e', 'utf-8'), 'file-e');
	});

	spec('assets/g* -> dist/', () => {
		build.copy('assets/g*', 'dist/');

		const files = getFiles();
		assert.deepEqual(files, [
			'a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e'
		]);
	});

	spec('assets/?* -> dist/', () => {
		build.copy('assets/?*', 'dist/');

		const files = getFiles();
		assert.deepEqual(files, [
			'a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e',
			'dist/b.png', 'dist/c.png', 'dist/d.png.gif', 'dist/e'
		]);

		assert.equal(fs.readFileSync('dist/b.png', 'utf-8'), 'file-b');
		assert.equal(fs.readFileSync('dist/c.png', 'utf-8'), 'file-c');
		assert.equal(fs.readFileSync('dist/d.png.gif', 'utf-8'), 'file-d');
		assert.equal(fs.readFileSync('dist/e', 'utf-8'), 'file-e');
	});

	spec('assets/*? -> dist/', () => {
		build.copy('assets/*?', 'dist/');

		const files = getFiles();
		assert.deepEqual(files, [
			'a', 'assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e',
			'dist/b.png', 'dist/c.png', 'dist/d.png.gif', 'dist/e'
		]);

		assert.equal(fs.readFileSync('dist/b.png', 'utf-8'), 'file-b');
		assert.equal(fs.readFileSync('dist/c.png', 'utf-8'), 'file-c');
		assert.equal(fs.readFileSync('dist/d.png.gif', 'utf-8'), 'file-d');
		assert.equal(fs.readFileSync('dist/e', 'utf-8'), 'file-e');
	});

});


suite('list', {
	eachSetup() {
		mock.restore();
		mock({
			'a': 'file-a',
			'assets': {
				'b.png': 'file-b',
				'c.png': 'file-c',
				'd.png.gif': 'file-d',
				'e': 'file-e'
			}
		});
	},
}, () => {

	spec('a', () => {
		const files = build.list('a');

		assert.deepEqual(files, ['a']);
	});

	spec('assets/', () => {
		const files = build.list('assets/');

		assert.deepEqual(files, ['assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e']);
	});

	spec('assets/*.png', () => {
		const files = build.list('assets/*.png');

		assert.deepEqual(files, ['assets/b.png', 'assets/c.png']);
	});

	spec('assets\\*.png', () => {
		const files = build.list('assets\\*.png');

		assert.deepEqual(files, ['assets/b.png', 'assets/c.png']);
	});

	spec('assets/?', () => {
		const files = build.list('assets/?');

		assert.deepEqual(files, ['assets/e']);
	});

	spec('assets/g*', () => {
		const files = build.list('assets/g*');

		assert.deepEqual(files, []);
	});

	spec('assets/?*', () => {
		const files = build.list('assets/?*');

		assert.deepEqual(files, ['assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e']);
	});

	spec('assets/*?', () => {
		const files = build.list('assets/*?');

		assert.deepEqual(files, ['assets/b.png', 'assets/c.png', 'assets/d.png.gif', 'assets/e']);
	});

});
