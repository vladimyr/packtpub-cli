'use strict';

const { fetchBook } = require('../packtpub');
const { getCredentials } = require('../lib/auth');
const { wrap } = require('./helpers.js');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const writeFile = require('write').stream;

const options = {
  t: {
    alias: 'type',
    default: 'pdf',
    type: 'string',
    choices: ['pdf', 'epub', 'mobi'],
    describe: 'Select book format'
  },
  d: {
    alias: 'dir',
    type: 'string',
    describe: 'Choose download directory'
  }
};

module.exports = {
  command: 'download',
  desc: chalk.whiteBright('Download book from daily offer'),
  builder: options,
  handler: wrap(handler)
};

async function handler({ type, dir = process.cwd() }) {
  const auth = await getCredentials();
  if (!auth) {
    console.error('\nYou are not logged in!');
    return;
  }

  const book = await fetchBook({ ...auth, type });
  console.log(chalk`\n  {underline Daily offer:}`);
  console.log(chalk`\n  {bold # ${book.title}}\n  {green ${book.url}}\n`);
  const filepath = path.join(dir, book.filename(type));
  console.log(chalk`Download location:\n  {green ${filepath}}\n`);

  let spinner;
  try {
    spinner = ora('Downloading...').start();
    await download(book, filepath);
    spinner.text = 'Downloaded';
    spinner.succeed();
  } catch (err) {
    if (spinner) spinner.fail();
    throw err;
  }
}

function download(book, filepath) {
  return new Promise((resolve, reject) => {
    book.byteStream().pipe(writeFile(filepath))
      .once('error', reject)
      .once('finish', () => resolve(book));
  });
}
