const DEBUG_DECIMALS = 4;

// const FACTOR = 10000;
const FACTOR = 1;

var debug = {
  set temp(v) {
    document.getElementById('temp').innerHTML = v;
  },
  set theta(v) {
    document.getElementById('theta').innerHTML = degrees(v).toFixed(DEBUG_DECIMALS);
  },
  set phi(v) {
    document.getElementById('phi').innerHTML = degrees(v).toFixed(DEBUG_DECIMALS);
  },
  set T(v) {
    document.getElementById('T').innerHTML = (v * FACTOR).toFixed(DEBUG_DECIMALS);
  },
  set v(a) {
    document.getElementById('v').innerHTML = a.toFixed(DEBUG_DECIMALS);
  },
  set v0(a) {
    document.getElementById('v0').innerHTML = a.toFixed(DEBUG_DECIMALS);
  },
  set theta_dot(v) {
    document.getElementById('theta_dot').innerHTML = (v*FACTOR*3600).toFixed(DEBUG_DECIMALS);
  },
  set phi_dot(v) {
    document.getElementById('phi_dot').innerHTML = (v*FACTOR*3600).toFixed(DEBUG_DECIMALS);
  },
  set L0(v) {
    document.getElementById('L0').innerHTML = (v*FACTOR).toFixed(DEBUG_DECIMALS);
  },
  set T0(v) {
    document.getElementById('T0').innerHTML = (v*FACTOR).toFixed(DEBUG_DECIMALS);
  },
  // set fps(v) {
  //   document.getElementById('fps').innerHTML = v.toFixed(0);
  // },
  // set phi(v) {
  //   this._phi = v;
  //   document.getElementById('phi').innerHTML = v.toFixed(1);
  // },
  // set phi_(v) {
  //   this._phi_ = v;
  //   document.getElementById('phi_').innerHTML = v.toFixed(1);
  //   document.getElementById('phi2').innerHTML =
  //     (this._phi_-this._phi).toFixed(1);
  // }
}

