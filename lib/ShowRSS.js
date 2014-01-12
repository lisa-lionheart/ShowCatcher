
var Persist = require('./Persist');
var sa = require('superagent');

function ShowRSS(obj)
{
	
	this.shows = {};
	this.subscriptions = [];

	this.restore(obj);
	
	if(Object.keys(this.shows).length === 0){
		this.refreshShowList(console.log);
	}
}

Persist(ShowRSS,[
	'shows',
	'subscriptions'
]);


ShowRSS.prototype.refreshShowList = function(done){
	
	var self = this;
	
	sa
	.get('http://showrss.info/?cs=feeds')
	.end(function(err,res){
	
		var regex = /<option\ value=\"([^\"]+)\">([^<>]+)<\/option>/g;
		var matches = res.text.match(regex);
		
		matches.forEach(function(match){
			
			match = regex.exec(match);
			
			if(match){
				var id = match[1];
				var name = match[2];
		
				self.shows[id] = name;
			}
		});
		
		self.commit();
		done();
	});
};



module.exports = ShowRSS;