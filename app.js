var express = require('express')
  , fs = require('fs')
  , Page = require("./page.js")
  , argv = require('optimist').argv
  , ejs = require('ejs')

var app = express();
var port = process.env.PORT || argv.port || 5000;

//GET /data/:URL
app.get("/data", function(request, response) {
  console.log(request.query);
  var page = new Page({
    url: request.query.url,
    headers: {
      'User-Agent': request.headers['user-agent'],
      'Accept': request.headers['accept'],
      'Accept-Language': request.headers['accept-language'],
      'Cache-Control': request.headers['cache-control']
    }
  });
  page.parse(function(data) {
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


app.listen(port);

function jsonp(id, url, data) {
  return "_peekr_callback('"+id+"','"+url+"',"+JSON.stringify(data)+");"; 
}
