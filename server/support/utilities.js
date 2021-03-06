/**
 * @description Common and reusable functions 
 * 
 * @requires constants
 * @requires ws
 * @public
 * @module
 * 
 */
const C = require("./constants");
const WebSocket = require("ws");

/**
 * @description Broadcasts a WebSocket message to all connected clients.
 * 
 * @param {Set} clients - A set of all connected clients. 
 * @param {*} data - What is sent to each connected client.
 * @private
 * @function
 * 
 */
const broadcast = (clients, data) => {

    if (clients) {

        clients.forEach((client) => {

            if (client.readyState === WebSocket.OPEN) {

                client.send(data);
            }
        });
    }
};

/**
 * @description Create a new object that includes a subset of key/value pairs from another object.
 * 
 * @param {object} target - The target object used for extraction.
 * @param {...string} keys - The keys to extract from the target object and include in the new object.
 * @returns {object}
 * @function
 * 
 * @example
 * 
 * const obj = {a: 10, b: 20, c: 30};
 * const newObj = createObjectSubset(obj, "a", "c")
 * 
 * console.log(newObj); // {a: 10, c: 30}
 * 
 */
const createObjectSubset = (target, ...keys) => {

    return Object.fromEntries(
        
        Object.entries(target)
            .filter(([key]) => keys.includes(key))
    );
}

/**
 * @description Retrieve the signature partition of a JSON Web Token.
 * 
 * @param {string} jwt - A JSON Web Token composed of three partitions delimited by periods.
 * @returns {string} The third and last partition of a JSON Web Token.
 * @public
 * @function
 * 
 */
const getTokenSignature = (jwt) => jwt.slice(jwt.lastIndexOf(".") + 1);

/**
 * @description Sends an error HTTP response according to a provided error message.
 * 
 * @param {object} error - An error object that contains an error message.
 * @param {object} response - An HTTP response object.
 * @returns {object} An HTTP response object.
 * @public
 * @function 
 * 
 */
const sendErrorResponse = (error, response) => {

    let status;

    switch (error.message) {

        case C.Error.EMAIL_ALREADY_REGISTERED:
        case C.Error.USER_DOES_NOT_EXIST:
        case C.Error.VERIFICATION_ALREADY_PROCESSED:
        case C.Error.VOTE_CLOSED:
        case C.Error.VOTE_OPENED:
            status = C.Status.BAD_REQUEST;
            
            break;
                
        case C.Error.USER_INVALID_CREDENTIALS:
            status = C.Status.UNAUTHENTICATED;
            
            break;

        default:
            status = C.Status.INTERNAL_SERVER_ERROR;
    }

    return response
        .status(status)
        .send({ error: error.message });
};

/**
 * Export module
 * 
 */
module.exports = {

    broadcast,
    createObjectSubset,
    getTokenSignature,
    sendErrorResponse
};