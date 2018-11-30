var Map = function() {
  d3.json("world-small.json")
    .then(world => {
      this.world = world;
      this.projection = d3.geoOrthographic();
      render();
    })
  ;
}

Map.prototype.draw = function() {
  if (!this.projection) return;

  // Rotation: [yaw, pitch, roll]
  let target = new THREE.Vector3(0,0,0);
  let dir = camera.getWorldDirection(target).normalize();
  let latLon = xyz2latLon(dir.multiplyScalar(-1));
  let yaw = degrees(latLon.lon) + viewRotation();
  let rotation = [yaw, -degrees(latLon.lat)];
  this.projection.rotate(rotation);

  // Extent
  let box = renderer.domElement.viewBox.animVal;
  // let scale = 0.67;
  // let w = box.width*scale;
  // let h = box.height*scale;
  const zoom = camera.zoom;
  let w = radiusInWindow*2*zoom;
  let h = w;
  let center = [box.x + box.width/2, box.y + box.height/2];
  let extent = [[center[0]-w/2, center[1]-h/2], [center[0]+w/2, center[1]+h/2]];
  let sphere = ({type: "Sphere"});
  this.projection.fitExtent(extent, sphere)

  let path = d3.geoPath()
    .projection(this.projection);

  d3.select("#map").selectAll("*").remove();

  let lineColor = '#cccccc';

  let graticule = d3.geoGraticule().step([15, 15]);
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
  // console.log(d3.select(renderer.domElement));
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
