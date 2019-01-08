//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var express = require('express');

var router = express();
var server = http.createServer(router);

router.use(express.json());
//router.use(express.static(path.resolve(__dirname, 'client')));

const cache = new Map

router.get('*',(req,res)=>{
  const key = req.headers.horigin + req.url
  res.send( cache.get(key) || {} )
})

router.put('*',(req,res)=>{
  const key = req.headers.horigin + req.url
  cache.set(key, req.body )
  res.send( cache.get(key) )
})

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
