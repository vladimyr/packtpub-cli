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

const freeOffersUrl = urlJoin(baseUrl, '/packt/offers/free-learning');
const ebookDownloadUrl = urlJoin(baseUrl, '/ebook_download/');

const parseQuery = uri => qs.parse(uri.query);

module.exports = { fetchBook };

function fetchBook(options) {
  options = options || {};

  const type = options.type || 'pdf';
  const username = options.username;
  const password = options.password;

  let book;

  return request.getAsync(baseUrl)
    .spread((_, body) => {
      const form = getFormData(body, username, password);
      return request.postAsync(baseUrl, { form });
    })
    .spread(resp => {
      const query = parseQuery(resp.request.uri);
      if (query.login) {
        return request.getAsync(freeOffersUrl);
      }
      return Promise.reject(new Promise.OperationalError('Using invalid credentials!'));
    })
    .spread((_, body) => {
      book = getBookData(body);
      return request.getAsync(book.claimUrl);
    })
    .then(() => {
      return Object.assign(book, {
        byteStream() {
          return request.get(urlJoin(ebookDownloadUrl, book.id, type));
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

function getBookId(claimUrl) {
  const path = Url.parse(claimUrl).path;
  const tokens = path.replace(/^\//, '').split('/');
  return tokens[1];
}

function getBookData(offerPage) {
  const $ = cheerio.load(offerPage);

  const claimUrl = urlJoin(baseUrl, $('.dotd-main-book-form form').attr('action'));
  const id = getBookId(claimUrl);
  const title = $('.dotd-title h2').text().trim();

  return { id, title, claimUrl };
}
