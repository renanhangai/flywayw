"use strict";

const Promise = require( 'bluebird' );
const which   = Promise.promisify( require( 'which' ) );
const download = require( './Download' );
const path = require( 'path' );
const OS = require( 'os' );
const child_process = require( 'child_process' );

const PACKAGES = {
	x64: {
		'win32':   'https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/4.1.1/flyway-commandline-4.1.1-windows-x64.zip',
		'darwin':  'https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/4.1.1/flyway-commandline-4.1.1-macosx-x64.tar.gz',
		'linux':   'https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/4.1.1/flyway-commandline-4.1.1-linux-x64.tar.gz',
		'freebsd': 'https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/4.1.1/flyway-commandline-4.1.1-linux-x64.tar.gz',
		'sunos':   'https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/4.1.1/flyway-commandline-4.1.1-linux-x64.tar.gz'
	}
};

function spawn( command, args, options ) {
	options = Object.assign({
	}, options);
	const stdout = (options.stdout || process.stdout);
	const stderr = (options.stderr || process.stderr);
	return new Promise( function( resolve, reject ) {
		const proc = child_process.spawn( command, args, options );
		
		proc.stdout.on( 'data', (data) => { stdout.write( data ); });
		proc.stderr.on( 'data', (data) => { stderr.write( data ); });
		proc.on( 'error', reject );
		proc.on( 'close', resolve );
	});
}

class Flyway {

	constructor( options ) {
		this.options = Object.assign({
			stdout: process.stdout,
			stderr: process.stderr,
			cwd:    process.cwd()
		}, options);
	}

	_checkExecutable() {
		if ( this._checkExecutablePromise )
			return this._checkExecutablePromise;

		const tmpdir = path.resolve(this.options.tmpdir || '.tmp/flyway');

		this.options.stdout.write(`Finding flyway\n`);
		return this._checkExecutablePromise = Promise.resolve()
			.then(() => {
				if ( process.env.FLYWAY === 'debug' )
					throw new Error( "Not found" );
				else if ( process.env.FLYWAY )
					return process.env.FLYWAY;
				return which( 'flyway' );
			}).catch(() => {
				return which( 'flyway', { path: tmpdir });
			}).catch( () => {
				const platform = OS.platform();
				const url = PACKAGES.x64[ platform ];
				if ( !url )
					throw new Error( `Invalid flyway for platform '${platform}'` );
				return download.downloadDecompress( url, tmpdir, { stream: this.options.stderr || process.stderr } )
					.then(() => which( 'flyway', { path: tmpdir }) )
				;
			}).tap(( flyway ) => this.options.stdout.write(`Found: ${JSON.stringify(flyway)}\n\n`) )
		;
	}

	_runCommand( args ) {
		return this._checkExecutable()
			.tap( () => this.options.stdout.write(`flyway ${JSON.stringify(args[0])}\n====================\n\n`) )
			.tap( () => {
				if ( this.options.interceptArgs )
					return this.options.interceptArgs( args ).then((a) => args = a);
			})
			.then(( flyway ) => {
				return spawn( flyway, args, {
					stdout: this.options.stdout,
					stderr: this.options.stderr,
					cwd:    this.options.cwd
				});
			})
		;
	}

	create() {
	}
	
	migrate() {
		return this._runCommand(['migrate']);
	}
	
};
module.exports = Flyway;
