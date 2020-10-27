// The "Reference Earth" is our Earth as we know it
// The "Simulation earth" is the earth we are running in the simulation

//----------------------------------------
// Reference earth constants
//----------------------------------------
// Angular speed in rad/s.
const OMEGA_r = 7.292e-5;

//----------------------------------------
// Calculate the stable angular speed
// given eccentricity
//----------------------------------------

const F = (e) => {
  const Fr = 0.8086
  const er = 0.08182
  const A = (1.0 - Fr) / (1.0 - er)
  const B = (Fr - er) / (1.0 - er)
  return A * e + B;
}

const secondEccentricity = (e) => {
  return e / Math.sqrt(1.0 - e * e)
}

const q = (e) => {
  const es = secondEccentricity(e)
  if (es < 1e-7) {
    return 0;
  }
  const res = 1.0 / es * (1.0 + 3.0 / (es * es)) * Math.atan(es)    - 3.0 / (es * es)
  // const res =          (1 + 3 / sq(es))    * Math.atan(es)/es - 3 / sq(es);
  return res
}

const stableAngularSpeed = (e) => {
  if (e == 0) {
    return 0;
  }
  const determinant = 15.0 / 4.0 * q(e) * (1.0 - 3.0 * F(e) / 5.0)

  const G = 6.674e-11; // Newton's universal gravitational constant G (N m^2/kg^2)
  const M = 5.972e24; // earth mass in kg
  const r0 = 6371001; //! spherical earth radius (m)
  const g0 = G*M/sq(r0); // acceleration scale (m/s^2)
  const v0 = Math.sqrt(r0*g0); // velocity scale (m/s)
  const w0 = Math.sqrt(g0/r0); // angular speed scale (rad/s)
  // const w0 = 1.242 * 1e-3
  const result = w0 * Math.sqrt(determinant)
  // console.log('stableAngularSpeed', { result })
  return result
}

//----------------------------------------
// Calculate the equatorial radius given
// eccentricity
//----------------------------------------

function getEquatorialRadius(eccentricity) {
  const G = 6.674e-11; // Newton's universal gravitational constant G (N m^2/kg^2)
  const M = 5.972e24; // earth mass in kg
  const r0 = 6371001; // spherical earth radius (m)
  const g0 = G*M/sq(r0); // acceleration scale (m/s^2)
  const v0 = Math.sqrt(r0*g0); // velocity scale (m/s)
  const omega0 = Math.sqrt(g0/r0); // angular speed scale (rad/s)
  const ret = r0*Math.pow(1-sq(eccentricity), -1/6); // earth's equatorial radius (m)
  return ret;
}

//----------------------------------------
// Construct a simulation earth.
// If period is supplied, it will be used to calculate angular speed, otherwise eccentricity is used to calculate the period
// timePeriod => unit hrs
//----------------------------------------
var Earth = function(rotating=true, eccentricity = 0.08182, timePeriod = undefined) {
  this.rotating = rotating;
  this.e = eccentricity;

  // a - equatorial radius in meters
  this.a = getEquatorialRadius(this.e);

  this.stableAngularSpeed = stableAngularSpeed(this.e);

  // tau - period of rotation in seconds (roughly 24*60*60 for our Earth)
  if (timePeriod == null) {
    timePeriod = 2 * Math.PI / this.stableAngularSpeed;
  } else {
    timePeriod *= 60 * 60;
  }
  document.getElementById('time_period').value = "" + timePeriod / (60 * 60);
  this._tau = timePeriod;

  // V - earth's tangential equatorial speed
  // this._V = 2 * Math.PI * (this.a / this._tau); // meters per second

  // Earth's angular velocity in rad/s
  this.OMEGA = 2 * Math.PI / this._tau; // 0.0000727;

  if (!rotating) {
    this._tau = Infinity; // in seconds
    // this._V = 0;
    // this.T_ = Infinity;
    this.OMEGA = 0;
  }

  console.log('****************************************');
  console.log('Earth parameters');
  console.log('****************************************');
  console.log("OMEGA (angular speed)", this.OMEGA);
  console.log('eccentricity', this.e);
  console.log('tau (timePeriod)', this._tau);
  console.log('stableAngularSpeed', this.stableAngularSpeed);
  console.log('a (equatorial radius)', this.a);
}

// Earth's meridional radius of curvature
Earth.prototype.R = function(theta) {
  const e = this.e;
  return (1-sq(e))*this.a / Math.pow(1 - sq(e * Math.sin(theta)), 1.5);
}

// returns the number of radians the earth has rotated after
// time seconds
Earth.prototype.earthRotation = function(t) {
  if (!this.rotating) {
    return 0;
  }

  return (t/this._tau)*2*Math.PI;
}

// Reference earth
// Simulation earth

// Simulation earth's time period
Earth.prototype.tau = function() {
  return this._tau;//2 * Math.PI / this.OMEGA; // 0.0000727;
}

