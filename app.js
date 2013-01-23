var express = require('express')
  , fs = require('fs')
  , Page = require("./page.js")
  , argv = require('optimist').argv
  , ejs = require('ejs')
  , Cache = require('./cache.js')

var app = express();

var cache_ttl = process.env.IRON_CACHE_TTL || (argv.cache_ttl || (60 * 60))
var cache = argv.no_cache ? null : new Cache({
  token: process.env.IRON_CACHE_TOKEN || argv.cache_token,
  project_id: process.env.IRON_CACHE_PROJECT_ID || argv.cache_project_id,
  ttl: cache_ttl
});

//GET /data/:URL
app.get("/data", function(request, response) {
  var page = new Page({
    cache: cache,
    url: request.query.url,
    headers: {
      'User-Agent': request.headers['user-agent'],
      'Accept': request.headers['accept'],
      'Accept-Language': request.headers['accept-language'],
      'Cache-Control': request.headers['cache-control']
    }
  });
  page.data(function(data) {
    response.setHeader("Cache-Control", 
      "max-age=" + cache_ttl + ", must-revalidate");
    if (request.query.id) {
      response.setHeader("Content-Type", "text/javascript");
      response.send(jsonp(request.query.id, request.query.url, data));
    } else {
      response.setHeader("Content-Type", "application/json");
      response.send(JSON.stringify(data));
    }
  })
})

//GET /loader.js
//Load loader.js into memory for fast serving
var loader_js_content = fs.readFileSync("./api/loader.js", "utf8");
var loader_css = fs.readFileSync("./api/loader.css", "utf8");
var loader_js = ejs.render(loader_js_content, {css: loader_css, host: argv.host});
app.get("/peekr.js", function(request, response) {
  response.setHeader("Content-Type", "text/javascript");
  response.send(loader_js)
})

app.get('*', function(req, res){
  res.send('usage: GET http://'+argv.host+'/data?url=[url]', 404);
});

// Listen on environment PORT, argument, or 5000.
app.listen(process.env.PORT || (argv.port || 5000));

function jsonp(id, url, data) {
  return "_peekr_callback('"+id+"','"+url+"',"+JSON.stringify(data)+");"; 
}
