var Tyrion = function(){
	
	// Seed all our options
	this.options = {};
	this.options.isWalking = 1;
	this.options.isCycling = 0;
	this.options.isDriving = 0;
	
	this.options.isDaytime = 1;
	this.options.isOffroad = 0;
	
	this.options.avoidTolls = 0;
	this.options.avoidMotorways = 0;
	
	// We currently dont have narrow data. Always ignore avoids
	this.options.avoidNarrow = 0;	
	this.options.avoidWater = 0;
	this.options.avoidTrees = 0;
	this.options.avoidRocks = 0;
	this.options.avoidMarsh = 0;
	
	// OS path data will assume a path based on features, we can ask to avoid these.
	this.options.avoidInferred = 0;
	
	// An empty array incase we need to avoid lat/lon
	this.options.avoidLocations = [];
	
	// avoidFloor and wallBase settings
	this.options.wallBase = 1;
	this.options.avoidFloor = 0;
	this.avoidFloor = function(value){
		if(value > 0){
			this.options.avoidFloor = value;
			// double our floor, and the * it by two...add 1 in value is 1. 
			this.options.wallBase = (((value+value)*2)+1);
			this.trigger('change');
		}
	}
	
	// We can set an elevation profile.
	this.options.ourDifficulty = 0;
	this.difficulty = function(value){
		if(value >= 0){ 
			this.options.ourDifficulty = value;
			this.trigger('change');
		}
	}
	
	// All of our data variables
	this.options.data = {};
	this.options.data.file = 0;
	this.options.data.format = 0;
	
	// Because we're  ashort distance most of the time, reduce the data to a radius around us.
	this.options.data.radius = 25;
	this.options.data.haversineBuffer = 5;
	
	this.radius = function(radius){
		if(radius == 'auto'){
			// make this haversine
			if(this.route.begin.length > 0 && this.route.end.length > 0){
				this.options.data.radius = this.haversine();
			}
		} else if(radius > 0){
			this.options.radius = radius;
			this.trigger('change');
		}
	}
	
	// This is a great circle straight line calculation for begin to end in KM
	this.haversine = function(){
	
		var radius = 6371;
		var lat1 = this.route.begin[0];
		var lon1 = this.route.begin[1];
		var lat2 = this.route.end[0];
		var lon2 = this.route.end[1];
		
		var dla = (lat2-lat1) * Math.PI / 180;
		var dlo = (lon2-lon1) * Math.PI / 180;
		var lat1 = lat1 * Math.PI / 180;
		var lat2 = lat2 * Math.PI / 180;

		var a = Math.sin(dla/2) * Math.sin(dla/2) + Math.sin(dlo/2) * Math.sin(dlo/2) * Math.cos(lat1) * Math.cos(lat2); 
		var b = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var c = radius * b;
		return c > 0 ? c + this.options.data.haversineBuffer : this.options.data.radius;	
	}
	
	// Start and empty parser
	this.parser = {};
	
	// Our 'data functions'
	this.data = function(data){
		// make sure its a file
		var parts = data.split('.');
		var ext = parts.pop();
		if(ext == 'svg'){
			this.options.data.file = data;
			this.options.data.format = 'svg';
			this.parser = new SVGParse(this);
		} else if(ext == 'osm'){
			this.options.data.file = data;
			this.options.data.format = 'osm';
			this.parser = new OSMParse(this);
		} else if(ext == 'os'){
			this.options.data.file = data;
			this.options.data.format = 'os';
			this.parser = new OSParse(this);
		} else {
			throw new Error('the provided file format is not supported');
		}
	}
	
	// Add eventing functions
	this.events = ['complete','progress','fail','change','impossible'];
	this._events = [];
	this.on = function(event, callback){
		if(this.events.indexOf(event) >= 0){
			if(typeof this._events[event] == 'undefined'){
				this._events[event] = callback;
			} else if(typeof this._events[event] == 'object'){
				this._events[event].push(callback);
			} else if(typeof this._events[event] == 'function'){
				var current = this._events[event];
				this._events[event] = [];
				this._events[event].push(current);
				this._events[event].push(callback);
			} else { throw new Error("Event "+event+" was not found"); }
		}
	}
	
	this.trigger = function(event,args){
		if(!args){ args = 'null'; }
		if(this.events.indexOf(event) >= 0){
			if(typeof this._events[event] == 'function'){
				this._events[event](args);
			} else if(typeof this._events[event] == 'object' && this._events[event] instanceof Array){
				for(callback in this._events[event]){
					if(typeof this._events[event][callback] == 'function'){
						this._events[event][callback](args);
					}
				}
			} else { }
		}
	}
	
	// a function to set our is options
	this.is = function(value){
		value = value.toProperCase();
		if(this.options['is'+value] !== 'undefined'){
			if(!this.options['is'+value]){
				this.options['is'+value] = 1;
				this.trigger('change');
			}
		}
	}
	// to reverse an is.
	this.isnt = function(value){
		value = value.toProperCase();
		if(this.options['is'+value] !== 'undefined'){
			if(this.options['is'+value]){
				this.options['is'+value] = 0;
				this.trigger('change');
			}
		}
	}
	
	// Add our avoid functions
	this.avoid = function(value){
		if(typeof value == 'object' && value.length == 2){
			this.options.avoidLocations.push(value);
		} else {
			value = value.toProperCase();
			if(this.options['avoid'+value] !== 'undefined'){
				if(!this.options['avoid'+value]){
					this.options['avoid'+value] = 1;
					this.trigger('change');
				}
			}
		}
	}
	
	// The reverse of avoid
	this.allow = function(value){
		value = value.toProperCase();
		if(this.options['avoid'+value] !== 'undefined'){
			if(this.options['avoid'+value]){
				this.options['avoid'+value] = 0;
				this.trigger('change');
			}
		}
	}
	
	// Set a route holder and our route functions
	this.route = {};
	this.route.begin = [];
	this.route.via = [];
	this.route.end = [];
	
	this.begin = function(loc){
		if(typeof loc == 'object' && loc.length == 2){
			this.route.begin = loc;
		}
	}
	this.via = function(loc){
		if(typeof loc == 'object' && loc.length == 2){
			this.route.via.push(loc);
		}
	}
	this.end = function(loc){
		if(typeof loc == 'object' && loc.length == 2){
			this.route.end = loc;
		}
	}
	
	
	// Actually calculate the route.
	//
	// This function will be CRAZY, memory leaks will be a big part of our life. Our goal will be to get the data set
	// Read: http://www.ibm.com/developerworks/web/library/wa-memleak/
	//
	// Load data to graph - with all conditions.
	// Astar the graph
	// Change our results to TyrionResult sets.
	// If we're empty run ``incomplete``
	// If we have routes trigger our ``complete`` and pass our results.
	this.calculate = function(){
		var res = new TyrionResult();
		this.trigger('complete',res);
	}
}

var TyrionResults = function(res){

}

var TyrionResult = function(res){
	this._res = [];
	this.best = function(){ return this; }
	this.nth = function(n){ return this; }
	
	this.gpx = function(){}
	this.geoJson = function(){ return "my cool geojson"; }
}

// These will parse a data set into a weighted graph, then astar will search.
// Avoids: will set walls in their location, so on pase lat and lng, feature ranges will be set to 0 in their position in the graph
var OSMParse = function(){}
var SVGParse = function(parent){ this.parent = parent; }
var OSParse = function(parent){ this.parent = parent; }

// javascript-astar
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Includes Binary Heap (with modifications) from Marijn Haverbeke. 
// http://eloquentjavascript.net/appendix2.html

// ToDo:- Rewrite these into full classes and expand heurstocs
function Graph(e){var t=[];for(var n=0;n<e.length;n++){t[n]=[];for(var r=0,i=e[n];r<i.length;r++){t[n][r]=new GraphNode(n,r,i[r])}}this.input=e;this.nodes=t}function GraphNode(e,t,n){this.data={};this.x=e;this.y=t;this.pos={x:e,y:t};this.type=n}function BinaryHeap(e){this.content=[];this.scoreFunction=e}var GraphNodeType={OPEN:1,WALL:0};Graph.prototype.toString=function(){var e="\n";var t=this.nodes;var n,r,i,s;for(var o=0,u=t.length;o<u;o++){n="";r=t[o];for(i=0,s=r.length;i<s;i++){n+=r[i].type+" "}e=e+n+"\n"}return e};GraphNode.prototype.toString=function(){return"["+this.x+" "+this.y+"]"};GraphNode.prototype.isWall=function(){return this.type==GraphNodeType.WALL};BinaryHeap.prototype={push:function(e){this.content.push(e);this.sinkDown(this.content.length-1)},pop:function(){var e=this.content[0];var t=this.content.pop();if(this.content.length>0){this.content[0]=t;this.bubbleUp(0)}return e},remove:function(e){var t=this.content.indexOf(e);var n=this.content.pop();if(t!==this.content.length-1){this.content[t]=n;if(this.scoreFunction(n)<this.scoreFunction(e)){this.sinkDown(t)}else{this.bubbleUp(t)}}},size:function(){return this.content.length},rescoreElement:function(e){this.sinkDown(this.content.indexOf(e))},sinkDown:function(e){var t=this.content[e];while(e>0){var n=(e+1>>1)-1,r=this.content[n];if(this.scoreFunction(t)<this.scoreFunction(r)){this.content[n]=t;this.content[e]=r;e=n}else{break}}},bubbleUp:function(e){var t=this.content.length,n=this.content[e],r=this.scoreFunction(n);while(true){var i=e+1<<1,s=i-1;var o=null;if(s<t){var u=this.content[s],a=this.scoreFunction(u);if(a<r)o=s}if(i<t){var f=this.content[i],l=this.scoreFunction(f);if(l<(o===null?r:a)){o=i}}if(o!==null){this.content[e]=this.content[o];this.content[o]=n;e=o}else{break}}}};var astar={init:function(e){for(var t=0,n=e.length;t<n;t++){for(var r=0,i=e[t].length;r<i;r++){var s=e[t][r];s.f=0;s.g=0;s.h=0;s.cost=s.type;s.visited=false;s.closed=false;s.parent=null}}},heap:function(){return new BinaryHeap(function(e){return e.f})},search:function(e,t,n,r,i){astar.init(e);i=i||astar.euclidean;r=!!r;var s=astar.heap();s.push(t);while(s.size()>0){var o=s.pop();if(o===n){var u=o;var a=[];while(u.parent){a.push(u);u=u.parent}return a.reverse()}o.closed=true;var f=astar.neighbors(e,o,r);for(var l=0,c=f.length;l<c;l++){var h=f[l];if(h.closed||h.isWall()){continue}var p=o.g+h.cost;var d=h.visited;if(!d||p<h.g){h.visited=true;h.parent=o;h.h=h.h||i(h.pos,n.pos);h.g=p;h.f=h.g+h.h;if(!d){s.push(h)}else{s.rescoreElement(h)}}}}return[]},manhattan:function(e,t){var n=Math.abs(t.x-e.x);var r=Math.abs(t.y-e.y);return n+r},euclidean:function(e,t){var n=Math.abs(t.x-e.x);var r=Math.abs(t.y-e.y);return Math.sqrt(n*n+r*r)},neighbors:function(e,t,n){var r=[];var i=t.x;var s=t.y;if(e[i-1]&&e[i-1][s]){r.push(e[i-1][s])}if(e[i+1]&&e[i+1][s]){r.push(e[i+1][s])}if(e[i]&&e[i][s-1]){r.push(e[i][s-1])}if(e[i]&&e[i][s+1]){r.push(e[i][s+1])}if(n){if(e[i-1]&&e[i-1][s-1]){r.push(e[i-1][s-1])}if(e[i+1]&&e[i+1][s-1]){r.push(e[i+1][s-1])}if(e[i-1]&&e[i-1][s+1]){r.push(e[i-1][s+1])}if(e[i+1]&&e[i+1][s+1]){r.push(e[i+1][s+1])}}return r}}

// String prototype
String.prototype.toProperCase=function(){return this.substr(0,1).toUpperCase()+this.substr(1,this.length)}

