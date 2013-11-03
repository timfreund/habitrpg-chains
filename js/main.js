var actions = null;
var days = ['su', 'm', 't', 'w', 'th', 'f', 's'];
var habitData = null;
var key = function(d) { return d.key; };
var now = new Date();

var height = $(window).height() - 225;
var width = $(window).width();
var xScale = null;
var yScale = null;


function calculateDatumHeight(diagramHeight, dailys){
    var datumCount = 0;
    for(var i = 0; i < dailys.length; i++){
        if(datumCount < dailys[i].history.length){
            datumCount = dailys[i].history.length;
        }
    }
    console.log("datumHeight " + (diagramHeight / datumCount));
    return (diagramHeight / datumCount) - 3;
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
        success: function(incoming) { console.log(incoming); habitData = incoming; renderHabitData(); },
        error: fetchHabitDataHandleError,
        beforeSend: setHeader
    });
}

function fetchHabitDataHandleError(){
    alert("boo");
}

function renderHabitData(){
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
            datum.text = daily.text;
            datum.day = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
            datum.key = datum.text + datum.day.toUTCString();
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

    xScale = d3.scale.ordinal().domain(titles).rangeBands([0, width], 0.05);
    yScale = d3.scale.linear().domain([d3.min(actions, function(d){ return d.day;}), 
                                       d3.max(actions, function(d){ return d.day;})]).range([height, 0]);
    
    var svg = d3.select("body")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    var dots = svg.selectAll("rect")
      .data(actions, key)
      .enter()
      .append("rect")
      .attr({'width': xScale.rangeBand(),
             'height': calculateDatumHeight(height, habitData.dailys),
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
