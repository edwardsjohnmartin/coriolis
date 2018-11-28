// Radius is the radius of the sphere
var GreatCircle = function(radius, latmax, lon0) {
  let pointsArray = [];

  this.latmax = latmax;
  this.lon0 = lon0;

  let inc = Math.PI / 180;
  for (let lon = this.lon0; lon <= 2*Math.PI + this.lon0; lon+=inc) {
    let lat = this.getlat(lon);
    let p = latLon2xyz(lat, lon);
    // pointsArray.push(new THREE.Vector3(radius * p.x, radius * p.y, radius * p.z));
    pointsArray.push(radius * p.x, radius * p.y, radius * p.z);
  }

  this.vertices = pointsArray;
}

GreatCircle.prototype.getlat = function(lon) {
  return Math.atan(Math.tan(this.latmax) * Math.cos(lon-this.lon0));
}

GreatCircle.prototype.dlatdlon = function(lat, lon) {
  return (-Math.tan(this.latmax)*Math.sin(lon-this.lon0)) /
    (1 + sq(Math.tan(this.latmax)) * sq(Math.cos(lon-this.lon0)));
}

GreatCircle.prototype.veast = function(lat, lon, mag) {
  let dlatdlon = this.dlatdlon(lat, lon);
  return mag * Math.cos(Math.atan(dlatdlon));
}

GreatCircle.prototype.vnorth = function(lat, lon, mag) {
  let dlatdlon = this.dlatdlon(lat, lon);
  return mag * Math.sin(Math.atan(dlatdlon));
}
