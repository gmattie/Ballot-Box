/**
 * @description Users router module prefixed with the path /api/users.
 * 
 * @requires auth
 * @requires bcryptjs
 * @requires constants
 * @requires express
 * @requires jsonwebtoken
 * @requires mongoose
 * @requires nodemailer
 * @requires User
 * @requires utils
 * @requires validation
 * @public
 * @module
 * 
 */
const { Reset, User } = require("../../models/User");
const auth = require("../../middleware/auth");
const bcryptjs = require("bcryptjs");
const C = require("../../support/constants");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const router = require("express").Router();
const utils = require("../../support/utilities");
const validation = require("../../middleware/validation");

/**
 * @description Returns a hashed password.
 * 
 * @param {string} password - The target password to hash.
 * @returns (string) The hashed password.
 * @private
 * @function
 * 
 */
const getHashedPassword = async (password) => {  

    try {

        return await bcryptjs.hash(password, 10);
    }
    catch (error) {

        throw new Error(error);
    }
};

/**
 * @description Returns a hashed signature partition of a JSON Web Token.
 * 
 * @param {string} token - The target JSON Web Token.
 * @returns {string} A hashed signature partition of the target JSON Web Token.
 * @private
 * @function
 * 
 */
const getHashedTokenSignature = async (token) => {

    try {

        const tokenSignature = utils.getTokenSignature(token);
        
        return await bcryptjs.hash(tokenSignature, 10);
    }
    catch (error) {

        throw new Error(error);
    }
};

/**
 * @description Returns a JSON Web Token signed with the ID of a user document.
 * 
 * @param {string} userID - The ID of a user document assigned to the JSON Web Token payload.
 * @returns {object} A JSON Web Token.
 * @private
 * @function
 * 
 */
const getJWT = async (userID) => {

    const payload = {

        user: {

            id: userID
        }
    };

    return await jwt.sign(

        payload,
        process.env.JWT_PRIVATE_KEY,
        { expiresIn: C.Expire.JWT_TOKEN }
    );
};

/**
 * @description Sends an email.
 * 
 * @param {string} to - The email address of the recipient.
 * @param {string} name - The name of the recipient.
 * @param {string} subject - The subject of the email.
 * @param {string} href - The hypertext reference assigned to the button within the email body.
 * 
 */
const sendEmail = async (to, name, subject, href) => {

    try {

        let message, buttonLabel, expiration;

        switch (subject) {

            case C.Email.SUBJECT_ACTIVATE:
                message = C.Email.MESSAGE_ACTIVATE;
                buttonLabel = C.Email.BUTTON_LABEL_ACTIVATE_ACCOUNT;
                expiration = C.Expire.USER_ACTIVATE;

                break;

            case C.Email.SUBJECT_RESET:
                message = C.Email.MESSAGE_RESET;
                buttonLabel = C.Email.BUTTON_LABEL_RESET_PASSWORD;
                expiration = C.Expire.USER_RESET;

                break;
        }

        const html = `
            
            <p>${name},<p>
            <p>${message}</p>
            <a style="${C.Email.BUTTON_STYLE}" href="${href}">
                ${buttonLabel}
            </a>
            <p>${C.Email.MESSAGE_CREDENTIALS}</p>
            <p>${C.Email.MESSAGE_EXPIRE} ${expiration}.</p>
        `;

        const transporter = nodemailer.createTransport({

            service: process.env.EMAIL_SERVICE,
            host: process.env.EMAIL_HOST,
            secure: false,
            auth: {
              user: process.env.EMAIL_ADDRESS,
              pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({

            from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_ADDRESS}>`,
            to: to,
            subject: subject,
            html: html
        });
    }
    catch (error) {

        throw new Error(error);
    }
};

/**
 * @description (POST) Register a user.
 * Users are registered by providing "name", "email" and "password" values within the HTTP request body.
 * Admin users are registered by additionally providing valid credentials for both "adminUsername" and "adminPassword" within the HTTP request body.
 * Verifying the registered email address is required in order to activate the account and complete the registration.
 * 
 * @public
 * @constant
 * 
 */
router.post(C.Route.REGISTER, [
    
        validation.userRegister,
        validation.result
    ],
    async (req, res) => {

        try {
            
            const { name, email, password, adminUsername, adminPassword } = req.body;
            const validAdminUsername = (adminUsername === process.env.DB_USERNAME);
            const validAdminPassword = (adminPassword === process.env.DB_PASSWORD);            
            const userExists = await User.findOne({ email });
            
            if (userExists) {
                
                throw new Error(C.Error.EMAIL_ALREADY_REGISTERED);
            }
            
            const user = new User({
                
                [C.Model.ADMIN]: (validAdminUsername && validAdminPassword),
                [C.Model.EMAIL]: email,
                [C.Model.EXPIRE]: Date.now(),
                [C.Model.IP]: req.ip,
                [C.Model.NAME]: name,
                [C.Model.PASSWORD]: await getHashedPassword(password)
            });
            
            await user.save();
            
            const encodedEmail = encodeURIComponent(user[C.Model.EMAIL]);
            const encodedPassword = encodeURIComponent(user[C.Model.PASSWORD]);
            const query = `?${C.Model.EMAIL}=${encodedEmail}&${C.Model.PASSWORD}=${encodedPassword}`;
            const href = `${req.protocol}://${req.get(C.Header.HOST)}${C.Route.API_USERS}${C.Route.VERIFY}${query}`;
            
            await sendEmail(email, name, C.Email.SUBJECT_ACTIVATE, href);

            return res
                .status(C.Status.OK)
                .json({ email });
        }
        catch (error) {

            utils.sendErrorResponse(error, res);
        }
    }
);

/**
 * @description (GET) Verify the email address registered to a user.
 * Actions that required verifying a registered email address include account activation and resetting a user's password.
 * Email addresses are verified by comparing the user's hashed password to a forwarded query string that contains the same hashed password. 
 * 
 * @public
 * @constant
 * 
 */
router.get(C.Route.VERIFY, async (req, res) => {

        try {

            const { email, password } = req.query;          
            const user = await User
                .findOne({ email })
                .collation({
                    
                    locale: C.Local.ENGLISH,
                    strength: 2
                });

            if (!user || (user[C.Model.PASSWORD] !== password)) {
                
                throw new Error(C.Error.VERIFICATION_ALREADY_PROCESSED);
            }

            if (!user[C.Model.EXPIRE]) {

                const reset = await Reset
                    .findOne({ email })
                    .collation({
                    
                        locale: C.Local.ENGLISH,
                        strength: 2
                    });

                if (!reset) {

                    throw new Error(C.Error.VERIFICATION_ALREADY_PROCESSED);
                }

                user[C.Model.PASSWORD] = reset[C.Model.PASSWORD];
                
                await reset.remove();
            }
            else {

                user[C.Model.EXPIRE] = undefined;
            }
            
            const token = await getJWT(user.id);

            user[C.Model.IP] = req.ip;
            user[C.Model.TOKEN] = await getHashedTokenSignature(token);

            await user.save();

            return res
                .status(C.Status.OK)
                .redirect(`${req.protocol}://${req.get(C.Header.HOST)}`);
        }
        catch (error) {

            utils.sendErrorResponse(error, res);
        }
    }
);

/**
 * @description (POST) Log in a user.
 * Users are logged in by providing valid credentials for both "email" and "password" within the HTTP request body.
 * 
 * @public
 * @constant
 * 
 */
router.post(C.Route.LOGIN, [

        validation.userLogin,
        validation.result
    ],
    async (req, res) => {

        try {

            const { email, password } = req.body;
            const user = await User
                .findOne({ email })
                .collation({
                    
                    locale: C.Local.ENGLISH,
                    strength: 2
                });

            if (!user || user[C.Model.EXPIRE]) {

                throw new Error(C.Error.USER_INVALID_CREDENTIALS);
            }

            const validPassword = await bcryptjs.compare(password, user.password);

            if (!validPassword) {

                throw new Error(C.Error.USER_INVALID_CREDENTIALS);
            }

            const token = await getJWT(user.id);

            user[C.Model.IP] = req.ip;
            user[C.Model.TOKEN] = await getHashedTokenSignature(token);

            await user.save();

            return res
                .status(C.Status.OK)
                .json({ token });
        }
        catch (error) {

            utils.sendErrorResponse(error, res);
        }
    }
);

/**
 * @description (PATCH) Update a user.
 * All users are authorized to update their own user document via token authentication.
 * User documents are edited by providing optional "name", "password", "adminUsername" and/or "adminPassword" values within the HTTP request body.
 * 
 * @protected
 * @constant
 * 
 */
router.patch(C.Route.EDIT, [
    
        auth,
        validation.userEdit,
        validation.result
    ],
    async (req, res) => {

        try {
            
            const user = res.locals[C.Local.USER];
            const { name, avatar, password, adminUsername, adminPassword } = req.body;

            if (name) {

                user[C.Model.NAME] = name;
            }

            if (avatar !== undefined) {

                user[C.Model.AVATAR] = avatar;
            }

            if (password) {
                
                user[C.Model.PASSWORD] = await getHashedPassword(password);
            }

            if (adminUsername && adminPassword) {

                user[C.Model.ADMIN] = (adminUsername === process.env.DB_USERNAME && adminPassword === process.env.DB_PASSWORD);
            }

            const token = await getJWT(user.id);

            user[C.Model.DATE] = Date.now();
            user[C.Model.TOKEN] = await getHashedTokenSignature(token);

            await user.save();

            return res
                .status(C.Status.OK)
                .json({ token });            
        }
        catch (error) {

            utils.sendErrorResponse(error, res);
        }
    }
);

/**
 * @description (POST) Reset a password.
 * All users may request a reset of their password by providing their valid "email" address and a new "password" within the HTTP request body.
 * Confirmation via email is required in order to reset the password.
 * 
 * @public
 * @constant
 * 
 */
router.post(C.Route.RESET, [

        validation.userReset,
        validation.result
    ],
    async (req, res) => {

        try {

            const { email, password } = req.body;
            const user = await User
                .findOne({ email })
                .collation({
                    
                    locale: C.Local.ENGLISH,
                    strength: 2
                });

            if (!user || user[C.Model.EXPIRE]) {

                throw new Error(C.Error.USER_DOES_NOT_EXIST);
            }

            let reset = await Reset
                .findOne({ email })
                .collation({
                    
                    locale: C.Local.ENGLISH,
                    strength: 2
                });

            if (reset) {

                await reset.remove();
            }

            reset = new Reset({

                [C.Model.EMAIL]: email,
                [C.Model.PASSWORD]: await getHashedPassword(password)
            });

            await reset.save();

            const encodedEmail = encodeURIComponent(email);
            const encodedPasswords = encodeURIComponent(user[C.Model.PASSWORD]);
            const query = `?${C.Model.EMAIL}=${encodedEmail}&${C.Model.PASSWORD}=${encodedPasswords}`;
            const href = `${req.protocol}://${req.get(C.Header.HOST)}${C.Route.API_USERS}${C.Route.VERIFY}${query}`;
            
            await sendEmail(email, user[C.Model.NAME], C.Email.SUBJECT_RESET, href);

            return res
                .status(C.Status.OK)
                .json({ email });
        }
        catch (error) {

            utils.sendErrorResponse(error, res);
        }
    }
);

/**
 * @description (GET) Log out a user.
 * All users are authorized to log out via token authentication and optionally providing their own valid user ID as a request parameter.
 * Admin users, via admin authentication, are authorized to log out any user by providing an optional valid user ID request parameter.
 * 
 * @protected
 * @constant
 * 
 */
router.get(`${C.Route.LOGOUT}/:${C.Route.PARAM}?`, auth, async (req, res) => {
    
    try {
        
        const user = res.locals[C.Local.USER];
        const paramUserID = req.params[C.Route.PARAM];
        let result;

        if (user.admin) {

            if (paramUserID) {

                const isValidUserID = mongoose.Types.ObjectId.isValid(paramUserID);

                if (!isValidUserID) {

                    throw new Error(C.Error.USER_DOES_NOT_EXIST);
                }

                result = (paramUserID === user.id)
                    ? user
                    : await User
                        .findById(paramUserID)
                        .select(`${C.Model.EMAIL} ${C.Model.NAME}`);

                if (!result) {

                    throw new Error(C.Error.USER_DOES_NOT_EXIST);
                }
            }
            else {

                result = user;
            }
        }
        else {

            if (paramUserID && paramUserID !== user.id) {
                
                throw new Error(C.Error.USER_INVALID_CREDENTIALS);
            }

            result = user;
        }

        result[C.Model.TOKEN] = undefined;
        
        await result.save();

        return res
            .status(C.Status.OK)
            .send({ user: result });
    }
    catch (error) {

        utils.sendErrorResponse(error, res);
    }
});

/**
 * @description (DELETE) Delete a user.
 * Only admin users, via admin authentication, are authorized to delete user documents by providing a valid user ID as a request parameter.
 * 
 * @protected
 * @constant
 * 
 */
router.delete(`${C.Route.DELETE}/:${C.Route.PARAM}`, auth, async (req, res) => {
    
    try {
        
        const user = res.locals[C.Local.USER];
        const paramUserID = req.params[C.Route.PARAM];
        const isValidUserID = mongoose.Types.ObjectId.isValid(paramUserID);

        if (user[C.Model.ADMIN]) {

            if (!isValidUserID) {

                throw new Error(C.Error.USER_DOES_NOT_EXIST);
            }

            const deletedUser = await User
                .findByIdAndRemove(paramUserID)
                .select(`${C.Model.ADMIN} ${C.Model.EMAIL} ${C.Model.NAME}`);

            return res
                .status(C.Status.OK)
                .json({ user: deletedUser });
        }
        else {

            throw new Error(C.Error.USER_INVALID_CREDENTIALS);
        }
    }
    catch (error) {

        utils.sendErrorResponse(error, res);
    }
});

/**
 * @description (GET) Retrieve one's own user document.
 * All users are authorized to retrieve their own user document via token authentication.
 * 
 * @protected
 * @constant
 * 
 */
router.get(C.Route.SELF, auth, async (req, res) => {

    try {
        
        const user = res.locals[C.Local.USER];

        return res
            .status(C.Status.OK)
            .json({ user });
    }
    catch (error) {

        utils.sendErrorResponse(error, res);
    }
});

/**
 * @description (GET) Retrieve an array of either one or all users.
 * Admin users, via admin authentication, are authorized to retrieve either a list of all users or a single user by optionally providing a valid user ID as a request parameter.
 * 
 * @protected
 * @constant
 * 
 */
router.get(`/:${C.Route.PARAM}?`, auth, async (req, res) => {

    try {

        const user = res.locals[C.Local.USER];
        const paramUserID = req.params[C.Route.PARAM];
        let result;

        if (user.admin) {

            const userFields = `${C.Model.ADMIN} ${C.Model.AVATAR} ${C.Model.EMAIL} ${C.Model.IP} ${C.Model.NAME}`;

            if (paramUserID) {

                const isValidUserID = mongoose.Types.ObjectId.isValid(paramUserID);

                if (!isValidUserID) {

                    throw new Error(C.Error.USER_DOES_NOT_EXIST);
                }

                result = (paramUserID === user.id)
                    ? user
                    : await User
                        .findById(paramUserID)
                        .select(userFields);

                if (!result) {

                    throw new Error(C.Error.USER_DOES_NOT_EXIST);
                }

                result = [result];
            }
            else {

                result = await User
                    .find({})
                    .select(userFields);
            }
        }
        else {

            throw new Error(C.Error.USER_INVALID_CREDENTIALS);
        }
            
        return res
            .status(C.Status.OK)
            .send({ users: result });
    }
    catch (error) {

        utils.sendErrorResponse(error, res);
    }
});

/**
 * Export module
 * 
 */
module.exports = router;