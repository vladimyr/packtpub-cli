'use strict';

let request = require('request');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const qs = require('querystring');
const Url = require('url');
const urlJoin = require('url-join');

request = request.defaults({
  jar: true,
  followRedirect: true,
  followAllRedirects: true
});
request = Promise.promisifyAll(request);

const baseUrl = 'https://www.packtpub.com/';
const freeOffersUrl = urlJoin(baseUrl, '/packt/offers/free-learning');
const parseQuery = uri => qs.parse(uri.query);

module.exports = { login, fetchBook };

async function login(username, password) {
  const { body: html } = await request.getAsync(baseUrl);
  const form = getFormData(html, username, password);
  const resp = await request.postAsync(baseUrl, { form });
  const query = parseQuery(resp.request.uri);
  if (query.login) return;
  throw new Promise.OperationalError('Using invalid credentials!');
}

async function fetchBook({ username, password, type = 'pdf' } = {}) {
  await login(username, password);
  const { body: html } = await request.getAsync(freeOffersUrl);
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
