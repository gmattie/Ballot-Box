/**
 * @description ItemDetail component.
 * 
 * @requires constants
 * @requires Portal
 * @requires prop-types
 * @requires react
 * @requires ViewportImage
 * @public
 * @module
 * 
 */
import * as C from "../../support/constants";
import Portal from "./Portal";
import PropTypes from "prop-types";
import React, { useRef } from "react";
import ViewportImage from "../ViewportImage";

/**
 * @description Renders an modal window inside a React Portal.
 * ItemDetail components must contain an "imageURL" and "title" for display and a "dismountCallback" function
 * that is passed down to the Portal child component for removal of the modal window from the DOM.
 * 
 * @param {object} props - Immutable properties populated by the parent component.
 * @returns {object} The portal rendered to the DOM.
 * @public
 * @function
 * 
 */
const ItemDetail = ({

        imageURL,
        title,
        result,
        dismountCallback
    }) => {

    /**
     * Refs
     */
    const portal = useRef(null);

    /**
     * @description Handler for dispatched "click" events.
     * Since this modal component may have sibling modal components it is necessary to stop the propagation of the click event. 
     * 
     * @param {object} event - The event object. 
     * @private
     * @function
     * 
     */
    const clickHandler = (event) => {

        event.stopPropagation();

        portal.current.exit();
    };

    /**
     * @description Returns the appropriate ordinal suffix for a target number.
     * 
     * @param {number} value - The target number.
     * @private
     * @function
     * 
     */
    const getOrdinal = (value) => {

        const ones = value % 10;
        const tens = value % 100;

        if (ones === 1 && tens !== 11) {

            return C.Ordinal.ST;
        }

        if (ones === 2 && tens !== 12) {

            return C.Ordinal.ND;
        }

        if (ones === 3 && tens !== 13) {

            return C.Ordinal.RD;
        }

        return C.Ordinal.TH;
    };

    /**
     * @description Returns the appropriate label for the number of points.
     * 
     * @param {number} value - The number of points.
     * @private
     * @function
     * 
     */
    const getPoints = (value) => {

        const label = (value === 1)
            ? C.Label.POINT
            : C.Label.POINTS;

        return `${value} ${label}`;
    };
    
    /**
     * JSX markup
     * 
     */
    return (

        <Portal
            ref={portal}
            elementID={C.ID.ELEMENT_ITEM_DETAIL}
            dismountCallback={dismountCallback}
        >
            <div
                className={C.Style.ITEM_DETAIL}
                onClick={clickHandler}
            >
                <ViewportImage
                    src={imageURL}
                    alt={title}
                    placeholder={C.Image.TRANSPARENT_PLACEHOLDER}
                    imageStyle={C.Style.ITEM_DETAIL_IMAGE}
                    preIntersectionStyle={C.Style.TRANSPARENT}
                    intersectionStyle={C.Style.ITEM_DETAIL_IMAGE_INTERSECTION}
                    errorStyle={C.Style.ITEM_DETAIL_IMAGE_ERROR}
                    preloaderStyle={C.Style.ITEM_DETAIL_IMAGE_PRELOADER}
                />

                <div className={C.Style.ITEM_DETAIL_INFO}>
                    <div className={C.Style.ITEM_DETAIL_INFO_TITLE}>
                        {title}
                    </div>

                    {result && 
                        <div className={C.Style.ITEM_DETAIL_INFO_RESULT}>
                            <div className={C.Style.ITEM_DETAIL_INFO_RESULT_ENTRY}>
                                <span className={C.Style.ITEM_DETAIL_INFO_RESULT_ENTRY_KEY}>
                                    {C.Label.RANK}:
                                </span>

                                <span className={C.Style.ITEM_DETAIL_INFO_RESULT_ENTRY_VALUE}>
                                    {result[C.Model.RANK]}

                                    <span className={C.Style.ITEM_DETAIL_INFO_RESULT_ENTRY_VALUE_ORDINAL}>
                                        {getOrdinal(result[C.Model.RANK])}
                                    </span>
                                </span>
                            </div>

                            <div className={C.Style.ITEM_DETAIL_INFO_RESULT_ENTRY}>
                                <span className={C.Style.ITEM_DETAIL_INFO_RESULT_ENTRY_KEY}>
                                    {C.Label.SCORE}:
                                </span>

                                <span className={C.Style.ITEM_DETAIL_INFO_RESULT_ENTRY_VALUE}>
                                    {getPoints(result[C.Model.TOTAL])}
                                </span>
                            </div>
                        </div>
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
ItemDetail.propTypes = {

    imageURL: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    
    result: PropTypes.shape({

        [C.Model.RANK]: PropTypes.number.isRequired,
        [C.Model.TOTAL]: PropTypes.number.isRequired
    }),

    dismountCallback: PropTypes.func.isRequired,
};

/**
 * Export module
 * 
 */
export default ItemDetail;