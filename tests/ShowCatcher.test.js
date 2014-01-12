/* globals describe, it, beforeEach */

var ShowCatcher = require('../lib/ShowCatcher');
var assert = require('assert');
var sinon = require('sinon');

describe('ShowCatcher', function(){

	var catcher;
	
	beforeEach(function(){
		
		//Disable persistence
		ShowCatcher.prototype.restore = sinon.spy();
		ShowCatcher.prototype.commit = sinon.spy();
		
		catcher = new ShowCatcher();
	});
	
	
	describe('addFeed', function(){
		
		it('should add an object to the feeds array', function(){
			
			catcher.addFeed('http://example.com', 'Example', '/mnt/downloads');
			
			assert.equal(catcher.subscriptions.length,1, 'One feed');
			assert(catcher.commit.called,'Saved');
			
		});
	});
	
	describe('getTorrentsForFeed', function(){
		
		var feed = {
			url: 'http://showrss.info/feeds/4.rss',
			options: {
				quality: 'any'
			}
		};
	
		it('should get some episdodes of American Dad', function(done){
		
			catcher.getTorrentsForFeed(feed, function(err,torrents){
				
				//
				for(var i =0; i < torrents.length; i++){
					var torrent = torrents[1];
					
					assert(torrent.url, 'Has a link');
					assert(torrent.date, 'Has a date that it was published');
					assert(torrent.title, 'Has a title');
				}
			
				done();
			});
			
		});
		
	});
	
	describe('processFeed', function(){
	
		
		beforeEach(function(){
			catcher.addTorrentForFeed = sinon.stub();
			catcher.getTorrentsForFeed = sinon.stub();
		});
		
		
		it('should add torrents it has not already seen', function(){
		
			var feed = {
				lastDownload: new Date(2014,1,1),
				options: {
					quality: 'any'
				}
			};
			
			var torrents = [{
				url: 'http://site/test.torrent',
				date: new Date(2014,1,10)
			}];
			
			catcher.getTorrentsForFeed.yields(null,torrents);
			catcher.processFeed(feed,sinon.spy());
			
			assert(catcher.addTorrentForFeed.calledWith('http://site/test.torrent',feed));
		});
		
		it('should not add torrents it has already seen', function(){
		
			var feed = {
				lastDownload: new Date(2014,1,10),
				options: {
					quality: 'any'
				}
			};
			
			var torrents = [{
				url: 'http://site/test.torrent',
				date: new Date(2014,1,1)
			}];
			
			catcher.getTorrentsForFeed.yields(null,torrents);
			catcher.processFeed(feed,sinon.spy());
			
			assert(!catcher.addTorrentForFeed.called);
		});
		
		
	});
	
});