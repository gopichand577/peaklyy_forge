const { createTempFile } = require("../../utils/createTempFile");
const { cleanupFile } = require("../../utils/cleanupFile");
const { executeCommand } = require("../../utils/executeCommand");

const executePython = async (code) => {
  const filePath = createTempFile("python", "py", code);

  console.log("Python file:", filePath);

  try {
    const command = `python -X utf8 "${filePath}"`;

    console.log("Running command:", command);

    const output = await executeCommand(command);

    cleanupFile(filePath);

    return output;
  } catch (err) {
    console.error("PYTHON COMPILER ERROR:");
    console.error(err);

    cleanupFile(filePath);

    throw err;
  }
};

module.exports = {
  executePython,
};