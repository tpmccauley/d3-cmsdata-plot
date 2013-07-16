// <thomas.mccauley@cern.ch>

var m = {top: 50, right:50, bottom:50, left:100},
    w = 1000 - m.left - m.right,
	h = 500 - m.top - m.bottom,
	x = d3.scale.linear().range([0, w]),
	//x = d3.scale.ordinal().rangeRoundBands([0,w]), ordinal sclae don't allow me to have control of the ticks
	y = d3.scale.linear().range([h, 0]),
	xaxis = d3.svg.axis().scale(x).orient("bottom").tickSize(6).ticks(10).tickSubdivide(true),
	yaxis = d3.svg.axis().scale(y).orient("left").tickSize(6).ticks(10).tickSubdivide(true),
	current_dataset, 
	svg;

var datasets = { Zee:"http://localhost:8000/data/Zee.json", 
				 Zmumu:"http://localhost:8000/data/Zmumu.json",
				 Wenu:"http://localhost:8000/data/Wenu.json",
				 Wmunu:"http://localhost:8000/data/Wmunu.json" };

function init() {
	svg = d3.select("#plot").append("svg")
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
}

function redrawScatterplot(data,xkey,ykey) {	
	var xmin = d3.min(data.map(function(d) {return +d[xkey];})),
		xmax = d3.max(data.map(function(d) {return +d[xkey];})),
		ymin = d3.min(data.map(function(d) {return +d[ykey];})),
		ymax = d3.max(data.map(function(d) {return +d[ykey];}));
		
	x.domain([xmin,xmax]);
	y.domain([ymin,ymax]);
	
	var t = svg.transition().duration(100);
    t.select("g.x.axis").call(xaxis);
    t.select("g.y.axis").call(yaxis);

	var dots = svg.selectAll("circle").data(data);
	
	dots.enter().insert("circle")
		.attr("cx", function(d) {return x(+d[xkey]);})
		.attr("cy", function(d) {return y(+d[ykey]);})
		.attr("r", 8.0);
		
	dots.transition()
		.duration(1000)
		.attr("cx", function(d) {return x(+d[xkey]);})
		.attr("cy", function(d) {return y(+d[ykey]);})
		.attr("r", 8.0);
	
	dots.exit().remove();
}

init();

function getDataset() {
	return $('#dataset').val();
}

function getX() {
	return $('#x').val();
}

function getY() {
	return $('#y').val();
}

function updateDataset() {
	var dataset = getDataset();
	
	console.log(dataset);
	
	if ( dataset != current_dataset ) {
		d3.json(datasets[dataset], function(data) {
			current_dataset = dataset;
			populateAxes(data);
		});
	}
}

function populateAxes(data) {
	$('#x').empty();
	$('#y').empty();
		
	for (var key in data[0]) {	
		$('#x').append($('<option/>', {value:key,text:key}));
		$('#y').append($('<option/>', {value:key,text:key}));
	}
}

function updateScatter() {
	var x = getX(),
		y = getY();
	
	d3.json(datasets[current_dataset], function(data) {
		redrawScatterplot(data,x,y);
	});
}

// Add event listeners to selections
document.getElementById("dataset").addEventListener("change", updateDataset, false);
document.getElementById("x").addEventListener("change", updateScatter, false);
document.getElementById("y").addEventListener("change", updateScatter, false);
