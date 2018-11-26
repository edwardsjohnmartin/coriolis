// Radius is the radius of the sphere
var GreatCircle = function(radius, latmax, lon0) {
  let pointsArray = [];

  // this.latmax = 2*Math.PI/3;
  // this.lon0 = Math.PI;
  this.latmax = latmax;
  this.lon0 = lon0;

  let inc = Math.PI / 180;
  for (let lon = this.lon0; lon <= 2*Math.PI + this.lon0; lon+=inc) {
    let lat = this.getlat(lon);
    let p = latLon2xyz(lat, lon);
    // pointsArray.push(vec4(radius * p[0], radius * p[1], radius * p[2], 1.0));
  }
  // this.vertexBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  this.numPoints = pointsArray.length;
}

function sq(x) {
  return x*x;
}

GreatCircle.prototype.getlat = function(lon) {
  return Math.atan(Math.tan(this.latmax) * Math.cos(lon-this.lon0));
}

GreatCircle.prototype.dlatdlon = function(lat, lon) {
  return (-Math.tan(this.latmax)*Math.sin(lon-this.lon0)) /
    (1 + sq(Math.tan(this.latmax)) * sq(Math.cos(lon-this.lon0)));
}

GreatCircle.prototype.veast = function(lat, lon, mag) {
  // let dlatdlon = (-Math.tan(this.latmax)*Math.sin(lon-this.lon0)) /
  //   (1 + sq(Math.tan(this.latmax)) * sq(Math.cos(lon-this.lon0)));
  let dlatdlon = this.dlatdlon(lat, lon);
  return mag * Math.cos(Math.atan(dlatdlon));
}

GreatCircle.prototype.vnorth = function(lat, lon, mag) {
  // let dlatdlon = (-Math.tan(this.latmax)*Math.sin(lon-this.lon0)) /
  //   (1 + sq(Math.tan(this.latmax)) * sq(Math.cos(lon-this.lon0)));
  let dlatdlon = this.dlatdlon(lat, lon);
  return mag * Math.sin(Math.atan(dlatdlon));
}
