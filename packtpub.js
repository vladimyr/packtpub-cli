'use strict';

let request = require('request');
const Promise = require('bluebird');
const cheerio = require('cheerio');
const Url = require('url');
const urlJoin = require('url-join');
const qs = require('querystring');

request = request.defaults({
  jar: true,
  followRedirect: true,
  followAllRedirects: true
});
request = Promise.promisifyAll(request, { multiArgs: true });

const baseUrl = 'https://www.packtpub.com/';
const parseQuery = uri => qs.parse(uri.query);

module.exports = { login, fetchBook };

function login(username, password) {
  return request.getAsync(baseUrl)
    .spread((_, html) => {
      const form = getFormData(html, username, password);
      return request.postAsync(baseUrl, { form });
    })
    .spread(resp => {
      const query = parseQuery(resp.request.uri);
      if (query.login) return;
      const err = new Promise.OperationalError('Using invalid credentials!');
      return Promise.reject(err);
    });
}

function fetchBook({ username, password, type = 'pdf' } = {}) {
  const freeOffersUrl = urlJoin(baseUrl, '/packt/offers/free-learning');

  return login(username, password)
    .then(() => request.getAsync(freeOffersUrl))
    .spread((_, html) => {
      const book = getBookData(html);
      return Object.assign(book, {
        filename(type = 'pdf') {
          return `${book.title}.${type}`;
        },
        byteStream() {
          const downloadUrl = urlJoin(baseUrl, '/ebook_download/', book.id, type);
          return request.get(downloadUrl);
        }
      });
    });
}

function getFormData(loginPage, username, password) {
  const $ = cheerio.load(loginPage);
  const hiddenInputs = 'form#packt-user-login-form input[type="hidden"]';

  const formData = {
    email: username,
    password,
    op: 'Login'
  };

  $(hiddenInputs).each((i, el) => {
    const $el = $(el);
    formData[$el.attr('name')] = $el.attr('value');
  });

  return formData;
}

function getBookData(offerPage) {
  const $ = cheerio.load(offerPage);

  const url = urlJoin(baseUrl, $('.dotd-main-book-image a').attr('href'));
  const claimUrl = urlJoin(baseUrl, $('.dotd-main-book-form form').attr('action'));
  const id = getBookId(claimUrl);
  const title = $('.dotd-title h2').text().trim();

  return { id, title, url, claimUrl };
}

function getBookId(claimUrl) {
  const path = Url.parse(claimUrl).path;
  const tokens = path.replace(/^\//, '').split('/');
  return tokens[1];
}
