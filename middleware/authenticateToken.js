const jwt = require("jsonwebtoken");
const { TOKEN_SECRET } = require("../utils/constants");
function authenticateToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Token not Provided" });

  jwt.verify(token.split(" ")[1], TOKEN_SECRET, (err, decode) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const userRole = decode.role;
    req.userRole = userRole;
    next();
  });
}
module.exports = authenticateToken;
