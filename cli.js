#!/usr/bin/env node

'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var format = require('util').format;
var argv = require('yargs').argv;

var downloadEbook = require('./download.js');

var useStdout = argv.o || false;
var downloadType = argv.t || 'pdf';
var config = argv.c;

var stderr = process.stderr;

stderr.write('\n Downloading latest free ebook from packtpub.com ...\n');
stderr.write('=====================================================\n');

fs.readFileAsync(config)
  .then(JSON.parse)
  .then(function complete(config) {
    stderr.write(format(' Username: %s\n', config.username));

    config.downloadType = downloadType;
    return downloadEbook(config);
  })
  .then(function complete(ebook) {
    stderr.write(format(' Book title: %s\n', ebook.title));
    stderr.write(format(' Book ID: %s\n', ebook.id));

    var outputStream;

    if (!useStdout) {
      var filename = format('%s.%s', ebook.title, downloadType);
      stderr.write(format('\n Writing to "%s" ...  ', filename));
      outputStream = fs.createWriteStream(filename);
    } else {
      outputStream = process.stdout;
    }

    ebook.byteStream
      .on('end', function() { if (!useStdout) stderr.write('Done!\n'); })
      .pipe(outputStream);
  });
