var Map = function() {
  this.width = 1257;
  this.height = 1257;
  this.sphere = ({type: "Sphere"})

  d3.json("world-small.json")
    .then(world => {
      this.world = world;
      this.projection = d3.geoOrthographic()
        // .translate([this.width / 2, this.height / 2])
        // .fitExtent([[1, 1], [this.width - 1, this.height - 1]], this.sphere)
      ;
      render();
    })
  ;
}

Map.prototype.draw = function() {
  if (!this.projection) return;

  // [yaw, pitch, roll]
  let rotation = [-degrees(camera.rotation.y), degrees(camera.rotation.x), 0];
  this.projection.rotate(rotation);

  console.log(renderer.domElement.viewBox);
  let box = renderer.domElement.viewBox.animVal;
  // let extent = [[1, 1], [this.width - 1, this.height - 1]];
  let scale = 0.67;
  let w = box.width*scale;
  let h = box.height*scale;
  let center = [box.x + box.width/2, box.y + box.height/2];
  // let extent = [[box.x, box.y], [box.width+box.x, box.height+box.y]];
  let extent = [[center[0]-w/2, center[1]-h/2], [center[0]+w/2, center[1]+h/2]];
  this.projection.fitExtent(extent, this.sphere)

  let path = d3.geoPath()
    .projection(this.projection);

  d3.select("#map").selectAll("*").remove();

  let lineColor = '#cccccc';

  let graticule = d3.geoGraticule().step([10, 10]);
  // d3.select("#map").selectAll("path")
  d3.select(renderer.domElement).selectAll("path")
    .data([graticule()])
    .enter()
    .append("path")
    .attr("d", path)
    .attr('class', 'grat')
    .attr('fill', 'none')
    .attr('stroke', lineColor)
  ;

  // Need to use geoJSON if loading world.json.
  // let geoJSON = topojson.feature(world, world.objects.countries);
  // let geoJSON = this.world;

  // d3.select("#map").selectAll("path")
  console.log(d3.select(renderer.domElement));
  d3.select(renderer.domElement).selectAll("path")
    // .data(geoJSON.features)
    .data(this.world.features)
    .enter()
    .append("path")
    .attr("id", d => d.id)
    .attr("d", path)
    .attr('class', 'countries')
    .style('fill', '#f5f5f5')
    .style('stroke', lineColor)
  ;
}
