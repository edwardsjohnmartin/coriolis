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

}

function eccentricityChanged() {
  console.log("changed");
}
