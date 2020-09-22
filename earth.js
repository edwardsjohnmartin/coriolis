const F = (e) => {
  const Fr = 0.8086
  const er = 0.08182
  const A = (1 - Fr) / (1 - er)
  const B = (Fr - er) / (1 - er)
  return A * e + B;
}

const secondEccentricity = (e) => {
  return e / Math.sqrt(1 - e * e)
}

const q = (e) => {
  const es = secondEccentricity(e)
  if (es < 1e-7) {
    return 0;
  }
  const res = 1 / es * (1 + 3 / (es * es)) * Math.atan(es) - 3 / (es * es)
  return res
}

const stableAngularSpeed = (e) => {
  const determinant = 15 / 4 * q(e) * (1 - 3 * F(e) / 5)
  const result = w0 * Math.sqrt(determinant)
  console.log('stableAngularSpeed', { result })
  return result
}

// if period is supplied, it will be used to calculate angular speed, otherwise eccentricity is used to calculate the period
// timePeriod => unit hrs
var Earth = function(rotating=true, eccentricity = 0.08182, timePeriod = undefined) {
  this.rotating = rotating;

  // R: earth's radius (assumed spherical)
  // T: earth's period of rotation (24 hours, stored in seconds)
  // V: earth's tangential equatorial speed -- V = 2*PI*R/T
  this.R = 6378137; // equatorial radius in meters
  this.stableAngularSpeed = stableAngularSpeed(eccentricity)

  if (timePeriod == null) {
    timePeriod = 2 * Math.PI / this.stableAngularSpeed
  } else {
    timePeriod *= 60 * 60
  }

  document.getElementById('time_period').value = "" + timePeriod / (60 * 60)

  this.T = timePeriod
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

