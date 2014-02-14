# Tyrion
**This code is chnaging every day, it doesn't work yet. Only pull/clone/fork if you're one of our developers**

Tyrion is a routing engine in pure JavaScript that runs a graph search to find the optimal path between two nodes. Tyrion can parse either SVG data or OSM XML into a grid to be searched. It also comes prebuilt with some heuristic like models to help imporve location based graph searching.

```js
var route = new Tyrion();
route.data('./gb.svg');

route.begin(51.344365,0.733463]);
route.end([53.909293,-1.596543]);

route.on('complete',function(results){
	console.log(results.geoJson()); 
});

route.calculate();

```

a kitchen skin example,

```js
// start a new route and pass our vector data
var route = new Tyrion();
route.data('./gb.svg');

// We can pass some conditions to the calculation
route.is('walking');
route.is('offroad');

// We can also tell the route to avoid features
route.avoid('motorways');

// You can also pass a latitude and longitude to avoid
route.avoid([51.482906,-0.177665]);

// Enter our start point
route.begin(51.344365,0.733463]);

// If we need to we can add a via
route.via([53.143752,-1.194104]);

// Where we want to end up
route.end([53.909293,-1.596543]);

// Register a callback for completion
route.on('complete',function(results){
  // Get path data for our results.
  console.log(results.best().geoJson()); 
  console.log(results.nth(3).geoJson()); 
});

// Register a callback for fails
route.on('fail',function(results){
  console.log('No route could be round');
});


// Calculate our route
route.calculate();

```

# Parsing
When we build our search graph, we take in to account the route settings and skew the values at important locations in the grid, and example of this is, if we're a walking route we will favour routes that stay in our 'environment' over those heading towards a road, so in a walking grid `paths` are given a higher value than `roads` likewise if we ask to avoid marshes they will be set to 0 (or see avoidFloor) in the grid.

# API
A full api breakdown for Tyrion

## .data(file,{options})
This is the data file to be parsed, you can provide a SVG, OSM or OS data. The larger this dataset the longer the ``calculate()`` will take. options allows for you to set a ``range`` with in the data and a ``projection`` for the data. 

## .is()
allows you to set conditions for the route, currently supported are,

```js
route.is('walking'); // Calculate walking routes
route.is('cycling'); // Calculate cycling routes
route.is('driving'); // Calculate driving routes

route.is('daytime'); // We might have diffrent routes at night

// All `is` settings can be unset using `isnt`
route.isnt('daytime'); // would tell the engine it's nightime
```

## .avoid()
our parser models can set walls in the graph for certain geographical features.

```js
route.avoid('motorways'); // won't route down motorways, if you set is to walking/cycling this will be set automatically.
route.avoid('tolls'); // again only used when in 'driving' mode

// We can pass a lat, lng to avoid also.
route.avoid([lat,lng]);

// OS map sets allow us to avoid types of terrain
route.avoid('rocks'); // rocky landscapes and cliffs
route.avoid('trees'); // forests
route.avoid('water'); // streams and rivers
route.avoid('marsh'); // marshland

// OS maps make at attempt to 'infer' unknown paths. We might not want this.
route.avoid('inferred');

// All `avoid` settings can be unset using `allow`
route.allow('water');
```

If you want to not fully avoid a terrain type but simply favour routes that do not pass through them you can set avoidFloor to a value higher than 0. avoidFloors act as a multiplier value for our base,``base = (((floor+floor)*2)+1)`` so routes avoiding them are heavily favoured but in general you are likely to get less 'impossible' routes. 

```js
route.avoidFloor(1);
```

at a later date we will provide independent avoidFloor values for each terrain type.

Setting your avoidFloor to 0 is DRAMATICALLY increase search time as almost all routes will be seen by the script as viable. 

## .difficulty(value)
OS tracks and trails come with a 'difficulty' based on the types of terrain they pass through and their elevation. You can use our engine to generat routes with given difficulty levels, the higher this number the more difficult the route will be.

```js
route.difficulty(10); // very hard
```

## .on(event, callback)

```js
route.on('impossible',function(){
	console.log('No path could be found through this grid.');
});
```

events are, 

``complete`` for when a calculation has completed.

``fail`` for when a calculation fails.

``progress`` a periodical update from the graph search.

``impossible`` if a graph completes but no path is found, this event will trigger.

``change`` if any of the settings for this instance change this event if fired.