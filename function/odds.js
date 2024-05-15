exports.americanToDecimal = (american) => {
    let dec = 0;
    if (american > 0) {
        dec = (american / 100) + 1;
    } else if (american < 0) {
        dec = (100 / Math.abs(american)) + 1;
    }

    return dec.toFixed(2);
}


exports.decimalToAmerican = (dec) => {
    let american = 0;
    if (dec >= 2) {
        american = (dec - 1) * 100;
    } else if (dec < 2) {
        american = -100 / (dec - 1);
    }

    if (american >= 0) {
        return Math.floor(american + 0.5);
    } else {
        return Math.ceil(american - 0.5);
    }
}
