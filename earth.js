const EARTH_SPHERE = 0;
const EARTH_ELLIPSOID = 1;

var Earth = function() {
  // R: earth's radius (assumed spherical)
  // T: earth's period of rotation (24 hours, stored in seconds)
  // V: earth's tangential equatorial speed -- V = 2*PI*R/T
  this.R = 6371393; // in meters
  this.T = 24*60*60; // in seconds
  this.V_ = 2 * Math.PI * (this.R / this.T); // meters per second
  this.V = this.V_;
  // T_: the period of the puck
  this.T_ = 16*60*60;

  // Earth's angular velocity in rad/s
  this.OMEGA = Math.PI / (12*60*60); // 0.0000727;

}

// returns the number of radians the earth has rotated after
// time seconds
Earth.prototype.earthRotation = function(t) {
  // return (t/T_)*2*Math.PI;
  return (t/this.T)*2*Math.PI;
}

