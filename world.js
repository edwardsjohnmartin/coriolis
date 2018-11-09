// var World = function(radius, latitudeBands, longitudeBands) {
// resln - resolution in drawing bands
// latBandSpacing - how many degrees should separate drawn latitude bands
// lonBandSpacing - how many degrees should separate drawn longitude bands
var World = function(radius, resln, latBandSpacing, lonBandSpacing) {
  // let latitudeBands = 30;
  // let longitudeBands = 30;

  resln = radians(resln);
  latBandSpacing = radians(latBandSpacing);
  lonBandSpacing = radians(lonBandSpacing);

  let pointsArray = [];

  // Latitude lines
  for (let theta = -Math.PI; theta < Math.PI; theta += latBandSpacing) {
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);

    for (let phi = 0; phi <= 2*Math.PI; phi += resln) {
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);

      let x = cosPhi * sinTheta;
      let y = cosTheta;
      let z = sinPhi * sinTheta;

      pointsArray.push(vec4(radius * x, radius * y, radius * z, 1.0));
    }
  }

  this.lonOffset = pointsArray.length;

  // Longitude lines
  for (let phi = -Math.PI; phi < Math.PI; phi += lonBandSpacing) {
    let sinPhi = Math.sin(phi);
    let cosPhi = Math.cos(phi);

    for (let theta = -Math.PI; theta <= Math.PI; theta += resln) {
      let sinTheta = Math.sin(theta);
      let cosTheta = Math.cos(theta);

      let x = cosPhi * sinTheta;
      let y = cosTheta;
      let z = sinPhi * sinTheta;

      pointsArray.push(vec4(radius * x, radius * y, radius * z, 1.0));
    }
  }

  // for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
  //   let theta = latNumber * Math.PI / latitudeBands;
  //   let sinTheta = Math.sin(theta);
  //   let cosTheta = Math.cos(theta);

  //   for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
  //     let phi = longNumber * 2 * Math.PI / longitudeBands;
  //     let sinPhi = Math.sin(phi);
  //     let cosPhi = Math.cos(phi);

  //     let x = cosPhi * sinTheta;
  //     let y = cosTheta;
  //     let z = sinPhi * sinTheta;

  //     pointsArray.push(vec4(radius * x, radius * y, radius * z, 1.0));
  //   }
  // }

  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  this.numLatBands = Math.PI / latBandSpacing + 1;
  this.numLonBands = Math.PI / lonBandSpacing + 1;
  this.numBandPoints = (2*Math.PI) / resln + 1;
  this.numPoints = pointsArray.length;
}

