function eccentricityChanged(){

  let svg = document.getElementById('diagram');

  let temp = document.getElementById('mytext');
  if (temp) {
    temp.remove();
  }

  let s = 0.5;
  let omega = 1;
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

  makeEllipse();

}

function makeEllipse() {
  let svg = document.getElementById('diagram');

  let temp = document.getElementById('mydiagram');
  if (temp) {
    temp.remove();
  }

  let ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  ellipse.setAttribute('d', 'M 400 200 a 100,200 90 1,0 1,0 z');
  ellipse.style.fill = 'white';
  ellipse.style.stroke = 'black';
  ellipse.style.strokeWidth = '5px';
  ellipse.setAttribute('id', 'mydiagram');
  svg.appendChild(ellipse);
}

function init() {
  let svg = document.getElementById('diagram');

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

  let path = document.createElementNS('http://www.w3.org/2000/svg',
      'path');
  path.setAttribute('d', 'M 200 195 L 210 200 L 200 205 z');
  path.style.stroke = 'black';
  path.style.strokeWidth = '5px';
  svg.appendChild(path);

  let arrow= document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M 150 200 L 200 200');
  arrow.style.stroke = 'black';
  arrow.style.strokeWidth = '2px';
  svg.appendChild(arrow);
  arrow.setAttributeNS('marker-end', 'triangle', 'void');

}

