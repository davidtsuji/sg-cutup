var gulp = require( 'gulp' ),
	browserify = require( 'gulp-browserify' ),
	cluster = require( 'cluster' ),
	concat = require( 'gulp-concat' ),
	jshint = require( 'gulp-jshint' ),
	jshintReporter = require( "jshint-stylish" ),
	less = require( "gulp-less" ),
	rename = require( 'gulp-rename' ),
	mkdirp = require( 'mkdirp' ),
	shell = require( 'gulp-shell' )
	uglify = require( 'gulp-uglify' );

var pkg = require( './package.json' ),
	config = require( './gulpfile.json' );

var worker, livereloadServer;

var livereload = function ( _file ) {
	return function ( _path ) {
		if ( livereloadServer ) livereloadServer.changed( _file );
	}
}

gulp.task( "jshint", function () {
	return gulp.src( [ "./src/client/**/*.js", "test/**/*.js" ] )
		.pipe( jshint() )
		.pipe( jshint.reporter( jshintReporter ) );
} );

gulp.task( "markupApp", function () {
	return gulp.src( [ "./src/client/markup/*.html" ] )
		.pipe( gulp.dest( './public' ) )
		.on( 'end', livereload( '.html' ) );
} );

gulp.task( "libs", function () {
	config.libs.forEach( function ( _plugin ) {
		gulp.src( './bower_components/' + _plugin + '/**/*', {
			base: './bower_components/' + _plugin + ''
		} )
			.pipe( gulp.dest( './public/libs/' + _plugin ) );
	} );
} );

gulp.task( 'scriptsAppBrowserify', [ 'jshint' ], function () {
	return gulp.src( './src/client/scripts/index.js' )
		.pipe( browserify( {
			standalone: pkg.name,
			debug: true
		} ) )
		.pipe( rename( pkg.name + '.js' ) )
		.pipe( gulp.dest( './.tmp' ) );
} );

gulp.task( 'scriptsApp', [ 'scriptsAppBrowserify' ], function () {
	return gulp.src( config.scripts.concat( [
		'./.tmp/' + pkg.name + '.js'
	] ) )
		.pipe( concat( pkg.name + '.js', {
			newLine: ';'
		} ) )
		.pipe( gulp.dest( './public/scripts' ) )
		.on( 'end', livereload( '.js' ) );
} );

gulp.task( 'scriptsAppMinify', [ 'scriptsApp' ], function () {
	return gulp.src( './public/scripts/' + pkg.name + '.js' )
		.pipe( uglify() )
		.pipe( rename( pkg.name + '.min.js' ) )
		.pipe( gulp.dest( './public/scripts' ) )
		.on( 'end', livereload( '.js' ) );
} );

gulp.task( 'server', function () {
	cluster.setupMaster( {
		exec: "./src/server/bin/www"
	} );
	if ( worker ) worker.kill();
	worker = cluster.fork( {
		DEBUG: pkg.name,
		NODE_ENV: 'development'
	} );
} );

gulp.task( 'stylesApp', function () {
	return gulp.src( './src/client/styles/home.less' )
		.pipe( less() )
		.pipe( gulp.dest( './public/styles' ) )
		.on( 'end', livereload( '.css' ) );
} );

gulp.task( 'test', [ 'build' ], shell.task( [
	'npm test'
], {
	ignoreErrors: true
} ) );

gulp.task( 'watch', function () {

	livereloadServer = require( 'gulp-livereload' )();

	gulp.watch( [ './src/client/markup/**/*' ], [ 'markupApp' ] );
	gulp.watch( [ './src/client/scripts/**/*' ], [ 'scriptsApp' ] );
	gulp.watch( [ './src/client/styles/**/*' ], [ 'stylesApp' ] );
	gulp.watch( [ './test/**/*' ], [ 'test' ] );
	gulp.watch( [ './gulpfile.js*' ], [ 'default' ] );
} );

gulp.task( 'default', [ 'build', 'minify', 'test' ] );
gulp.task( 'build', [ 'scripts', 'markup', 'styles', 'libs' ] );
gulp.task( 'markup', [ 'markupApp' ] );
gulp.task( 'scripts', [ 'scriptsApp' ] );
gulp.task( 'styles', [ 'stylesApp' ] );
gulp.task( 'minify', [ 'scriptsAppMinify' ] );
gulp.task( 'run', [ 'default', 'server', 'watch' ] );