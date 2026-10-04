const fs = require("fs");
const path = require("path");
const { executeCommand } = require("../../utils/executeCommand");

const executeJava = async (code) => {
  const tempDir = path.join(__dirname, "..", "..", "temp", "java");

  fs.mkdirSync(tempDir, { recursive: true });

  const className = "Main";
  const filePath = path.join(tempDir, `${className}.java`);

  fs.writeFileSync(filePath, code);

  try {
    // Compile
    await executeCommand(`javac "${filePath}"`);

    // Run
    const output = await executeCommand(
      `java -cp "${tempDir}" ${className}`
    );

    return output;
  } finally {
    // Cleanup
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const classFile = path.join(tempDir, `${className}.class`);
    if (fs.existsSync(classFile)) {
      fs.unlinkSync(classFile);
    }
  }
};

module.exports = {
  executeJava,
};