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
  // Store lon0 in radians
  this.lon0 = lon0;

  // The initial position in cartesian coordinates
  this.p0 = latLon2xyz(0, lon0);
  this.north0 = new THREE.Vector3(0, Math.sqrt(5/4)*V, 0);
  this.east0 = new THREE.Vector3(V, 0, 0);
  this.v0 = this.north0.clone().add(this.east0);
  this.rotAxis = this.p0.clone().cross(this.v0.clone().normalize()).normalize();
}

//------------------------------------------------------------
// phi
// Computes the time-dependent azimuthal position of the
// launch point of the puck as seen by an observer in the
// fixed frame. It tracks the line of longitude from which the
// puck was fired. Return value is in radians.
//------------------------------------------------------------
CoriolisSim.prototype.phi = function(t) {
  return this.lon0 + 2 * Math.PI * t / T;
}

//------------------------------------------------------------
// phi_
// Computes the time-dependent position of the line of
// longitude through which the puck is passing at time t. At
// t=0, phi == phi_. Return value is in radians.
//------------------------------------------------------------
CoriolisSim.prototype.phi_ = function(t) {
  return this.lon0 + Math.atan((2/3)*Math.tan(2*Math.PI*t/T_));
}

//------------------------------------------------------------
// lat
// Computes the time-dependent latitude of the puck at time t.
// Return value is in radians.
//------------------------------------------------------------
CoriolisSim.prototype.lat = function(t) {
  return (t/T_) * 2 * Math.PI;
}

//------------------------------------------------------------
// p
// Computes the time-dependent position of the puck in
// Cartesian coordinates in the fixed frame.
//------------------------------------------------------------
CoriolisSim.prototype.p = function(t) {
  let ret = this.p0.clone();
  return ret.applyAxisAngle(this.rotAxis, (t/T_)*2*Math.PI);
}

//------------------------------------------------------------
// v
// Computes the time-dependent velocity vector of the puck in
// the puck's frame.
//------------------------------------------------------------
CoriolisSim.prototype.v = function(t) {
  let ret = this.v0.clone();
  return ret.normalize().applyAxisAngle(this.rotAxis, (t/T_)*2*Math.PI);
}

