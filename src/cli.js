"use strict";

const program = require( 'commander' );
const Flyway  = require( './index' );
const Promise = require( 'bluebird' );
const inquirer = require( 'inquirer' );
program
	.version( "0.0.1" )
	.option('-n, --no-prompt', 'Disable prompt for user and password' )
	.option('-d, --database-dir <database>', 'The database running dir' )
	.arguments('<cmd> [args...] ')
	.action( runFlyway )
;
program.parse( process.argv );

function interceptArgs( args ) {
	const prompt = inquirer.createPromptModule();
	return prompt([
		{ type: 'input', name: 'user', message: "Database user:", when: () => program.prompt },
		{ type: 'password', name: 'password', message: "Database password:", when: () => program.prompt },
	]).then(function( answers ) {
		const user = answers.user || program.user;
		const pass = answers.password || program.password;
		if ( user )
			args = args.concat([`-user=${user}`, `-password=${pass}` ]);
		return args;
	}).then(function( newargs ) {
		if ( program.url )
			newargs = newargs.concat([ `-url=${program.url}` ]);
		return newargs;
	});
}

function runFlywayPromise( cmd, args ) {
	return Promise.resolve()
		.then(function() {
			const flyway = new Flyway({
				cwd: program.databaseDir,
				interceptArgs: function( a ) {
					return interceptArgs( a )
						.then((a) => a.concat( args ) )
					;
				}
			});
			if ( cmd === 'migrate' )
				return flyway.migrate();
			else
				throw new Error( `Invalid command ${JSON.stringify(cmd)}` );
		})
	;
};

function runFlyway( cmd, args ) {
	runFlywayPromise( cmd, args );
};
