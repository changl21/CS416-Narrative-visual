const dataPath = "data/";
const hours_and_gdp = "annual-working-hours-vs-gdp-per-capita.csv";
const hours_and_productivity = "productivity-vs-annual-hours-worked.csv"; 
const time_and_productivity = "labor-productivity-per-hour.csv";
const margin = {top: 0, right: 30, bottom: 50, left: 30};

const continents = ["Asia", "Europe", "North America", "South America", "Africa", "Antarctica", "Oceania"];
const continentColors = {
    "Asia": "#1f77b4",
    "Europe": "#ff7f0e",
    "North America": "#2ca02c",
    "South America": "#d62728",
    "Africa": "#9467bd",
    "Antarctica": "#8c564b",
    "Oceania": "#e377c2"
};
function getcountryfromdata(data) {
    var countryset = new Set();
    for (const element of data) {
        countryset.add(element.entity);
    }
    return Array.from(countryset);
}

function mapdotsizeofpop() {
    return d3.scaleLog()
             .domain([200000, 1310000000])
             .range([0.5, 20]); 
}

function addtool(svg, continents, width, color) {
    svg.selectAll("dots")
       .data(continents)
       .enter()
       .append("rect")
       .attr("x", width - 50)
       .attr("y", function(d, i) {
           return (20 + i * 25);
       })
       .attr("width", 14)
       .attr("height", 14)
       .style("fill", function(d) {
          return color(d);
       })
       .attr("class", function(d) { return "legend-rect " + d.replace(/\s+/g, ''); }); 
    
    svg.selectAll("labels")
       .data(continents)
       .enter()
       .append("text")
       .attr("x", width - 50 + 20) 
       .attr("y", function(d, i) {
           return (20 + i * 25 + 7);
       })
       .style("fill", function(d) {
           return color(d);
       })
       .text(function(d) {
           return d;
       })
       .attr("text-anchor", "start")
       .style("alignment-baseline", "middle")
       .style("font-size", "10px")
       .attr("class", function(d) { return "legend-text " + d.replace(/\s+/g, ''); }); 
}







//chart2
async function rendersecondchart(year) {
    const container = document.getElementById('scatterplot-1');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const width_scatterPlot = containerWidth - margin.left - margin.right;
    const height_scatterPlot = containerHeight - margin.top - margin.bottom;

    const data = await d3.csv(dataPath + hours_and_productivity);
    const filteredData = data.filter(function(d) {
        return (d.entity != "") && (d.year == year) && (d.continent != "") && (d.average_annual_hours_worked != "") && (d.productivity != "");
    }).map(function(d) {
        return {
            entity: d.entity,
            year: +d.year,
            continent: d.continent,
            average_annual_hours_worked: +d.average_annual_hours_worked,
            productivity: +d.productivity,
            total_population: +d.total_population
        };
    });

    d3.select("#scatterplot-1").selectAll("*").remove();

    let svg = d3.select("#scatterplot-1").append("svg")
                .attr("width", containerWidth)
                .attr("height", containerHeight)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("defs").append("marker")
       .attr("id", "arrow")
       .attr("markerWidth", 10)
       .attr("markerHeight", 10)
       .attr("refX", 0)
       .attr("refY", 3)
       .attr("orient", "auto")
       .append("path")
       .attr("d", "M0,0 L0,6 L9,3 z")
       .attr("fill", "black");

    const yScale = d3.scaleLinear()
                     .domain([0, d3.max(filteredData, d => d.productivity)])
                     .range([height_scatterPlot, 0]);

    const xScale = d3.scaleLinear()
                     .domain([d3.min(filteredData, d => d.average_annual_hours_worked), d3.max(filteredData, d => d.average_annual_hours_worked)])
                     .range([0, width_scatterPlot]);

    const yAxis = d3.axisLeft(yScale)
                    .tickSize(-width_scatterPlot)
                    .tickFormat(d => d3.format("~s")(d));

    const xAxis = d3.axisBottom(xScale)
                    .tickSize(-height_scatterPlot)
                    .tickFormat(d => d3.format("~s")(d));

    svg.append("g")
       .call(yAxis)
       .selectAll("line")
       .style("stroke", "#ccc")
       .style("stroke-opacity", 0.5);

    svg.append("g")
       .attr("transform", "translate(0," + height_scatterPlot + ")")
       .call(xAxis)
       .selectAll("line")
       .style("stroke", "#ccc")
       .style("stroke-opacity", 0.5);

    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 0 - margin.left)
       .attr("x", 0 - (height_scatterPlot / 2))
       .attr("dy", "1em")
       .style("text-anchor", "middle")
       .text("Productivity")
       .style("font-size", "9px");

    svg.append("text")
       .attr("x", width_scatterPlot / 2)
       .attr("y", height_scatterPlot + margin.bottom - 10)
       .style("text-anchor", "middle")
       .text("Annual Working Hours per Worker")
       .style("font-size", "9px");

    const circlesize = mapdotsizeofpop();
    const dotColors = d3.scaleOrdinal()
                        .domain(continents)
                        .range(continents.map(continent => continentColors[continent]));

    const tooltip = d3.select("#scatterplot-1").append("div")
                      .attr("class", "tooltip")
                      .style("z-index", "10")
                      .style("position", "absolute");

    const circles = svg.append('g')
                       .selectAll("circle")
                       .data(filteredData)
                       .enter()
                       .append("circle")
                       .attr("cx", function(d) { return xScale(d.average_annual_hours_worked); })
                       .attr("cy", function(d) { return yScale(d.productivity); })
                       .attr("r", function(d) { return circlesize(d.total_population); })
                       .attr("data-entity", function(d) { return d.entity; })
                       .style("fill", function(d) {
                           const color = d3.color(dotColors(d.continent));
                           color.opacity = 0.5;
                           return color;
                       })
                       .on("mouseover", function(event, d) {
                           tooltip.transition()
                                  .duration(200)
                                  .style("opacity", .9);
                           tooltip.html("Country: " + d.entity + "<br/>" +
                                        "Productivity: " + d.productivity + "<br/>" +
                                        "Annual Hours Worked: " + d.average_annual_hours_worked);

                           const [x, y] = d3.pointer(event, container);

                           let left = x + 10;
                           let top = y - 28;

                           if (left + tooltip.node().offsetWidth > containerWidth) {
                               left = x - tooltip.node().offsetWidth - 10;
                           }
                           if (top + tooltip.node().offsetHeight > containerHeight) {
                               top = y - tooltip.node().offsetHeight - 10;
                           }

                           tooltip.style("left", left + "px")
                                  .style("top", top + "px");

                           circles.style("opacity", 0.2);
                           d3.select(this).style("opacity", 1);

                           svg.selectAll(".legend-rect").style("opacity", 0.2);
                           svg.selectAll(".legend-text").style("opacity", 0.2);
                           svg.selectAll("." + d.continent.replace(/\s+/g, '')).style("opacity", 1);
                       })
                       .on("mouseout", function(event, d) {
                           tooltip.transition()
                                  .duration(500)
                                  .style("opacity", 0);

                           circles.style("opacity", 1);
                           svg.selectAll(".legend-rect").style("opacity", 1);
                           svg.selectAll(".legend-text").style("opacity", 1);
                       });

    svg.append('g')
       .selectAll("text")
       .data(filteredData)
       .enter()
       .append("text")
       .attr("x", function(d) { return xScale(d.average_annual_hours_worked); })
       .attr("y", function(d) { return yScale(d.productivity); })
       .attr("dy", -5)
       .attr("text-anchor", "middle")
       .style("fill", function(d) { return dotColors(d.continent); })
       .style("font-size", "8px")
       .text(function(d) { return d.entity; });

    addtool(svg, continents, width_scatterPlot, dotColors);

    const annotations = [
        { country: 'Ireland', dx: 50, dy: 50 },
        { country: 'Malaysia', dx: 50, dy: 50 },
        { country: 'Hong Kong', dx: 50, dy: 50 },
        { country: 'United States', dx: 50, dy: 50 }
    ];

    annotations.forEach(function(annotation) {
        const countryData = filteredData.find(d => d.entity === annotation.country);
        if (countryData) {
            svg.append("line")
               .attr("x1", xScale(countryData.average_annual_hours_worked))
               .attr("y1", yScale(countryData.productivity))
               .attr("x2", xScale(countryData.average_annual_hours_worked) + annotation.dx)
               .attr("y2", yScale(countryData.productivity) + annotation.dy)
               .attr("stroke", "black")
               .attr("stroke-opacity", 0.5)
               .attr("marker-end", "url(#arrow)");

            svg.append("text")
               .attr("x", xScale(countryData.average_annual_hours_worked) + annotation.dx + 5)
               .attr("y", yScale(countryData.productivity) + annotation.dy)
               .text(annotation.country + "\nProductivity: " + countryData.productivity + "\nHours: " + countryData.average_annual_hours_worked)
               .style("font-size", "12px")
               .style("opacity", 0.5)
               .attr("alignment-baseline", "middle");
        }
    });

}
async function linearchart(country) {
    const container = document.getElementById('scatterplot-1');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const data = await d3.csv(dataPath + time_and_productivity);
    const filteredData = data.filter(function(d) {
        return (d.entity === country) && (d.year >= 1970) && (d.year <= 2019);
    }).map(function(d) {
        return {
            year: +d.year,
            productivity: +d.productivity
        };
    });

    const data1970 = filteredData.find(d => d.year === 1970);
    const data2019 = filteredData.find(d => d.year === 2019);

    d3.select("#scatterplot-1").selectAll("*").remove();

    let svg = d3.select("#scatterplot-1").append("svg")
                .attr("width", containerWidth)
                .attr("height", containerHeight)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const xScale = d3.scaleLinear()
                     .domain([1970, 2019])
                     .range([0, width]);

    const yScale = d3.scaleLinear()
                     .domain([0, d3.max(filteredData, d => d.productivity)])
                     .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);
    svg.append("g")
       .attr("class", "grid")
       .attr("transform", "translate(0," + height + ")")
       .call(d3.axisBottom(xScale)
             .tickSize(-height)
             .tickFormat(""))
       .selectAll("line")
       .style("stroke", "#ccc")
       .style("stroke-opacity", 0.2);

    svg.append("g")
       .attr("class", "grid")
       .call(d3.axisLeft(yScale)
             .tickSize(-width)
             .tickFormat(""))
       .selectAll("line")
       .style("stroke", "#ccc")
       .style("stroke-opacity", 0.2);

    svg.append("g")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

    svg.append("g")
       .call(yAxis);

    const line = d3.line()
                   .x(d => xScale(d.year))
                   .y(d => yScale(d.productivity));

    svg.append("path")
       .datum(filteredData)
       .attr("fill", "none")
       .attr("stroke", "steelblue")
       .attr("stroke-width", 1.5)
       .transition()
       .duration(9000)
       .attr("d", line);

    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height + margin.bottom)
       .style("text-anchor", "middle")
       .text("Year")
       .style("font-size", "9px");

    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", 0 - (height / 2))
       .attr("y", -50)
       .attr("dy", "1em")
       .style("text-anchor", "middle")
       .text("Productivity Per Hour")
       .style("font-size", "9px");

    const annotationGroup = svg.append("g")
                               .style("opacity", 0);

    const annotationRect = annotationGroup.append("rect")
                                          .attr("fill", "white")
                                          .attr("stroke", "black")
                                          .attr("stroke-width", 1)
                                          .attr("rx", 5)
                                          .attr("ry", 5)
                                          .attr("width", 120)
                                          .attr("height", 40);

    const annotationText = annotationGroup.append("text")
                                          .attr("class", "annotation")
                                          .attr("fill", "black")
                                          .style("font-size", "9px");

    svg.selectAll("circle")
       .data(filteredData)
       .enter()
       .append("circle")
       .attr("cx", d => xScale(d.year))
       .attr("cy", d => yScale(d.productivity))
       .attr("r", 3)
       .attr("fill", "steelblue")
       .on("mouseover", function(event, d) {
           annotationGroup.transition()
                          .duration(200)
                          .style("opacity", 1);

           const rectX = Math.min(Math.max(xScale(d.year) - 60, 0), width - 120);
           const rectY = Math.min(Math.max(yScale(d.productivity) - 60, 0), height - 40);

           annotationRect.attr("x", rectX)
                         .attr("y", rectY);

           annotationText.attr("x", rectX + 5)
                         .attr("y", rectY + 15)
                         .text(`Year: ${d.year}`)
                         .append("tspan")
                         .attr("x", rectX + 5)
                         .attr("y", rectY + 30)
                         .text(`Productivity: ${d.productivity}`);
       })
       .on("mouseout", function(event, d) {
           annotationGroup.transition()
                          .duration(500)
                          .style("opacity", 0);
       });

    svg.append("line")
       .attr("x1", xScale(1970))
       .attr("y1", yScale(data1970.productivity))
       .attr("x2", xScale(1970) + 50)
       .attr("y2", yScale(data1970.productivity) + 50)
       .attr("stroke", "black")
       .attr("stroke-opacity", 0.2)
       .attr("marker-end", "url(#arrow)");

    svg.append("text")
       .attr("x", xScale(1970) + 55)
       .attr("y", yScale(data1970.productivity) + 50)
       .style("text-anchor", "start")
       .style("font-size", "9px")
       .style("fill", "black")
       .style("opacity", 0.6)
       .text(`Year: 1970, Productivity: ${data1970.productivity}`);

    svg.append("line")
       .attr("x1", xScale(2019))
       .attr("y1", yScale(data2019.productivity))
       .attr("x2", xScale(2019) - 50)
       .attr("y2", yScale(data2019.productivity) + 50)
       .attr("stroke", "black")
       .attr("stroke-opacity", 0.2)
       .attr("marker-end", "url(#arrow)");

    svg.append("text")
       .attr("x", xScale(2019) - 55)
       .attr("y", yScale(data2019.productivity) + 50)
       .style("text-anchor", "end")
       .style("font-size", "9px")
       .style("fill", "black")
       .style("opacity", 0.6)
       .text(`Year: 2019, Productivity: ${data2019.productivity}`);
}
async function populateCountrySelect() {
    const data = await d3.csv(dataPath + time_and_productivity);
    const countries = [...new Set(data.map(d => d.entity))].sort();

    const select = document.getElementById('countrySelect');
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.text = country;
        select.appendChild(option);
    });
    linearchart(countries[0]);
    select.addEventListener('change', function() {
        const selectedCountry = this.value;
        linearchart(selectedCountry);
    });
}
populateCountrySelect();



async function renderFirstChartstatic(year) {
    const container = document.getElementById('scatterplot-1');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const margin = {top: 20, right: 50, bottom: 50, left: 50};
    const width_scatterPlot = containerWidth - margin.left - margin.right;
    const height_scatterPlot = containerHeight - margin.top - margin.bottom;

    const data = await d3.csv(dataPath + hours_and_gdp);
    const filteredData = data.filter(function(d) {
        return (d.entity != "") && (d.year == year) && (d.continent != "") && (d.gdp_per_capita != "") && (d.average_annual_hours_worked != "");
    }).map(function(d) {
        return {
            entity: d.entity,
            year: +d.year,
            continent: d.continent,
            average_annual_hours_worked: +d.average_annual_hours_worked,
            gdp_per_capita: +d.gdp_per_capita,
            total_population: +d.total_population
        };
    });

    d3.select("#scatterplot-1").selectAll("*").remove();

    let svg = d3.select("#scatterplot-1").append("svg")
                .attr("width", containerWidth)
                .attr("height", containerHeight)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("defs").append("marker")
       .attr("id", "arrow")
       .attr("markerWidth", 10)
       .attr("markerHeight", 10)
       .attr("refX", 0)
       .attr("refY", 3)
       .attr("orient", "auto")
       .append("path")
       .attr("d", "M0,0 L0,6 L9,3 z")
       .attr("fill", "black");

    const yScale = d3.scaleLinear()
                     .domain([0, d3.max(filteredData, d => d.gdp_per_capita)])
                     .range([height_scatterPlot, 0]);

    const xScale = d3.scaleLinear()
                     .domain([d3.min(filteredData, d => d.average_annual_hours_worked), d3.max(filteredData, d => d.average_annual_hours_worked)])
                     .range([0, width_scatterPlot]);

    const yAxis = d3.axisLeft(yScale)
                    .tickSize(-width_scatterPlot)
                    .tickFormat(d => d3.format("~s")(d));

    const xAxis = d3.axisBottom(xScale)
                    .tickSize(-height_scatterPlot)
                    .tickFormat(d => d3.format("~s")(d));

    svg.append("g")
       .call(yAxis)
       .selectAll("line")
       .style("stroke", "#ccc")
       .style("stroke-opacity", 0.5);

    svg.append("g")
       .attr("transform", "translate(0," + height_scatterPlot + ")")
       .call(xAxis)
       .selectAll("line")
       .style("stroke", "#ccc")
       .style("stroke-opacity", 0.5);

    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 0 - margin.left)
       .attr("x", 0 - (height_scatterPlot / 2))
       .attr("dy", "1em")
       .style("text-anchor", "middle")
       .text("GDP per Capita ($)")
       .style("font-size", "9px");

    svg.append("text")
       .attr("x", width_scatterPlot / 2)
       .attr("y", height_scatterPlot + margin.bottom - 10)
       .style("text-anchor", "middle")
       .text("Annual Working Hours per Worker")
       .style("font-size", "9px");

    const circlesize = mapdotsizeofpop();
    const dotColors = d3.scaleOrdinal()
                        .domain(continents)
                        .range(continents.map(continent => continentColors[continent]));

    const tooltip = d3.select("#scatterplot-1").append("div")
                      .attr("class", "tooltip")
                      .style("z-index", "10")
                      .style("position", "absolute");

    const circles = svg.append('g')
                       .selectAll("circle")
                       .data(filteredData)
                       .enter()
                       .append("circle")
                       .attr("cx", function(d) { return xScale(d.average_annual_hours_worked); })
                       .attr("cy", function(d) { return yScale(d.gdp_per_capita); })
                       .attr("r", function(d) { return circlesize(d.total_population); })
                       .attr("data-entity", function(d) { return d.entity; })
                       .style("fill", function(d) {
                           const color = d3.color(dotColors(d.continent));
                           color.opacity = 0.5;
                           return color;
                       })
                       .on("mouseover", function(event, d) {
                           tooltip.transition()
                                  .duration(200)
                                  .style("opacity", .9);
                           tooltip.html("Country: " + d.entity + "<br/>" +
                                        "GDP per Capita: " + d.gdp_per_capita + "<br/>" +
                                        "Annual Hours Worked: " + d.average_annual_hours_worked);

                           const [x, y] = d3.pointer(event, container);

                           let left = x + 10;
                           let top = y - 28;

                           if (left + tooltip.node().offsetWidth > containerWidth) {
                               left = x - tooltip.node().offsetWidth - 10;
                           }
                           if (top + tooltip.node().offsetHeight > containerHeight) {
                               top = y - tooltip.node().offsetHeight - 10;
                           }

                           tooltip.style("left", left + "px")
                                  .style("top", top + "px");

                           circles.style("opacity", 0.2);
                           d3.select(this).style("opacity", 1);

                           svg.selectAll(".legend-rect").style("opacity", 0.2);
                           svg.selectAll(".legend-text").style("opacity", 0.2);
                           svg.selectAll("." + d.continent.replace(/\s+/g, '')).style("opacity", 1);
                       })
                       .on("mouseout", function(event, d) {
                           tooltip.transition()
                                  .duration(500)
                                  .style("opacity", 0);

                           circles.style("opacity", 1);
                           svg.selectAll(".legend-rect").style("opacity", 1);
                           svg.selectAll(".legend-text").style("opacity", 1);
                       });

    svg.append('g')
       .selectAll("text")
       .data(filteredData)
       .enter()
       .append("text")
       .attr("x", function(d) { return xScale(d.average_annual_hours_worked); })
       .attr("y", function(d) { return yScale(d.gdp_per_capita); })
       .attr("dy", -5)
       .attr("text-anchor", "middle")
       .style("fill", function(d) { return dotColors(d.continent); })
       .style("font-size", "8px")
       .text(function(d) { return d.entity; });

    addtool(svg, continents, width_scatterPlot, dotColors);

    const annotations = [
        { country: 'Ireland', dx: 50, dy: 50 },
        { country: 'Malaysia', dx: 50, dy: 50 },
        { country: 'Hong Kong', dx: 50, dy: 50 }
    ];

    annotations.forEach(function(annotation) {
        const countryData = filteredData.find(d => d.entity === annotation.country);
        if (countryData) {
            svg.append("line")
               .attr("x1", xScale(countryData.average_annual_hours_worked))
               .attr("y1", yScale(countryData.gdp_per_capita))
               .attr("x2", xScale(countryData.average_annual_hours_worked) + annotation.dx)
               .attr("y2", yScale(countryData.gdp_per_capita) + annotation.dy)
               .attr("stroke", "black")
               .attr("stroke-opacity", 0.5) 
               .attr("marker-end", "url(#arrow)");

            svg.append("text")
               .attr("x", xScale(countryData.average_annual_hours_worked) + annotation.dx + 5)
               .attr("y", yScale(countryData.gdp_per_capita) + annotation.dy)
               .text(annotation.country + "\nGDP: $" + countryData.gdp_per_capita + "\nHours: " + countryData.average_annual_hours_worked)
               .style("font-size", "12px")
               .style("opacity", 0.5) 
               .attr("alignment-baseline", "middle");
        }
    });
}
