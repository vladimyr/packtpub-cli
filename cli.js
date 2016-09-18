#!/usr/bin/env node

'use strict';

var downloadBook = require('./download.js');

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var resolve = require('path').resolve;
var format = require('util').format;
var yargs = require('yargs');
var ora = require('ora');
var pkg = require('./package.json');

var argv = yargs.version(pkg.version)
  .usage('\n$0 -c [config file] -t <type> -d <download dir>')
  .option('c', {
    alias: 'config',
    demand: true,
    type: 'string',
    describe: 'Provide path to config file'
  })
  .option('t', {
    alias: 'type',
    default: 'pdf',
    type: 'string',
    choices: [ 'pdf', 'epub', 'mobi' ],
    describe: 'Provide ebook type'
  })
  .option('d', {
    alias: 'directory',
    type: 'string',
    describe: 'Provide path to destination directory'
  })
  .option('o', {
    alias: 'use-stdout',
    default: false,
    type: 'boolean',
    describe: 'Print contents to stanard output'
  })
  .help('h').alias('h', 'help')
  .argv;

var spinner;
console.error('\n# Downloading latest free ebook from packtpub.com\n');

readConfig(argv.config)
  .then(function complete(config) {
    spinner = ora(format('Logging in using provided credentials [username: %s]', config.username));
    spinner.start();

    var options = Object.assign({}, config, { type: argv.type });
    return downloadBook(options);
  })
  .then(function complete(book) {
    spinner.succeed();

    var downloadStream = book.byteStream();
    downloadStream.on('end', function() { succeed(); });
    downloadStream.on('error', function(err) { fail(err); });
    downloadStream.pipe(getOutputStream(book, argv));
  })
  .error(function onError(err) { fail(spinner, err); });

function readConfig(path) {
  return fs.readFileAsync(path).then(JSON.parse);
}

function getOutputStream(book, options) {
  if (options.useStdout) {
    spinner = ora(format('Downloading "%s" [book_id: %s]', book.title, book.id));
    spinner.start();
    return process.stdout;
  }

  var filename = format('%s.%s', book.title, argv.type);
  spinner = ora(format('Writing to "%s.%s" [book_id: %s]', filename, book.id));
  spinner.start();

  var filepath = resolve(argv.directory || process.cwd(), filename);
  return fs.createWriteStream(filepath);
}

function succeed(text) {
  spinner.text = text || spinner.text;
  spinner.succeed();
  console.error();
}

function fail(error) {
  spinner.text = format('Error: %s', error.message);
  spinner.fail();
  console.error();
}
