function init() {
  let svg = document.getElementById('diagram');

  var ellipse = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  ellipse.setAttribute("d","M 0 0 L 100 200"); //Set path's data
  ellipse.style.stroke = "#000"; //Set stroke colour
  ellipse.style.strokeWidth = "5px"; //Set stroke width
  svg.appendChild(ellipse);
}

