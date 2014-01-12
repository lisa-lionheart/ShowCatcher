var fs = require('fs');
var events = require('events');
var util = require('util');

function Persist(klass, feilds, children){


	util.inherits(klass, events.EventEmitter)
	
	klass.filename = Persist.dataDir + klass.name;

	klass.prototype.commit = function(){
		
		console.log(klass.name, 'commited');
		
		try
		{
			fs.writeFileSync(klass.filename, JSON.stringify(this.toJSON(),0,2));

			this.emit('updated');
		}catch(e){
			console.log('exception while saving');
		}
	};
	
	function deserializeValues(key, value){
		
		if(typeof value === 'string'){
				
			//Interprete dates serialized into strings
			if(value.length == 24 &&
		       /\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/.test(value)){
				   value = new Date(value);
		    }
		}
		
		return value;
	}

	klass.prototype.restore = function(obj){
		try
		{
			if(obj === undefined){
				obj = JSON.parse(fs.readFileSync(klass.filename),deserializeValues)
			}
		}catch(e){
			console.log('Error loading',klass.name);
		}
		
		if(!obj){
			obj = {}
		}
		
		for(var i in feilds){
			if(obj[feilds[i]]){
				this[feilds[i]] = obj[feilds[i]];
			}
		}
		
		if(children){
			for(var name in children){
				var data = obj[name];
				this[name] = new children[name](data);
				this[name].commit = this.commit.bind(this);
			}
		}
	};

	klass.prototype.toJSON = function(){
		var obj = {};
		for(var i in feilds) obj[feilds[i]] = this[feilds[i]];
		
		if(children){
			for(var name in children){
				obj[name] = this[name].toJSON();
			}
		}
		return obj;
	};
}

Persist.dataDir = './data/';

module.exports = Persist;
