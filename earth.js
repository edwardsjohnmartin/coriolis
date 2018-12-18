// R: earth's radius (assumed spherical)
// T: earth's period of rotation (24 hours, stored in seconds)
// V: earth's tangential equatorial speed -- V = 2*PI*R/T
const R = 6371393; // in meters
const T = 24*60*60; // in seconds
const V = 2 * Math.PI * (R / T); // meters per second
// T_: the period of the puck
const T_ = 16*60*60;

// Earth's angular velocity in rad/s
const OMEGA = 0.0000727;

// returns the number of radians the earth has rotated after
// time seconds
function earthRotation(t) {
  // return (t/T_)*2*Math.PI;
  return (t/T)*2*Math.PI;
}

