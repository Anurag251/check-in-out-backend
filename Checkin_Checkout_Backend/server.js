const express = require("express");
const cors = require("cors");
const moment = require("moment-timezone");
const mongoose = require("mongoose");
const RegisteredUsers = require("./models/RegisteredUsers");
const CheckedInUsers = require("./models/CheckedInUsers");

const app = express();
const port = 3000;

const timezone = "Asia/Kathmandu";

app.use(cors());
app.use(express.json());

mongoose.connect(
  // "mongodb+srv://Anurag251:aSOPrOrdf05ngvDb@checkinout.zllsfhq.mongodb.net/?retryWrites=true&w=majority&appName=Checkinout"
  "mongodb://localhost:27017/checkinout"
);

const qrScanLink =
  "https://rotarydistrict3292.org.np/vieweventregistrationdetails/";

// app.get("/checkin-users", async (req, res) => {
//   try {
//     let foundUser = await CheckedInUsers.find();
//     if (foundUser !== null && foundUser !== undefined && foundUser.length) {
//       return res.status(200).json({
//         status: true,
//         message: "All Users",
//         user: foundUser,
//       });
//     } else {
//       return res.status(200).json({
//         status: false,
//         message: "No one has checkedin yet",
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong.",
//     });
//   }
// });

app.post("/getUser/:date", async (req, res) => {
  try {
    console.log(req.params.date);
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
