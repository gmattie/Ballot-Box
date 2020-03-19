/**
 * @description Collapsible component.
 * 
 * @requires Button
 * @requires constants
 * @requires prop-types
 * @requires react
 * @requires Triangle
 * @requires utilities
 * @public
 * @module
 * 
 */
import { concatClassNames } from "../../support/utilities";
import * as C from "../../support/constants";
import Button from "../controls/Button";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef } from "react";
import Triangle from "../../assets/Triangle.svg";

/**
 * @description A wrapper component that facilitates expanding and collapsing children content when the header "Button" component is clicked.
 * 
 * @param {object} props - Immutable properties populated by the parent component.
 * @returns {object} The portal rendered to the DOM.
 * @public
 * @function
 * 
 */
const Collapsible = ({
    
        title,
        children,
        eventHandler,
        expanded,
    }) => {

    /**
     * Refs
     * 
     */
    const arrowRef = useRef();
    const contentRef = useRef();

    /**
     * @description Calls a provided "eventHandler" prop if the component is initialized in an expanded state.
     * 
     * @private
     * @function
     * 
     */
    useEffect(() => {

        if (expanded) {

            eventHandler(false);
        }
    }, [eventHandler, expanded]);

    /**
     * @description Handler for a dispatched "transitionend" event.
     * Upon completing a CSS transition from either expanding or collapsing the component, the CSS "display" property will be set as either "block" or "none" respectively.
     * Additionally, the temporary inline "style" attribute is removed and a provided "eventHandler" prop will be called.
     * 
     * @param {object} event - The event object.
     * @private
     * @function
     * 
     */
    const transitionEndHandler = useCallback((event) => {

        const content = event.target;
        const isContentCollapsed = (content.style.height === `${0}${C.CSS.PX}`);
        
        if (isContentCollapsed) {
            
            content.classList.add(C.Style.HIDDEN);
        }
        
        content.removeEventListener(C.Event.TRANSITION_END, transitionEndHandler);
        content.removeAttribute(C.HTMLElement.Attribute.STYLE);

        if (eventHandler) {

            eventHandler(isContentCollapsed);
        }
    }, [eventHandler]);

    /**
     * @description Handler for a dispatched "click" event on the header "Button" component.
     * This function facilitates a smooth CSS transition for both collapsing and expanding the component within a continuous vertical document flow.
     * 
     * @private
     * @function
     * 
     */
    const headerClickHandler = useCallback(() => {
        
        const content = contentRef.current;
        content.addEventListener(C.Event.TRANSITION_END, transitionEndHandler);
        
        const arrow = arrowRef.current;
        arrow.classList.toggle(C.Style.COLLAPSIBLE_ARROW_EXPANDED);

        const isContentCollapsed = content.classList.contains(C.Style.HIDDEN);

        if (isContentCollapsed) {
            
            content.style.height = `${0}${C.CSS.PX}`;
            content.classList.remove(C.Style.HIDDEN);

            window.requestAnimationFrame(() => {

                content.style.height = `${content.scrollHeight}${C.CSS.PX}`;
            });
        }
        else {
            
            window.requestAnimationFrame(() => {
                
                content.style.height = `${content.scrollHeight}${C.CSS.PX}`;
                
                window.requestAnimationFrame(() => {
                    
                    content.style.height = `${0}${C.CSS.PX}`;
                });
            });
        }
    }, [transitionEndHandler]);

    /**
     * JSX markup
     * 
     */
    return (

        <div className={C.Style.COLLAPSIBLE}>
            <Button
                style={C.Style.BUTTON_SUBMIT}
                onClick={headerClickHandler}
            >
                <img
                    ref={arrowRef}
                    className={
                        concatClassNames(
                            C.Style.COLLAPSIBLE_ARROW,
                            (expanded && C.Style.COLLAPSIBLE_ARROW_EXPANDED)
                        )
                    }
                    src={Triangle}
                    alt={C.Label.ARROW}
                />

                {title}
            </Button>

            <div
                ref={contentRef}
                className={
                    concatClassNames(
                        C.Style.COLLAPSIBLE_CONTENT,
                        (!expanded && C.Style.HIDDEN)
                    )
                }
            > 
                {children}
            </div>
        </div>
    );
};

/**
 * Prop Types
 * 
 */
Collapsible.propTypes = {

    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    eventHandler: PropTypes.func,
    expanded: PropTypes.bool,
};

/**
 * Export module
 * 
 */
export default Collapsible;