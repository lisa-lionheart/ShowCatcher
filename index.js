

var ShowCatcher = require('./lib/ShowCatcher');
var express = require('express');

var showCatcher = new ShowCatcher();


function formatDateTime(date){

	var age = Date.now() - date.getTime();
	
	if(age > 365*24*60*60){
		return date.toString().split(' ').slice(0,4).join(' ');
	}
	
	if(age > 24*60*60){
		return date.toString().split(' ').slice(0,3).join(' ');
	}

	return date.toTimeString().split(' ')[0];
}

function getPresets(){
	var presets = [];

	

	for(var id in showCatcher.showRss.shows){
		if(showCatcher.showRss.shows.hasOwnProperty(id)){
			var show = showCatcher.showRss.shows[id];
		
			presets.push({
				text: 'ShowRss: ' + show,
				url: 'http://showrss.info/feeds/'+id+'.rss',
				name: show
			});
		}
	}
	
	presets = presets.sort(function(a,b){
		return a.name.localeCompare(b.name);
	});

	presets.unshift({
		text: 'Select a preset ...',
		name: 'aaaaaaaa'
	});

	return presets;
}

var app = express();
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	
	
	app.use(function(req,res,next){
		res.locals.showCatcher = showCatcher;
		res.locals.getPresets = getPresets;
		res.locals.formatDateTime = formatDateTime;
		next();
	});
	
	app.all('/*', express.basicAuth(showCatcher.config.auth.username,showCatcher.config.auth.password));
	
	
	app.use(express.static(__dirname + '/static'));
});


app.get('/', function(req,res){ res.render('home'); });
app.get('/add', function(req,res){ res.render('add_feed'); });
app.get('/config',function(req,res){ res.render('config'); });

app.post('/config', function(req,res){

	/* jshint -W069 */
	showCatcher.config.interval = req.body['interval'];
	showCatcher.config.downloadDir = req.body['downloadDir'];
	showCatcher.config.auth.username = req.body['auth.username'];
	showCatcher.config.auth.password = req.body['auth.password'];
	showCatcher.config.transmission.host = req.body['transmission.host'];
	showCatcher.config.transmission.port = req.body['transmission.port'];
	showCatcher.config.transmission.username = req.body['transmission.username'];
	showCatcher.config.transmission.password = req.body['transmission.password'];
	
	showCatcher.commit();
	
	process.exit(0);
});

app.get('/fetch_now', function(req,res){
	
	if(req.query.index){
		showCatcher.processFeed(showCatcher.subscriptions[req.query.index], function(err){
			res.redirect('/');
		});
		
		return;
	}
	
	showCatcher.processAll(function(err){
		res.redirect('/');
	});
});


app.get('/remove', function(req,res){
	
	if(req.query.index){
		showCatcher.subscriptions.splice(req.query.index,1);
		showCatcher.commit();
	}
	
	res.redirect('/');
});


app.post('/add', function(req,res){
	
	var feed = {
		url: req.body.url,
		title: req.body.title,
		options: {
			downloadDir: req.body.downloadDir,
			quality: req.body.quality
		}
	};
	

	console.log('feed', feed);
	
	if(req.body.test){
		
		showCatcher.getTorrentsForFeed(feed,function(err,torrents){
			if(err){
				return res.send(500,err.toString());
			}
			console.log('torrents',torrents);
	
			res.render('add_feed', {
				torrents: torrents,
				feed: feed
			});
		});
		
		return;
	}
	
	showCatcher.addFeed(feed.url, feed.title, feed.options);
	
	res.redirect('/');
});


app.listen(showCatcher.config.port);

