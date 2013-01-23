var request = require('request')

module.exports = exports = function(options) {

  if (options.token == null) throw "token is required";
  if (options.project_id == null) throw "project_id is required";
  if (options.ttl == null) throw "ttl is required";

  var cache = 'peekr_urls';
  var ttl = options.ttl;
  var cache_timeout = options.timeout || 250;

  function itemUrl(url) {
    return "https://cache-aws-us-east-1.iron.io/1" +
      "/projects/" + options.project_id + 
      "/caches/" + cache +
      "/items/" + escapeKey(url);
  }

  function escapeKey(key) {
    // todo when ironcache works with URI encoded use:
    // return encodeURIComponent(key)
    return key.replace(/[^A-Za-z0-9]+/g, "_");
  }

  this.put = function(url, value) {
    request({
      url: itemUrl(url),
      method: "PUT",
      headers: {
        "Authorization": "OAuth "+ options.token
      },
      json: {
        value: JSON.stringify(value),
        expires_in: ttl
      }
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        // console.log("CACHE PUT: [" + url + "]");
      } else if (!error && response.statusCode == 404) {
        console.log("CACHE PUT miss: [" + url + "]:" + JSON.stringify(body));
      } else {
        console.log("CACHE PUT error: " + error + ": " + JSON.stringify(body));
      }
    })
  }

  this.get = function(url, callback) {
    var start = new Date().getTime();
    request({
      uri: itemUrl(url),
      timeout: cache_timeout,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "OAuth "+ options.token
      }
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var elapsed = new Date().getTime() - start;
        console.log("CACHE [" + url + "] in " + elapsed + "ms");
        callback(JSON.parse(JSON.parse(body).value));
      } else if (!error && response.statusCode == 404) {
        // console.log("CACHE Miss: [" + url + "]");
        callback(null);
      } else {
        console.log("CACHE GET Error [" + url + "]: " + error);
        callback(null);
      }
    })
  }

}