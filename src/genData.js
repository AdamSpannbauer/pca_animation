function genData2d() {
  const nRows = 10;
  const minVal = -1;
  const maxVal = 1;

  const xMeanLow = -random(minVal, 0);
  const xMeanHi = -random(0, maxVal);
  const xStd = random(maxVal / 15, maxVal / 2);

  const yMeanLow = random(minVal, 0);
  const yMeanHi = random(0, maxVal);
  const yStd = random(maxVal / 15, maxVal / 2);

  let output = new Array(nRows);
  let xSum = 0;
  let ySum = 0;

  for (let r = 0; r < nRows; r += 1) {
    output[r] = new Array(2);

    const xMean = map(r, 0, nRows, xMeanLow, xMeanHi);
    const yMean = map(r, 0, nRows, yMeanLow, yMeanHi);

    const xVal = constrain(randomGaussian(xMean, xStd), minVal, maxVal);
    const yVal = constrain(randomGaussian(yMean, yStd), minVal, maxVal);

    xSum += xVal;
    ySum += yVal;

    output[r][0] = xVal;
    output[r][1] = yVal;
  }

  // sort by 1st column (will be x axis in plot)
  output = output.sort((x1, x2) => x2[0] - x1[0]);

  const xMean = xSum / nRows;
  const yMean = ySum / nRows;

  const centered = new Array(nRows);
  for (let r = 0; r < nRows; r += 1) {
    centered[r] = [
      (output[r][0] - xMean),
      (output[r][1] - yMean),
    ];
  }

  return [output, centered];
}

export default genData2d;
