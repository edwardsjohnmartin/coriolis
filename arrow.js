var Arrow = function() {
  var pointsArray = [];

  pointsArray.push(vec4(0.0, 0.0, 0.0, 1.0));
  pointsArray.push(vec4(1.0, 0.0, 0.0, 1.0));

  pointsArray.push(vec4(1.0, 0.0, 0.0, 1.0));
  pointsArray.push(vec4(0.8, 0.10, 0.0, 1.0));

  pointsArray.push(vec4(1.0, 0.0, 0.0, 1.0));
  pointsArray.push(vec4(0.8, -0.10, 0.0, 1.0));

  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  this.numPoints = pointsArray.length;
}

