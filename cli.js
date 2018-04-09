#!/usr/bin/env node

'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const pathResolve = require('path').resolve;
const Configstore = require('configstore');
const yargs = require('yargs');
const ora = require('ora');
const pkg = require('./package.json');

const fetchBook = require('./packtpub.js').fetchBook;

// Setup command line options parsing.
const argv = yargs.version(pkg.version)
  .usage('\n$0 -c [config file] -t <type> -d <download dir>')
  .option('c', {
    alias: 'config',
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

// Reference to active spinner.
let spinner;

console.error('\n# Downloading latest free ebook from packtpub.com\n');

// Read credentials.
readConfig(argv.config)
  .then(config => {
    spinner = ora(`Logging in using provided credentials [username: ${config.username}]`);
    spinner.start();

    // Log in and fetch book data.
    const options = Object.assign({}, config, { type: argv.type });
    return fetchBook(options);
  })
  .then(book => {
    spinner.succeed();

    // Download book from remote.
    const downloadStream = book.byteStream();
    downloadStream.on('end', () => succeed());
    downloadStream.on('error', err => fail(err));
    downloadStream.pipe(getOutputStream(book, argv));
  })
  .error(err => fail(err));

function readConfig(path) {
  if (path) {
    return fs.readFileAsync(path).then(JSON.parse);
  }

  const conf = new Configstore(pkg.name, null, { globalConfigPath: true });
  return Promise.resolve(conf.all);
}

function getOutputStream(book, options) {
  if (options.useStdout) {
    spinner = ora(`Downloading "${book.title}" [book_id: ${book.id}]`);
    spinner.start();
    return process.stdout;
  }

  const filename = `${book.title}.${argv.type}`;
  spinner = ora(`Writing to "${filename}" [book_id: ${book.id}]`);
  spinner.start();

  const filepath = pathResolve(argv.directory || process.cwd(), filename);
  return fs.createWriteStream(filepath);
}

function succeed(text) {
  spinner.text = text || spinner.text;
  spinner.succeed();
  console.error();
}

function fail(err) {
  spinner.text = `Error: ${err.message}`;
  spinner.fail();
  console.error();
}
