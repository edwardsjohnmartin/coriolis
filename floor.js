var Floor = function() {
  var pointsArray = [];
  var colorsArray = [];
  var y = 0.0;
  var lo = -1.0;
  var hi = 1.0;
  var inc = 0.1;
  const color = vec4(0.5, 0.5, 0.5, 1.0);
  for (var x = lo; x <= hi; x += inc) {
    pointsArray.push(vec4(x, y, hi));
    pointsArray.push(vec4(x, y, lo));
    colorsArray.push(color);
    colorsArray.push(color);
  }
  for (var z = lo; z <= hi; z += inc) {
    pointsArray.push(vec4(lo, y, z));
    pointsArray.push(vec4(hi, y, z));
    colorsArray.push(color);
    colorsArray.push(color);
  }

  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  this.colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  this.numPoints = pointsArray.length;
}

