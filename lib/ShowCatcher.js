var ShowRSS = require('./ShowRSS');
var Persist = require('./Persist');
var Transmission = require('transmission');
var sa = require('superagent');
var async = require('async');

var Entities = require('html-entities').XmlEntities;

var entities = new Entities();

function ShowCatcher()
{
	this.config = {
		port: 1234,
		downloadDir: '~/Downloads/',
		auth: {
			username: 'admin',
			password: 'admin'
		},
		transmission: {
			host: 'localhost',
			port: '9091',
			username: 'torrents',
			password: 'codemonkey'
		},
		interval: 30
	};
	
	this.subscriptions = [];
	
	this.messages = [];
	
	this.restore();
	
	this.transmission = new Transmission(this.config.transmission)
	
	setInterval(this.processAll.bind(this), this.config.interval * 60 * 1000);
}


Persist(ShowCatcher, [
	'subscriptions',
	'config'
],{
	'showRss' : ShowRSS
})

ShowCatcher.prototype.addMessage = function(msg, isError){
	
	this.messages.push({
		when: new Date(),
		text: msg,
		isError: isError
	});
}

ShowCatcher.prototype.addFeed = function(url, name, options){
	
	var feed = {
		url: url,
		name: name,
		lastChecked: new Date(0),
		lastDownload: new Date(0),
		options: {
			quality: options.quality,
			downloadDir: options.downloadDir,
		}
	};
	
	this.subscriptions.push(feed);
	this.commit();
};


ShowCatcher.prototype.getTorrentsForFeed = function(feed, done){
	
	console.log('Refershing feed', feed.name);
	
	sa
	.get(feed.url)
	.end(function(err,res){
		try 
		{
			//console.log(res.text);
			var torrents = [];
		
			var items = res.text.match(/<item>(((?!<item>).)*)<\/item>/g);
			items.forEach(function(itemXml){
				
				itemXml = entities.decode(itemXml);
			
				var torrent = {}
			
				torrent.title = /<title>(.*)<\/title>/.exec(itemXml)[1];
				torrent.description = /<showrss:rawtitle>(.*)<\/showrss:rawtitle>/.exec(itemXml)[1];
				torrent.url =  /<link>(.*)<\/link>/.exec(itemXml)[1];
				torrent.date = new Date(/<pubDate>(.*)<\/pubDate>/.exec(itemXml)[1]);
				
				if( feed.options.quality !== 'any' && 
				    torrent.title.indexOf(feed.options.quality) === -1)
				{	
					console.info('Skipping ', torrent.title);
				}
				else
				{
					torrents.push(torrent);
				}
				
			});
		
		
		}catch(err){
			done(err);
		}
		
		done(null, torrents);
		
	});
};

ShowCatcher.prototype.processAll = function(done){
	console.log('Checking feeds....');
	async.each(this.subscriptions, this.processFeed.bind(this), done);
};

ShowCatcher.prototype.processFeed = function(feed, done){

	var self = this;
	self.getTorrentsForFeed(feed, function(err, torrents){
		
		console.log('Got',torrents.length,'torrents');
		
		async.each(torrents, function(torrent, done){
			
			if(torrent.date > feed.lastDownload){
				
				console.log('Adding', torrent.title);
				
				self.addTorrentForFeed(torrent.url,feed, function(err){
					
					if(err){
						console.log(err);
						self.addMessage('Error adding torrent: ' + torrent.title, true);
						return done(err);
					}

					feed.lastDownload = new Date();
					self.addMessage('Started download of' + torrent.title);
					self.commit();
					
					done();
				})
			}else{
				console.log('Skipping', torrent.title, torrent.date);
				done();
			}
		},function(err){
			
			if(!err){
				feed.lastChecked = new Date();
				self.commit();	
			}
			
			done();
		});
	});
};

ShowCatcher.prototype.addTorrentForFeed = function(url, feed, done){
	
	var opts = {
		'download-dir': feed.options.downloadDir
	};
	
	console.log('Adding', url);

	this.transmission.add(url, opts, done)
};

module.exports=ShowCatcher;