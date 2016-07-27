import * as ts from 'typescript';
import { File, FileCache } from './input';
import * as utils from './utils';

export class Host implements ts.CompilerHost {
	// TODO: Cache lib.d.ts between compilations. Old code:
	/* static libDefault: utils.Map<ts.SourceFile> = {};
	static getLibDefault(typescript: typeof ts, libFileName: string, originalFileName: string) {
		let fileName: string;
		for (const i in require.cache) {
			if (!Object.prototype.hasOwnProperty.call(require.cache, i) || require.cache[i] === undefined) continue;

			if (require.cache[i].exports === typescript) {
				fileName = i;
			}
		}
		if (fileName === undefined) {
			return undefined; // Not found
		}
		fileName = path.join(path.dirname(fileName), libFileName);
		if (this.libDefault[fileName]) {
			return this.libDefault[fileName]; // Already loaded
		}

		const content = fs.readFileSync(fileName).toString('utf8');
		return this.libDefault[fileName] = tsApi.createSourceFile(typescript, originalFileName, content, typescript.ScriptTarget.ES3); // Will also work for ES5 & 6
	} */

	typescript: typeof ts;
	fallback: ts.CompilerHost;

	currentDirectory: string;
	input: FileCache;

	constructor(typescript: typeof ts, currentDirectory: string, input: FileCache, option: ts.CompilerOptions) {
		this.typescript = typescript;
		this.fallback = typescript.createCompilerHost(option);

		this.currentDirectory = currentDirectory;
		this.input = input;
	}

	getNewLine() {
		return '\n';
	}
	useCaseSensitiveFileNames() {
		return false;
	}

	getCurrentDirectory = () => {
		return this.currentDirectory;
	}
	getCanonicalFileName(filename: string) {
		return utils.normalizePath(filename);
	}
	getDefaultLibFileName(options: ts.CompilerOptions) {
		return this.fallback.getDefaultLibFileName(options);
	}
	getDefaultLibLocation() {
		return this.fallback.getDefaultLibLocation();
	}

	writeFile = (fileName: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void) => {}

	fileExists = (fileName: string) => {
		let sourceFile = this.input.getFile(fileName);
		if (sourceFile) return true;

		return this.fallback.fileExists(fileName);
	}

	readFile = (fileName: string) => {
		const normalizedFileName = utils.normalizePath(fileName);

		let sourceFile = this.input.getFile(fileName);
		if (sourceFile) return sourceFile.content;

		return this.fallback.readFile(fileName);
	}

	getSourceFile = (fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile => {
		// TODO: Cache lib.d.ts files between compilations
		let sourceFile = this.input.getFile(fileName);
		if (sourceFile) return sourceFile.ts;

		return this.fallback.getSourceFile(fileName, languageVersion, onError);
	}
	
	realpath = (path: string) => {
		return this.fallback.realpath(path);
	}

	getDirectories = (path: string) => {
		return this.fallback.getDirectories(path);
	}
}
