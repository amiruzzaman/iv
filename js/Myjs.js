//Init Map
//*******************************************************************************************************************************************************
var lat = 41.141376;
var lng = -8.613999;
var zoom = 14;

// add an OpenStreetMap tile layer
var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ';


var grayscale = L.tileLayer(mbUrl, {
        id: 'mapbox.light',
        attribution: mbAttr
    }),
    streets = L.tileLayer(mbUrl, {
        id: 'mapbox.streets',
        attribution: mbAttr
    });


var map = L.map('map', {
    center: [lat, lng], // Porto
    zoom: zoom,
    layers: [streets],
    zoomControl: true,
    fullscreenControl: true,
    fullscreenControlOptions: { // optional
        title: "Show me the fullscreen !",
        titleCancel: "Exit fullscreen mode",
        position: 'bottomright'
    }
});

var baseLayers = {
    "Grayscale": grayscale, // Grayscale tile layer
    "Streets": streets, // Streets tile layer
};

layerControl = L.control.layers(baseLayers, null, {
    position: 'bottomleft'
}).addTo(map);

// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var featureGroup = L.featureGroup();

var drawControl = new L.Control.Draw({
    position: 'bottomright',
	collapsed: false,
    draw: {
        // Available Shapes in Draw box. To disable anyone of them just convert true to false
        polyline: false,
        polygon: false,
        circle: false,
        rectangle: true,
        marker: false,
    }

});
map.addControl(drawControl); // To add anything to map, add it to "drawControl"
//*******************************************************************************************************************************************************
//*****************************************************************************************************************************************
// Index Road Network by Using R-Tree
//*****************************************************************************************************************************************
var rt = cw(function(data,cb){
	//console.log(data);
	var self = this;
	var request,_resp;
	importScripts("js/rtree.js");
	if(!self.rt){
		self.rt=RTree();
		request = new XMLHttpRequest();
		request.open("GET", data);
		request.onreadystatechange = function() {
			if (request.readyState === 4 && request.status === 200) {
				_resp=JSON.parse(request.responseText);
				self.rt.geoJSON(_resp);
				cb(true);
			}
		};
		request.send();
	}else{
		return self.rt.bbox(data);
	}
});

rt.data(cw.makeUrl("js/trips.json"));
//*****************************************************************************************************************************************	
//*****************************************************************************************************************************************
// Drawing Shapes (polyline, polygon, circle, rectangle, marker) Event:
// Select from draw box and start drawing on map.
//*****************************************************************************************************************************************	

map.on('draw:created', function (e) {
	//alert('here');
	var type = e.layerType,
		layer = e.layer;
	
	if (type === 'rectangle') {
		console.log(layer.getLatLngs()); //Rectangle Corners points
		var bounds=layer.getBounds();
		rt.data([[bounds.getSouthWest().lng,bounds.getSouthWest().lat],[bounds.getNorthEast().lng,bounds.getNorthEast().lat]]).
		then(function(d){var result = d.map(function(a) {return a.properties;});
		console.log(result);
		// Trip Info: avspeed, distance, duration, endtime, maxspeed, minspeed, starttime, streetnames, taxiid, tripid
		
		DrawRS(result);
		ScatterPlot(result);
		});
	}
	
	drawnItems.addLayer(layer);			//Add your Selection to Map  
});
//*****************************************************************************************************************************************
// DrawRS Function:
// Input is a list of road segments ID and their color. Then the visualization can show the corresponding road segments with the color
// Test:      var input_data = [{road:53, color:"#f00"}, {road:248, color:"#0f0"}, {road:1281, color:"#00f"}];
//            DrawRS(input_data);
//*****************************************************************************************************************************************
function DrawRS(trips) {
	for (var j=0; j<trips.length; j++) {  // Check Number of Segments and go through all segments
		var TPT = new Array();			  
		TPT = TArr[trips[j].tripid].split(',');  		 // Find each segment in TArr Dictionary. 
		var polyline = new L.Polyline([]).addTo(drawnItems);
        polyline.setStyle({
            color: 'red',                      // polyline color
			weight: 1,                         // polyline weight
			opacity: 0.5,                      // polyline opacity
			smoothFactor: 1.0  
        });
		for(var y = 0; y < TPT.length-1; y=y+2){    // Parse latlng for each segment
			polyline.addLatLng([parseFloat(TPT[y+1]), parseFloat(TPT[y])]);
		}
	}		
}

function ScatterPlot(result)
{
	var d =[];
	var x_array = [];
	var y_array = [];
	for (var i = 0; i < result.length; i++) {
	//var x ="x:"+ String(result[i].avspeed);
	//var x ="x:"+ result[i].avspeed;
	//var y ="y:"+ String(result[i].maxspeed);
	//var y ="y:"+ result[i].maxspeed;
	var x =result[i].avspeed;
	var y =result[i].maxspeed;
	x_array.push(["x:" +x]);
	y_array.push(["y:" +y]);
	
	//x_array.push([x]);
	//y_array.push([y]);
		//d.push(["x:", x], ["y:", y]);
  //console.log(d[i]);
  //console.log(x, ",", y);
	}
	
	
  var x_y_array = [];

  for (let i = 0; i < x_array.length; i++) {
    x_y_array.push("{"+x_array[i] + ', ' + y_array[i]+"}");
  }
 console.log(x_y_array); 
 var jsonString = JSON.stringify(x_y_array);
console.log(jsonString);
	
	var data1 = [
      {"x":0.123,"y":0.046},
      {"x":0.032,"y":-0.0345},
      {"x":-0.044,"y":-0.0505},
      {"x":0.05,"y":0.076},
      {"x":0.04,"y":0.036},
      {"x":-.034,"y":0.029},
      {"x":-.023,"y":0.087},
      {"x":0.034,"y":0.067},
      {"x":0.024,"y":0.048},
      {"x":0.087,"y":-0.09},
    ]; 
	
	//data1 = d;
    var svg = dimple.newSvg("#chartContainer", 300,300);

      var myChart = new dimple.chart(svg);
      myChart.setBounds(90, 35, 240, 200)
      xAxis = myChart.addCategoryAxis("x", "x");
      yAxis = myChart.addCategoryAxis("y", "y");
      xAxis.showGridlines = true;
      xAxis.tickFormat = '%'
      yAxis.tickFormat = '%'
      yAxis.ticks = 5 
      xAxis.ticks = 5 
      s1 = myChart.addSeries("Price Tier", dimple.plot.bubble, [xAxis, yAxis]);
      s1.data = data1
      myChart.addLegend(90, 240, 145, 20, "left");
      myChart.draw();
}