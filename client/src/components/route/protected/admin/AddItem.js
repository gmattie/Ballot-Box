/**
 * @description AddItem component.
 * 
 * @requires Button
 * @requires Collapsible
 * @requires constants
 * @requires Dialog
 * @requires prop-types
 * @requires react
 * @requires TextField
 * @requires useAuth
 * @requires useInputText
 * @requires useItems
 * @public
 * @module
 * 
 */
import * as C from "../../../../support/constants";
import Button from "../../../controls/Button";
import Collapsible from "../../../controls/Collapsible";
import Dialog from "../../../modal/Dialog";
import PropTypes from "prop-types";
import React, { useRef, useState } from "react";
import TextField from "../../../controls/TextField";
import useAuth from "../../../../hooks/useAuth";
import useInputText from "../../../../hooks/useInputText";
import useItems from "../../../../hooks/useItems";

/**
 * @description The AddItem component contains UI elements that are required to add Item documents to the database.
 * The UI elements include text input fields for setting the "name" with optional "thumbnail" and "image" URLs and a button for submitting the input data to the server.
 * 
 * @param {object} props - Immutable properties populated by the parent component.
 * @returns {object} JSX markup.
 * @public
 * @function
 * 
 */
const AddItem = ({ logout }) => {

    /**
     * State
     * 
     */
    const [ invalidName, setInvalidName ] = useState(null);
    const [ invalidThumbnail, setInvalidThumbnail ] = useState(null);
    const [ invalidImage, setInvalidImage ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ showDialog, setShowDialog ] = useState(false);

    /**
     * Refs
     * 
     */
    const isSubmittable = useRef(false);
    const responseUpdate = useRef(false);

    /**
     * Hooks
     * 
     */
    const { authError, setAuthError } = useAuth();

    const {
        
        fetchAdd,
        itemsAdd,
        setItemsAdd
    } = useItems();

    const {

        binding: bindName,
        clearValue: clearName,
        value: name
    } = useInputText(C.Label.NAME, confirmHandler);

    const {

        binding: bindThumbnail,
        clearValue: clearThumbnail,
        value: thumbnail
    } = useInputText(C.Label.THUMBNAIL, confirmHandler);

    const {

        binding: bindImage,
        clearValue: clearImage,
        value: image
    } = useInputText(C.Label.IMAGE, confirmHandler);

    /**
     * Set isSubmittable flag
     * Determines if the present state of text data is sufficient for submitting to the server.
     * 
     */
    isSubmittable.current = name;

    /**
     * Add item success
     * Clear appropriate text input elements.
     * 
     */
    if (itemsAdd && responseUpdate.current) {

        responseUpdate.current = false;

        clearName();
        clearThumbnail();
        clearImage();
    }
    
    /**
     * Add item failure
     * Parse the error object to set the appropriate local error states.
     * 
     */
    if (authError && responseUpdate.current) {

        responseUpdate.current = false;

        if (Array.isArray(authError.error)) {
            
            authError.error.forEach((error) => {

                switch (/[^.]*$/.exec(error[C.ID.ERROR_PARAM])[0]) {

                    case C.ID.NAME_NAME:
                        setInvalidName(error[C.ID.ERROR_MESSAGE]);

                        break;

                    case C.ID.NAME_THUMBNAIL:
                        setInvalidThumbnail(error[C.ID.ERROR_MESSAGE]);

                        break;

                    case C.ID.NAME_IMAGE:
                        setInvalidImage(error[C.ID.ERROR_MESSAGE]);

                        break;

                    default:
                        throw new Error(error[C.ID.ERROR_MESSAGE]);
                }
            });

            setAuthError(null);
        }
        else {

            if (authError.error.includes(C.Error.DUPLICATE_KEY)) {

                setInvalidName(C.Error.DUPLICATE_KEY);
            }
            else {

                setTimeout(() => logout());
            }
        }
    }

    /**
     * @description Displays the confirmation dialog.
     * Written as a function declaration in order to be hoisted and accessible to the custom hooks above.
     * 
     * @function
     * @private
     * 
     */
    function confirmHandler() {

        if (isSubmittable.current) {

            setShowDialog(true);
        }
    }

    /**
     * @description Posts the request body to the server.
     * Resets to the initial render by nullifying the "authError" and "itemsAdd" states and clearing all local error states.
     * Function executes asynchronously to facilitate the local loading state.
     * 
     * @async
     * @function
     * @private
     *  
     */
    const submitHandler = async () => {

        setShowDialog(false);
        setIsLoading(true);

        setAuthError(null);
        setItemsAdd(null);

        setInvalidName(null);
        setInvalidThumbnail(null);
        setInvalidImage(null);

        responseUpdate.current = true;
        await fetchAdd(name, thumbnail, image);

        setIsLoading(false);
    };

    /**
     * JSX markup
     * 
     */
    return (

        <>
            {showDialog &&
                <Dialog 
                    message={C.Label.CONFIRM_ADD_ITEM}
                    okCallback={submitHandler}
                    cancelCallback={() => setShowDialog(false)}
                />
            }

            <Collapsible title={C.Label.ADD_ITEM}>
                <div className={C.Style.ADD_ITEM}>
                    <div className={C.Style.ADD_ITEM_NAME}>
                        <TextField
                            name={C.ID.NAME_NAME}
                            disabled={isLoading}
                            errorMessage={invalidName}
                            {...bindName}
                        />
                    </div>

                    <div className={C.Style.ADD_ITEM_THUMBNAIL}>
                        <TextField
                            name={C.ID.NAME_THUMBNAIL}
                            disabled={isLoading}
                            errorMessage={invalidThumbnail} 
                            {...bindThumbnail}
                        />
                    </div>

                    <div className={C.Style.ADD_ITEM_IMAGE}>
                        <TextField
                            name={C.ID.NAME_IMAGE}
                            disabled={isLoading}
                            errorMessage={invalidImage}
                            {...bindImage}
                        />
                    </div>

                    <div className={C.Style.ADD_ITEM_BUTTON}>
                        <Button
                            style={C.Style.BUTTON_SUBMIT_EMPHASIS}
                            onClick={confirmHandler}
                            disabled={isLoading || !isSubmittable.current}
                        >
                            {C.Label.ADD}
                        </Button>
                    </div>

                    {
                        //TODO: Replace with style animation
                        isLoading && <div>LOADING...</div>
                    }
                </div>
            </Collapsible>
        </>
    );
};

/**
 * Prop Types
 * 
 */
AddItem.propTypes = {

    logout: PropTypes.func.isRequired
};

/**
 * Export module
 * 
 */
export default AddItem;