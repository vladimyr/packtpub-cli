#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const pkg = require('./package.json');
const alias = { h: 'help', v: 'version' };

const usage = chalk`
  {bold $0} v${pkg.version} - {yellow ${pkg.description}}

Usage:
  $0 <command>`;

const footer = chalk`
Homepage:     {green ${pkg.homepage}}
Report issue: {green ${pkg.bugs.url}}`.trim();

// eslint-disable-next-line no-unused-expressions
require('yargs')
  .strict()
  .alias(alias)
  .commandDir('commands')
  .demandCommand(1, 'You need at least one command before moving on')
  .recommendCommands()
  .fail(onError)
  .usage(usage)
  .epilogue(footer)
  .help()
  .argv;

function onError(msg, err, yargs) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  yargs.showHelp();
  if (msg) console.error(chalk.bold(msg));
  process.exit(1);
}
