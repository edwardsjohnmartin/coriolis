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
  path.style.strokeWidth = '10px';
  svg.appendChild(path);

  let arrow= document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M 100 200 L 200 200');
  arrow.style.stroke = 'black';
  arrow.style.strokeWidth = '5px';
  svg.appendChild(arrow);
  arrow.setAttributeNS('marker-end', 'triangle', 'void');
}

function eccentricityChanged(){

  let svg = document.getElementById('diagram');

  let temp = document.getElementById('mytext');
  if (temp) {
    temp.remove();
  }

  let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', 585);
  text.setAttribute('y', 275);
  text.setAttribute('fill', 'red');
  text.setAttribute('id','mytext');
  svg.appendChild(text);

  let txt = document.getElementById("eccentricity").value;
  parseFloat('text', txt);
  text.innerHTML = txt;

  makeEllipse();

}

function makeEllipse() {
  let svg = document.getElementById('diagram');

  let ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  ellipse.setAttribute('d', 'M 400 200 a 75,150 90 1,0 1,0 z');
  ellipse.style.fill = 'white';
  ellipse.style.stroke = 'black';
  ellipse.style.strokeWidth = '5px';
  svg.appendChild(ellipse);

}
