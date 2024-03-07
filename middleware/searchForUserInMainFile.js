const searchForUserInMainFile = (registeredUsers, id) => {
  try {
    let found = false;
    let user = null;

    for (let i = 0; i < registeredUsers.length; i++) {
      const qrcode = registeredUsers[i]["QR Scan"];
      if (parseInt(qrcode.split("/").pop()) === parseInt(id)) {
        found = true;
        user = registeredUsers[i];
        break;
      }
    }

    return [found, user];
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
    });
  }
};

module.exports = searchForUserInMainFile;
