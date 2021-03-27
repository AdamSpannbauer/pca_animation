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

  if (t > zoomFrames + 50) {
    // Variance scaled line on x axis
    strokeWeight(10);
    stroke(palette[palette.length - 3]);
    line(0, 0, covarianceMatrix[0][0] * width, 0);
  }

  if (t > zoomFrames + 150) {
    // Variance scaled line on y axis
    strokeWeight(10);
    stroke(palette[palette.length - 6]);
    line(0, 0, 0, covarianceMatrix[1][1] * width);
  }
  pop();

  push();
  scale(1, -1);

  textSize(18);
  displayUtils.displayTable2d([
    ['Cov(x, x)', 'Cov(x, y)'],
    ['Cov(y, x)', 'Cov(y, y)'],
  ], dataTableX - textSize() / 2, dataTableY, palette);

  const displayCovMat = [['', ''], ['', '']];

  if (t > zoomFrames + 50) {
    // Arrow to calc-ed table
    push();
    fill(0);
    line(dataTableX + textSize() * 12, 2 * textSize(), 0, 2 * textSize());
    triangle(0, 2 * textSize() - 10, 0, 2 * textSize() + 10, width * 0.02, 2 * textSize());
    pop();
  }

  if (t > zoomFrames + 50) {
    // Calc var(x)
    fill(palette[palette.length - 3]);
    stroke(palette[palette.length - 3]);
    text(`Cov(x, x) = Var(x) = ${covarianceMatrix[0][0].toFixed(2)}`, dataTableX + textSize() * 9, dataTableY + textSize() * 4);
    displayCovMat[0][0] = covarianceMatrix[0][0].toFixed(2);
  }

  if (t > zoomFrames + 150) {
    // Calc var(y)
    fill(palette[palette.length - 6]);
    stroke(palette[palette.length - 6]);
    text(`Cov(y, y) = Var(y) = ${covarianceMatrix[1][1].toFixed(2)}`, dataTableX + textSize() * 9, dataTableY + textSize() * 5.2);
    displayCovMat[1][1] = covarianceMatrix[1][1].toFixed(2);
  }

  noStroke();
  if (t > zoomFrames + 50) {
    // covariance mat
    fill(255, 100);
    displayUtils.displayTable2d(
      displayCovMat, 30, dataTableY,
      [palette[palette.length - 3], palette[palette.length - 6]],
    );
  }

  if (t > zoomFrames + 225) {
    // Calc cov(x, y)
    fill(0);
    stroke(0);
    text(`Cov(x, y) = Cov(y, x) = ${covarianceMatrix[0][1].toFixed(2)}`, dataTableX + textSize() * 9, dataTableY + textSize() * 6.3);

    displayCovMat[0][0] = '';
    displayCovMat[1][1] = '';
    displayCovMat[0][1] = covarianceMatrix[0][1].toFixed(2);
    displayCovMat[1][0] = covarianceMatrix[0][1].toFixed(2);

    fill(255, 0);
    displayUtils.displayTable2d(
      displayCovMat, 30, dataTableY,
      [0, 0],
    );
  }

  if (t > zoomFrames + 275) {
    textSize(dataTableFontSize * 1.1);
    fill(0);
    text(`total variance = Var(x) + Var(y) = ${covarianceMatrix[0][0].toFixed(2)} + ${covarianceMatrix[1][1].toFixed(2)} = ~${(covarianceMatrix[0][0] + covarianceMatrix[1][1]).toFixed(2)}`, dataTableX + textSize() * 6, dataTableY + textSize() * 11);
    fill(255, 100);
  }

  pop();

  displayUtils.labelStep('Calculate covariance matrix');

  const isOver = t > zoomFrames + 320;
  return isOver;
}
