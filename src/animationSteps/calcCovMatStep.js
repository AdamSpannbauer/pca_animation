/* eslint-disable import/extensions */
import displayUtils from '../utils/displayUtils.js';
import plotUtils from '../utils/plotUtils.js';

// TODO: time release/progressively display info instead of all at once

function zoomOutPlot({
  centeredData, t, palette, zoomFrames = 50,
}) {
  const scl = map(t, 0, zoomFrames, 1, 0.5, true);
  scale(scl, scl);
  translate(-width * (1 - scl), height * (1 - scl));

  plotUtils.drawAxes();
  plotUtils.plot2d(centeredData, palette);
}

export default function calcCovMatStep({
  centeredData, covarianceMatrix, palette,
  t, zoomFrames = 50, dataTableFontSize = 15,
  dataTableX = null, dataTableY = null,
}) {
  if (dataTableX === null) {
    // eslint-disable-next-line no-param-reassign
    dataTableX = -width / 2;
  }

  if (dataTableY === null) {
    // eslint-disable-next-line no-param-reassign
    dataTableY = dataTableFontSize * 2;
  }

  push();
  zoomOutPlot({
    centeredData, t, palette, zoomFrames,
  });

  if (t <= zoomFrames) {
    const isOver = false;
    pop();
    return isOver;
  }

  strokeWeight(10);
  stroke(palette[palette.length - 3]);
  line(0, 0, covarianceMatrix[0][0] * width, 0);
  stroke(palette[palette.length - 6]);
  line(0, 0, 0, covarianceMatrix[1][1] * width);

  pop();

  push();
  scale(1, -1);

  textSize(18);
  displayUtils.displayTable2d([
    ['Cov(x, x)', 'Cov(x, y)'],
    ['Cov(y, x)', 'Cov(y, y)'],
  ], dataTableX - textSize() / 2, dataTableY, palette);

  fill(palette[palette.length - 3]);
  stroke(palette[palette.length - 3]);
  text(`Cov(x, x) = Var(x) = ${covarianceMatrix[0][0].toFixed(2)}`, dataTableX + textSize() * 9, dataTableY + textSize() * 4);
  fill(palette[palette.length - 6]);
  stroke(palette[palette.length - 6]);
  text(`Cov(y, y) = Var(y) = ${covarianceMatrix[1][1].toFixed(2)}`, dataTableX + textSize() * 9, dataTableY + textSize() * 5.2);

  fill(0);
  stroke(0);
  text(`Cov(x, y) = Cov(y, x) = ${covarianceMatrix[0][1].toFixed(2)}`, dataTableX + textSize() * 9, dataTableY + textSize() * 6.3);

  line(dataTableX + textSize() * 12, 2 * textSize(), 0, 2 * textSize());
  triangle(0, 2 * textSize() - 10, 0, 2 * textSize() + 10, width * 0.02, 2 * textSize());
  noStroke();
  fill(255, 100);
  displayUtils.displayTable2d(covarianceMatrix, 30, dataTableY, palette);
  textSize(dataTableFontSize);
  fill(0);
  text(`total variance = Var(x) + Var(y) = ${covarianceMatrix[0][0].toFixed(2)} + ${covarianceMatrix[1][1].toFixed(2)} = ~${(covarianceMatrix[0][0] + covarianceMatrix[1][1]).toFixed(2)}`, dataTableX + textSize() * 7, dataTableY + textSize() * 11);
  fill(255, 100);
  pop();
  displayUtils.labelStep('Calculate covariance matrix');

  const isOver = true;
  return isOver;
}
