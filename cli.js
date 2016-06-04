#!/usr/bin/env node

'use strict';

var downloadEbook = require('./download.js');

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var resolve = require('path').resolve;
var format = require('util').format;
var yargs = require('yargs');

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


var stderr = process.stderr;
stderr.write('\n Downloading latest free ebook from packtpub.com ...\n');
stderr.write('=====================================================\n');

var config = argv.config;
fs.readFileAsync(config)
  .then(JSON.parse)
  .then(function complete(config) {
    stderr.write(format(' Username: %s\n', config.username));

    config.downloadType = argv.type;
    return downloadEbook(config);
  })
  .then(function complete(ebook) {
    stderr.write(format(' Book title: %s\n', ebook.title));
    stderr.write(format(' Book ID: %s\n', ebook.id));

    var outputStream;

    if (!argv.useStdout) {
      var filename = format('%s.%s', ebook.title, argv.type);
      stderr.write(format('\n Writing to "%s" ...  ', filename));
      var filepath = resolve(argv.directory || process.cwd(), filename);
      outputStream = fs.createWriteStream(filepath);
    } else {
      outputStream = process.stdout;
    }

    ebook.byteStream
      .on('end', function() { if (!argv.useStdout) stderr.write('Done!\n\n'); })
      .pipe(outputStream);
  });
