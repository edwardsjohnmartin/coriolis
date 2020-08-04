const EARTH_SPHERE = 0;
const EARTH_ELLIPSOID = 1;

var Earth = function(rotating=true) {
  this.rotating = rotating;

  // R: earth's radius (assumed spherical)
  // T: earth's period of rotation (24 hours, stored in seconds)
  // V: earth's tangential equatorial speed -- V = 2*PI*R/T
  // this.R = 6371393; // in meters
  // this.T = 24*60*60; // in seconds
  // this.R = 6371000; // mean radius in meters
  this.R = 6378137; // equatorial radius in meters
  this.T = 23.93*60*60 // (23.93 hours, stored in seconds). 
  this.V_ = 2 * Math.PI * (this.R / this.T); // meters per second
  this.V = this.V_;
  // T_: the period of the puck
  this.T_ = 16*60*60;

  // Earth's angular velocity in rad/s
  // this.OMEGA = Math.PI / (12*60*60); // 0.0000727;
  this.OMEGA = 2 * Math.PI / this.T; // 0.0000727;
  console.log("omega = " + this.OMEGA);
  // console.log("V = " + this.V);

  if (!rotating) {
    this.T = Infinity; // in seconds
    this.V = 0;
    this.T_ = Infinity;
    this.OMEGA = 0;
  }

  this.type = EARTH_SPHERE;
}

// returns the number of radians the earth has rotated after
// time seconds
Earth.prototype.earthRotation = function(t) {
  if (!this.rotating) {
    return 0;
  }

  // return (t/T_)*2*Math.PI;
  return (t/this.T)*2*Math.PI;
}

