'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const netrc = require('netrc');

const file = path.join(os.homedir(), '.netrc');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

module.exports = { read, write };

async function read() {
  const content = await readFile(file, 'utf8');
  return netrc.parse(content);
}

async function write(conf) {
  const content = netrc.format(conf);
  await writeFile(file, content, 'utf8');
  return content;
}
