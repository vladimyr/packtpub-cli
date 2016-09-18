'use strict';

var request = require('request');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var Url = require('url');
var urlJoin = require('url-join');

request = request.defaults({
  jar: true,
  followRedirect: true,
  followAllRedirects: true
});
request = Promise.promisifyAll(request, { multiArgs: true });

var baseUrl = 'https://www.packtpub.com/';

var freeOffersUrl = urlJoin(baseUrl, '/packt/offers/free-learning');
var ebookDownloadUrl = urlJoin(baseUrl, '/ebook_download/');

module.exports = function downloadBook(options) {
  options = options || {};

  var type = options.type || 'pdf';
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
      var downloadUrl = urlJoin(ebookDownloadUrl, book.id, type);
      book.byteStream = function() { return request.get(downloadUrl); };
      return book;
    });
};

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

function getBookId(claimUrl) {
  var path = Url.parse(claimUrl).path;
  var tokens = path.replace(/^\//, '').split('/');
  return tokens[1];
}

function getBookData(offerPage) {
  var $ = cheerio.load(offerPage);

  var claimUrl = urlJoin(baseUrl, $('[class$="claim"]').attr('href'));
  var id = getBookId(claimUrl);
  var title = $('.dotd-title h2').text().trim();

  return {
    id: id,
    title: title,
    claimUrl: claimUrl
  };
}
