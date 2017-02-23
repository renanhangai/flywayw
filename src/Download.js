"use strict";

const request  = require( 'request' );
const progress = require( 'request-progress' );
const Promise  = require( 'bluebird' );
const tmp = require( 'tmp' );
const path = require( 'path' );
const fs = require( 'fs' );
const URL = require( 'url' );
const ProgressBar = require( 'progress' );
const decompress = require( 'decompress' );

function tmppfile( options ) {
	return new Promise( function( resolve, reject ) {
		tmp.file( options, function( err, path, fd, clean ) {
			if ( err )
				reject( err );
			else
				resolve({ path: path, fd: fd, clean: clean });
		});
	});
}

function download( url, options ) {
	options = options || {};
	
	const urlObj   = URL.parse( url );
	const basename = path.basename( urlObj.pathname || url );
	
	return tmppfile({ postfix: options.suffix || basename })
		.then(function( file ) {
			return new Promise( function( resolve, reject ) {
				const stream = options.stream || process.stderr;
				stream.write( `  Downloading ${basename}\n` );
				const bar = new ProgressBar(`  [:bar] :percent :etas`, {
					complete: '=',
					incomplete: ' ',
					width: 100,
					total: 100,
					stream: stream
				});
				progress( request( url, options ) )
					.on( 'progress', function( state ) {
						bar.update( state.percent );
					}).on( 'error', reject )
					.on( 'end', resolve )
					.pipe( fs.createWriteStream( file.path, { fd: file.fd } ))
				;
			}).then(function() {
				return file;
			});
		})
	;
}

function downloadDecompress( url, dist, options ) {
	options = options || {};
	return download( url, options )
		.then(function( file ) {
			return decompress( file.path, dist );
		})
	;
}

module.exports = download;
module.exports.downloadDecompress = downloadDecompress;
