const express = require("express");
const cors = require("cors");
const moment = require("moment-timezone");
const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const jwt = require("jsonwebtoken");
const RegisteredUsers = require("./models/RegisteredUsers");
const CheckedInUsers = require("./models/CheckedInUsers");
const Users = require("./models/Users");
const authenticateToken = require("./middleware/authenticateToken");
const { TOKEN_SECRET } = require("./utils/constants");

const app = express();
const port = 3000;

const timezone = "Asia/Kathmandu";

app.use(cors());
app.use(express.json());

mongoose.connect(
  // "mongodb+srv://Anurag251:aSOPrOrdf05ngvDb@checkinout.zllsfhq.mongodb.net/?retryWrites=true&w=majority&appName=Checkinout"
  "mongodb://localhost:27017/checkinout",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const qrScanLink =
  "https://rotarydistrict3292.org.np/vieweventregistrationdetails/";

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  Users.findOne({ username, password })
    .then((doc) => {
      console.log(doc);
      if (!doc) {
        return res
          .status(404)
          .json({ message: "Username or password doesn't match" });
      }

      const payload = {
        username: doc.username,
        role: doc.role,
        email: doc.email,
        phone: doc.phone,
      };

      const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "1d" });
      return res.json({ token });
    })
    .catch((reason) => {
      console.error(reason);
      return res.status(500).json({ message: "Internal server error" });
    });
});

// app.use(authenticateToken);

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const workBook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workBook.SheetNames[0];
    const workSheet = workBook.Sheets[sheetName];
    const newRegisteredUsers = xlsx.utils.sheet_to_json(workSheet);

    console.log(1);
    await RegisteredUsers.deleteMany();
    console.log(2);

    const operations = newRegisteredUsers.map((data) => ({
      insertOne: {
        document: {
          ...data,
        },
      },
    }));

    await RegisteredUsers.bulkWrite(operations);

    res.status(200).json({ message: "Data uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/getUser/:date", async (req, res) => {
  try {
    const date = String(req.params.date);
    const dateFormat = moment(date, "YYYY-MM-DD").format("YYYY-MM-DD");

    const users = await CheckedInUsers.find({ checkedInDate: dateFormat });

    return res.status(200).json({
      status: true,
      users: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
    });
  }
});

app.get("/checkinout/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Id.",
      });
    }

    let user = await RegisteredUsers.findOne({
      QRScan: qrScanLink + id,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    const currentDate = moment().tz(timezone).format("YYYY-MM-DD");
    let foundUser = await CheckedInUsers.findOne({
      qrScan: id,
      checkedInDate: { $gte: currentDate },
    });

    if (foundUser === null && user) {
      return res.status(200).json({
        status: true,
        message: "User hasn't been checked in.",
        user: user,
      });
    }

    if (foundUser && foundUser.checkedIn) {
      return res.status(200).json({
        status: true,
        message: "User has been checked in.",
        user: {
          ...user._doc,
          meals: foundUser.meals,
        },
      });
    }

    if (foundUser && foundUser.checkedIn === false) {
      return res.status(200).json({
        status: false,
        message: "User hasn't been checked in.",
        user: {
          ...user._doc,
          meals: foundUser.meals,
        },
      });
    }
    return res.status(200).json({
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

app.post("/checkinout/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Id.",
      });
    }

    const user = await RegisteredUsers.findOne({
      QRScan: qrScanLink + id,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    const currentDate = moment().tz(timezone).format("YYYY-MM-DD");
    const currentTime = moment().tz(timezone).format("hh:mm:ss A");

    let checkedInUser = await CheckedInUsers.findOne({
      qrScan: id,
      checkedInDate: { $gte: currentDate },
    });

    if (checkedInUser !== null && checkedInUser.checkedIn) {
      return res.status(200).json({
        status: false,
        message: "User already checked in.",
      });
    }

    if (checkedInUser !== null && !checkedInUser.checkedIn) {
      checkedInUser.checkedIn = true;
      checkedInUser.checkedInTime = currentTime;
      checkedInUser.checkedOutTime = null;
      await checkedInUser.save();
      return res.status(200).json({
        status: true,
        message: "User checked in successfully.",
      });
    }

    if (checkedInUser === null) {
      checkedInUser = new CheckedInUsers({
        name: user.Name,
        email: user.Email,
        phoneNumber: user.PhoneNumber,
        clubName: user.ClubName,
        qrScan: id,
        spouseQR: user.SpouseQR,
        checkedIn: true,
        checkedInDate: currentDate,
        checkedInTime: currentTime,
      });

      await checkedInUser.save();

      return res.status(200).json({
        status: true,
        message: "User checked in successfully.",
      });
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

// PUT route to check-out user
app.put("/checkinout/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Id.",
      });
    }

    const currentDate = moment().tz(timezone).format("YYYY-MM-DD");
    const currentTime = moment().tz(timezone).format("hh:mm:ss A");

    let checkedOutUser = await CheckedInUsers.findOneAndUpdate(
      { qrScan: id, checkedInDate: { $gte: currentDate } },
      { $set: { checkedIn: false, checkedOutTime: currentTime } },
      { new: true }
    );

    if (checkedOutUser) {
      return res.status(200).json({
        status: true,
        message: "User checked out successfully.",
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "User not found or not checked in.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
    });
  }
});

app.post("/meal/:id/:meal", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const meal = String(req.params.meal);

    if (isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Id.",
      });
    }

    const currentDate = moment().tz(timezone).format("YYYY-MM-DD");

    let updateMeal = await CheckedInUsers.findOneAndUpdate(
      { qrScan: id, checkedInDate: { $gte: currentDate } },
      { $push: { meals: String(meal) } },
      { new: true }
    );

    if (updateMeal !== null) {
      return res.status(200).json({
        status: true,
        meal: updateMeal.meals,
      });
    }
    return res.status(200).json({
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

app.get("/favicon.ico", (req, res) => res.status(204));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
