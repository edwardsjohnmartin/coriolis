function runTests() {
  if (xyz2latLon(new THREE.Vector3(1,0,0)).lat != 0) {
    throw 1;
  }
}
