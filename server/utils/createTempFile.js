const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const createTempFile = (folder, extension, code) => {
    const tempDir = path.join(__dirname, "..", "temp", folder);

    fs.mkdirSync(tempDir, { recursive: true });

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, code);

    return filePath;
};

module.exports = {
    createTempFile
};