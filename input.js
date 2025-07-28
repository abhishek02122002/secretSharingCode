const fs = require('fs');
const path = require('path');

// Convert base-b string to BigInt decimal
function baseToDecimal(value, base) {
    return BigInt(parseInt(value, base));
}

// Perform Lagrange Interpolation to find f(0)
function lagrangeInterpolation(points) {
    let result = 0n;

    for (let j = 0; j < points.length; j++) {
        let [xj, yj] = points[j];
        let numerator = 1n;
        let denominator = 1n;

        for (let m = 0; m < points.length; m++) {
            if (m !== j) {
                let xm = BigInt(points[m][0]);
                numerator *= -xm;
                denominator *= (BigInt(xj) - xm);  // ✅ FIXED BigInt conversion
            }
        }

        let term = yj * numerator / denominator;
        result += term;
    }

    return result;
}

// Reads a JSON file and returns the secret 'c'
function getSecretFromFile(filename) {
    const filePath = path.join(__dirname, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const k = data.keys.k;
    const points = [];

    let count = 0;
    for (let key in data) {
        if (key === 'keys') continue;
        if (count >= k) break;

        let x = parseInt(key);
        let base = parseInt(data[key].base);
        let value = data[key].value.toLowerCase();
        let y = baseToDecimal(value, base);

        points.push([x, y]);
        count++;
    }

    const secret = lagrangeInterpolation(points);
    return secret.toString();
}

// Main
const secret1 = getSecretFromFile('input1.json');
const secret2 = getSecretFromFile('input2.json');

console.log("Secret for Test Case 1:", secret1);
console.log("Secret for Test Case 2:", secret2);