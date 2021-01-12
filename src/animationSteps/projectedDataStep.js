/* eslint-disable import/extensions */
import displayUtils from '../utils/displayUtils.js';
import plotUtils from '../utils/plotUtils.js';

export default function projectedDataStep({ projectedData, palette }) {
  displayUtils.labelStep('Data plotted on\n\'Principal Axes\'');
  plotUtils.drawAxes();
  plotUtils.plot2d(projectedData, palette);
}
