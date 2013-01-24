if (process.env.NEW_RELIC_APP_NAME) 
  var newrelic = require("newrelic");

var express = require('express')
  , fs = require('fs')
  , Page = require("./page.js")
  , argv = require('optimist').argv
  , ejs = require('ejs')
  , Cache = require('./cache.js')
  , UglifyJS = require("uglify-js")

var app = express();

var cache_ttl = process.env.IRON_CACHE_TTL || (argv.cache_ttl || (60 * 60))
var cache = argv.no_cache ? null : new Cache({
  token: process.env.IRON_CACHE_TOKEN || argv.cache_token,
  project_id: process.env.IRON_CACHE_PROJECT_ID || argv.cache_project_id,
  ttl: cache_ttl,
  timeout: process.env.IRON_CACHE_TIMEOUT || argv.cache_timeout
});

//GET /data/:URL
app.get("/data", function(request, response) {
  if (!request.query.url) {
    response.send(usage());
    return;
  }
  var page = new Page({
    cache: cache,
    url: request.query.url,
    headers: {
      'User-Agent': 'facebookexternalhit',
      'Accept': request.headers['accept'],
      'Accept-Language': request.headers['accept-language'],
      'Cache-Control': request.headers['cache-control']
    }
  });
  page.data(function(data) {
    if (data && data.url && !data.error) setCacheHeaders(response); // Cache if has URL parameter
    if (request.query.callback) {
      response.setHeader("Content-Type", "text/javascript");
      response.send(jsonp(request.query.callback, request.query.url, data));
    } else {
      response.setHeader("Content-Type", "application/json");
      response.send(JSON.stringify(data));
    }
  })
})

//GET /loader.js
//Load loader.js into memory for fast serving
var loader_js = getLoaderJS();
app.get("/peekr.js", function(request, response) {
  response.setHeader("Content-Type", "text/javascript");
  response.send(loader_js)
})

app.get('*', function(req, res){
  res.send(usage(), 404);
});

// Listen on environment PORT, argument, or 5000.
var port = process.env.PORT || (argv.port || 5000);
console.log("Listening on port " + process.env.PORT);
app.listen(port);

function jsonp(callback, url, data) {
  return callback+"("+JSON.stringify(data)+");"; 
}

function usage() {
  return 'usage: GET http://'+argv.host+'/data?url=[url]';
}

function setCacheHeaders(response) {
  response.setHeader("Cache-Control", "public, max-age=" + cache_ttl);
  response.setHeader("Expires", new Date(Date.now() + cache_ttl*1000).toUTCString());
}

function getLoaderJS() {
  var pro = require("uglify-js").uglify;
  var loader_js_content = fs.readFileSync("./api/loader.js", "utf8");
  var loader_css = fs.readFileSync("./api/loader.css", "utf8");
  var loader_js = ejs.render(loader_js_content, {css: loader_css, host: argv.host});
  if (argv.no_minify) return loader_js;
  return UglifyJS.minify(loader_js, {fromString:true}).code;
}
