/* eslint-disable import/extensions */
import displayUtils from '../utils/displayUtils.js';
import plotUtils from '../utils/plotUtils.js';
import matUtils from '../utils/matUtils.js';

function zoomInPlot({
  dataStep, eigVals, currAngle, t, palette, zoomFrames = 50,
}) {
  push();
  const scl = map(t, 0, zoomFrames, 0.5, 1, true);
  scale(scl, scl);
  translate(-width * (1 - scl), height * (1 - scl));

  plotUtils.drawAxes();
  plotUtils.plot2d(dataStep, palette);

  noFill();
  rotate(currAngle);
  strokeWeight(5);

  stroke(palette[palette.length - 6]);
  line(0, 0, 0, eigVals[1] * width);

  stroke(palette[palette.length - 3]);
  line(0, 0, eigVals[0] * width, 0);
  pop();
}

export default function rotatingStep({
  projectedData, eigVals,
  currAngle, angleVel,
  t, zoomFrames = 50,
  palette, dataTableFontSize = 15,
  dataTableX = null, dataTableY = null,
}) {
  push();

  const rotMat = [
    [cos(-currAngle), -sin(-currAngle)],
    [sin(-currAngle), cos(-currAngle)],
  ];

  const dataStep = matUtils.matMul(projectedData, rotMat);

  zoomInPlot({
    dataStep, eigVals, currAngle, t, palette, zoomFrames,
  });

  if (t <= zoomFrames) {
    return [false, currAngle];
  }

  push();
  scale(1, -1);
  textSize(dataTableFontSize);

  displayUtils.displayTable2d(dataStep, dataTableX, dataTableY, palette);
  fill(0);
  text('Covariance matrix:', dataTableX + textSize(), -height / 2 + textSize() * 10);
  fill(255, 100);
  displayUtils.displayTable2d(
    matUtils.covarianceMatrix2d(dataStep),
    dataTableX,
    -height / 2 + textSize() * 12,
    palette,
  );
  pop();

  displayUtils.labelStep('Rotate to max variance axes');

  const newAngle = currAngle + angleVel;
  const isOver = abs(newAngle) <= abs(angleVel);

  return [isOver, newAngle];
}
