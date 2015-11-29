"use strict";

const gulp = require("gulp");
const mocha = require("gulp-mocha");

/**
* Execute all tests.
*/
gulp.task("test", () => {
	return gulp.src("tests/**/*.js", { read: false })
		.pipe(mocha({ reporter: "spec" }));
});
