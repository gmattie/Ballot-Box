/**
 * @description The Redux store module.
 * 
 * @requires constants
 * @requires reducers
 * @requires redux
 * @requires redux-thunk
 * @module
 * 
 */
import { createStore, applyMiddleware, compose } from "redux";
import * as C from "../support/constants";
import reducers from "./reducers";
import thunk from "redux-thunk";

/**
 * @description Redux store enhancers conditionally composed of middleware and developer tools.
 * 
 * @private
 * @function
 * 
 */
const enhancers = () => {
    
    const middleware = applyMiddleware(thunk);
    const reduxDevToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__();

    if (process.env.NODE_ENV === C.Local.ENV_DEVELOPMENT && reduxDevToolsExtension) {

        return compose(

            middleware,
            reduxDevToolsExtension
        );
    }

    return middleware;
};

/**
 * @description Create a Redux store object with reducers and enhancers.
 * 
 * @public
 * @constant
 * 
 */
const store = createStore(
    
    reducers,
    enhancers()
);

/**
 * Export module
 * 
 */
export default store;