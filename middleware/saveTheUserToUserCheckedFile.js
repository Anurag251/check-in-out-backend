const fs = require("node:fs");
const path = require("node:path");
const moment = require("moment-timezone");
const xlsx = require("xlsx");

const checkIfUserExistsInCheckedFile = require("../utils/checkIfUserExistsInCheckedFile");
const Checkin = require("../models/checkin");

const saveTheUserToUserCheckedFile = async (user, timezone, folderName) => {
  try {
    const currentDate = moment().tz(timezone).format("YYYY-MM-DD");
    const currentTime = moment().tz(timezone).format("hh:mm:ss A");

    const directoryPath = path.join(__dirname, "../", folderName);
    const filename = `${currentDate}.xlsx`;
    const filePath = path.join(directoryPath, filename);

    const [found, checkedIn] = checkIfUserExistsInCheckedFile(filePath, user);
    if (found && checkedIn) {
      return false;
    }
    if (found && checkedIn === false) {
      //check in
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const checkedInUsers = xlsx.utils.sheet_to_json(worksheet);

      let found = false;
      let userIndex = -1;

      for (let i = 0; i < checkedInUsers.length; i++) {
        const qrcode = checkedInUsers[i]["QR Scan"];
        if (
          parseInt(qrcode.split("/").pop()) ===
          parseInt(user["QR Scan"].split("/").pop())
        ) {
          found = true;
          userIndex = i;
          break;
        }
      }

      if (!found) {
        return res.status(404).json({
          status: false,
          message: "User not found.",
        });
      }

      if (found && !checkedIn) {
        // Check-in logic
        checkedInUsers[userIndex].checkedIn = true;
        checkedInUsers[userIndex]["Checked In"] = currentTime;

        const updatedWorksheet = xlsx.utils.json_to_sheet(checkedInUsers);
        const updatedWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(
          updatedWorkbook,
          updatedWorksheet,
          sheetName
        );

        xlsx.writeFile(updatedWorkbook, filePath);

        return true; // User checked in successfully
      }
    }

    let workbook;
    let sheetData = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath);
      workbook = xlsx.read(fileContent, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    } else {
      sheetData.push([
        "Name",
        "Email",
        "Phone Number",
        "Club Name",
        "QR Scan",
        "Spouse QR",
        "Checked In",
        "Checked Out",
        "checkedIn",
      ]);
    }

    sheetData.push([
      user.Name || "-",
      user.Email || "-",
      user["Phone Number"] || "-",
      user["Club Name"] || "-",
      user["QR Scan"] || "-",
      user["Spouse QR"] || "-",
      user.checkedIn ? user["Checked In"] || currentTime : "-",
      !user.checkedIn ? user["Checked Out"] || currentTime : "-",
      true,
    ]);

    const newWorkbook = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(sheetData);
    xlsx.utils.book_append_sheet(newWorkbook, ws);

    const newWorkbookBuffer = xlsx.write(newWorkbook, {
      bookType: "xlsx",
      type: "buffer",
    });
    fs.writeFileSync(filePath, newWorkbookBuffer);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = saveTheUserToUserCheckedFile;
