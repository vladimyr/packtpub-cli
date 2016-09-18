'use strict';

var request = require('request');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var Url = require('url');

request = request.defaults({
  jar: true,
  followRedirect: true,
  followAllRedirects: true
});
request = Promise.promisifyAll(request, { multiArgs: true });

var baseUrl = 'https://www.packtpub.com/';

var freeOffersUrl = Url.resolve(baseUrl, '/packt/offers/free-learning');
var ebookDownloadUrl = Url.resolve(baseUrl, '/ebook_download/');

function isRedirected(resp, referer) {
  return resp.request.headers.referer === referer;
}

function getFormData(loginPage, username, password) {
  var $ = cheerio.load(loginPage);
  var hiddenInputs = 'form#packt-user-login-form input[type="hidden"]';

  var formData = {
    email: username,
    password: password,
    op: 'Login'
  };

  $(hiddenInputs).each(function(i, el) {
    var $el = $(el);
    formData[$el.attr('name')] = $el.attr('value');
  });

  return formData;
}

function getBookData(offerPage) {
  var $ = cheerio.load(offerPage);
  var claimUrl = Url.resolve(baseUrl, $('[class$="claim"]').attr('href'));
  var claimPath = Url.parse(claimUrl).path;

  var tokens = claimPath.replace(/^\//, '').split('/');
  var bookId = tokens[1];

  var bookTitle = $('.dotd-title h2').text().trim();

  return {
    id: bookId,
    title: bookTitle,
    claimUrl: claimUrl
  };
}

module.exports = function downloadBook(options) {
  options = options || {};

  var downloadType = options.downloadType || 'pdf';
  var username = options.username;
  var password = options.password;

  var book;

  return request.getAsync(baseUrl)
    .spread(function complete(_, body) {
      var formData = getFormData(body, username, password);
      return request.postAsync(baseUrl, { form: formData });
    })
    .spread(function complete(resp) {
      if (isRedirected(resp, 'https://www.packtpub.com/')) {
        return request.getAsync(freeOffersUrl);
      } else {
        return Promise.reject(new Promise.OperationalError('Using invalid credentials!'));
      }
    })
    .spread(function complete(_, body) {
      book = getBookData(body);
      return request.getAsync(book.claimUrl);
    })
    .spread(function complete() {
      var downloadUrl = Url.resolve(ebookDownloadUrl, book.id + '/' + downloadType);
      book.byteStream = function() { return request.get(downloadUrl); };
      return book;
    });
};
