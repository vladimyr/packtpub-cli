#!/usr/bin/env node

'use strict';

var downloadBook = require('./download.js');

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var resolve = require('path').resolve;
var format = require('util').format;
var yargs = require('yargs');
var ora = require('ora');

var argv = yargs.usage('\n$0 -c [config file] -t <type> -d <download dir>')
  .option('c', {
    alias: 'config',
    demand: true,
    type: 'string',
    describe: 'provide path to config file'
  })
  .option('t', {
    alias: 'type',
    default: 'pdf',
    type: 'string',
    describe: 'provide ebook type [pdf|epub|mobi]'
  })
  .option('d', {
    alias: 'directory',
    type: 'string',
    describe: 'provide path to destination directory'
  })
  .option('o', {
    alias: 'use-stdout',
    default: false,
    type: 'boolean',
    describe: 'print contents to stanard output'
  })
  .help('h').alias('h', 'help')
  .argv;

function fail(spinner, error) {
  spinner.text = format('Error: %s', error.message);
  spinner.fail();
  console.error();
}

function succeed(spinner, text) {
  spinner.text = text || spinner.text;
  spinner.succeed();
  console.error();
}

function readConfig(path) {
  return fs.readFileAsync(path).then(JSON.parse);
}

var spinner;
console.error('\n# Downloading latest free ebook from packtpub.com\n');

readConfig(argv.config)
  .then(function complete(config) {
    spinner = ora(format('Logging in using provided credentials [username: %s]', config.username));
    spinner.start();

    config.downloadType = argv.type;
    return downloadBook(config);
  })
  .then(function complete(book) {
    spinner.succeed();

    var outputStream;

    if (!argv.useStdout) {
      var filename = format('%s.%s', book.title, argv.type);
      spinner = ora(format('Writing to "%s" [book_id: %s]', filename, book.id));
      var filepath = resolve(argv.directory || process.cwd(), filename);
      outputStream = fs.createWriteStream(filepath);
    } else {
      spinner = ora(format('Downloading "%s" [book_id: %s]', book.title, book.id));
      outputStream = process.stdout;
    }

    spinner.start();
    var downloadStream = book.byteStream();
    downloadStream.on('end', function() { succeed(spinner); });
    downloadStream.on('error', function(err) { fail(spinner, err); });
    downloadStream.pipe(outputStream);
  })
  .error(function onError(err) { fail(spinner, err); });
