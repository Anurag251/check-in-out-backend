const fs = require("node:fs/promises");
const path = require("node:path");

const checkAndCreateFolder = async (folderName) => {
  try {
    const folderPath = path.join(__dirname, "../", folderName);

    await fs.stat(folderPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        const folderPath = path.join(__dirname, "../", folderName);
        await fs.mkdir(folderPath, { recursive: true });
      } catch (err) {}
    }
  }
};

module.exports = checkAndCreateFolder;
