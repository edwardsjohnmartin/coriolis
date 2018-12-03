// R: earth's radius (assumed spherical)
// T: earth's period of rotation (24 hours, stored in seconds)
// V: earth's tangential equatorial speed -- V = 2*PI*R/T
const R = 6371393; // in meters
const T = 24*60*60; // in seconds
const V = 2 * Math.PI * (R / T); // meters per second
// T_: the period of the puck
const T_ = 16*60*60;


//------------------------------------------------------------
// Constructor
// lon0 is the longitude in radians at which the puck was
// struck.
//------------------------------------------------------------
var CoriolisSim = function(lon0) {
  // The initial position in cartesian coordinates
  this.p0 = new Position(0, lon0);

  // north0 and east0 are in rotating frame cartesian coordinates
  // this.north0 = new THREE.Vector3(0, Math.sqrt(5/4)*V, 0);
  // this.east0 =
  //   new THREE.Vector3(V*Math.cos(this.p0.lon), 0, -V*Math.sin(this.p0.lon));

  // this.v0 = this.north0.clone().add(this.east0);
  this.v0 = new Velocity(V, Math.sqrt(5/4)*V, 0);
  this.speed = Math.sqrt(sq(this.v0.east)+sq(this.v0.north));
  // this.rotAxis_fixed =
  //   this.p0.cartesian.clone().cross(this.v0.clone().normalize()).normalize();
}

//------------------------------------------------------------
// phi
// Computes the time-dependent azimuthal position of the
// launch point of the puck as seen by an observer in the
// fixed frame. It tracks the line of longitude from which the
// puck was fired. Return value is the azimuthal position in
// radians.
//------------------------------------------------------------
CoriolisSim.prototype.phi = function(t) {
  // return this.lon0 + 2 * Math.PI * t / T;
  return this.p0.lon + 2 * Math.PI * t / T;
}

//------------------------------------------------------------
// phi_
// Computes the time-dependent azimuthal position of the puck
// at time t in the fixed frame. At t=0, phi == phi_. Return
// value is the azimuthal angle in radians.
//------------------------------------------------------------
CoriolisSim.prototype.phi_ = function(t) {
  // return this.lon0 + Math.atan((2/3)*Math.tan(2*Math.PI*t/T_));
  // return this.p0.lon + Math.atan((2/3)*Math.tan(2*Math.PI*t/T_));
  return this.p0.lon + Math.atan((V/this.speed)*Math.tan(2*Math.PI*t/T_));
}

//------------------------------------------------------------
// theta_
// Computes the time-dependent pitch position of the puck
// at time t in the fixed frame. At t=0, theta_ == 0. Return
// value is the pitch angle in radians.
//------------------------------------------------------------
CoriolisSim.prototype.theta_ = function(t) {
  return this.p0.lat + Math.asin((this.v0.north/this.speed) * Math.sin(2*Math.PI*t/T_));
}

//------------------------------------------------------------
// phi_rotating
// Computes the time-dependent longitudinal position of the puck
// at time t in the rotating frame, or the starting longitude
// plus azimuthal degrees of
// travel from the starting point. At t=0, phi_ == 0. Return
// value is the azimuthal angle in radians.
//------------------------------------------------------------
CoriolisSim.prototype.phi_rotating = function(t) {
  // return this.lon0 + (this.phi_(t) - this.phi(t));
  return this.p0.lon + (this.phi_(t) - this.phi(t));
}

//------------------------------------------------------------
// p
// Computes the time-dependent position of the puck.
//------------------------------------------------------------
CoriolisSim.prototype.p = function(t) {
  const lat = this.theta_(t);
  const lon = this.phi_rotating(t);
  return new Position(lat, lon);
  // let ret = this.p0.cartesian.clone();
  // return ret.applyAxisAngle(this.rotAxis_fixed, (t/T_)*2*Math.PI);
}

// //------------------------------------------------------------
// // pFixed
// // Computes the time-dependent position of the puck in
// // Cartesian coordinates in the fixed frame.
// //------------------------------------------------------------
// CoriolisSim.prototype.pFixed = function(t) {
//   let ret = this.p0.cartesian.clone();
//   return ret.applyAxisAngle(this.rotAxis_fixed, (t/T_)*2*Math.PI);
// }

// //------------------------------------------------------------
// // pRotating
// // Computes the time-dependent position of the puck in
// // Cartesian coordinates in the rotating frame.
// //------------------------------------------------------------
// CoriolisSim.prototype.pRotating = function(t) {
//   let pFixed = this.pFixed(t);
//   let lat = xyz2latLon(pFixed).lat;
//   let lon = this.phi_rotating(t);
//   return latLon2xyz(lat, lon);
// }

//------------------------------------------------------------
// v
// Computes the time-dependent velocity vector of the puck in
// the fixed frame.
//------------------------------------------------------------
CoriolisSim.prototype.v = function(t) {
  // let ret = this.v0.clone();
  // return ret.normalize().applyAxisAngle(this.rotAxis_fixed, (t/T_)*2*Math.PI);
  return this.v0.cartesian(this.p(t));
}

//------------------------------------------------------------
// pathFixed
// Computes the puck's path from time t0 to time t1 in the
// fixed frame. divisions
// is the number of pieces to divide the curve into. Coordinates
// returned in fixed-frame cartesian coordinates.
//------------------------------------------------------------
CoriolisSim.prototype.path = function(t0, t1, divisions) {
  if (t0 == t1) return [];

  const inc = (t1-t0)/divisions;
  let points = [];
  for (let t = t0; t <= t1; t += inc) {
    points.push(this.p(t));
  }
  return points;
}

// //------------------------------------------------------------
// // pathFixed
// // Computes the puck's path from time t0 to time t1 in the
// // fixed frame. divisions
// // is the number of pieces to divide the curve into. Coordinates
// // returned in fixed-frame cartesian coordinates.
// //------------------------------------------------------------
// CoriolisSim.prototype.pathFixed = function(t0, t1, divisions) {
//   if (t0 == t1) return [];

//   const inc = (t1-t0)/divisions;
//   let points = [];
//   for (let t = t0; t <= t1; t += inc) {
//     const pFixed = this.pFixed(t);
//     const latLonFixed = xyz2latLon(pFixed);
//     const lonRotating = this.phi(t1) + latLonFixed.lon - this.phi(t);
//     const pRotating = latLon2xyz(latLonFixed.lat, lonRotating);
//     points.push(pRotating);
//   }
//   return points;
// }

// //------------------------------------------------------------
// // pathRotating
// // Computes the puck's path from time t0 to time t1 in the
// // rotating frame. divisions
// // is the number of pieces to divide the curve into. Coordinates
// // returned in rotating frame cartesian coordinates.
// //------------------------------------------------------------
// CoriolisSim.prototype.pathRotating = function(t0, t1, divisions) {
//   if (t0 == t1) return [];

//   const inc = (t1-t0)/divisions;
//   let points = [];
//   for (let t = t0; t <= t1; t += inc) {
//     const pRotating = this.pRotating(t);
//     points.push(pRotating);
//   }
//   return points;
// }

