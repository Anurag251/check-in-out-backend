const fs = require("node:fs");
const xlsx = require("xlsx");

const checkIfUserExistsInCheckedFile = (filePath, user) => {
  if (!fs.existsSync(filePath)) {
    return [false, false];
  }

  const fileContent = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileContent, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const existingUsers = xlsx.utils.sheet_to_json(worksheet);

  const foundUser = existingUsers.find(
    (existingUser) => existingUser.Email === user.Email
  );

  return [
    foundUser === undefined ? false : true,
    foundUser === undefined ? false : foundUser.checkedIn,
  ];
};

module.exports = checkIfUserExistsInCheckedFile;
