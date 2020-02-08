# Simple Build Kit

[![Build Status](https://travis-ci.org/lukaszmn/simple-build-kit.svg)](https://travis-ci.org/lukaszmn/simple-build-kit)
[![npm version](https://badge.fury.io/js/simple-build-kit.svg)](https://badge.fury.io/js/simple-build-kit)


# Introduction
*Simple Build Kit* is a very lightweight build toolkit for Node.js only for copying files.

It has no dependencies to other packages.

All methods are synchronous and file operations use the UTF-8 encoding.

# Download

Get it from the [npm](https://www.npmjs.com/package/simple-build-kit) registry:

```
npm install --save-dev simple-build-kit
```

# Reference

Types of arguments:
* `folder` - path to a folder, e.g. `assets` or `~/projects/first`
* `path` - path to a file, e.g. `./file.js` or `/project/lib/file.js`
* `destination` - path to a folder if it ends with `/`, and path to file otherwise , e.g. `./file.js` or `dest/`

Methods:

## `deleteFolder(folder)`
Recursively deletes a folder. There is a check if the folder exists first, so it's safe to call this method always.

## `cleanFolder(folder)`
First deletes the folder if it exists, then creates the folder.

## `read(path)`
Reads the file and returns its contents.

## `concat(paths)`
Reads all files and returns their content concatented.

## `save(path, contents)`
Writes the contents to the file. If the destination folder doesn't exists, it will be created.

## `createFolders(destination)`
Creates all missing folders for given path. Examples:
* for `dist/assets/abc`, folders `dist` and `dist/assets` will be created
* for `dist/assets/abc/`, folders `dist`, `dist/assets` and `dist/assets/abc` will be created

## `copy(source, destination)`
Copies source file(s) to the destination.

The `source` can be:
* `path/to/file.js` - `file.js` will be copied to the destination.
* `path/to/folder/` - all files from the `folder` will be copied to the destination.
* `path/to/file*.png` - all files matching the pattern will be copied to the destination. Possible wildcards: `*` and `?`. Note: matching subfolders will also be recursively copied.

The `destination` can be:
* `path/to/file.js` - destination file. Only valid for single source file.
* `path/to/folder/` - destination folder. Source file(s) will be copied to the destination folder.

If the `destination` folder does not exist, it will be created.
