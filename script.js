const width = 800;
const height = 600;

const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Group for zoom
const g = svg.append("g");

// Projection
const projection = d3.geoMercator();
const path = d3.geoPath().projection(projection);

// Color scale
const color = d3.scaleSequential(d3.interpolateReds);

// Tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load data
Promise.all([
    d3.json("https://raw.githubusercontent.com/TungTh/tungth.github.io/master/data/vn-provinces.json"),
    d3.csv("https://raw.githubusercontent.com/TungTh/tungth.github.io/master/data/vn-provinces-data.csv")
]).then(([geoData, csvData]) => {

    const dataMap = new Map();
    csvData.forEach(d => {
        dataMap.set(d.province, +d.value);
    });

    color.domain([
        0,
        d3.max(csvData, d => +d.value)
    ]);

    projection.fitSize([width, height], geoData);

    let centered = null;

    const paths = g.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("class", "province")
        .attr("d", path)
        .attr("fill", d => {
            const value = dataMap.get(d.properties.province);
            return value ? color(value) : "#ccc";
        })
        .on("mouseover", function(event, d) {
            const value = dataMap.get(d.properties.province);

            tooltip.style("opacity", 1)
                .html(`<strong>${d.properties.province}</strong><br>Value: ${value || "N/A"}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            zoomToFeature(event, d);
        });
console.log(csvData[0]);
console.log(geoData.features[0].properties);
    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    function zoomToFeature(event, d) {
        let x, y, k;

        if (centered !== d) {
            const bounds = path.bounds(d);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const xMid = (bounds[0][0] + bounds[1][0]) / 2;
            const yMid = (bounds[0][1] + bounds[1][1]) / 2;

            k = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
            x = width / 2 - k * xMid;
            y = height / 2 - k * yMid;

            centered = d;
        } else {
            // reset click
            x = 0;
            y = 0;
            k = 1;
            centered = null;
        }

        svg.transition()
            .duration(750)
            .call(
                zoom.transform,
                d3.zoomIdentity.translate(x, y).scale(k)
            );
    }

});