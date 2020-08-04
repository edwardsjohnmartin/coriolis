const EARTH_SPHERE = 0;
const EARTH_ELLIPSOID = 1;

var Earth = function(rotating=true) {
  this.rotating = rotating;

  // R: earth's radius (assumed spherical)
  // T: earth's period of rotation (24 hours, stored in seconds)
  // V: earth's tangential equatorial speed -- V = 2*PI*R/T
  this.R = 6371393; // in meters
  this.T = 1*60*60; // in seconds
  this.V_ = 2 * Math.PI * (this.R / this.T); // meters per second
  this.V = this.V_;
  // T_: the period of the puck
  this.T_ = 16*60*60;

  // Earth's angular velocity in rad/s
  this.OMEGA = Math.PI / (12*60*60); // 0.0000727;
  const e = 0.5;
  const B = 10;
  const d = Math.sqrt(1 - 3 * B / 5)
  this.OMEGA *= e * d; // 0.0000727;


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

