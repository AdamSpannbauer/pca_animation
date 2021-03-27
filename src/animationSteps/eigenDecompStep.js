/* eslint-disable import/extensions */
import displayUtils from '../utils/displayUtils.js';
import plotUtils from '../utils/plotUtils.js';

// TODO: time release/progressively display info instead of all at once

export default function eigenDecompStep({
  centeredData, covarianceMatrix,
  eigVals, projectionMatrix, t,
  palette, dataTableFontSize = 15,
  dataTableX = null, dataTableY = null,
}) {
  push();
  scale(0.5, 0.5);
  translate(-width / 2, height / 2);

  plotUtils.drawAxes();
  plotUtils.plot2d(centeredData, palette);

  strokeWeight(10);
  if (t > 100) {
    stroke(palette[palette.length - 6]);
    line(
      0,
      0,
      projectionMatrix[0][1] * eigVals[1] * width,
      projectionMatrix[1][1] * eigVals[1] * width * 1.2,
    );
  }

  if (t > 50) {
    stroke(palette[palette.length - 3]);
    line(
      0,
      0,
      projectionMatrix[0][0] * eigVals[0] * width,
      projectionMatrix[1][0] * eigVals[0] * width * 1.2,
    );
  }
  pop();

  push();
  scale(1, -1);

  textSize(18);
  noStroke();
  fill(0);
  text('Covariance matrix:', dataTableX + textSize() * 0.5, dataTableY);
  fill(255, 100);
  displayUtils.displayTable2d(covarianceMatrix, dataTableX, dataTableY + textSize() * 1.5, palette);
  stroke(0);
  fill(0);
  line(-width * 0.2, dataTableY + 2 * textSize(), -width * 0.1, dataTableY + 2 * textSize());
  triangle(-width * 0.1,
    dataTableY + 2 * textSize() - 10,
    -width * 0.1, dataTableY + 2 * textSize() + 10, -width * 0.08, dataTableY + 2 * textSize());

  noStroke();
  if (t > 50) {
    text('Eigenvectors:', 0, dataTableY);
    fill(255, 100);
    displayUtils.displayTable2d(
      [[projectionMatrix[0][0]], [projectionMatrix[1][0]]],
      0, dataTableY + textSize() * 1.5, [palette[palette.length - 3], palette[palette.length - 3]],
    );
    if (t > 100) {
      displayUtils.displayTable2d(
        [[projectionMatrix[0][1]], [projectionMatrix[1][1]]],
        width * 0.2, dataTableY + textSize() * 1.5,
        [palette[palette.length - 6], palette[palette.length - 6]],
      );
    }
  }

  fill(0);
  if (t > 50) {
    text('Eigenvalues:', 0, dataTableY + textSize() * 5);
    fill(255, 100);
    displayUtils.displayTable2d(
      [[eigVals[0]]], 0, dataTableY + textSize() * 6.5, [palette[palette.length - 3]],
    );
    if (t > 100) {
      displayUtils.displayTable2d(
        [[eigVals[1]]], width * 0.2, dataTableY + textSize() * 6.5, [palette[palette.length - 6]],
      );
    }
  }

  fill(0);
  textSize(dataTableFontSize * 1.1);
  stroke(0);
  if (t > 150) {
    text(`total variance = Sum(Eigenvalues) = ${eigVals[0].toFixed(2)} + ${eigVals[1].toFixed(2)} = ~${(eigVals[0] + eigVals[1]).toFixed(2)}`, dataTableX + textSize() * 6, dataTableY + textSize() * 12.2);
  }

  text(`total variance = Var(x) + Var(y) = ${covarianceMatrix[0][0].toFixed(2)} + ${covarianceMatrix[1][1].toFixed(2)} = ~${(covarianceMatrix[0][0] + covarianceMatrix[1][1]).toFixed(2)}`, dataTableX + textSize() * 6, dataTableY + textSize() * 11);
  pop();

  fill(150);
  displayUtils.labelStep('Find the eigenvectors of the \ncovariance matrix');

  const isOver = t > 170;
  return isOver;
}
