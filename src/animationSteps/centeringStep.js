/* eslint-disable import/extensions */
import displayUtils from '../utils/displayUtils.js';
import plotUtils from '../utils/plotUtils.js';

export default function centeringStep({
  data, centeredData, palette, t,
  centeringFrames = 100, dataTableFontSize = 15,
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

  displayUtils.labelStep('Center');

  const dataStep = plotUtils.animatePoints(data, centeredData, t, 0, centeringFrames);

  plotUtils.drawAxes();
  plotUtils.plot2d(dataStep, palette);

  push();
  scale(1, -1);
  textSize(dataTableFontSize);
  displayUtils.displayTable2d(dataStep, dataTableX, dataTableY, palette);
  pop();

  const isOver = t >= centeringFrames;
  return isOver;
}
