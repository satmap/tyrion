# Tyrion
Tyrion is a routing engine in pure JavaScript that runs a graph search to find the optimal path between two nodes. Tyrion can parse either SVG data or OSM XML into a grid to be searched. It also comes prebuilt with some heurstic models to help imporve location based graph searching.

By default Tyrion only returns path data for the route.

```js
var route = new Tyrion();
route.data('./gb.svg');

route.begin(51.344365,0.733463]);
route.end([53.909293,-1.596543]);

var results = route.calculate();

console.log(results.geoJson()); 
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

// We can fetch more than on result by asking calculate
var results = route.calculate(4);

// Get path data for our results.
console.log(results.best().geoJson()); 
console.log(results.nth(3).geoJson()); 

```
