'use strict';

const { fetchBook } = require('../packtpub');
const { OperationalError } = require('bluebird');
const chalk = require('chalk');
const netrc = require('../lib/netrc');
const ora = require('ora');
const path = require('path');
const writeFile = require('write').stream;

const isOperationalError = err => err instanceof OperationalError;

const options = {
  type: {
    alias: 't',
    default: 'pdf',
    type: 'string',
    choices: ['pdf', 'epub', 'mobi'],
    describe: 'ebook filetype'
  },
  dir: {
    alias: 'd',
    type: 'string',
    describe: 'download directory'
  }
};

module.exports = {
  command: 'download',
  desc: 'Download daily offer',
  builder: options,
  handler
};

async function handler({ type, dir = process.cwd() }) {
  const conf = await netrc.read();
  const auth = conf['packtpub.com'];
  if (!auth) {
    console.error('\nYou are not logged in!');
    return;
  }
  let spinner;
  try {
    const options = { username: auth.login, password: auth.password, type };
    const book = await fetchBook(options);
    console.log('\nDaily offer:');
    console.log(chalk`\n  {bold # ${book.title}}\n  {green ${book.url}}`);
    const filepath = path.join(dir, book.filename(type));
    console.log(chalk`\nDownload location:\n  {green ${filepath}}\n`);
    spinner = ora(chalk`Downloading...`);
    spinner.start();
    await download(book, filepath);
    spinner.text = chalk`Downloaded`;
    spinner.succeed();
  } catch (err) {
    if (spinner) spinner.fail();
    if (!isOperationalError(err)) throw err;
    console.error(chalk`\n{bgRed.white.bold Error} ${err.message}`);
    process.exit(1);
  }
}

function download(book, filepath) {
  return new Promise((resolve, reject) => {
    book.byteStream().pipe(writeFile(filepath))
      .once('error', reject)
      .once('finish', () => resolve(book));
  });
}
