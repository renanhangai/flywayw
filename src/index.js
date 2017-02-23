"use strict";

const Promise = require( 'bluebird' );
const which   = Promise.promisify( require( 'which' ) );
const download = require( './Download' );

class Flyway {

	constructor( options ) {
		this.options = Object.assign({
			stream: process.stderr
		}, options);
	}

	_checkExecutable() {
		if ( this._checkExecutablePromise )
			return this._checkExecutablePromise;

		return this._checkExecutablePromise = Promise.resolve()
			.then(function() {
				if ( process.env.FLYWAY === 'debug' )
					throw new Error( "Not found" );
				else if ( process.env.FLYWAY )
					return process.env.FLYWAY;
				return which( 'flyway' );
			}).catch(function() {
				return download( 'https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/4.1.1/flyway-commandline-4.1.1-linux-x64.tar.gz' );
			})
		;
	}

	create() {
	}
	
	migrate() {
	}
	
};
module.exports = Flyway;

const x = new Flyway;
x._checkExecutable()
	.then( console.log, console.log )
;
