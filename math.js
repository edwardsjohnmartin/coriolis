//------------------------------------------------------------
// Positions are always given in lat/lon in the earth's
// coordinate system
//------------------------------------------------------------
var Position = function(lat, lon) {
  this.lat = lat;
  this.lon = lon;
  // Cartesian coordinates are as if the observer is looking
  // orthoganally toward the equator/prime meridian intersection.
  this.cartesian = latLon2xyz(lat, lon);

  // It's handy to know the east vector at this coordinate point.
  let vnorth_ = new THREE.Vector3(0,1,0).sub(this.cartesian);
  this.east = vnorth_.clone().cross(this.cartesian);
}

//------------------------------------------------------------
// Velocities are always given in north/east vector components
// (scalars) in the earth's coordinate system
//------------------------------------------------------------
var Velocity = function(north, east) {
  this.north = north;
  this.east = east;
  this.theta = Math.atan2(north, east);
}

Velocity.prototype.cartesian = function(p) {
  return p.east.applyAxisAngle(p.cartesian, this.theta);
}

function velFromRadians(theta, speed) {
  return new Velocity(speed*Math.sin(theta), speed*Math.cos(theta));
}


//------------------------------------------------------------
// Coordinate conversion functions
//------------------------------------------------------------

function radians(deg) {
  return deg * Math.PI / 180;
}

function degrees(rad) {
  return rad * 180 / Math.PI;
}

// // Lat and lon are given in radians.
// function latLon2xyz_old(lat, lon) {
//   let r = Math.cos(lat);
//   let x = r*Math.cos(-lon);
//   let y = Math.sin(lat);
//   let z = r*Math.sin(-lon);
//   return new THREE.Vector3(x,y,z);
// }

// Lat and lon are given in radians.
function latLon2xyz(lat, lon) {
  let r = Math.cos(lat);
  let x = -r*Math.sin(-lon);
  let y = Math.sin(lat);
  let z = r*Math.cos(-lon);
  return new THREE.Vector3(x,y,z);
}

// Given an xyz position on a unit sphere, returns the lat/lon
// (in radians) as if the observer is looking at the equator-
// prime meridian intersection.
function xyz2latLon(p) {
  const lat = Math.asin(p.y);
  // const r = Math.cos(lat);
  // const lon = -Math.acos(p.x/r);
  // const lon = -Math.atan2(p.z, p.x);
  const lon = -Math.atan2(p.x, p.z);
  return {lat:lat, lon:lon};
}

//------------------------------------------------------------
// Sphere math stuff
//------------------------------------------------------------

//------------------------------------------------------------
// east
// Computes the east vector at point p. The returned vector
// is in cartesian coordinates in the fixed reference frame.
// The returned vector is normalized.
//------------------------------------------------------------
function east(p) {
  // Get the tangent vector to the circle in the xz plane
  return new THREE.Vector3(p.z, 0, -p.x).normalize();
}

//------------------------------------------------------------
// north
// Computes the north vector at point p. The returned vector
// is in cartesian coordinates in the fixed reference frame.
// The returned vector is normalized.
//------------------------------------------------------------
function north(p) {
  return p.clone().normalize().cross(east(p));
}

//------------------------------------------------------------
// General math stuff
//------------------------------------------------------------

function sq(x) {
  return x*x;
}
