/**
 * @description ResultDetail component.
 * 
 * @requires constants
 * @requires Portal
 * @requires prop-types
 * @requires react
 * @requires ResultDetailTableInfo
 * @requires ResultDetailTableItemRow
 * @requires ResultDetailTableUser
 * @requires useAuth
 * @requires useMount
 * @requires useVotes
 * @requires useWebSocket
 * @requires utilities
 * @public
 * @module
 * 
 */
import { concatClassNames } from "../../../support/utilities";
import * as C from "../../../support/constants";
import Portal from "../Portal";
import PropTypes from "prop-types";
import React, { useRef, useState } from "react";
import ResultDetailTableInfo from "./ResultDetailTableInfo";
import ResultDetailTableItemRow from "./ResultDetailTableItemRow";
import ResultDetailTableUser from "./ResultDetailTableUser";
import useAuth from "../../../hooks/useAuth";
import useMount from "../../../hooks/useMount";
import useVotes from "../../../hooks/useVotes";
import useWebSocket from "../../../hooks/useWebSocket";

/**
 * @description Renders an modal window inside a React Portal.
 * ResultDetail components must contain a "voteID" to create and display details of the target Vote document and a "dismountCallback"
 * function that is passed down to the Portal child component for removal of the modal window from the DOM.
 * Vote documents that are flagged as active will continue to fetch data and render when new data is received.
 * 
 * @param {object} props - Immutable properties populated by the parent component.
 * @returns {object} The portal rendered to the DOM.
 * @public
 * @function
 * 
 */
const ResultDetail = ({

        voteID,
        dismountCallback,
        logout
    }) => {

    /**
     * State
     * 
     */
    const [ isLoading, setIsLoading ] = useState(true);

    /**
     * Refs
     */
    const cachedVote = useRef(null);
    const portal = useRef(null);

    /**
     * Hooks
     * 
     */
    const { authError } = useAuth();
    const { onMount } = useMount();

    const {
        
        fetchOne,
        setVotesError,
        setVotesOne,
        votesError,
        votesOne
    } = useVotes();

    const { webSocketMessage, setWebSocketMessage } = useWebSocket();

    /**
     * @description Fetch the target Vote document
     * The target Vote document, which is either loaded from the cache or fetched via an HTTP request, populates the "votesOne" state.
     * 
     * @private
     * @function
     * 
     */
    const mount = () => {

        (async () => {

            setWebSocketMessage(null);

            cachedVote.current = sessionStorage.getItem(voteID);

            if (cachedVote.current) {

                setVotesOne(JSON.parse(cachedVote.current));
            }
            else {

                await fetchOne(voteID);
            }
            
            setIsLoading(false); 
        })();
    };

    onMount(mount);

    /**
     * WebSocket event handling
     * Updates the application state according to the "type" of a parsed WebSocket message. 
     * Fetches the updated data for the target Vote document when the WebSocket messages of either type C.Event.VOTE_CAST or C.Event.VOTE_CLOSED are broadcast.
     * Setting the webSocketMessage to null facilitates receiving continuous webSocket messages of type C.Event.VOTE_CAST without repeatedly fetching data.
     * 
     */
    if (webSocketMessage && !isLoading) {
        
        const parsedWebSocketMessage = JSON.parse(webSocketMessage);
        const webSocketMessageType = parsedWebSocketMessage[C.WebSocket.TYPE];

        const isVoteCast = (webSocketMessageType === C.Event.VOTE_CAST);
        const isVoteClosed = (webSocketMessageType === C.Event.VOTE_CLOSED);
        
        if (isVoteCast || isVoteClosed) {

            setWebSocketMessage(null);
            fetchOne(voteID);
        }
    }

    /**
     * VotesOne Success
     * Saves the fetched Vote document to the cache if it is not an active vote.
     * 
     */
    if (votesOne && !votesOne[C.Model.ACTIVE] && !isLoading) {

        if (!sessionStorage.getItem(voteID)) {

            sessionStorage.setItem(voteID, JSON.stringify(votesOne));
        }
    }

    /**
     * Auth failure
     * Logout user if authentication fails while fetching data.
     * 
     */
    if (authError) {

        setTimeout(() => logout());
    }

    /**
     * Vote error
     * Close the component model if the vote is closed without having any cast votes.
     * 
     */
    if (votesError) {

        if (votesError.error === C.Error.VOTE_DOES_NOT_EXIST) {

            setVotesError(null);
            dismountCallback();
        }
        else {

            setTimeout(() => logout());    
        }
    }

    /**
     * @description Retrieves and array of rank values for the target Item document ID per user.
     * 
     * @param {string} itemID - The ID of the target Item document.
     * @returns {array|null} An array of rank values.
     * @private
     * @function
     *  
     */
    const getCastRanks = (itemID) => {

        if (votesOne[C.Model.ANONYMOUS]) {

            return null;
        }

        const result = [];
        const quantity = votesOne[C.Model.QUANTITY];

        votesOne[C.Model.VOTE].forEach((vote) => {
        
            result.push("");

            for (const cast of vote[C.Model.CAST]) {

                if (cast[C.Model.ITEM] && (cast[C.Model.ITEM][C.Model.ID] === itemID)) {

                    result.splice(result.length - 1, 1, quantity - cast[C.Model.RANK]);

                    break;
                }
            }
        });
    
        return result;
    };

    /**
     * JSX markup
     * 
     */
    return (

        <Portal
            ref={portal}
            elementID={C.ID.ELEMENT_RESULT_DETAIL}
            dismountCallback={dismountCallback}
        >
            <div
                className={C.Style.RESULT_DETAIL}
                onClick={() => portal.current.exit()}
            >
                <div className={C.Style.RESULT_DETAIL_CONTAINER}>
                    {(isLoading || !votesOne)
                        ?   <div className={C.Style.RESULT_DETAIL_CONTAINER_PRELOADER} />
                        :   <table className={
                                concatClassNames(
                                    C.Style.RESULT_DETAIL_CONTAINER_TABLE,
                                    (!cachedVote.current && C.Style.RESULT_DETAIL_CONTAINER_TABLE_ANIMATION_ENTER)
                                )
                            }>
                                <thead>
                                    <tr>
                                        <ResultDetailTableInfo
                                            aggregate={votesOne[C.Model.AGGREGATE]}
                                            date={votesOne[C.Model.DATE]}
                                            isActive={votesOne[C.Model.ACTIVE]}
                                            isAnonymous={votesOne[C.Model.ANONYMOUS]}
                                            quantity={votesOne[C.Model.QUANTITY]}
                                            totalCastVotes={votesOne[C.Model.VOTE].length}
                                        />

                                        {(votesOne[C.Model.AGGREGATE] || !votesOne[C.Model.ACTIVE]) && !votesOne[C.Model.ANONYMOUS] &&
                                            votesOne[C.Model.VOTE].map((vote) => {

                                                return (

                                                    <ResultDetailTableUser
                                                        key={vote[C.Model.ID]}
                                                        user={vote[C.Model.USER]}
                                                    />
                                                );
                                            })
                                        }
                                    </tr>
                                </thead>

                                <tbody>
                                    {votesOne[C.Model.TOTAL].map((total, index) => {

                                        return (

                                            <ResultDetailTableItemRow
                                                key={total[C.Model.ID]}
                                                itemName={
                                                    
                                                    (total[C.Model.ITEM] && total[C.Model.ITEM][C.Model.NAME]) ||
                                                    C.Error.MISSING_DATA
                                                }
                                                itemImageURL={
                                                    
                                                    (total[C.Model.ITEM] && total[C.Model.ITEM][C.Model.IMAGE]) ||
                                                    C.Image.BLANK
                                                }
                                                result={{

                                                    [C.Model.RANK]: index + 1,
                                                    [C.Model.TOTAL]: total[C.Model.RANK]
                                                }}
                                                ranks={getCastRanks(total[C.Model.ITEM] && total[C.Model.ITEM][C.Model.ID])}
                                            />
                                        );
                                    })}
                                </tbody>    
                            </table>
                    }
                </div>
            </div>
        </Portal>
    );
};

/**
 * Prop Types
 * 
 */
ResultDetail.propTypes = {

    voteID: PropTypes.string.isRequired,
    dismountCallback: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
};

/**
 * Export module
 * 
 */
export default ResultDetail;