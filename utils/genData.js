function genData2d(nRows) {
  const xMeanLow = -random(-1, 0);
  const xMeanHi = -random(0, 1);
  const xStd = random(1 / 15, 1 / 2);

  const yMeanLow = random(-1, 0);
  const yMeanHi = random(0, 1);
  const yStd = random(1 / 15, 1 / 2);

  const safeNRows = nRows || 10;

  let output = new Array(safeNRows);
  let xSum = 0;
  let ySum = 0;

  for (let r = 0; r < safeNRows; r += 1) {
    output[r] = new Array(2);

    const xMean = map(r, 0, safeNRows, xMeanLow, xMeanHi);
    const yMean = map(r, 0, safeNRows, yMeanLow, yMeanHi);

    const xVal = randomGaussian(xMean, xStd);
    const yVal = randomGaussian(yMean, yStd);

    xSum += xVal;
    ySum += yVal;

    output[r][0] = xVal;
    output[r][1] = yVal;
  }

  output = output.sort((x1, x2) => x2[0] - x1[0]);

  const xMean = xSum / safeNRows;
  const yMean = ySum / safeNRows;

  const centered = new Array(safeNRows);
  for (let r = 0; r < safeNRows; r += 1) {
    centered[r] = [
      (output[r][0] - xMean),
      (output[r][1] - yMean),
    ];
  }

  return [output, centered];
}

export default genData2d;
