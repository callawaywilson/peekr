var request = require('request')
  , url = require('url')
  , Parser = require('./parser.js')

module.exports = exports = function(options) {

  var cache = options.cache;
  this.options = options;

  this.data = function(callback) {
    try {
      var uri = this.options.url;
      if (uri.indexOf("http") != 0) uri = "http://" + uri;
      var href = url.parse(uri);
      if (!href.host || !href.pathname) throw "Invalid URL";
      var headers = this.options.headers;
      if (cache) {
        cache.get(href, function(data) {
          if (data) callback(data);
          else getFromUrl(href, headers, callback);
        })
      } else {
        getFromUrl(href, headers, callback);
      }
    } catch(err) {
      console.log("ERROR url:["+this.options.url+"]", err);
      callback({
        error: "Error handling request",
        url: this.options.url
      });
    }
  }


  function getFromUrl(url, headers, callback) {  
    var start = new Date().getTime();
    var parser = new Parser();
    parser.parse(request({
      uri: url, 
      headers: headers,
      timeout: options.timeout
    }), {},
    function(data) {
      var elapsed = new Date().getTime() - start;
      if (!data.error) {
        callback(data);
        console.log("FETCH url:[" + url + "] in " + elapsed + "ms")
        if (cache && data) cache.put(url, data);
      } else {
        callback(data);
        if (errorCacheable(data) && cache) cache.put(url, data);
        console.log("FETCH error url:[" + url + "] " + 
          (data.statusCode ? data.statusCode : "") + 
          " '" + data.error + "' in " + elapsed + "ms");
      }
    });

  }

  function errorCacheable(data) {
    return data && (data.statusCode == 403 || data.statusCode == 404);
  }

}