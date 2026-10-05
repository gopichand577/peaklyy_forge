const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");
const { detectJava } = require("../config/languages");

const JDK_DIR = path.join(__dirname, "..", "runtimes", "jdk");

// Direct URLs for Adoptium Eclipse Temurin JDK 17
const JDK_URLS = {
  "linux-x64": "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_linux_hotspot_17.0.10_7.tar.gz",
  "linux-arm64": "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_aarch64_linux_hotspot_17.0.10_7.tar.gz",
  "darwin-x64": "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_mac_hotspot_17.0.10_7.tar.gz",
  "darwin-arm64": "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_aarch64_mac_hotspot_17.0.10_7.tar.gz",
  "win32-x64": "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.10_7.zip",
};

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = (currentUrl) => {
      https
        .get(currentUrl, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return request(response.headers.location);
          }
          if (response.statusCode !== 200) {
            return reject(new Error(`Failed to download JDK: HTTP ${response.statusCode}`));
          }
          response.pipe(file);
          file.on("finish", () => {
            file.close(() => resolve(destPath));
          });
        })
        .on("error", (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
    };
    request(url);
  });
}

async function installJdk() {
  const current = detectJava();
  if (current.available) {
    console.log(`[JDK Setup] Java JDK is already available at: ${current.javac}`);
    return;
  }

  const platformKey = `${process.platform}-${process.arch}`;
  const downloadUrl = JDK_URLS[platformKey] || JDK_URLS["linux-x64"];

  console.log(`[JDK Setup] JDK not found. Installing JDK 17 for ${platformKey}...`);
  console.log(`[JDK Setup] Download source: ${downloadUrl}`);

  if (!fs.existsSync(JDK_DIR)) {
    fs.mkdirSync(JDK_DIR, { recursive: true });
  }

  const isZip = downloadUrl.endsWith(".zip");
  const tempArchive = path.join(__dirname, "..", "runtimes", isZip ? "jdk_temp.zip" : "jdk_temp.tar.gz");

  try {
    await downloadFile(downloadUrl, tempArchive);
    console.log(`[JDK Setup] Download complete. Extracting archive...`);

    if (process.platform === "win32") {
      const tmpExtract = `${JDK_DIR}_tmp`;
      if (fs.existsSync(tmpExtract)) {
        fs.rmSync(tmpExtract, { recursive: true, force: true });
      }
      execSync(`powershell -Command "Expand-Archive -Path '${tempArchive}' -DestinationPath '${tmpExtract}' -Force"`);
      const entries = fs.readdirSync(tmpExtract);
      const innerFolder = entries.find((e) => fs.statSync(path.join(tmpExtract, e)).isDirectory());
      const sourceDir = innerFolder ? path.join(tmpExtract, innerFolder) : tmpExtract;

      execSync(`powershell -Command "Copy-Item -Path '${sourceDir}\\*' -Destination '${JDK_DIR}' -Recurse -Force"`);
      fs.rmSync(tmpExtract, { recursive: true, force: true });
    } else {
      execSync(`tar -xzf "${tempArchive}" -C "${JDK_DIR}" --strip-components=1`);
      execSync(`chmod -R +x "${JDK_DIR}/bin"`);
      if (fs.existsSync(path.join(JDK_DIR, "lib"))) {
        try {
          execSync(`chmod -R +x "${JDK_DIR}/lib"`);
        } catch (e) {}
      }
    }

    if (fs.existsSync(tempArchive)) {
      fs.unlinkSync(tempArchive);
    }

    const verified = detectJava();
    if (verified.available) {
      console.log(`[JDK Setup] ✅ JDK successfully installed! javac: ${verified.javac}`);
    } else {
      console.error(`[JDK Setup] ⚠️ JDK extracted but detection failed.`);
    }
  } catch (err) {
    console.error(`[JDK Setup] ❌ Failed to install JDK:`, err.message);
    if (fs.existsSync(tempArchive)) {
      fs.unlinkSync(tempArchive);
    }
  }
}

if (require.main === module) {
  installJdk();
}

module.exports = { installJdk };
