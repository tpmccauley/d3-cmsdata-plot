// <thomas.mccauley@cern.ch>

var m = {top: 50, right:50, bottom:50, left:100},
    w = 1000 - m.left - m.right,
	h = 500 - m.top - m.bottom,
	x = d3.scale.linear().range([0, w]),
	//x = d3.scale.ordinal().rangeRoundBands([0,w]), ordinal scale doesn't allow me to have control of the ticks
	y = d3.scale.linear().range([h, 0]),
	xaxis = d3.svg.axis().scale(x).orient("bottom").tickSize(6).ticks(10).tickSubdivide(true),
	yaxis = d3.svg.axis().scale(y).orient("left").tickSize(6).ticks(10).tickSubdivide(true),
    current_dataset, raw_data, filtered_data, 
    svg;

var histogram = d3.layout.histogram();

var datasets = { Zee:"http://localhost:8000/data/Zee.json", 
				 Zmumu:"http://localhost:8000/data/Zmumu.json",
				 Wenu:"http://localhost:8000/data/Wenu.json",
				 Wmunu:"http://localhost:8000/data/Wmunu.json" };

function init() {
	svg = d3.select("#main-plot").append("svg")
		.attr("width", w + m.left + m.right)
		.attr("height", h + m.top + m.bottom)
		.append("g")
		.attr("transform", "translate("+m.left+","+m.top+")");

	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0,"+h+")")
	    .call(xaxis);
		
	svg.append("g")
	    .attr("class", "y axis")
	    .call(yaxis);

	$("#range").val("");
}

function rect_mouseover() {
    var r = d3.select(this);
}

function rect_mouseout() {
    var r = d3.select(this);
}


function redrawHistogram(data, key) {		
    var nbins = 100;
	
	histogram.value(function(d) {return +d[key];});
	histogram.bins(nbins);
	data = histogram(data);
	
	x.domain([d3.min(data.map(function(d) {return d.x;})), d3.max(data.map(function(d) {return d.x;}))]);
	y.domain([0,d3.max(data.map(function(d) {return d.y;}))]);

	var bin_width = w/nbins;

	var t = svg.transition().duration(100);
        t.select("g.x.axis").call(xaxis);
        t.select("g.y.axis").call(yaxis);

	var rects = svg.selectAll("rect").data(data);
	
	rects.enter().insert("rect")
		.attr("width", bin_width)
		.attr("x", function(d,i) {return bin_width*i;})
		.attr("y", function(d) {return y(d.y);})
		.attr("height", function(d) {return h-y(d.y);})
	    .text("on rectangle");

	rects.transition()
		.duration(1000)
		.attr("width", bin_width)
		.attr("x", function(d,i) {return bin_width*i;})
		.attr("y", function(d) {return y(d.y);})
		.attr("height", function(d) {return h-y(d.y);});

	rects.exit().remove();


	function brushstart() {
	    svg.classed("selecting", true);
	}

	function brushmove() {
	    var s = d3.event.target.extent();
	    rects.classed("selected", function(d) { return s[0] <= d && d <= s[1]; });
	}

	function brushend() {
	    svg.classed("selecting", !d3.event.target.empty());
	} 
	
	
	svg.append("g")
	    .attr("class", "brush")
	    .call(d3.svg.brush().x(x).y(y)
		  .on("brushstart", brushstart)
		  .on("brush", brushmove)
		  .on("brushend", brushend))
	    .selectAll("rect")
	    .attr("height", h);

	rects.on("mouseover", rect_mouseover);
	rects.on("mouseout", rect_mouseout);
}

init();

function getDataset() {
    var v = $('#dataset').val();
    console.log("dataset = "+v);
    return v;
}

function getValue() {
    var v = $('#value').val();
    console.log("value = "+v);
    return v;
}

function getSelection() {
    var v = $('#selection').val();
    console.log("selection = "+v);
    return v;
}

function updateDataset() {
	var dataset = getDataset();
	
	if ( dataset != current_dataset ) {
		d3.json(datasets[dataset], function(data) {
			current_dataset = dataset;
			raw_data = data;
			populateValues(data);
			populateSelections(data);
		});
	}
}

function populateValues(data) {
	$('#value').empty();

	for (var key in data[0]) {	
		$('#value').append($('<option/>', {value:key,text:key}));
	}
}

function populateSelections(data) {
    $('#selection').empty();
    
    for (var key in data[0]) {
	$('#selection').append($('<option/>', {value:key,text:key}));
    }

}

function updateHistogram() {
	var value = getValue();	
	redrawHistogram(raw_data, value);
}

function applySelection() {
    var selection = getSelection();

    var smin = d3.min(raw_data.map(function(d) {return +d[selection];})),
	smax = d3.max(raw_data.map(function(d) {return +d[selection];}));

    console.log("smin = "+smin+"  smax = "+smax);
    $("#range").val(smin + " - " + smax);

    $( "#slider-range" ).slider({
	        range: true,
		min: smin,
		max: smax,
		values: [ smin, smax ],

		create: function(event,ui) {
		$("#range").val(smin + " - " + smax);
	    },

		slide: function( event, ui ) {
		$("#range").val(ui.values[ 0 ] + " - " + ui.values[ 1 ]);
	    },

		stop: function(event, ui) {
		filtered_data = raw_data.filter(function(d) {return (d[selection] < ui.values[1] && d[selection] > ui.values[0]);});
		redrawHistogram(filtered_data, getValue());
	    }
	}); 
}

// Add event listeners to selections
document.getElementById("dataset").addEventListener("change", updateDataset, false);
document.getElementById("value").addEventListener("change", updateHistogram, false);
document.getElementById("selection").addEventListener("change", applySelection, false);

