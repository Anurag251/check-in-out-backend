const express = require("express");
const cors = require("cors");
const moment = require("moment-timezone");
const mongoose = require("mongoose");
const path = require("node:path");
const jwt = require('jsonwebtoken');
const bodyparser = require('body-parser')
const XLSX = require("xlsx");
const searchForUserInMainFile = require("./middleware/searchForUserInMainFile");
const saveTheUserToUserCheckedFile = require("./middleware/saveTheUserToUserCheckedFile");
const checkAndCreateFolder = require("./middleware/checkAndCreateFolder");
const checkIfUserExistsInCheckedFile = require("./utils/checkIfUserExistsInCheckedFile");
const Checkin = require("./models/checkin");
const Users = require("./models/users");
const authenticateToken = require("./middleware/authenticateToken");
const { TOKEN_SECRET } = require("./utils/constants");

const app = express();
const port = 3000;

const dbURI = "mongodb://localhost:27017/checkinout";

const timezone = "asia/kathmandu";
const folderName = "checked_users";
app.use(bodyparser.json());

app.use(cors());

checkAndCreateFolder(folderName);

const workbook = XLSX.readFile("./registeredUsers.xlsx");
const sheet_name_list = workbook.SheetNames;
const registeredUsers = XLSX.utils.sheet_to_json(
  workbook.Sheets[sheet_name_list[0]]
);

app.post('/login',(req,res)=>{
   Users.find({username,password}).then((doc)=>{
    const payload = {username:doc.username,role:doc.role,email:doc.email,phone:doc.phone}
    const token = jwt.sign(payload,TOKEN_SECRET,{expiresIn:'1d'})
    return res.json({token})
   }).catch((reson)=>{
    return res.json({message:'Username or password doesn\'t match'}).status(404)
   })
})

// you can adjust this middelware as your need
app.use(authenticateToken)
app.get("/:id", (req, res) => {
  const role = req.userRole
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Id.",
      });
    }

    let user = registeredUsers[id - 1];

    if (user === undefined || user === null || typeof user === undefined) {
      const [found, foundUser] = searchForUserInMainFile(registeredUsers, id);
      if (found) {
        user = foundUser;
      }
      if (!found) {
        return res.status(404).json({
          status: false,
          message: "User not found.",
        });
      }
    }

    const qrcode = user["QR Scan"];

    if (qrcode === undefined || qrcode === null || typeof user === undefined) {
      return res.status(500).json({
        status: false,
        message: "QR code doesn't exist.",
      });
    }

    if (parseInt(qrcode.split("/").pop()) !== parseInt(id)) {
      const [found, foundUser] = searchForUserInMainFile(registeredUsers, id);

      if (found) {
        user = foundUser;
      }
      if (!found) {
        return res.status(404).json({
          status: false,
          message: "User not found.",
        });
      }
    }

    const currentDate = moment().tz(timezone).format("YYYY-MM-DD");

    const directoryPath = path.join(__dirname, folderName);
    const filename = `${currentDate}.xlsx`;
    const filePath = path.join(directoryPath, filename);

    const [found, checkedIn] = checkIfUserExistsInCheckedFile(filePath, user);

    if (found && checkedIn) {
      return res.status(200).json({
        status: false,
        message: "User has been checked in.",
        user: user,
      });
    }

    if (found && !checkedIn) {
      return res.status(200).json({
        status: true,
        message: "User hasn't been checked in.",
        user: user,
      });
    }

    return res.status(404).json({
      status: false,
      message: "User not found.",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
    });
  }
});
app.post("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Id.",
      });
    }

    const user = registeredUsers[id - 1];

    if (user === undefined || user === null || typeof user === undefined) {
      const [found, user] = searchForUserInMainFile(registeredUsers, id);
      if (found) {
        const status = await saveTheUserToUserCheckedFile(
          user,
          timezone,
          folderName
        );
        console.log(user);

        if (status) {
          return res.status(200).json({
            status: true,
            message: "User checked in.",
          });
        }

        if (!status) {
          return res.status(200).json({
            status: false,
            message: "User has been checked in.",
          });
        }
      }
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    const qrcode = user["QR Scan"];

    if (qrcode === undefined || qrcode === null || typeof user === undefined) {
      return res.status(500).json({
        status: false,
        message: "QR code doesn't exist.",
      });
    }

    if (parseInt(qrcode.split("/").pop()) !== parseInt(id)) {
      const [found, user] = searchForUserInMainFile(registeredUsers, id);
      if (found) {
        const status = await saveTheUserToUserCheckedFile(
          user,
          timezone,
          folderName
        );
        if (status) {
          return res.status(200).json({
            status: true,
            message: "User checked in.",
          });
        }

        if (!status) {
          return res.status(200).json({
            status: false,
            message: "User has been checked in.",
          });
        }
      }
    }

    if (parseInt(qrcode.split("/").pop()) === parseInt(id)) {
      const status = await saveTheUserToUserCheckedFile(
        user,
        timezone,
        folderName
      );

      if (status) {
        return res.status(200).json({
          status: true,
          message: "User checked in.",
        });
      }

      if (!status) {
        return res.status(200).json({
          status: false,
          message: "User has been checked in.",
        });
      }
    }

    return res.status(404).json({
      status: false,
      message: "User not found.",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
    });
  }
});
app.put("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Id.",
      });
    }

    const currentDate = moment().tz(timezone).format("YYYY-MM-DD");

    const directoryPath = path.join(__dirname, folderName);
    const filename = `${currentDate}.xlsx`;
    const filePath = path.join(directoryPath, filename);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const checkedInUsers = XLSX.utils.sheet_to_json(worksheet);

    let found = false;
    let userIndex = -1;

    for (let i = 0; i < checkedInUsers.length; i++) {
      const qrcode = checkedInUsers[i]["QR Scan"];
      if (parseInt(qrcode.split("/").pop()) === parseInt(id)) {
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

    checkedInUsers[userIndex].checkedIn = false;

    const updatedWorksheet = XLSX.utils.json_to_sheet(checkedInUsers);
    const updatedWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(updatedWorkbook, updatedWorksheet, sheetName);

    XLSX.writeFile(updatedWorkbook, filePath);

    return res.status(200).json({
      status: true,
      message: "User checked out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
    });
  }
});





mongoose
  .connect(dbURI)
  .then(() =>
    app.listen(port, () => {
      console.log(`http://localhost:${port}`);
    })
  )
  .catch((err) => console.log(err));
