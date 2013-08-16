module.exports = (grunt) ->
	pkg = grunt.file.readJSON('package.json')

	replacements =
		'VERSION': pkg.version

	# Project configuration.
	grunt.initConfig
		relativePath: ''

		# Tasks
		clean: 
			main: ['build', 'tmp-deploy']

		copy:
			main:
				files: [
					expand: true
					cwd: 'src/'
					src: ['**', '!*.coffee']
					dest: 'build/<%= relativePath %>'
				]
			dist:
				files:
					'dist/checkout-sdk.min.js': ['build/checkout-sdk.min.js']
					'dist/checkout-sdk.js': ['build/checkout-sdk.js']

		coffee:
			main:
				files: [
					expand: true
					cwd: 'src/'
					src: ['**/*.coffee']
					dest: 'build/<%= relativePath %>/'
					ext: '.js'
				]

		uglify:
			dist:
				files:
					'build/checkout-sdk.min.js': ['build/checkout-sdk.js']

		karma:
			options:
				configFile: 'karma.conf.js'
			unit:
				background: true
			single:
				singleRun: true

		'string-replace':
			main:
				files:
					'build/<%= relativePath %>/checkout-sdk.js': ['build/<%= relativePath %>/checkout-sdk.js']
				options:
					replacements: ({'pattern': new RegExp(key, "g"), 'replacement': value} for key, value of replacements)

		connect:
			main:
				options:
					port: 9001
					base: 'build/'

		remote: main: {}

		watch:
			main:
				options:
					livereload: true
				files: ['src/**/*.html', 'src/**/*.coffee', 'spec/**/*.coffee', 'src/**/*.js', 'src/**/*.less']
				tasks: ['clean', 'coffee', 'copy', 'string-replace', 'karma:unit:run']

		vtex_deploy:
			main:
				options:
					buildDirectory: 'build'
			walmart:
				options:
					buildDirectory: 'build'
					bucket: 'vtex-io-walmart'
					requireEnvironmentType: 'stable'

	grunt.loadNpmTasks name for name of pkg.dependencies when name[0..5] is 'grunt-'

	grunt.registerTask 'default', ['clean', 'coffee', 'copy', 'string-replace', 'server', 'karma:unit', 'watch:main']
	grunt.registerTask 'dist', ['clean', 'coffee', 'copy', 'string-replace', 'uglify', 'copy:dist'] # Dist - minifies files
	grunt.registerTask 'test', ['karma:single']
	grunt.registerTask 'server', ['connect', 'remote']