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
    fullscreenControlOptions: {// optional
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
var rt = cw(function (data, cb) {
    //console.log(data);
    var self = this;
    var request, _resp;
    importScripts("js/rtree.js");
    if (!self.rt) {
        self.rt = RTree();
        request = new XMLHttpRequest();
        request.open("GET", data);
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                _resp = JSON.parse(request.responseText);
                self.rt.geoJSON(_resp);
                cb(true);
            }
        };
        request.send();
    } else {
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
        var bounds = layer.getBounds();
        rt.data([[bounds.getSouthWest().lng, bounds.getSouthWest().lat], [bounds.getNorthEast().lng, bounds.getNorthEast().lat]]).
                then(function (d) {
                    var result = d.map(function (a) {
                        return a.properties;
                    });
                    console.log(result);
                    // Trip Info: avspeed, distance, duration, endtime, maxspeed, minspeed, starttime, streetnames, taxiid, tripid

                    DrawRS(result);
                    ScatterPlot(result);
                    wordFreq(result);
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
    for (var j = 0; j < trips.length; j++) {  // Check Number of Segments and go through all segments
        var TPT = new Array();
        TPT = TArr[trips[j].tripid].split(',');  		 // Find each segment in TArr Dictionary. 
        var polyline = new L.Polyline([]).addTo(drawnItems);
        polyline.setStyle({
            color: 'red', // polyline color
            weight: 1, // polyline weight
            opacity: 0.5, // polyline opacity
            smoothFactor: 1.0
        });
        for (var y = 0; y < TPT.length - 1; y = y + 2) {    // Parse latlng for each segment
            polyline.addLatLng([parseFloat(TPT[y + 1]), parseFloat(TPT[y])]);
        }
    }
}

function ScatterPlot(result)
{
    document.getElementById("chartContainer").innerHTML = "";
    var d = [];
    var x_array = [];
    var y_array = [];
    
    var object_array = []
    for (var i = 0; i < result.length; i++) {
        //var x ="x:"+ String(result[i].avspeed);
        //var x ="x:"+ result[i].avspeed;
        //var y ="y:"+ String(result[i].maxspeed);
        //var y ="y:"+ result[i].maxspeed;
        var x = result[i].avspeed;
        var y = result[i].maxspeed;
        x_array.push(["x:" + x]);
        y_array.push(["y:" + y]);
        var obj_ = {x, y};
        obj_.x = parseInt(result[i].avspeed, 10);
        obj_.y = parseInt(result[i].maxspeed, 10);
        object_array.push(obj_);
        //x_array.push([x]);
        //y_array.push([y]);
        //d.push(["x:", x], ["y:", y]);
        //console.log(d[i]);
        //console.log(x, ",", y);
    }


    var x_y_array = [];

    for (let i = 0; i < x_array.length; i++) {
        x_y_array.push("{" + x_array[i] + ', ' + y_array[i] + "}");
    }
    
    var topten=[];
    for (let i = 0; i < 10; i++) {
        topten[i] = object_array[i]
    }
    console.log(x_y_array);
    console.log(object_array);

    var jsonString = JSON.stringify(x_y_array);
    //console.log(jsonString);

    var data1 = [
        {"x": 0.123, "y": 0.046},
        {"x": 0.032, "y": -0.0345},
        {"x": -0.044, "y": -0.0505},
        {"x": 0.05, "y": 0.076},
        {"x": 0.04, "y": 0.036},
        {"x": -.034, "y": 0.029},
        {"x": -.023, "y": 0.087},
        {"x": 0.034, "y": 0.067},
        {"x": 0.024, "y": 0.048},
        {"x": 0.087, "y": -0.09},
    ];

    //data1 = d;
    //data1 = object_array;
    
    data1=topten;
    
    console.log(data1);
    var svg = dimple.newSvg("#chartContainer", 300, 300);

    var myChart = new dimple.chart(svg);
    myChart.setBounds(90, 35, 240, 200)
    xAxis = myChart.addCategoryAxis("x", "x");
    yAxis = myChart.addCategoryAxis("y", "y");
    xAxis.showGridlines = true;
    xAxis.tickFormat = ''//'%'
    yAxis.tickFormat = ''//'%'
    yAxis.ticks = 5
    xAxis.ticks = 5
    s1 = myChart.addSeries("Speed", dimple.plot.bubble, [xAxis, yAxis]);
    s1.data = data1
    myChart.addLegend(90, 240, 145, 20, "left");
    myChart.draw();
}

function wordFreq(string) {
    document.getElementById("word-cloud").innerHTML = "";
    var streetnames = []
    for (var i = 0; i < string.length; i++) {
        //alert(string[i].streetnames.length);
        for (var j = 0; j < string[i].streetnames.length; j++)
        {
            streetnames.push(string[i].streetnames[j])
        }
    }
    //console.log(streetnames);
    var streetname = streetnames.join();
    //console.log(streetnames.join())
//    for (var x = 0; x < streetnames.length; x++)
//    {
//        
//        //console.log(freqMap);
//    }
    streetname = streetname.replace(/[0-9]/g, "")
    var words = streetname.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, " ").split(/\s/); //replace , . - # etc to blank space
//    var freqMap = {};
//    words.forEach(function (w) {
//        if (!freqMap[w]) {
//            freqMap[w] = 0;
//        }
//        freqMap[w] += 1;
//    });
//    console.log(freqMap);
//console.log(words);

    var freq = words.reduce(function (p, c) {
        p[c] = (p[c] || 0) + 1;
        return p;
    }, {});
    //console.log(freq);

    var array = Object.keys(freq).map(function (key) {
        return {word: key, freq: freq[key]};
    });
    //console.log(array);

    var topten = []

    for (i = 0; i < 10; i++)
    {
        topten[i] = words[i];
    }
    //console.log(topten)
    /********************/

    /*  ======================= SETUP ======================= */
    var config = {
        trace: true,
        spiralResolution: 1, //Lower = better resolution
        spiralLimit: 360 * 5, //360*5
        lineHeight: 0.8, //0.8
        xWordPadding: 0,
        yWordPadding: 3,
        font: "sans-serif"
    }

//    var words = ["words", "are", "cool", "and", "so", "are", "you", "inconstituent", "funhouse!", "apart", "from", "Steve", "fish"].map(function (word) {
//        return {
//            word: word,
//            freq: Math.floor(Math.random() * 50) + 10
//        }
//    })

    var words = topten.map(function (word) {
        return {
            word: word,
            freq: Math.floor(Math.random() * 50) + 10
        }
    })
    //words = array;
    //words = topten;
    //console.log(words)
    //alert(words);
    words.sort(function (a, b) {
        return -1 * (a.freq - b.freq);
    });

    var cloud = document.getElementById("word-cloud");
    cloud.style.position = "relative";
    cloud.style.fontFamily = config.font;

    var traceCanvas = document.createElement("canvas");
    traceCanvas.width = cloud.offsetWidth;
    traceCanvas.height = cloud.offsetHeight;
    var traceCanvasCtx = traceCanvas.getContext("2d");
    cloud.appendChild(traceCanvas);

    var startPoint = {
        x: cloud.offsetWidth / 2,
        y: cloud.offsetHeight / 2
    };

    var wordsDown = [];
    /* ======================= END SETUP ======================= */





    /* =======================  PLACEMENT FUNCTIONS =======================  */
    function createWordObject(word, freq) {
        var wordContainer = document.createElement("div");
        wordContainer.style.position = "absolute";
        wordContainer.style.fontSize = freq + "px";
        wordContainer.style.lineHeight = config.lineHeight;
        /*    wordContainer.style.transform = "translateX(-50%) translateY(-50%)";*/
        wordContainer.appendChild(document.createTextNode(word));

        return wordContainer;
    }

    function placeWord(word, x, y) {

        cloud.appendChild(word);
        word.style.left = x - word.offsetWidth / 2 + "px";
        word.style.top = y - word.offsetHeight / 2 + "px";

        wordsDown.push(word.getBoundingClientRect());
    }

    function trace(x, y) {
//     traceCanvasCtx.lineTo(x, y);
//     traceCanvasCtx.stroke();
        traceCanvasCtx.fillRect(x, y, 1, 1);
    }

    function spiral(i, callback) {
        angle = config.spiralResolution * i;
        x = (1 + angle) * Math.cos(angle);
        y = (1 + angle) * Math.sin(angle);
        return callback ? callback() : null;
    }

    function intersect(word, x, y) {
        cloud.appendChild(word);

        word.style.left = x - word.offsetWidth / 2 + "px";
        word.style.top = y - word.offsetHeight / 2 + "px";

        var currentWord = word.getBoundingClientRect();

        cloud.removeChild(word);

        for (var i = 0; i < wordsDown.length; i += 1) {
            var comparisonWord = wordsDown[i];

            if (!(currentWord.right + config.xWordPadding < comparisonWord.left - config.xWordPadding ||
                    currentWord.left - config.xWordPadding > comparisonWord.right + config.wXordPadding ||
                    currentWord.bottom + config.yWordPadding < comparisonWord.top - config.yWordPadding ||
                    currentWord.top - config.yWordPadding > comparisonWord.bottom + config.yWordPadding)) {

                return true;
            }
        }

        return false;
    }
    /* =======================  END PLACEMENT FUNCTIONS =======================  */





    /* =======================  LETS GO! =======================  */
    (function placeWords() {
        for (var i = 0; i < words.length; i += 1) {

            var word = createWordObject(words[i].word, words[i].freq);

            for (var j = 0; j < config.spiralLimit; j++) {
                //If the spiral function returns true, we've placed the word down and can break from the j loop
                if (spiral(j, function () {
                    if (!intersect(word, startPoint.x + x, startPoint.y + y)) {
                        placeWord(word, startPoint.x + x, startPoint.y + y);
                        return true;
                    }
                })) {
                    break;
                }
            }
        }
    })();
    /* ======================= WHEW. THAT WAS FUN. We should do that again sometime ... ======================= */



    /* =======================  Draw the placement spiral if trace lines is on ======================= */
    (function traceSpiral() {

        traceCanvasCtx.beginPath();

        if (config.trace) {
            var frame = 1;

            function animate() {
                spiral(frame, function () {
                    trace(startPoint.x + x, startPoint.y + y);
                });

                frame += 1;

                if (frame < config.spiralLimit) {
                    window.requestAnimationFrame(animate);
                }
            }

            //animate();
        }
    })();





    /********************/





    //return freqMap;
}