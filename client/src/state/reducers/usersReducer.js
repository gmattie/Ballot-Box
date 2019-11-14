/**
 * @description The users reducer module.
 * 
 * @requires constants
 * @module
 * 
 */
import * as C from "../../support/constants";

/**
 * @description The initial state of the reducer.
 * 
 * @private
 * @constant
 * 
 */
const initialState = {
    
    [C.Action.Type.USERS_ERROR]: null,
    [C.Action.Type.USERS_RESET]: null,
    [C.Action.Type.USERS_SELF]: null,
};

/**
 * @description The reducer creates and returns a new state by changing the previous state in response to an action.
 * 
 * @param {object} state - The initial or previous state of the reducer.
 * @param {object} action - Describes how to change the state.
 * @returns {object} The new state of the reducer.
 * @public
 * @function
 * 
 */
const usersReducer = (state = initialState, action) => {

    switch (action.type) {

        case C.Action.Type.USERS_ERROR:

            return {

                ...state,
                [C.Action.Type.USERS_ERROR]: action[C.Action.PAYLOAD]
            };

        case C.Action.Type.USERS_RESET:

            return {

                ...state,
                [C.Action.Type.USERS_RESET]: action[C.Action.PAYLOAD],
                [C.Action.Type.USERS_ERROR]: null
            };

        case C.Action.Type.USERS_SELF:

            return {
                
                ...state,
                [C.Action.Type.USERS_SELF]: action[C.Action.PAYLOAD],
                [C.Action.Type.USERS_ERROR]: null
            };

        default:

            return state;
    }
};

/**
 * Export module
 * 
 */
export default usersReducer;