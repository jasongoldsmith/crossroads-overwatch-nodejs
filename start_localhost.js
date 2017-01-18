#!/usr/bin/env node
var debug = require('debug')('overwatch')
var app = require('./app/app')
var fs = require('fs')
var https = require('https')

var options = {
  key  : fs.readFileSync('/Users/ahujapr/localhost.key'),
  cert : fs.readFileSync('/Users/ahujapr/localhost.crt')
}

process.on('uncaughtException', function(err) {
  console.log('Uncaught exception')
  console.log(err)
  console.log(err.stack)
})



//app.set('port', process.env.PORT || 3000)

//var server = app.listen(app.get('port'), function() {
//  debug('Express server listening on port ' + server.address().port)
//  fs.writeFile("app/tmp/starttime.txt", new Date().getTime())
//})

https.createServer(options, app).listen(3000, function () {
  console.log('Started!');
})


