/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      build: {
        options: {
          engine: 'gm',
          sizes: [{
            /*
            Change these:
            
            width: ,
            suffix: ,
            quality:
            */
			
			width:640,
			quality:75
		  },
		  {
			  
			width:768,
			quality:75
		  },
		  {
			  
			width:1024,
			quality:50
		  },
		  {
			  
			width:1366,
			quality:50
		  },
		  {
			  
			width:1600,
			quality:35
		  },
		  {
			  
			width:1920,
			quality:24
		  }]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img/',
          dest: 'build/img/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      build: {
        src: ['build/*'],
      },
      js: ['build/js/*.js', '!build/js/*.min.js']
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      build: {
        options: {
          create: ['build/img/']
        },
      },
    },

    /* Copy images to build */
    copy: {
      build: {
        files: [{
          expand: true,
          src: 'img/*.{gif,jpg,png}',
          dest: 'build/img/',
		  flatten:true
        },
        {
            expand: true,
            src: 'data/*',
            dest: 'build/data/',
            flatten: true,
        },
        {
            expand:true,
            src: '*.{html,md}',
            dest: 'build/'
        },
        ]
      },
      noUglify: {
        files: [{
            expand: true,
            src: 'js/*',
            dest: 'build/js/',
            flatten: true,
          },]
      },
    },
    concat: {
        options: {
            separator: ';\n',
            sourceMap: true,
            sourceMapIncludeSources: true,
        },
        main: {
            src: ['js/dbhelper.js','js/main.js'],
            dest: 'build/js/main.js',
            nonull: true,
        },
        restaurant_info: {
            src: ['js/dbhelper.js','js/restaurant_info.js'],
            dest: 'build/js/restaurant_info.js',
            nonull: true,
        }
    },
    uglify: {
        options: {
            sourceMap: true,
            sourceMapIncludeSources: true,
        },
        build: {
            files: {
                'build/js/main.min.js': ['build/js/main.js'],
                'build/js/restaurant_info.min.js': ['build/js/restaurant_info.js'],
            }
        }
    },
    babel:{
        options: {
            
        },
        build: {
            files: {
                'build/js/main.js': ['build/js/main.js'],
                'build/js/restaurant_info.js': ['build/js/restaurant_info.js']
            }
        }
    },
    cssmin: {
        build: {
            files: [{
                expand: true,
                dest: 'build/css/',
                src: ['css/*.css'],
                ext: '.min.css',
                flatten: true,
                sourceMap: true,
                sourceMapIncludeSources: true,
            }
            ]
        }
    }
  });
  
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy:build', 'concat', 'babel', 'uglify', 'clean:js', 'cssmin', 'responsive_images']);
  grunt.registerTask('noUglify', ['clean', 'mkdir', 'copy', 'concat', 'babel', 'cssmin', 'responsive_images']);
  grunt.registerTask('noBabel', ['clean', 'mkdir', 'copy:build', 'concat', 'cssmin', 'responsive_images']);
};
