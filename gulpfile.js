/*eslint-env node */


var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');
var responsiveImages = require('gulp-responsive-images');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
var del = require('del');

gulp.task('default', ['clean', 'copy', 'copy:idb', 'copy:img', 'responsiveImages', 'styles', 'concat:js']);

gulp.task('styles', function() {
	gulp.src('sass/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(gulp.dest('build/css'));
		
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

gulp.task('clean', function(){
    return del.sync(['build']);
});



gulp.task('concat:main', function(){
    return gulp.src(['js/dbhelper.js','js/favorite.js', 'js/main.js'])
        .pipe(concat('main.js'))
        .pipe(gulp.dest('build/js/'));
});

gulp.task('concat:restaurant', function(){
    return gulp.src(['js/dbhelper.js','js/favorite.js','js/restaurant_info.js'])
        .pipe(concat('restaurant_info.js'))
            .pipe(gulp.dest('build/js/'));
});

gulp.task('concat:js', ['concat:main', 'concat:restaurant']);

gulp.task('copy', function(){
   return gulp.src(['js/sw/sw.js','js/dbhelper.js','*.{html,md,webmanifest}'])
    .pipe(gulp.dest('build'));   
});

gulp.task('copy:idb', function(){
    return gulp.src(['js/idb.js'])
    .pipe(gulp.dest('build/js'));
});

gulp.task('copy:img', function(){
    return gulp.src(['img/**/*'])
    .pipe(gulp.dest('build/img'));
});

gulp.task('copy:img-fixed', function(){
    return gulp.src(['img/fixed/*'])
    .pipe(gulp.dest('build/img/fixed'));
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
            suffix:'-1024',
            quality:75
		  },
		  {
			  
			width:1366,
			upscale:true,
            suffix:'-1366',
            quality:75
		  },
		  {
			  
			width:1600,
			upscale:true,
            suffix:'-1600',
            quality:75
		  },
		  {
			  
			width:1920,
			upscale:true,
            suffix:'-1920',
            quality:75
    }]
    }))
    .pipe(gulp.dest('build/img/'));
});
