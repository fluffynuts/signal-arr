/*
 * grunt-webpack
 * https://github.com/sokra/grunt-webpack
 *
 * Copyright (c) 2014 Tobias Koppers @sokra
 * Licensed under the MIT license.
 */

var path = require('path');
var _ = require('lodash');
module.exports = function(grunt) {
	var util = require('./webpack-utilities.js')(grunt);
	var getWithPlugins = util.getWithPlugins;
	var mergeFunction = util.mergeFunction;
	var webpack = require('webpack');
	var WebpackDevServer = require('webpack-dev-server');
	var ProgressPlugin = require('webpack/lib/ProgressPlugin');

	grunt.registerMultiTask('webpack-dev-server', 'Start a webpack-dev-server.', function() {
		var done = this.async();
		var options = _.merge({
				port: 8080,
				host: undefined,
				keepalive: false,
				contentBase: '.',
				webpack: {
					context: '.',
					output: {
						path: '/'
					}
				},
				progress: true,
				stats: {
					colors: true,
					hash: false,
					timings: false,
					assets: true,
					chunks: false,
					chunkModules: false,
					modules: false,
					children: true
				}
			},
			getWithPlugins([this.name, 'options']),
			getWithPlugins([this.name, this.target]),
			mergeFunction
		);
		if (typeof options.contentBase === 'string' && !/^(https?:)?\/\//.test(options.contentBase)) {
			options.contentBase = path.resolve(process.cwd(), options.contentBase);
		}
		[].concat(options.webpack).forEach(function(webpackOptions) {
			webpackOptions.context = path.resolve(process.cwd(), webpackOptions.context);
			if (webpackOptions.output && webpackOptions.output.path) {
				webpackOptions.output.path = path.resolve(process.cwd(), webpackOptions.output.path);
			}
		});

		var compiler = webpack(options.webpack);
		if (options.progress) {
			var chars = 0;
			compiler.apply(new ProgressPlugin(function(percentage, msg) {
				if (percentage < 1) {
					percentage = Math.floor(percentage * 100);
					msg = percentage + '% ' + msg;
					if (percentage < 100) {
						msg = ' ' + msg;
					}
					if (percentage < 10) {
						msg = ' ' + msg;
					}
				}
				for (; chars > msg.length; chars--) {
					grunt.log.write('\b \b');
				}
				chars = msg.length;
				for (var i = 0; i < chars; i++) {
					grunt.log.write('\b');
				}
				grunt.log.write(msg);
			}));
		}
		var server = new WebpackDevServer(compiler, options);
		if (options.middleware) {
			for (var key in options.middleware) {
				grunt.log.writeln('\rusing custom middleware for ' + key);
				server.use(key, options.middleware[key]);
			}
		}
    if(options.websocket) {
      proxy = require('http-proxy').createProxyServer();
      server.listeningApp.on('upgrade', function(req, socket) {
        if (req.url.match(options.websocket.path)) {
          console.log('proxying ws', req.url);
          proxy.ws(req, socket, {'target': options.websocket.url});
        }
      });
    }
		server.listen(options.port, options.host, function() {
			grunt.log.writeln('\rwebpack-dev-server on port ' + options.port + '  ');
			if (!options.keepAlive && !options.keepalive) {
				done();
			}
		});
	});
};