'use strict';

const chalk = require('chalk');
const Promise = require('bluebird');

module.exports = { wrap };

function wrap(handler) {
  return function () {
    return Promise.resolve(handler.apply(this, arguments))
      .error(err => {
        console.error(chalk`\n{bgRed.white.bold Error} ${err.message}`);
        process.exit(1);
      });
  };
}
