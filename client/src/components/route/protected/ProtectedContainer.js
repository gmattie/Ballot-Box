/**
 * @description ProtectedContainer component.
 * 
 * @requires Button
 * @requires constants
 * @requires EditUser
 * @requires react
 * @requires react-router-dom
 * @requires Results
 * @requires ResultsContainer
 * @requires useAuth
 * @requires useItems
 * @requires usePersist
 * @requires UserInfo
 * @requires useUsers
 * @requires useVotes
 * @requires useWebSocket
 * @requires utilities
 * @requires Vote
 * @requires VoteInfo

 * @public
 * @module
 * 
 */
import { debounce } from "../../../support/utilities";
import { Route, Switch, useRouteMatch, useHistory } from "react-router-dom";
import * as C from "../../../support/constants";
import Button from "../../controls/Button";
import DashboardContainer from "./dashboard/DashboardContainer";
import React, { createContext, useEffect, useRef, useState } from "react";
import ResultsContainer from "./results/ResultsContainer";
import useAuth from "../../../hooks/useAuth";
import useItems from "../../../hooks/useItems";
import usePersist from "../../../hooks/usePersist";
import UserInfo from "./info/UserInfo";
import useUsers from "../../../hooks/useUsers";
import useVotes from "../../../hooks/useVotes";
import useWebSocket from "../../../hooks/useWebSocket";
import Vote from "./Vote";
import VoteInfo from "./info/VoteInfo";

/**
 * @description Creates an exportable Context object.
 * This Context object allows the ProtectedContainer component to provide its "logout" function to be consumed by the
 * protected route components and/or their descendants without having to pass props down manually to each component.
 * 
 * @public
 * @object
 * 
 */
const LogoutAPI = createContext();

/**
 * @description The ProtectedContainer component groups the UI components of the application that are only accessible via user authentication.
 * This component contains vote and user information and navigation buttons for all the protected route components: Vote, ResultsContainer, and DashboardContainer.
 * 
 * @returns {object} JSX markup.
 * @public
 * @function
 * 
 */
const ProtectedContainer = () => {
    
    /**
     * State
     * 
     */
    const [ deadline, setDeadline ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ isMounting, setIsMounting ] = useState(true);

    /**
     * Refs
     * 
     */
    const webSocketMessageRef = useRef();
    const contentRef = useRef();

    /**
     * Hooks
     * 
     */
    const { authToken } = useAuth();    
    const history = useHistory();
    
    const {
        
        itemsAll,
        itemsCandidate,
        setItemsAll,
        setItemsCandidate,
        setItemsVote
    } = useItems();

    const {

        persistScrollDashboard: scrollTopDashboard,
        setPersistScrollDashboard: setScrollTopDashboard
    } = usePersist();

    const { path } = useRouteMatch();
    const { fetchLogout } = useUsers();
    
    const {
        
        fetchActive,
        setVotesAll,
        setVotesCast,
        votesActive,
        votesAll
    } = useVotes();
    
    const { webSocketMessage } = useWebSocket(true);

    /**
     * Mounting
     * 
     */
    if (isMounting && authToken) {

        if (!votesActive) {

            fetchActive();
        }
        
        setIsMounting(false);
    }

    /**
     * WebSocket event handling
     * Updates the application state according to the "type" and/or "data" values of a parsed WebSocket message. 
     * WebSocket data is used to efficiently augment the appropriate application state rather than simply overwriting the application state by fetching updated data.
     * WebSocket messages of type C.Event.ITEM_EDIT and C.Event.ITEM_ADD include data of an Item document object or an array of Item document objects, respectively.
     * WebSocket messages of type C.Event.VOTE_OPENED and C.Event.VOTE_COMPLETE include data of a Vote document object with the properties "aggregate", "anonymous", "id", "active" and "date".
     * WebSocket messages of type C.Event.VOTE_DEADLINE includes data of an object with the properties "days", "hours", "minutes" and "seconds".
     * This component includes the initialized useWebSocket hook.
     * 
     */
    if (webSocketMessage &&
        webSocketMessage !== webSocketMessageRef.current) {

        const parsedWebSocketMessage = JSON.parse(webSocketMessage);
        const webSocketMessageType = parsedWebSocketMessage[C.WebSocket.TYPE];

        const isItemAdded = (webSocketMessageType === C.Event.ITEM_ADD);
        const isItemEdited = (webSocketMessageType === C.Event.ITEM_EDIT);
        const isVoteOpened = (webSocketMessageType === C.Event.VOTE_OPENED);
        const isVoteClosed = (webSocketMessageType === C.Event.VOTE_CLOSED);
        const isVoteComplete = (webSocketMessageType === C.Event.VOTE_COMPLETE);
        const isVoteDeadline = (webSocketMessageType === C.Event.VOTE_DEADLINE);

        if (isItemAdded || isItemEdited || isVoteOpened || isVoteClosed || isVoteComplete || isVoteDeadline) {

            const webSocketMessageData = parsedWebSocketMessage[C.WebSocket.DATA];
            
            if ((isItemAdded || isItemEdited) && itemsAll) {

                let updatedItems;

                if (isItemAdded) {
                    
                    updatedItems = itemsAll.concat(webSocketMessageData);
                    updatedItems.sort((a, b) => a[C.Model.NAME].localeCompare(b[C.Model.NAME]));
                }

                if (isItemEdited) {

                    const replaceIndex = itemsAll.findIndex((item) => item[C.Model.ID] === webSocketMessageData[C.Model.ID]);

                    updatedItems = [...itemsAll];
                    updatedItems.splice(replaceIndex, 1, webSocketMessageData);
                }

                setItemsAll(updatedItems);

                if (itemsCandidate) {

                    setItemsCandidate(updatedItems);
                }
            }

            if ((isVoteOpened || isVoteComplete || isVoteClosed) && votesAll) {

                if (isVoteOpened || isVoteComplete) {

                    votesAll.unshift(webSocketMessageData);
                    setVotesAll(votesAll);
                }

                if (isVoteClosed) {

                    const activeVoteIndex = votesAll.findIndex((vote) => vote[C.Model.ACTIVE]);

                    if (activeVoteIndex !== -1) {

                        votesAll.splice(activeVoteIndex, 1);
                        setVotesAll(votesAll);
                    }
                }
            }

            if (isVoteOpened || isVoteClosed) {

                fetchActive();

                setDeadline(null);
                setVotesCast(null);

                if (isVoteClosed && itemsAll) {

                    setItemsCandidate(itemsAll);
                    setItemsVote(null);
                }
            }

            if (isVoteDeadline) {

                setDeadline(webSocketMessageData);
            }

            webSocketMessageRef.current = webSocketMessage;
        }
    }

    /**
     * @description Persist the scroll position for the DashboardContainer components.
     * The DashboardContainer component content may overflow to activate the scrollbar of the ProtectedContainer component content. 
     * 
     * @private
     * @function
     * 
     */
    useEffect(() => {

        if (contentRef.current) {

            if (path === C.Route.DASHBOARD) {
                
                contentRef.current.scrollTop = scrollTopDashboard;
            }
        }
    }, [path, scrollTopDashboard]);

    /**
     * @description Retrieves a CSS style based on the hypertext reference link argument.
     * 
     * @param {string} href - A hypertext reference link.
     * @private
     * @function
     *  
     */
    const getButtonStyle = (href) => {

        const style = (href === path)
            ? C.Style.BUTTON_NAVIGATION_SELECTED
            : C.Style.BUTTON_NAVIGATION;

        return style;
    };

    /**
     * @description Creates a button with textual content, a click callback and a hypertext reference link.
     * 
     * @param {string} label - The button's textual content.
     * @param {function} callback - The function to execute when the button is clicked.
     * @param {string|null} href - A hypertext reference link.
     * @private
     * @function
     * 
     */
    const createButton = (label, callback, href) => {
 
        return (

            <Button
                style={getButtonStyle(href)}
                onClick={callback.bind(null, href)}
            >
                {label}
            </Button>
        );
    };

    /**
     * @description Adds a new route to the router history.
     * 
     * @param {string} route - the added route.
     * @private
     * @function
     * 
     */
    const addRouterHistory = (route) => {

        history.push(route);
    };

    /**
     * @description Logs out the user and redirects the the login page.
     * 
     * @async
     * @private
     * @function
     * 
     */
    const logout = async () => {

        setIsLoading(true);

        await fetchLogout();

        addRouterHistory(C.Route.LOGIN);
    };

    /**
     * @description Handler for a dispatched "scroll" event.
     * Assigns the "topScroll" value of the content component to the appropriate persist state according to the route path.
     * 
     * @private
     * @function
     * 
     */
    const scrollHandler = () => {

        if (contentRef.current) {

            const scrollTop = contentRef.current.scrollTop;

            if ((path === C.Route.DASHBOARD) && (scrollTopDashboard !== scrollTop)) {
                
                setScrollTopDashboard(scrollTop);
            }
        }
    };

    /**
     * JSX markup
     * 
     */
    return (

        <div className={C.Style.PROTECTED_CONTAINER}>
            {(!authToken || isMounting || isLoading)
                ?   <div className={C.Style.PROTECTED_CONTAINER_PRELOADER} />
                :   <>
                        <UserInfo />

                        <VoteInfo deadline={deadline} />

                        <div className={C.Style.PROTECTED_CONTAINER_NAV}>
                            {createButton(C.Label.VOTE, addRouterHistory, C.Route.VOTE)}
                            {createButton(C.Label.RESULTS, addRouterHistory, C.Route.RESULTS)}
                            {createButton(C.Label.DASHBOARD, addRouterHistory, C.Route.DASHBOARD)}
                        
                            <div className={C.Style.PROTECTED_CONTAINER_NAV_SHADOW} />
                        </div>
                        
                        <div
                            className={C.Style.PROTECTED_CONTAINER_CONTENT}
                            onScroll={debounce(C.Duration.DEBOUNCE_SCROLL, scrollHandler)}
                            ref={contentRef}
                        >
                            <LogoutAPI.Provider value={logout}>
                                <Switch>
                                    <Route path={C.Route.VOTE}>
                                        <Vote />
                                    </Route>

                                    <Route path={C.Route.RESULTS}>
                                        <ResultsContainer />
                                    </Route>

                                    <Route path={C.Route.DASHBOARD}>
                                        <DashboardContainer />
                                    </Route>
                                </Switch>
                            </LogoutAPI.Provider>
                        </div>
                    </>
            }
        </div>
    );
};

/**
 * Export module
 * 
 */
export {
    
    ProtectedContainer as default,
    LogoutAPI
};