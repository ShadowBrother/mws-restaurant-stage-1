/*eslint-env node */

var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');
var responsiveImages = require('gulp-responsive-images');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();


gulp.task('default', ['styles', 'lint'], function() {
	gulp.watch('sass/**/*.scss', ['styles']);
	gulp.watch('js/**/*.js', ['lint']);

	browserSync.init({
		server: './'
	});
});

gulp.task('styles', function() {
	gulp.src('sass/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(gulp.dest('gulp/css'))
		.pipe(browserSync.stream());
});

gulp.task('lint', function () {
	return gulp.src(['js/**/*.js'])
		// eslint() attaches the lint output to the eslint property
		// of the file object so it can be used by other modules.
		.pipe(eslint())
		// eslint.format() outputs the lint results to the console.
		// Alternatively use eslint.formatEach() (see Docs).
		.pipe(eslint.format())
		// To have the process exit with an error code (1) on
		// lint error, return the stream and pipe to failOnError last.
		.pipe(eslint.failOnError());
});

gulp.task('responsiveImages', function(){
    return gulp.src('img/*')
    .pipe(responsiveImages({
        '**/*':[{
            width:640,
			upscale:true,
            suffix:'-640'
		  },
		  {
			  
			width:768,
			upscale:true,
            suffix:'-768'
		  },
		  {
			  
			width:1024,
			upscale:true,
            suffix:'-1024'
		  },
		  {
			  
			width:1366,
			upscale:true,
            suffix:'-1366'
		  },
		  {
			  
			width:1600,
			upscale:true,
            suffix:'-1600'
		  },
		  {
			  
			width:1920,
			upscale:true,
            suffix:'-1920'
    }]
    }))
    .pipe(gulp.dest('gulp/img/'));
});
