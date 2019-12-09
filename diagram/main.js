function eccentricityChanged(){

  let svg = document.getElementById('diagram');

  let temp = document.getElementById('mytext');
  if (temp) {
    temp.remove();
  }

  let s = 0.5;
  let omega = 0.5;
  let A = 0.2084558583;
  let B = 0.7915441417;

  let e = document.getElementById('eccentricity').value;
  let formFactor = A * e + B;
  let eccent = Math.sqrt(Math.pow(e, 2)/(1-Math.pow(e,2)));
  let p = (1 + 1/(Math.pow(eccent, 2)))*(1-(1/eccent)*Math.atan(eccent))-(1/3);
  let q = (1/eccent)*(1+3/(Math.pow(eccent, 2)))*Math.atan(eccent)-3/(Math.pow(eccent, 2));
  let omegaStable = Math.sqrt((15/4)*q*(1-(3/5)*formFactor));
  let apperantGravA = Math.pow(1-Math.pow(e,2), -1/6)*(1-(1+p/q)*Math.pow(omegaStable, 2));
  let apperantGravB = Math.pow(1-Math.pow(e,2),1/3)*(1+2*p/q*Math.pow(omegaStable,2));
  let a = Math.pow((1-Math.pow(e,2)),-1/6);
  let b = Math.pow((1-Math.pow(e,2)),1/3);
  let scaleFactor = 150;
  let eqRad = a*scaleFactor;
  let polRad = b*scaleFactor;

  let latitude = [Math.PI/6];
  let latitudeLength = latitude.length;
  var i;

  for (i of latitude) {
    let rho = (a*Math.cos(i))/Math.sqrt(1-Math.pow(e*Math.sin(i),2));
    let z = (a*(1-Math.pow(e,2))*Math.sin(i))/Math.sqrt(1-Math.pow(e*Math.sin(i),2));
    let lattGrav = (a* apperantGravA*Math.pow(Math.cos(i),2)+b*apperantGravB*Math.pow(
        Math.sin(i),2))/Math.sqrt(Math.pow(a*Math.cos(i),2)+Math.pow(b*Math.sin(i),2));
    let gravRho =-lattGrav*Math.cos(i)-Math.pow(omegaStable,2)*rho;
    let gravZ = -lattGrav*Math.sin(i);
    let accelCent = Math.pow(omega,2)*rho;
    let rho2 = rho + s*gravRho;
    let z2 = z +  s*gravZ;
    let rho3 = rho2 + s*accelCent;
    console.log(rho2, z2, rho3);
    gravityVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, b);
    accelCentVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, b);
    apperantGravVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, b);
  }

  makeEllipse(eqRad,polRad);

}

function makeEllipse(eqRad,polRad) {
  let svg = document.getElementById('diagram');

  let temp = document.getElementById('mydiagram');
  if (temp) {
    temp.remove();
  }
  let ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  ellipse.setAttribute('d', `M 400 100 a ${polRad},${eqRad} 90 1,0 1,0 z`);
  ellipse.style.fill = 'transparent';
  ellipse.style.stroke = 'black';
  ellipse.style.strokeWidth = '5px';
  ellipse.setAttribute('id', 'mydiagram');
  svg.appendChild(ellipse);
}

function gravityVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
  let svg = document.getElementById('diagram');

  let temp = document.getElementById('marker');
  if (temp) {
    temp.remove();
  }

  let startRho = rho + 400;


  let marker= document.createElementNS('http://www.w3.org/2000/svg',
      'marker');
  marker.setAttribute('id', 'triangle');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '0');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerUnits', 'strokeWidth');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('orient', 'auto');

  //let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  //path.setAttribute('d', `M ${rho2} ${z2} L 210 200 L 200 205 z`);
  //path.style.stroke = 'green';
  //path.style.strokeWidth = '5px';
  //svg.appendChild(path);

  let arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', `M ${rho},${z} L ${rho2} ${z2}`);
  arrow.style.stroke = 'black';
  arrow.style.strokeWidth = '2px';
  svg.appendChild(arrow);
  arrow.setAttributeNS('marker-end', 'triangle', 'void');
}

function accelCentVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
  let svg = document.getElementById('diagram');

  let temp = document.getElementById('marker');
  if (temp) {
    temp.remove();
  }

  let marker= document.createElementNS('http://www.w3.org/2000/svg',
      'marker');
  marker.setAttribute('id', 'triangle');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '0');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerUnits', 'strokeWidth');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('orient', 'auto');

  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${rho3} ${z2} L 210 200 L 200 205 z`);
  path.style.stroke = 'black';
  path.style.strokeWidth = '5px';
  svg.appendChild(path);

  let arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', `M ${rho2},${z2} L ${rho3} ${z2}`);
  arrow.style.stroke = 'red';
  arrow.style.strokeWidth = '2px';
  svg.appendChild(arrow);
  arrow.setAttributeNS('marker-end', 'triangle', 'void');
}

function apperantGravVector(rho, z, rho2, z2, rho3, gravRho, gravZ, s, polRad) {
  let svg = document.getElementById('diagram');

  let temp = document.getElementById('marker');
  if (temp) {
    temp.remove();
  }

  let marker= document.createElementNS('http://www.w3.org/2000/svg',
      'marker');
  marker.setAttribute('id', 'triangle');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '0');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerUnits', 'strokeWidth');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('orient', 'auto');

  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${rho3} ${z2} L 210 200 L 200 205 z`);
  path.style.stroke = 'black';
  path.style.strokeWidth = '5px';
  svg.appendChild(path);

  let arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', `M ${rho},${z} L ${rho3} ${z2}`);
  arrow.style.stroke = 'blue';
  arrow.style.strokeWidth = '2px';
  svg.appendChild(arrow);
  arrow.setAttributeNS('marker-end', 'triangle', 'void');
}



