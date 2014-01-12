module.exports = function(grunt) {

    grunt.initConfig({
        mochacli: {
            options: {
                require: ['should'],
                reporter: 'nyan',
                bail: true
            },
            test: {
                src: ['tests/*.js'],
                options: {
                    reporter: 'nyan'
                }
            },
            bamboo: {
                src: ['tests/*.js'],
                options: {
                    reporter: 'xunit'
                }
            }
        },

        jshint: {
            test: {
                src: ['tests/**/*.js', '*.js', '!newrelic.js']
            },

            options: {
                jshintrc: '.jshintrc'
            }
        },

        watch: {
            test: {
                files: ['Gruntfile.js', 'tests/**/*.js', '*.js', 'lib/**/*.js'],
                tasks: ['test']
            }
        },
    });

    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint', 'mochacli:test']);
    grunt.registerTask('bamboo', ['jshint', 'mochacli:bamboo']);
	
	grunt.registerTask('build', function() {
		grunt.log.ok('Nothing to do here!');
	});
};