'use strict';

var ACTIVITY = require('../define/activity.js'),
    FSM = require('./parser.js'),
    EXPORTS = getTransformer,
    TRANSFORMERS = {};

function registerTransformer(name, handler) {
    if (!name || typeof name !== 'string') {
        throw new Error("Invalid transformer [name] parameter");
    }
    
    if (!(handler instanceof Function)) {
        throw new Error("Invalid transform [handler] parameter");
    }
    
    TRANSFORMERS[':' + name] = handler;
    handler.transformType = name;
    
    return EXPORTS;
}

function getTransformer(name) {
    var list = TRANSFORMERS;
    var id;
    
    if (!name || typeof name !== 'string') {
        throw new Error("Invalid transformer [name] parameter");
    }
    
    id = ':' + name;
    
    if (id in list) {
        return list[id];
    }
    
    return void(0);
}

function exportFSM(transformer, fsm) {
    
    var hasOwn = Object.prototype.hasOwnProperty,
        translateState = transformStateName,
        translateNode = transformNode,
        translateTransition = transformTransition,
        
        TYPE_STATE = 1,
        TYPE_NODE = 2,
        TYPE_TRANSITION = 3,
        
        states = fsm.map,
        directions = fsm.directions,
        actions = fsm.actions,
        merges = fsm.merges,
        input = {
            type: TYPE_STATE,
            data: fsm.start,
            next: null
        },
        last = input,
        stack = null,
        stateNames = {},
        exportObject = {},
        config = {
            name: fsm.name,
            nodeName: 'action',
            transitionName: 'events',
            startName: 'start',
            
            //fsm: fsm,
            engine: getTransformer(transformer),
            states: stateNames,
            actions: {},
            
            transitions: {},
            nodes: {},
            result: exportObject
        };
        
    var direction, source, target, state, item, action, id, transitions, data,
        index, desc, lastStack;
        
    //console.log('transform! ', fsm);
    
    // initialize exportObject
    transformInitialize(config, config.name);
    
    for (; input; input = input.next) {
        switch (input.type) {
        case TYPE_STATE:
            source = input.data;
            transitions = states[source];
            
            // get all actions and transitions
            for (action in transitions) {
                if (hasOwn.call(transitions, action)) {
                    last = last.next = {
                        type: TYPE_NODE,
                        data: [source, action],
                        next: null
                    };
                    
                    // add state
                }
            }
            break;
        
        case TYPE_NODE:
            data = input.data;
            source = data[0];
            desc = data[1];
            index = source + ' > ' + desc;
            target = null;
            lastStack = stack;
            
            //console.log('has actions? ', index, ' in ', actions);
            if (index in actions) {
                action = actions[index];
                id = action.actionId;
                target = states[source][desc];
                //console.log("target: ", desc, " in ", states[source]);
                
                // translate source state
                if (!(source in stateNames)) {
                    translateState(config, source, id);
                }
                
                // translate node
                if (index in actions) {
                    translateNode(config, source, id);
                }

                // queue next
                if (!(target in stateNames)) {
                    console.log('   queue target state: ', target);
                    last = last.next = {
                        type: TYPE_STATE,
                        data: target,
                        next: null
                    };
                }
                
                // queue transition
                
                // add to stack
                stack = {
                    source: source,
                    action: id,
                    target: target,
                    before: stack
                };
                    
                //last = last.next = {
                //    type: TYPE_TRANSITION,
                //    data: [source, id, target],
                //    next: null
                //};
                
                
            }
            // is end action
            else {
                
            }
            
            if (lastStack) {
                last = last.next = {
                    type: TYPE_TRANSITION,
                    data: [lastStack.source,
                            lastStack.action,
                            lastStack.target],
                    next: null
                };
                stack = stack.before;
            }
            
            // process stack
            //if (stack) {
            //    last = last.next = {
            //        type: TYPE_TRANSITION,
            //        data: [stack.source, stack.action, stack.target],
            //        next: null
            //    };
            //    stack = stack.before;
            //}
            ////console.log("next ", target);
            //// create transition stack
            //if (target) {
            //    
            //    // add to stack
            //    stack = {
            //        source: source,
            //        action: id,
            //        target: target,
            //        before: stack
            //    };
            //    
            //}
            break;
        case TYPE_TRANSITION:
            data = input.data;
            console.log('   * create transition', data);
            translateTransition(config, data[0], data[1], data[2]);
        }
    }
    //console.log("config: ", config.fsm);
    console.log("config: ", config);
    
    console.log("config: ", fsm);
    
}

// initialize
function transformInitialize(config, name) {
    var toString = Object.prototype.toString,
        exportObject = config.result,
        result = config.engine('custom-result',
                                exportObject,
                                name,
                                config),
        
        isArray = false,
        defaultTransitions = config.transitions,
        transitions = defaultTransitions;
    
    if (toString.call(result) === '[object Object]') {
        
        // finalize transitions
        transitions = result.transitions;
        isArray = transitions instanceof Array;
        if (!isArray && toString.call(transitions) !== '[object Object]') {
            transitions = defaultTransitions;
        }
        
    }
    
    config.arrayTransitions = isArray;
    
    exportObject[config.transitionName] = config.transitions = transitions;
        
    // finalize nodes/actions
    exportObject[config.nodeName] = config.nodes;
}


// customize state name
function transformStateName(config, state) {
    var result = config.engine('custom-state',
                                    config.exportObject,
                                    state);
    
    config.states[state] = result && typeof result === 'string' ?
                                                        result : state;
    
    console.log('translated ', state, ' == ', config.states[state]);
}

// customize node name
function transformNode(config, state, actionId) {
    var action = ACTIVITY(actionId),
        actionObject = {
            id : actionId,
            name: action.name,
            type: action.type,
            descriptions: action.descriptions,
            guard: action.guardName,
            handler: action.handlerName
        },
        result = config.engine('custom-node',
                                    config.exportObject,
                                    config.states[state],
                                    actionObject);
    
        
    if (!result || typeof result !== 'string') {
        actionObject.id = result = actionId;
    }
    
    config.actions[actionId] = result;
    config.nodes[result] = actionObject;
    
    
    //console.log('same? ', actionObject.handler, action.handlerName);
}

// add transition
function transformTransition(config, source, action, target) {
    
    var exportObject = config.exportObject,
        translatedSource = config.states[source],
        translatedTarget = config.states[target],
        translatedAction = config.actions[action],
        transitions = config.transitions,
        arrayTransitions = config.arrayTransitions,
        
        result = config.engine('transition',
                                        exportObject,
                                        translatedSource,
                                        translatedAction,
                                        translatedTarget);
        
    //console.log("translated target? ", translatedTarget, " for: ", source, action, target);
    console.log("   connect ", source, ' > ', action, ' = ', target, '?', translatedTarget);
    
    if (Object.prototype.toString.call(result) !== '[object Object]') {
        result = arrayTransitions ? {
                            from: translatedSource,
                            name: translatedAction,
                            to: translatedTarget
                        } : translatedTarget;
    }
    
    if (arrayTransitions) {
        if (Object.prototype.toString.call(result) !== '[object Object]') {
            result = {
                        from: translatedSource,
                        name: translatedAction,
                        to: translatedTarget
                    };
        }
        transitions[transitions.length] = result;
        
    }
    else {
        if (!result || typeof result !== 'string') {
            result = translatedTarget;
        }
        
        if (!(translatedSource in transitions)) {
            transitions[translatedSource] = {};
        }
        
        transitions[translatedSource][translatedAction] = result;
    }
}


module.exports = EXPORTS;
EXPORTS.exportFSM = exportFSM;
EXPORTS.register = registerTransformer;

// register default transformer
registerTransformer('default', require("./transformer/default.js"));