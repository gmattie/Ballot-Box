/**
 * @description WebSocket hook module
 * 
 * @requires constants
 * @requires package
 * @requires react
 * @requires react-redux
 * @requires webSocketActions
 * @public
 * @module
 * 
 */
import { proxy } from "../../package.json";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import * as C from "../support/constants";
import * as webSocketActions from "../state/actions/webSocketActions";

/**
 * @description Initialize a WebSocket connection with event subscriptions.
 * All messages pushed from the server are dispatched to the Redux store in order to be accessible throughout the application.
 * The useWebSocket hook requires initializing a WebSocket object and event handling prior to accessing WebSocket data.
 * Subsequent uses of the hook do not require initializing in order to access WebSocket data. 
 * 
 * @param {boolean} init - Initializes a WebSocket object with event handling.
 * @returns {
 * 
 *      setWebSocketMessage: function,
 *      webSocketMessage: string
 * }
 * @public
 * @function 
 * 
 */
const useWebSocket = (init) => {

    const dispatch = useDispatch();

    useEffect(() => {

        if (init) {

            const locationOrigin = (process.env.NODE_ENV === C.Local.ENV_DEVELOPMENT)
                ? proxy
                : window.location.origin;
                
            const webSocketURL = locationOrigin.replace(new RegExp(`^${C.Local.PROTOCOL_HTTP}`), C.Local.PROTOCOL_WEB_SOCKET);
            const webSocket = new WebSocket(webSocketURL);

            const handleWebSocket = (message, close) => {

                if (message !== JSON.stringify({ [C.WebSocket.TYPE]: C.Event.WEBSOCKET_HEARTBEAT })) {

                    dispatch(webSocketActions.setWebSocketMessage(message));
                }

                if (close) {

                    webSocket.close();
                }
            };

            const handleOpen = (event) => handleWebSocket(JSON.stringify({ [C.WebSocket.TYPE]: event[C.WebSocket.TYPE] }), false);
            const handleMessage = (event) => handleWebSocket(event[C.WebSocket.DATA], false);
            const handleClose = (event) => handleWebSocket(JSON.stringify({ [C.WebSocket.TYPE]: event[C.WebSocket.TYPE] }), true);

            webSocket.addEventListener(C.Event.OPEN, handleOpen);
            webSocket.addEventListener(C.Event.MESSAGE, handleMessage);
            webSocket.addEventListener(C.Event.CLOSE, handleClose);
            webSocket.addEventListener(C.Event.ERROR, handleClose);

            return () => {

                webSocket.removeEventListener(C.Event.OPEN, handleMessage);
                webSocket.removeEventListener(C.Event.MESSAGE, handleMessage);
                webSocket.removeEventListener(C.Event.CLOSE, handleClose);
                webSocket.removeEventListener(C.Event.ERROR, handleClose);
                
                webSocket.close();
            };
        }
    }, [init, dispatch]);

    const setWebSocketMessage = (data) => dispatch(webSocketActions.setWebSocketMessage(data));
    const webSocketMessage = useSelector((state) => state.webSocket[C.Action.Type.WEBSOCKET_MESSAGE]);

    return {

        setWebSocketMessage,
        webSocketMessage
    };
};

/**
 * Export module
 * 
 */
export default useWebSocket; 