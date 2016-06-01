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
request = Promise.promisifyAll(request);

var baseUrl = 'https://www.packtpub.com/';

var freeOffersUrl = Url.resolve(baseUrl, '/packt/offers/free-learning');
var ebookDownloadUrl = Url.resolve(baseUrl, '/ebook_download/');

module.exports = function downloadEbook(options) {
  options = options || {};

  var downloadType = options.downloadType || 'pdf';
  var username = options.username;
  var password = options.password;

  var bookId, bookTitle;

  return request.getAsync(baseUrl)
    .spread(function complete(resp, body) {
      var $ = cheerio.load(body);
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

      return request.postAsync(baseUrl, { form: formData });
    })
    .spread(function complete(resp, body) {
      return request.getAsync(freeOffersUrl);
    })
    .spread(function complete(resp, body) {
        var $ = cheerio.load(body);
      var claimUrl = Url.resolve(baseUrl, $('[class$="claim"]').attr('href'));
      var claimPath = Url.parse(claimUrl).path;

      var tokens = claimPath.replace(/^\//, '').split('/');
      bookId = tokens[1];

      bookTitle = $('.dotd-title h2').text().trim();

      return request.getAsync(claimUrl);
    })
    .spread(function complete(resp, body) {
      var downloadUrl = Url.resolve(ebookDownloadUrl, bookId + '/' + downloadType);
      return {
        id: bookId,
        title: bookTitle,
        byteStream: request.get(downloadUrl)
      };
    });
};
