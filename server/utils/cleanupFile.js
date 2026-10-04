const fs = require("fs");

const cleanupFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

module.exports = {
    cleanupFile
};