/**
 * @description ListItem component.
 * 
 * @requires constants
 * @requires prop-types
 * @requires react
 * @requires react-beautiful-dnd
 * @requires ViewportImage
 * @public
 * @module
 * 
 */
import { Draggable } from "react-beautiful-dnd";
import * as C from "../../support/constants";
import PropTypes from "prop-types";
import React, { useRef } from "react";
import ViewportImage from "../ViewportImage";

/**
 * @description The ListItem component displays data passed down as props from the LitItemContainer parent component.
 * 
 * @param {object} props - Immutable properties populated by the parent component.
 * @returns {object} JSX markup.
 * @public
 * @function
 * 
 */
const ListItem = ({ data, index, showItemDetails }) => {

    /**
     * Refs
     * 
     */
    const previousClick = useRef(null);

    /**
     * @description Simulates a double-click event on all devices.
     * A double-click is determined by two clicks occurring within the standard time of 500 milliseconds.
     * 
     * @private
     * @function
     * 
     */
    const doubleClickHandler = () => {

        if (data[C.Model.IMAGE]) {

            const currentClick = Date.now();

            if (currentClick - previousClick.current < 500) {

                showItemDetails(data[C.Model.NAME], data[C.Model.IMAGE]);
            }
            else {

                previousClick.current = currentClick;
            }
        }
    };
 
    /**
     * JSX markup
     * 
     */
    return (
    
        <Draggable
            draggableId={data[C.Model.ID]}
            index={index}
        >
            {(provided, snapshot) => {
                
                if (snapshot.isDragging && window[C.Global.LIST_ITEM_DRAG_TARGET] !== data[C.Model.NAME]) {
                    
                    window[C.Global.LIST_ITEM_DRAG_TARGET] = data[C.Model.NAME];
                }

                const className = snapshot.isDragging
                ? C.Style.LIST_ITEM_ACTIVE
                : C.Style.LIST_ITEM;

                const isDragTarget = (window[C.Global.LIST_ITEM_DRAG_TARGET] === data[C.Model.NAME]);

                const placeholder = (isDragTarget)
                    ? data[C.Model.THUMBNAIL]
                    : C.Image.TRANSPARENT_PLACEHOLDER;

                const intersectionStyle = (isDragTarget)
                    ? null
                    : C.Style.LIST_ITEM_IMAGE_INTERSECTION;

                return (

                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={className}
                        style={provided.draggableProps.style}
                        onClick={doubleClickHandler}
                    >
                        <ViewportImage
                            src={data[C.Model.THUMBNAIL]}
                            alt={data[C.Model.NAME]}
                            placeholder={placeholder}
                            imageStyle={C.Style.LIST_ITEM_IMAGE}
                            preIntersectionStyle={C.Style.TRANSPARENT}
                            intersectionStyle={intersectionStyle}
                            errorStyle={C.Style.LIST_ITEM_IMAGE_ERROR}
                        />

                        <div className={C.Style.LIST_ITEM_TITLE}>
                            {data[C.Model.NAME]}
                        </div>
                    </div>
                );
            }}
        </Draggable>
    );
};

/**
 * Prop Types
 * 
 */
ListItem.propTypes = {

    data: PropTypes.shape({

        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        image: PropTypes.string,
        date: PropTypes.string
    }).isRequired,

    index: PropTypes.number.isRequired,
    showItemDetails: PropTypes.func.isRequired
};

/**
 * Export module
 * 
 */
export default ListItem;