'use strict';

function transform(type) {
    switch (type) {
    // args: type, operation, fsmName, config   (return: result overrides)
    case "initialize":  
        return {
            transitions: []
        };
        
    // args: type, operation, stateName, type   (return: new stateName)
    //case "state":
    
    // args: type, operation, customState, proposedNode
    //                                          (return: new action id)
    //case "node":
    
    // args: type, operation, customSourceState, actionOjbect, customTargetState
    //                                          (return: transition object if
    //                                              transition list is Array,
    //                                              or string if transition
    //                                              list is object)
    //case "transition":
    }
}

module.exports = transform;