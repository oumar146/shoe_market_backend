const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
   try {
       const token = req.headers.authorization.split(' ')[1];
       const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);
       const userEmail = decodedToken.userEmail;
       req.auth = {
        userEmail: userEmail
       };
	next();
   } catch(error) {
       res.status(401).json({ error });
   }
};