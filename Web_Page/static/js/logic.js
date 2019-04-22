

var map, layers, bboxpoly, bbox1, bbox2; //universals 
var centergeo=[];
var centerpath = "../static/data/scicenter.json";
var countypath = "../static/data/data.json";

function swaplatlon(inputlist){
  var outputlist=[];
  //console.log("pre", inputlist);

  inputlist.forEach(function(setofcoords) {
    var x = setofcoords[1]
    var y = setofcoords[0]
    console.log(setofcoords[0],setofcoords[1],x,y)
    outputlist.push([x,y])
  });

  //console.log("post", outputlist);
  return outputlist;
};

//initialize basemap
var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.light",
  accessToken: API_KEY
});

layers = {
  centers: new L.LayerGroup(),
 // counties: new L.LayerGroup(),
  voronoipolys: new L.LayerGroup(),
  popcolors: new L.LayerGroup(),
 // composite: new L.LayerGroup(),
}

var map = L.map("map-id", {
    center: [39.8283, -98.5795],
    zoom: 4,
    layers: [
      layers.centers,
      //layers.counties,
      layers.popcolors,
      layers.voronoipolys,
      //layers.composite
    ]
});
  
var overlays = {
  "Science Centers": layers.centers,
  //"Counties": layers.counties,
  "Sci Center Distances": layers.voronoipolys,
  "Population Density": layers.popcolors,
  
  //"Composite Suitability": layers.composite
}

L.control.layers(null, overlays).addTo(map);
  
lightmap.addTo(map);


function rendercenters() {
  //bring in science center data
 // centerpath = "/data/scicenter.json";
    
  d3.json(centerpath, function(data) {

    //check input
  // console.log(data.features)

    for (var i = 0; i < data.features.length; i++) {
    
      //console.log(data.features[i]);

      var newMarker =L.marker([data.features[i].geometry.coordinates[0], data.features[i].geometry.coordinates[1]], {
          opacity: .7
      });

      newMarker.addTo(layers.centers);

      newMarker.bindPopup(data.features[i].properties.Name
        + "<br>Location: "
        + data.features[i].properties.City
        + ', '
        + data.features[i].properties.State
        + `<br>Website: <a href='${data.features[i].properties.Website}'>`
        + data.features[i].properties.Website
        + "</a><br>Lat: "
        + data.features[i].geometry.coordinates[0]
        + "<br>Long: " 
        + data.features[i].geometry.coordinates[1] 
      );

    }

    centergeo = data;

    console.log("end of centerpath", centergeo)

    rendervoronoi();
  });

};

function rendercounties(){
  //bring in county population data
  //countypath = "/data/data.json";
    
  d3.json(countypath, function(data) {

    //bbox1 = countryboundaries(data);
    //fill area and popden
    console.log(data)

    data.features.forEach(function(thisdata) {
    //for (var i = 0; i < data.features.length; i++) {
      //console.log(data.features[1])
        
      var areameters = turf.area(thisdata.geometry);
      
      thisdata.properties.Area = areameters * 0.00000038610215854245

      thisdata.properties.Pop_Den =thisdata.properties.Population / thisdata.properties.Area
    });

    //countryboundaries();

    // Create a new choropleth layer
    geojson = L.choropleth(data, {

      // Define what  property in the features to use
      valueProperty: "Pop_Den",

      // Set color scale
      scale: ["DarkRed","Red","Orange","Yellow","White"],
      //"#b10026"
      // Number of breaks in step range
      steps: 20,

      // q for quantile, e for equidistant, k for k-means
      mode: "q",
      style: {
        // Border color
        color: "#fff",
        weight: 1,
        fillOpacity: 0.6
      },
      
      // Binding a pop-up to each layer
      onEachFeature: function(feature, layer) {
        
        //console.log(feature)

        layer.bindPopup(feature.properties.County 
          + ", " 
          + feature.properties.State 
          + "<br>Population: " 
          + feature.properties.Population
          + "<br>Area: "
          + Math.round((feature.properties.Area*10))/10
          + " Mi²<br>Pop Density: "
          + Math.round(feature.properties.Pop_Den*10)/10
          + " People / Mi²");
          
      }
      
    }).addTo(layers.popcolors);

  

    // Set up the legend
    var legend = L.control({ position: "bottomright" });

    legend.onAdd = function() {
      var div = L.DomUtil.create("div", "info legend");
      var limits = geojson.options.limits;
      var colors = geojson.options.colors;
      var labels = [];

      // Add min & max
      var legendInfo = "<B>Population<br>Density</B>" +
        "<div class=\"labels\">" + "People per<br>Square Mile" 
         // "<div class=\"min\">" + limits[0] + "</div>" +
         // "<div class=\"max\">" + limits[limits.length - 1] + "</div>" +
        "</div>";

      div.innerHTML = legendInfo;

      limits.forEach(function(limit, index) {
        labels.push("<tr style=\"background-color: " + colors[index] + "\"><td>" + Math.round(limit*100)/100 +"</td></tr>");
      });

      div.innerHTML += "<table>" + labels.join("") + "</table>";
      return div;
    };

    // Adding legend to the map
    legend.addTo(map);

  });
};


function rendervoronoi() {
  console.log("rendervoi", centergeo, bbox2)

  //countypath = "/data/data.json"; 
  d3.json(countypath, function(data1) {
    
      //This works but is resource heavy
      /*
    console.log("feature length", data1.features.length);
    for (var i = 0; i < data1.features.length; ++i) {
      console.log(i)
      if (i == 0) {
        var unionTemp = data1.features[i];
      } else {
        unionTemp = turf.union(unionTemp, data1.features[i]);
        console.log("united!")
      }
    }
    var thisunion = L.geoJson(unionTemp);
    thisunion.addTo(layers.counties);
    */

   // console.log("d3.json")
    bbox1 = turf.bbox(data1);

    var options = {
      bbox: [bbox1[1],bbox1[0],bbox1[3],bbox1[2]]
    };
    
    tests = turf.voronoi(centergeo, options);

    var totalarea = 0;

    tests.features.forEach(function(data2){
      L.polygon(data2.geometry.coordinates[0]).addTo(layers.voronoipolys);
                 
      var vorarea = turf.area(data2.geometry);
         
      totalarea += vorarea;
      //console.log("numbers", vorarea, totalarea);
    });
    
    console.log("totals :", totalarea / tests.features.length)

    rendercounties();
  });

};

function init(){
  
  rendercenters();
  
};

var counter= 0;
var table = $("#markerbody")

var greenIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function addMarker(e){
 // Add marker to map at click location; add popup window
 var newMarker = new L.marker(e.latlng, {icon: greenIcon}).addTo(map);
 console.log(e.latlng)
/*
 var latitude = $("#markerbody").append(e.latlng.lat.toFixed(2))
 var longitude = $("#markerbody").append(e.latlng.lng.toFixed(2))
 */
 var row = table.append('<tr><td>' + counter +'</td><td>'+ e.latlng.lat.toFixed(4) + '</td><td>' + e.latlng.lng.toFixed(4) + '</td></tr>');
 counter ++

}

map.on("dblclick", addMarker);

init();
/*
d3.select("#exportButton").on("click", exportData);

function exportData() {
  var tableData = d3.select("#markerlist");
  console.log(tableData)

}

function exportTableToCSV(filename) {
    var csv = [];
    var rows = document.querySelectorAll("table tr");
    
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll("td, th");
        
        for (var j = 0; j < cols.length; j++) 
            row.push(cols[j].innerText);
        
        csv.push(row.join(","));        
    }

    // Download CSV file
    downloadCSV(csv.join("\n"), filename);
}*/
