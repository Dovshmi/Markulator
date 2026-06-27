export function inchesToMm(inches) {
  return inches * 25.4;
}

export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function deviation(roundedNumber, nonRoundedNumber) {
  if (roundedNumber > nonRoundedNumber) return true;
  if (roundedNumber < nonRoundedNumber) return false;
  return 'same';
}

export function calculatePlusMinusTolerance(nominalIn, posTolIn, negTolIn) {
  const nominalMmExact = inchesToMm(nominalIn);
  const posTolMmExact = inchesToMm(posTolIn);
  const negTolMmExact = inchesToMm(negTolIn);

  let nominalMm = round2(nominalMmExact);
  let posTolMm = round2(posTolMmExact);
  let negTolMm = round2(negTolMmExact);

  const devNonRoundedPlus = nominalMmExact + posTolMmExact;
  const devRoundedPlus = round2(nominalMm + posTolMm);

  const devNonRoundedMinus = nominalMmExact - negTolMmExact;
  const devRoundedMinus = round2(nominalMm - negTolMm);

  if (deviation(devRoundedPlus, devNonRoundedPlus) === true) {
    if (posTolMm > 0) {
      posTolMm = round2(posTolMm - 0.01);
    } else {
      nominalMm = round2(nominalMm - 0.01);
    }
  }

  if (deviation(devRoundedMinus, devNonRoundedMinus) === false) {
    if (negTolMm > 0) {
      negTolMm = round2(negTolMm - 0.01);
    } else {
      nominalMm = round2(nominalMm + 0.01);
    }
  }

  return {
    nominalMm,
    posTolMm,
    negTolMm,
    maxLimitMm: round2(nominalMm + posTolMm),
    minLimitMm: round2(nominalMm - negTolMm),
  };
}

export function calculateMaxMinTolerance(maxTotalIn, minTotalIn) {
  const maxMmExact = inchesToMm(maxTotalIn);
  const minMmExact = inchesToMm(minTotalIn);

  let maxMm = round2(maxMmExact);
  let minMm = round2(minMmExact);

  if (deviation(maxMm, maxMmExact) === true) {
    maxMm = round2(maxMm - 0.01);
  }
  if (deviation(minMm, minMmExact) === false) {
    minMm = round2(minMm + 0.01);
  }

  return {
    maxMm,
    minMm,
    rangeMm: round2(maxMm - minMm),
  };
}
