/* eslint-disable import/extensions */
import displayUtils from '../utils/displayUtils.js';
import plotUtils from '../utils/plotUtils.js';
import matUtils from '../utils/matUtils.js';

export default function rotatingStep({
  projectedData, eigVals,
  currAngle, angleVel,
  palette, dataTableFontSize = 15,
  dataTableX = null, dataTableY = null,
}) {
  push();
  plotUtils.drawAxes();

  const rotMat = [
    [cos(-currAngle), -sin(-currAngle)],
    [sin(-currAngle), cos(-currAngle)],
  ];

  const dataStep = matUtils.matMul(projectedData, rotMat);

  plotUtils.plot2d(dataStep, palette);

  noFill();
  rotate(currAngle);
  strokeWeight(5);

  stroke(palette[palette.length - 6]);
  line(0, 0, 0, eigVals[1] * width);

  stroke(palette[palette.length - 3]);
  line(0, 0, eigVals[0] * width, 0);

  // strokeWeight(3);
  // stroke('#fde7254D');
  // ellipse(0, 0, eigVals[0] * width * 2, eigVals[1] * width * 2);

  pop();

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
