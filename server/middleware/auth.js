/**
 * @description Authorization middleware used to authenticate access protected routes via JSON Web Tokens.
 * 
 * @requires bcryptjs
 * @requires constants
 * @requires jsonwebtoken
 * @requires User
 * @requires utils
 * @public
 * @module
 * 
 */
const { User } = require("../models/User");
const bcryptjs = require("bcryptjs");
const C = require("../support/constants");
const jwt = require("jsonwebtoken");
const utils = require("../support/utilities");

/**
 * @description Verify the JSON Web Token from the request authorization header and compare it to the token value within the User document.
 * 
 * @public
 * @constant
 * 
 */
const auth = async (req, res, next) => {

    const token = req.header(C.Header.X_AUTH_TOKEN);

    try {
  
        if (!token) {

            throw new Error(C.Error.USER_INVALID_CREDENTIALS);
        }

        const tokenSignature = utils.getTokenSignature(token);
        const payload = await jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        const user = await User.findById(payload.user.id);
        
        if (!user || !user[C.Model.TOKEN]) {

            throw new Error(C.Error.USER_INVALID_CREDENTIALS);
        }
        
        const isUserToken = await bcryptjs.compare(tokenSignature, user[C.Model.TOKEN]);
         
        if (!isUserToken) {

            if (user && user[C.Model.TOKEN]) {

                user[C.Model.TOKEN] = undefined;

                await user.save();
            }

            throw new Error(C.Error.USER_INVALID_CREDENTIALS);
        }

        res.locals[C.Local.USER] = user;

        next();
    }
    catch (error) {

        if (error instanceof jwt.JsonWebTokenError ||
            error instanceof SyntaxError ||
            error.message === C.Error.USER_INVALID_CREDENTIALS) {

            return res
                .status(C.Status.UNAUTHENTICATED)
                .send({ error: C.Error.USER_INVALID_CREDENTIALS });
        }

        return res
            .status(C.Status.INTERNAL_SERVER_ERROR)
            .send({ error: error.message });
    }
};

/**
 * Export module
 * 
 */
module.exports = auth;