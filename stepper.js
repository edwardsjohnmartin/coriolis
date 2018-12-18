var Stepper = function(h) {
  this.h = h;
}

Stepper.prototype.step = function(verbose) {
  this.d = this.rk4(verbose);
}

function rk4Add(x, k, f) {
  let ret = [ 0, 0, 0, 0, 0, 0 ];
  for (let i = 0; i < ret.length; ++i) {
    ret[i] = x[i] + f * k[i];
  }
  return ret;
}

Stepper.prototype.rk4 = function(verbose) {
  let x = [ this.d.r, this.d.theta, this.d.phi,
            this.d.pr, this.d.ptheta, this.d.pphi ];
  let k1 = get_derivatives(x, verbose);
  let k2 = get_derivatives(rk4Add(x, k1, this.h/2), verbose);
  let k3 = get_derivatives(rk4Add(x, k2, this.h/2), verbose);
  let k4 = get_derivatives(rk4Add(x, k3, this.h), verbose);

  let ret = [ 0, 0, 0, 0, 0, 0 ];
  for (let i = 0; i < x.length; ++i) {
    ret[i] = x[i] + (this.h/6.0) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]);
  }

  ret[1] = normalize_angle(ret[1]);
  ret[2] = normalize_angle(ret[2]);

  if (verbose) {
    console.log("new = " + ret[0] + " " + ret[1] + " " + ret[2] + " " +
                ret[3] + " " + ret[4] + " " + ret[5]);
  }

  return new Dipole(ret[0], ret[1], ret[2], ret[3], ret[4], ret[5], this.d);
}
