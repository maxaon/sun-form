gulp = require('gulp')
plugin = require('gulp-load-plugins')()
es = require('event-stream')

gulp.task 'scripts', ->
  gulp.src 'src/**/*.coffee'
  .pipe plugin.sourcemaps.init()
  .pipe plugin.coffee()
  .pipe plugin.concat('sun-form.js')
  .pipe plugin.sourcemaps.write()
  .pipe gulp.dest('dist')

gulp.task 'templates', ['scripts'], ->
  tpls = gulp.src 'src/**/*.jade'
  .pipe plugin.jade()
  .pipe plugin.angularTemplatecache(module: 'sun.form.tpls')

  es.merge(tpls, gulp.src('dist/sun-form.js'))
  .pipe plugin.concat('sun-form.tpls.js')
  .pipe gulp.dest('dist')

gulp.task 'default', ['scripts', 'templates']
gulp.task 'watch', ['default'], ->
  gulp.watch ['src/**/*.coffee', 'src/**/*.jade'], ['default']