"use strict";

//
// Gulp
// --------------------------------------------------

/*
 * Import gulp modules
 */
import gulp from "gulp";
import del from "del";
import babel from "gulp-babel";
import rename from "gulp-rename";
import uglify from "gulp-uglify";
import size from "gulp-size";
import gzip from "gulp-gzip";
import ts from "gulp-typescript";
import browser_sync from "browser-sync";
import merge from "merge2";

/*
 * Create browserSync instance
 */
const browserSync = browser_sync.create();

/*
 * Clean dist directory
 */
const clean = () => del(["./dist"]);
export { clean };

/*
 * get ts configs of this project
 */
const tsProject = ts.createProject("tsconfig.json", { declaration: true });

/*
 * Compile ts
 */
export function compileTs() {
  const tsResults = gulp.src("./src/stickier.ts").pipe(tsProject());

  return merge([
    tsResults.dts.pipe(gulp.dest("./dist/")),
    tsResults.js
      .pipe(babel())
      .pipe(rename("stickier.compile.js"))
      .pipe(gulp.dest("./dist/"))
      .pipe(size({ title: "compiled:" }))
      .pipe(uglify())
      .pipe(size({ title: "minified:" }))
      .pipe(rename("stickier.min.js"))
      .pipe(gulp.dest("./dist/"))
      .pipe(gzip())
      .pipe(size({ title: "gzipped:" }))
      .pipe(gulp.dest("./dist/")),
  ]);
}

/*
 * Serve
 */
export function serve() {
  gulp.watch("./src/*.js", gulp.series(compileTs));

  gulp.watch("./demo/*.html").on("change", browserSync.reload);
  gulp.watch("./dist/*.js").on("change", browserSync.reload);

  return browserSync.init({
    server: {
      baseDir: "./",
      directory: true,
    },

    startPath: "/demo/index.html",
  });
}

/*
 * Builder
 */
const build = gulp.series(clean, compileTs);
export { build };

const server = gulp.series(clean, compileTs, serve);
export { server };

/*
 * Export a default task
 */
export default server;
