function init() {
  let svg = document.getElementById('diagram');

  let ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  ellipse.setAttribute('d', 'M 600 200 a 75,150 90 1,0 1,0');
  ellipse.style.stroke = 'black';
  ellipse.style.strokeWidth = '5px';
  svg.appendChild(ellipse);

  let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.innerHTML = 'Cade';
  text.setAttribute('x', 600);
  text.setAttribute('y', 250);
  text.setAttribute('fill', 'red');
  svg.appendChild(text);

  let marker= document.createElement('http://www.w3.org/2000/svg',
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
  marker.appendChild(path);
  path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  svg.appendChild(marker);

  let arrow= document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M 100 200 L 200 0');
  arrow.style.stroke = 'black';
  arrow.style.strokeWidth = '5px';
  arrow.setAttributeNS('marker-end', 'url(#triangle)');
}

function eccentricityChanged() {
  let str = document.getElementById("text").value;
  console.log("changed");
}
