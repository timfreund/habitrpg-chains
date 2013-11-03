var actions = null;
var days = ['su', 'm', 't', 'w', 'th', 'f', 's'];
var earliestDate = new Date(1970, 0, 1);
var habitData = null;
var key = function(d) { return d.key; };
var now = new Date();

var height = $(window).height() - 300;
var width = $(window).width() - 50;
var xScale = d3.scale.ordinal();
var yScale = d3.scale.linear();


function calculateDatumHeight(diagramHeight, dailys){
    var datumCount = 0;
    for(var i = 0; i < dailys.length; i++){
        if(datumCount < dailys[i].history.length){
            datumCount = dailys[i].history.length;
        }
    }

    var dateConstrainedCount = Math.floor((now - earliestDate) / 1000 / (60*60*24))
    if(datumCount > dateConstrainedCount){
        datumCount = dateConstrainedCount;
    }
    return (diagramHeight / datumCount) - 2;
}

function fetchAndRender(){
    var userid = $('#userid')[0].value;
    var apikey = $('#apikey')[0].value;
    

    fetchHabitData(userid, apikey);
}

function fetchHabitData(userid, apikey){
    function setHeader(xhr){
        xhr.setRequestHeader('x-api-user', userid);
        xhr.setRequestHeader('x-api-key', apikey);
    }

    var url = 'https://habitrpg.com/api/v1/user';
    if (userid == 'demo' && apikey == 'demo'){
        url = 'habitdata.json';
    }

    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(incoming) { habitData = incoming; transformData(); },
        error: fetchHabitDataHandleError,
        beforeSend: setHeader
    });
}

function fetchHabitDataHandleError(){
    alert("boo");
}

function transformData(){
    actions = [];
    var titles = [];
    for(var i = 0; i < habitData.dailys.length; i++){
        var daily = habitData.dailys[i];
        titles.push(daily.text);
        var lastValue = 0;
        for(var j = 0; j < daily.history.length; j++){
            var datum = daily.history[j];
            // the data as recorded is actually from the day prior
            var timestamp = new Date(datum.date - (86400*1000));
            if (timestamp > earliestDate){
                datum.text = daily.text;
                datum.day = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
                datum.key = datum.text + " " + datum.day.toDateString();
                if(lastValue < datum.value){
                    datum.state = 1;
                } else {
                    if(daily.repeat[days[datum.day.getDay()]]){
                        datum.state = -1;
                    } else {
                        datum.state = 0;
                    }
                }
                lastValue = datum.value;
                actions.push(datum);
            }
        }
    }

    xScale.domain(titles).rangeBands([0, width], 0.05);
    yScale.domain([d3.min(actions, function(d){ return d.day;}), 
                   d3.max(actions, function(d){ return d.day;})]).range([height, 0]);
    
    renderHabitData();
}

function renderHabitData(){
    var svg = d3.select("svg");
    if(svg[0][0] == null){
        svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    var datumHeight = calculateDatumHeight(height, habitData.dailys);

    var dots = svg.selectAll("rect")
      .data(actions, key);

    dots.exit()
        .attr({'height': 0,
               'width': 0})
        .remove();

    dots.transition()
        .duration(500)
        .attr({
            'height': datumHeight,
            'y': function(d){ return yScale(d.day)},
        });

    dots.enter()
      .append("rect")
      .on("mouseover", function(d) {
          var xPos = parseFloat(d3.select(this).attr("x")) + xScale.rangeBand() / 2;
          var yPos = parseFloat(d3.select(this).attr("y")) + 14;
          svg.append("text")
              .attr({"id": "tooltip",
                     "x": xPos,
                     "y": yPos,
                     "text-anchor": "middle",
                     "font-family": "sans-serif",
                     "font-size": "18px",
                     "font-weight": "bold",
                     "stroke": "white",
                     "stroke-width": .5,
                     "fill": "black"})
              .text(d.key);
      })
      .on("mouseout", function(d){ d3.select("#tooltip").remove();})
      .attr({'width': xScale.rangeBand(),
             'height': datumHeight,
             'fill': function(d){ 
                 if(d.state == 1){ 
                     return "rgb(25, 128, 25)"; 
                 } else if (d.state == -1){
                     return "rgb(128, 25, 25)";
                 } else if (d.state == 0){
                     return "rgb(225, 225, 225)";
                 }
             },
             'stroke-width': 0,
             'x': function(d){ return xScale(d.text); },
             'y': function(d){ return yScale(d.day);},
            });
}

function updateDomain(){
    var ed = $("#earliestdate")[0].valueAsDate;
    if(ed != null){
        earliestDate = ed;
    } else {
        earliestDate = new Date(1970, 0, 1);
    }

    transformData();
}
