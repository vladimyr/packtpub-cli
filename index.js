'use strict';

var request = require('request'),
    Promise = require('bluebird'),
    cheerio = require('cheerio'),
    Url     = require('url');

request = request.defaults({
    jar:                true,
    followRedirect:     true,
    followAllRedirects: true
});
request = Promise.promisifyAll(request);

var baseUrl          = 'https://www.packtpub.com/',
    freeOffersUrl    = Url.resolve(baseUrl, '/packt/offers/free-learning'),
    ebookDownloadUrl = Url.resolve(baseUrl, '/ebook_download/');

module.exports = function downloadFreeEbook(options){
    options = options || {};

    var downloadType = options.downloadType || 'pdf',
        username     = options.username,
        password     = options.password;

    var bookId, bookTitle;

    return request.getAsync(baseUrl)
        .spread(function complete(resp, body){
            var $ = cheerio.load(body),
                hiddenInputs = 'form#packt-user-login-form input[type="hidden"]';

            var formData = {
                email: username,
                password: password,
                op: 'Login'
            };

            $(hiddenInputs).each(function(i, el){
                var $el = $(el);
                formData[$el.attr('name')] = $el.attr('value');
            });

            return request.postAsync(baseUrl, { form: formData });
        })
        .spread(function complete(resp, body){
            return request.getAsync(freeOffersUrl);
        })
        .spread(function complete(resp, body){
            var $ = cheerio.load(body),
                claimUrl  = Url.resolve(baseUrl, $('[class$="claim"]').attr('href')),
                claimPath = Url.parse(claimUrl).path;

            var tokens = claimPath.replace(/^\//, '').split('/');

            bookId    = tokens[1];
            bookTitle = $('.dotd-title h2').text().trim();

            return request.getAsync(claimUrl);
        })
        .spread(function complete(resp, body){
            var downloadUrl = Url.resolve(ebookDownloadUrl, bookId + '/' + downloadType);
            return {
                id: bookId,
                title: bookTitle,
                byteStream: request.get(downloadUrl)
            };
        });
};