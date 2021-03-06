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
    
    [C.Action.Type.USERS_EDIT]: null,
    [C.Action.Type.USERS_ERROR]: null,
    [C.Action.Type.USERS_REGISTER]: null,
    [C.Action.Type.USERS_RESET]: null,
    [C.Action.Type.USERS_SELF]: null,
};

/**
 * @description The reducer creates and returns a new state immutably by altering a copy of the previous state in response to an action.
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

        case C.Action.Type.USERS_EDIT:
        case C.Action.Type.USERS_ERROR:
        case C.Action.Type.USERS_REGISTER:
        case C.Action.Type.USERS_RESET:
        case C.Action.Type.USERS_SELF:

            return {
                
                ...state,
                [action.type]: action[C.Action.PAYLOAD],
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