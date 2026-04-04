const { exec } = require("child_process");

function runPrediction(day) {
  return new Promise((resolve, reject) => {
    const cmd = `python backend/ml/predict.py ${day}`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) return reject(stderr);

      const result = parseFloat(stdout.trim());

      if (isNaN(result)) {
        return reject("Invalid output from Python");
      }

      resolve(result);
    });
  });
}

module.exports = { runPrediction };