/**
 * @description Vote component
 * 
 * @requires Button
 * @requires constants
 * @requires Dialog
 * @requires ErrorResponse
 * @requires ListContainer
 * @requires prop-types
 * @requires ProtectedContainer
 * @requires react
 * @requires SpanOverflow
 * @requires useAuth
 * @requires useItems
 * @requires useMount
 * @requires useUsers
 * @requires useVotes
 * @public
 * @module
 * 
 */
import { LogoutAPI } from "./ProtectedContainer";
import * as C from "../../../support/constants";
import Button from "../../controls/Button";
import Dialog from "../../modal/Dialog";
import ErrorResponse from "../../ErrorResponse";
import ListContainer from "../../list/ListContainer";
import React, { useContext, useRef, useState } from "react";
import SpanOverflow from "../../../components/SpanOverflow";
import useAuth from "../../../hooks/useAuth";
import useItems from "../../../hooks/useItems";
import useMount from "../../../hooks/useMount";
import useUsers from "../../../hooks/useUsers";
import useVotes from "../../../hooks/useVotes";

/**
 * @description The Vote component contains UI elements that are required to browse votable items and/or cast votes.
 * The UI elements include List components for displaying and sorting draggable Item documents,
 * a button to reset the "itemsCandidate" and "itemsVote" states to their default values and a button for casting votes to the server.
 * 
 * @returns {object} JSX markup.
 * @public
 * @function
 * 
 */
const Vote = () => {

    /**
     * Context
     * 
     */
    const logout = useContext(LogoutAPI);

    /**
     * State
     * 
     */
    const [ invalidVote, setInvalidVote ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ isMounting, setIsMounting ] = useState(true);
    const [ showDialog, setShowDialog ] = useState(false);

    /**
     * Refs
     * 
     */
    const isVotable = useRef(false);
    const responseUpdate = useRef(false);

    /**
     * Hooks
     * 
     */
    const { authError, setAuthError } = useAuth();
    
    const {
        
        fetchAll,
        itemsAll,
        itemsCandidate,
        itemsVote,
        setItemsCandidate,
        setItemsVote,
    } = useItems();
    
    const { onMount } = useMount();
    const { usersSelf } = useUsers();

    const {

        fetchActive,
        fetchCast,
        setVotesCast,
        votesActive,
        votesCast
    } = useVotes();

    /**
     * @description Fetches all Item documents if the "itemsAll" state is null.
     * 
     * @private
     * @function
     * 
     */
    const mount = () => {

        if (!itemsAll) {

            fetchAll();
        }
    };

    onMount(mount);            

    /**
     * Check if the user has already voted.
     * Mounting will complete when both the "votesActive" and "itemsAll" states have been populated with non-nullable values.
     * During an active vote, conditionally populate the "votesCast" state based on the user having already voted.
     * 
     */
    if (isMounting && votesActive && itemsAll) {

        setVotesCast(null);

        if (votesActive && votesActive[C.Model.VOTE]) {

            const currentUserVote = votesActive[C.Model.VOTE][C.Model.VOTE]
                .find((vote) => vote[C.Model.USER] === usersSelf[C.Model.USER][C.Model.ID]);

            if (currentUserVote) {

                const cast = {

                    [C.Model.CAST]: currentUserVote[C.Model.CAST].map((vote) => {

                        return {
                    
                            [C.Model.ITEM]: vote[C.Model.ITEM],
                            [C.Model.RANK]: vote[C.Model.RANK]
                        };
                    })
                };

                setVotesCast(cast);
            }
        }

        setIsMounting(false);
    }

    /**
     * @description Sets the "itemsCandidate" and "itemsVote" states to the default values.
     * 
     * @function
     * @private
     * 
     */
    const resetItemLists = () => {
        
        setItemsCandidate(itemsAll);
        setItemsVote(null);
    };

    /**
     * Reset the item lists when the "itemsCandidate" state is null.
     * This occurs when the component is mounted for the first time or when an Item document has been added or edited.
     * 
     */
    if (!itemsCandidate && itemsAll) {

        resetItemLists();
    }

    /**
     * Set isVotable flag.
     * Determines if the present state of both "votesActive" and "itemsVote" are sufficient for allowing users to cast votes to the server.
     * 
     */
    isVotable.current = (
        
        (votesActive && votesActive.vote) &&
        (itemsVote && itemsVote.length) &&
        (Math.min(itemsAll.length, votesActive.vote[C.Model.QUANTITY]) <= itemsVote.length)
    );

    /**
     * Vote cast or active failure.
     * Parse the error object to set the appropriate local error states.
     * 
     */
    if (authError && responseUpdate.current) {

        responseUpdate.current = false;

        if (Array.isArray(authError.error)) {
            
            authError.error.forEach((error) => {

                const errorMessage = error[C.Error.ERROR_MESSAGE];

                switch (error[C.Error.ERROR_PARAM]) {

                    case C.ID.NAME_CAST:
                        setInvalidVote(errorMessage);

                        break;

                    default:
                        switch (/[^.]*$/.exec(error[C.Error.ERROR_PARAM])[0]) {

                            case C.ID.NAME_ITEM:
                            case C.ID.NAME_RANK:
                                setInvalidVote(errorMessage);

                                break;

                            default:
                                throw new Error(errorMessage);
                        }
                }
            });
        }
        else {

            setTimeout(() => logout());
        }
    }

    /**
     * @description Posts the request body to the server.
     * Resets to the initial render by nullifying the "authError", "invalidVote" and "votesCast" states.
     * Function executes asynchronously to facilitate the local loading state.
     * 
     * @async
     * @function
     * @private
     *  
     */
    const submitHandler = async () => {

        setAuthError(null);
        setInvalidVote(null);
        setVotesCast(null);

        setIsLoading(true);

        responseUpdate.current = true;
        await fetchCast(itemsVote);
        await fetchActive();
        responseUpdate.current = false;

        resetItemLists();
        setIsLoading(false);
        setShowDialog(false);
    };

    /**
     * @description Handler for a dispatched "click" event on the Cancel button.
     * 
     * @function
     * @private
     *  
     */
    const cancelHandler = () => {

        setShowDialog(false);
    };

    /**
     * JSX markup
     * 
     */
    return (

        <div className={C.Style.VOTE}>
            {showDialog &&
                <Dialog 
                    content={C.Label.CONFIRM_VOTE}
                    okCallback={submitHandler}
                    cancelCallback={cancelHandler}
                    dismountCallback={cancelHandler}
                    preloader={{ [C.Event.COMPLETE]: false }}
                />
            }

            {(isMounting)
                ?   <div className={C.Style.VOTE_PRELOADER} />
                :   (votesCast && !responseUpdate.current)
                    ?   <div className={C.Style.VOTE_MESSAGE}>
                            <div className={C.Style.VOTE_MESSAGE_LABEL}>
                                {C.Label.VOTE_CAST}
                            </div>
                        </div>
                    :   <>
                            <ListContainer />

                            {(votesActive && votesActive[C.Model.VOTE]) &&
                                <>
                                    {invalidVote &&
                                        <div className={C.Style.VOTE_ERROR}>
                                            <ErrorResponse message={invalidVote} />
                                        </div>
                                    }

                                    <div className={C.Style.VOTE_BUTTONS}>
                                        <Button
                                            style={C.Style.BUTTON_SUBMIT_EMPHASIS}
                                            onClick={() => setShowDialog(true)}
                                            disabled={isLoading || !isVotable.current}
                                        >
                                            <SpanOverflow
                                                longText={C.Label.VOTE}
                                                shortText={C.Label.VOTE_SHORT_TEXT}
                                            />
                                        </Button>
                                        
                                        <Button
                                            style={C.Style.BUTTON_SUBMIT}
                                            onClick={resetItemLists}
                                            disabled={isLoading || !(itemsVote && itemsVote.length)}
                                        >
                                            <SpanOverflow
                                                longText={C.Label.RESET}
                                                shortText={C.Label.RESET_SHORT_TEXT}
                                            />
                                        </Button>
                                    </div>
                                </>
                            }
                        </>
            }
        </div>
    );
};

/**
 * Export module
 * 
 */
export default Vote;