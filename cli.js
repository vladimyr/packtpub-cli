#!/usr/bin/env node

'use strict';

var Promise = require('bluebird'),
    fs      = Promise.promisifyAll(require('fs')),
    argv    = require('yargs').argv;

var downloadFreeEbook = require('./index.js');

var useStdout    = argv.o || false,
    downloadType = argv.t || 'pdf',
    config       = argv.c;

var stderr = process.stderr;

stderr.write('\n Downloading latest free ebook from packtpub.com ...\n');
stderr.write('=====================================================\n');

fs.readFileAsync(config)
    .then(JSON.parse)
    .then(function complete(config){
        stderr.write(' Username: ' + config.username + '\n');

        config.downloadType = downloadType;
        return downloadFreeEbook(config);
    })
    .then(function complete(ebook){
        stderr.write(' Book title: ' + ebook.title + '\n');
        stderr.write(' Book ID: ' + ebook.id + '\n');

        var outputStream, onEnd;

        if (!useStdout) {
            var filename = ebook.title + '.' + downloadType;
            stderr.write('\n Writing to "' + filename + '" ...  ');

            outputStream = fs.createWriteStream(filename);
            onEnd = function(){ stderr.write('Done!\n'); };
        } else {
            outputStream = process.stdout;
            onEnd = Function.prototype;    
        }

        ebook.byteStream
            .on('end', onEnd)
            .pipe(outputStream);
    });