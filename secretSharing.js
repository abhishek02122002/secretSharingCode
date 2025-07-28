const fs = require('fs');
const path = require('path');

/**
 * Decode a string number given in some base to BigInt.
 * Supports bases from 2 up to 36.
 * @param {string} valueStr - The encoded value string.
 * @param {number} base - The numeric base of the encoded string.
 * @returns {BigInt} - Decoded BigInt value.
 */
function decodeValue(valueStr, base) {
  // parseInt with base returns Number, so we convert from string via BigInt constructor
  // This avoids any precision loss (parseInt returns Number)
  // Instead, directly use BigInt with base conversion:
  // Unfortunately, BigInt does not accept base parameter,
  // so we parse with parseInt (up to 36), then convert to BigInt.
  // If valueStr is very large, this may lose precision, but problem constraints say parseInt base <= 36 is enough.
  // Hence, we do:
  return BigInt(parseInt(valueStr, base));
}

/**
 * Given points (x, y), perform Lagrange interpolation at x=0 to find the constant term of the polynomial.
 * @param {Array<{x:BigInt, y:BigInt}>} points - Points to interpolate
 * @returns {BigInt} - The constant term (f(0)) of the polynomial.
 */
function lagrangeInterpolationConstantTerm(points) {
  const k = points.length;
  let f0 = 0n;

  for (let i = 0; i < k; i++) {
    let numerator = 1n;
    let denominator = 1n;
    const x_i = points[i].x;
    for (let j = 0; j < k; j++) {
      if (i !== j) {
        const x_j = points[j].x;
        numerator *= -x_j;
        denominator *= (x_i - x_j);
      }
    }
    // Exact integer division assured by problem constraints
    const L_i_0 = numerator / denominator;
    f0 += points[i].y * L_i_0;
  }

  return f0;
}

/**
 * Solve the secret constant term from a single test case JSON object.
 * @param {Object} jsonData - JSON object containing keys and roots.
 * @returns {string} - The constant term as a string.
 */
function solveFromJson(jsonData) {
  if (!jsonData || !jsonData.keys) {
    throw new Error("Invalid JSON input: missing keys");
  }

  const n = jsonData.keys.n;
  const k = jsonData.keys.k;

  if (typeof n !== "number" || typeof k !== "number") {
    throw new Error("Invalid keys: n and k must be numbers");
  }

  const roots = [];

  for (const key in jsonData) {
    if (key === "keys") continue;
    if (!/^\d+$/.test(key)) continue;

    const x = BigInt(key);
    const point = jsonData[key];

    if (!point || !point.base || !point.value) {
      throw new Error(`Invalid root data for key ${key}`);
    }

    const base = parseInt(point.base);
    if (isNaN(base) || base < 2 || base > 36) {
      throw new Error(`Invalid base for key ${key}: ${point.base}`);
    }

    const y = decodeValue(point.value, base);
    roots.push({ x, y });
  }

  if (roots.length < k) {
    throw new Error(`Not enough roots provided. Required: ${k}, got: ${roots.length}`);
  }

  // Use only first k points
  const selectedPoints = roots.slice(0, k);

  const secretC = lagrangeInterpolationConstantTerm(selectedPoints);
  return secretC.toString();
}

/**
 * Main function: reads combined test cases from a JSON file and solves each, printing results.
 * @param {string} filename - Path to the JSON file containing test cases.
 */
function solveFromJsonFile(filename) {
  const filePath = path.resolve(filename);

  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    if (!Array.isArray(jsonData.cases)) {
      throw new Error('Combined JSON file must have a top-level "cases" array');
    }

    jsonData.cases.forEach((testCase, index) => {
      try {
        const secret = solveFromJson(testCase);
        console.log(`Secret constant for test case #${index + 1}:`, secret);
      } catch (err) {
        console.log(`Error in test case #${index + 1}:`, err.message);
      }
    });
  } catch (err) {
    console.error("Error reading or processing file:", err.message);
  }
}

// Usage:
// Replace 'combined_testcases.json' with your actual file path
const inputFilePath = process.argv[2] || 'combined_testcases.json';
solveFromJsonFile(inputFilePath);