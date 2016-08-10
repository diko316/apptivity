'use strict';

var STATE_GEN_ID = 0,
    FSMS = {},
    EXPORTS = create,
    ACTIVITY = require('../define/activity.js');


function create(definition) {
    var list = FSMS,
        id = definition.id;
    var fsm;
    
    if (id in list) {
        return list[id];
    }
    
    list[id] = fsm = new Fsm(definition);
    return fsm;
    
}


function Fsm(definition) {
    
    this.ends = {};

    this.map = {};
    
    
    this.states = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    map: void(0),
    start: void(0),
    ends: void(0),
    states: void(0),
    
    generateState: function () {
        var id = 'state' + (++STATE_GEN_ID);
        this.map[id] = {};
        return id;
    },
    
    populateStates: function (definition) {
        var map = this.map,
            mgr = ACTIVITY,
            queue = definition.config.queue,
            c = -1,
            l = queue.length,
            stack = null;
            
        var item, activity, obj, left, right,
            pointer, state, target, end;
            
        console.log(queue);
        
        for (; l--;) {
            item = queue[++c];
            
            switch (item) {
            // join
            case '.':
                right = stack.fragment;
                stack = stack.before;
                left = stack.fragment;
                
                pointer = right.start;
                
                state = pointer.from;
                if (!state) {
                    state = this.generateState();
                    pointer.from = state;
                }
                
                for (end = left.end; end; end = end.next) {
                    pointer = end.pointer;
                    target = pointer.from;
                    pointer.to = target;
                    if (target) {
                        map[target][pointer.item.id] = state;
                    }
                }
                
                stack = {
                    fragment: {
                        start: left.start,
                        end: right.end
                    },
                    before: stack.before
                };
                break;
            
            // join options
            case '|':
                right = stack.fragment;
                stack = stack.before;
                left = stack.fragment;
                
                // join start
                pointer = left.start;
                state = pointer.from || right.start.from;
                if (!state) {
                    state = this.generateState();
                }
                
                end = null;
                for (; pointer; pointer = pointer.next) {
                    pointer.from = state;
                    target = pointer.to;
                    console.log('point: ', state, ' > ', pointer.item.id);
                    if (target) {
                        map[state][pointer.item.id] = target;
                        console.log(' join: ', state, ' > ', pointer.item.id, ' => ', target);
                    }
                    if (!end && !pointer.next) {
                        pointer.next = end = right.start;
                    }
                }
                
                // join ends
                end = left.end;
                for (; end.next; end = end.next) {}
                
                end.next = right.end; 
                
                stack = {
                    fragment: {
                        start: left.start,
                        end: left.end
                    },
                    before: stack.before
                };
                break;
            
            // condition merge
            case '<':
                right = stack.fragment;
                stack = stack.before;
                left = stack.fragment;
                
                // finalize options
                pointer = left.start;
                
                stack = {
                    fragment: {
                        start: left.start,
                        end: left.end
                    },
                    before: stack.before
                };
                break;
            
            //  activities
            default:
                activity = mgr(item);
                obj = {
                    item: activity,
                    state: null,
                    next: null
                };
                
                pointer = {
                    item: activity,
                    from: null,
                    to: null,
                    next: null
                };
                
                stack = {
                    fragment: {
                        start: pointer,
                        end: {
                            pointer: pointer,
                            next: null
                        }
                    },
                    before: stack
                };
            }
            // end
            if (!l && stack) {
                console.log(stack.fragment.start.item.id);
                //console.log(stack.fragment.end);
                // join start
                //pointer = stack.fragment.start;
                //state = pointer.from;
                //if (!state) {
                //    state = this.generateState();
                //    for (; pointer; pointer = pointer.next) {
                //        pointer.from = state;
                //    }
                //}
                //this.start = state;
                // join end
            }
        }
        
        if (!stack || stack.before) {
            throw new Error('invalid action sequence');
        }
        
        console.log(stack);
        
        
    }
    
    
    
    //populateStates: function (definition) {
    //    
    //    var map = this.map,
    //        states = this.states,
    //        state = this.start,
    //        endStates = this.ends,
    //        anchor = state,
    //        stack = null,
    //        config = definition.config,
    //        action = config.start,
    //        merge = null,
    //        stateBefore = null,
    //        actionAnchor = null,
    //        lastAction = null,
    //        option = null;
    //            
    //    var id, defOption, transition, guard, ends, inState;
    //    
    //    for (; action; ) {
    //        
    //        stateBefore = state;
    //        if (!actionAnchor) {
    //            actionAnchor = action;
    //        }
    //        
    //        // create transition
    //        transition = map[state];
    //        id = action.id;
    //        guard = id + '[' + (action.guardName || action.name) + ']';
    //        if (guard in transition) {
    //            throw new Error(
    //                'state conflict from transition ' +
    //                state + ' to ' +
    //                action.type + ':'  + action.name);
    //        }
    //        else {
    //            
    //            // new
    //            transition[guard] = id;
    //            state = id;
    //            map[state] = {};
    //        }
    //        
    //        inState = stateBefore in states;
    //        
    //        // condition option
    //        if (stateBefore === anchor.id && merge) {
    //            if (inState) {
    //                ends = states[stateBefore].options;
    //                ends[ends.length] = action.id;
    //                
    //            }
    //            else {
    //                states[stateBefore] = {
    //                    type: 'options',
    //                    options: [action.id]
    //                };
    //
    //            }
    //            
    //            
    //        }
    //        else if (inState) {
    //            states[stateBefore].target = action.id;
    //            
    //        }
    //        else {
    //            
    //            states[stateBefore] = {
    //                type: action.type,
    //                target: action.id
    //            };
    //        }
    //        
    //        // push to stack and evaluate action later
    //        defOption = action.options;
    //        if (defOption) {
    //
    //            stack = {
    //                action: action.next,
    //                option: option,
    //                config: config,
    //
    //                anchor: action,
    //                merge: merge,
    //                actionAnchor: actionAnchor,
    //
    //                before: stack
    //            };
    //            
    //            
    //            // create merge state
    //            merge = this.generateState();
    //            states[merge] = {
    //                type: 'merge',
    //                action: action.id,
    //                ends: []
    //            };
    //            state = action.id;
    //            anchor = action;
    //            
    //            option = defOption;
    //            config = option.definition.config;
    //            action = config.start;
    //            actionAnchor = null;
    //            
    //            if (!stack.before) {
    //                
    //                lastAction = merge;
    //            }
    //            continue;
    //            
    //        }
    //        else if (!stack) {
    //            lastAction = action.id;
    //        }
    //        
    //        // next
    //        action = action.next;
    //        
    //        for (; !action; ) {
    //            
    //            // iterate option
    //            if (option && option.next) {
    //                option = option.next;
    //                action = option.definition.config.start;
    //                
    //                // link to merge state
    //                states[state] = {
    //                    type: 'reduce',
    //                    reference: actionAnchor.id,
    //                    target: merge
    //                };
    //                ends = states[merge].ends;
    //                ends[ends.length] = state;
    //                //console.log(state, ' = ', anchor.id);
    //                state = anchor.id;
    //                actionAnchor = null;
    //                break;
    //        
    //            }
    //            
    //            // no more stack
    //            else if (!stack) {
    //                break;
    //            }
    //            
    //            // iterate stack
    //            action = stack.action;
    //            option = stack.option;
    //            
    //            // reduce
    //            states[state] = {
    //                type: 'reduce',
    //                reference: actionAnchor.id,
    //                target: merge
    //            };
    //            
    //
    //            ends = states[merge].ends;
    //            ends[ends.length] = state;
    //            state = merge;
    //            
    //            anchor = stack.anchor;
    //            config = stack.config;
    //            merge = stack.merge;
    //            
    //            actionAnchor = stack.actionAnchor;
    //            stack = stack.before;
    //
    //        }
    //        
    //        // ended
    //        if (!action) {
    //            endStates[lastAction] = true;
    //        }
    //    }
    //
    //},
    
    //lookup: function (state) {
    //    var states = this.states,
    //        mgr = ACTIVITY;
    //        
    //    var activity, action;
    //    
    //    if (typeof state === 'string' && state in states) {
    //        
    //        activity = states[state];
    //        
    //        switch (activity.type) {
    //        case 'action':
    //            return [
    //                activity.target,
    //                'action',
    //                mgr(activity.target)
    //            ];
    //        
    //        case 'condition':
    //            return [
    //                activity.target,
    //                'action',
    //                mgr(activity.target)
    //            ];
    //        case 'fork':
    //            return [
    //                activity.target,
    //                'action',
    //                mgr(activity.target)
    //            ];
    //        case 'options':
    //            action = mgr(state);
    //            return [
    //                activity.options,
    //                action.type,
    //                action
    //            ];
    //        case 'reduce':
    //            action = mgr(state);
    //            return [
    //                activity.target,
    //                'action',
    //                action
    //            ];
    //        case 'merge':
    //            
    //        }
    //        
    //        
    //        
    //        console.log(state, '=> ', activity);
    //        //
    //        //
    //        //activity = states[state];
    //        //action = ACTIVITY(activity.action);
    //        //console.log('action id ', activity.action, action);
    //        //return {
    //        //    state: map[state][action.id],
    //        //    activity: activity,
    //        //    action: action
    //        //};
    //        //console.log('transition: ', transition);
    //    }
    //    return void(0);
    //}
    
};








module.exports = EXPORTS;