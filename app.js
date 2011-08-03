
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
	app.use(require('stylus').middleware({
		src: __dirname + '/public',
		force: true,
		autocompile: true
	}));
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Get redis client
var client;
if (process.env.REDISTOGO_URL) {
	var rtg = require("url").parse(process.env.REDISTOGO_URL);
	client = require("redis").createClient(rtg.port, rtg.hostname);

	client.auth(rtg.auth.split(":")[1]);
}	else {
	client = require("redis").createClient();
}

// Get Opentok client
var opentok = require('opentok');
var ot = new opentok.OpenTokSDK("1566461", '3272571db984f6c32e9bf3e457f14f70d84c531d');

// Routes
app.get('/', function(req, res) {
  res.render('landing', {
    title: 'QuickTok'
  });
});

app.post('/new', function(req, res) {
	
	var hash = require('./hash').create();
	
	var params = {
		url: "http://qtok.me/" + hash,
		hash: hash,
		status: "OK"
	}
	
	res.writeHead(200, {'Content-type': 'application/json' });
	res.write(JSON.stringify(params));
	res.end();
});

app.post('/reserve', function(req, res) {
	
	if (!req.body.hash || (req.body.hash.length != 5)) {
		
		var params = {
			status: "ERROR: Hash is not a pseudo base64 of length 5"
		};
		
		res.writeHead(200, {'Content-type': 'application/json' });
		res.write(JSON.stringify(params));
		res.end();
	} else {
		ot.createSession('localhost', {}, function(session) {
			var hash = req.body.hash;
			
			// Save the session to redis
			client.set("hash:" + hash, session.sessionId);

			var params = {
				url: "http://qtok.me/" + hash,
				hash: hash,
				status: "OK"
			};
			
			res.writeHead(200, {'Content-type': 'application/json' });
			res.write(JSON.stringify(params));
			res.end();
		})
	}	
})

app.get('/get', function(req, res) {
	client.get("hash:" + req.query.hash, function (err, data) {
		console.log(err);
		console.log(data);

		var params = {
			sessionId: data,
			token: ot.generateToken(),
			apiKey: "1566461"
		};

		res.writeHead(200, {'Content-type': 'application/json' });
		res.write(JSON.stringify(params));
		res.end();
	})
})

app.get('/:hash', function(req, res) {
  res.render('chat', {
    title: "QuickTok"
  })
});

app.listen(3000);
console.log("Express server listening on port %d", app.address().port);




