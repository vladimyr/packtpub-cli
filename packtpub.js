'use strict';

let request = require('request');
const Promise = require('bluebird');
const cheerio = require('cheerio');
const Url = require('url');
const urlJoin = require('url-join');

request = request.defaults({
  jar: true,
  followRedirect: true,
  followAllRedirects: true
});
request = Promise.promisifyAll(request, { multiArgs: true });

const baseUrl = 'https://www.packtpub.com/';

const freeOffersUrl = urlJoin(baseUrl, '/packt/offers/free-learning');
const ebookDownloadUrl = urlJoin(baseUrl, '/ebook_download/');

module.exports = { fetchBook };

function fetchBook(options) {
  options = options || {};

  let type = options.type || 'pdf';
  let username = options.username;
  let password = options.password;

  let book;

  return request.getAsync(baseUrl)
    .spread((_, body) => {
      let form = getFormData(body, username, password);
      return request.postAsync(baseUrl, { form });
    })
    .spread(resp => {
      if (isRedirected(resp, 'https://www.packtpub.com/')) {
        return request.getAsync(freeOffersUrl);
      } else {
        return Promise.reject(new Promise.OperationalError('Using invalid credentials!'));
      }
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

function isRedirected(resp, referer) {
  return resp.request.headers.referer === referer;
}

function getFormData(loginPage, username, password) {
  let $ = cheerio.load(loginPage);
  let hiddenInputs = 'form#packt-user-login-form input[type="hidden"]';

  let formData = {
    email: username, password,
    op: 'Login'
  };

  $(hiddenInputs).each((i, el) => {
    let $el = $(el);
    formData[$el.attr('name')] = $el.attr('value');
  });

  return formData;
}

function getBookId(claimUrl) {
  let path = Url.parse(claimUrl).path;
  let tokens = path.replace(/^\//, '').split('/');
  return tokens[1];
}

function getBookData(offerPage) {
  let $ = cheerio.load(offerPage);

  let claimUrl = urlJoin(baseUrl, $('.dotd-main-book-form form').attr('action'));
  let id = getBookId(claimUrl);
  let title = $('.dotd-title h2').text().trim();

  return { id, title, claimUrl };
}
