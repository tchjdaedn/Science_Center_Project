// Create map centered on the United States
var mymap = L.map('mapid').setView([37.0902, -95.7129],4);

// Create tile layer with light map
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.light',
    accessToken: myKey
}).addTo(mymap);

// Create variable so that we can calculate the extremes of 'Significant Difference'
var mags = statesData.features.map(  function (i) { return i.properties['Significant Difference'] });

// Filter out empty values
mags = mags.filter(function (x) { return x != ''; });

// Sort list
mags = mags.sort((a, b) => a - b)

// Convert to integers
mags = mags.map(function(y) { return parseInt(y); });


// Create color function that returns color based on significant difference
function color (feature) {
    
    // If blank value return black because no data was available
    if (feature === '') {
        return 'black';
    } else {
        // Scale the colors to red for negatively significantly different white for no difference and blue for positively different
        var notNull = d3.scaleLinear()
          .domain([d3.min(mags),0, d3.max(mags)])
          .range(['red','white', 'blue'])
        return notNull(feature)
    }
}

// Create style variable that will make utilize color function
function style(feature) {
    return {
        fillColor: color(feature.properties['Significant Difference']),
        weight: 2,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

// Create function to highlight the state on hover
function highlightFeature(e) {

    // Create a layer for the target
    var layer = e.target;

    // Set style of layer
    layer.setStyle({
        weight: 5,
        color: 'gray',
        fillOpacity: 0.7
    });

    // For if opening in an odd browser
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    
    // Update info layer on highlight
    info.update(layer.feature.properties)
    }
}

// Create info layer
var info = L.control();

// Create info box in upper right corner of map by creating a new div
info.onAdd = function (mymap) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    // Display the information for the state that is being hovered on or tell user to hover over a state
    this._div.innerHTML = '<h4>State</h4>' + (props ?
        props.State + '<br>Significant Difference: ' + props['Significant Difference'] + 
        '<br>Score (0-300): ' + props['Score (0-300)'] + '<br>% With Basic Understanding: '
         + props['Above Basic (%)']  + '<br>% With Proficiency: ' + props['Above Proficient (%)']
        : 'Hover over a state')
};

// Add to the map
info.addTo(mymap);

// Reset the highlight on the mouse out
function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

// On click zoom into the state. Useful for getting to Rhode Island
function zoomToFeature(e) {
    mymap.fitBounds(e.target.getBounds());
}

// Things to do on each feature that is drawn
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// Create legend in bottom right of map
var legend = L.control({position: 'bottomright'});

// Add to map and do the following
legend.onAdd = function (mymap) {
    
    // Create div for legend
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [-13, -11, -9, -7, -5, -3, -1, 0, 1, 3, 5, 7, 9, 11, 13],
        labels = [];

    // loop through intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + color(grades[i]) + '"></i> ' +
            grades[i] + '<br>';
    }

    return div;
};

// Add legend to map
legend.addTo(mymap);

// Add geoJSON data to map with styling
var geojson = L.geoJson(statesData, {
                    style: style,
                    onEachFeature: onEachFeature}).addTo(mymap);