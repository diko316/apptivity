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
    
    this.actions = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    map: void(0),
    start: void(0),
    ends: void(0),
    actions: void(0),
    
    generateState: function (before, pointer) {
        var id = 'state' + (++STATE_GEN_ID);
        this.map[id] = {};
        return {
                id: id,
                pointer: pointer || null,
                before: before || null
            };
    },
    
    populateStates: function (definition) {
        var map = this.map,
            ends = this.ends,
            actions = this.actions,
            mgr = ACTIVITY,
            queue = definition.config.queue,
            c = -1,
            l = queue.length,
            stack = null,
            monitored = null;
            
        var item, activity, left, right, pointer, options, wait,
            state, target, end, fragment, transition;
        
        for (; l--;) {
            item = queue[++c];
            
            switch (item) {
            // join
            case '[]':
            case '.':
                right = stack.fragment;
                stack = stack.before;
                left = stack.fragment;
                
                state = right.state;
                if (!state) {
                    state = monitored = this.generateState(
                                                    monitored,
                                                    right.pointer);
                    right.state = state;
                    pointer = right.pointer;
                    for (; pointer; pointer = pointer.next) {
                        if (!pointer.from) {
                            pointer.from = state;
                        }
                    }
                }
                
                end = left.end;
                
                for (; end; end = end.next) {
                    fragment = end.fragment;
                    pointer = fragment.pointer;
                    for (; pointer; pointer = pointer.next) {
                        if (!pointer.to) {
                            pointer.to = state.id;
                        }
                    }
                }
                
                if (item === '[]') {
                    activity = left.pointer.item;
                    
                    state.action = {
                        type: activity.type,
                        target: right.options,
                        action: activity.id
                    };
                    
                    // must create wait from pointers in setting up options
                    
                    //console.log('[]', state.id);
                    //end = right.end;
                    //for (; end; end = end.next) {
                    //    fragment = end.fragment;
                    //    pointer = fragment.pointer;
                    //    console.log(' ',
                    //        pointer.from && pointer.from.id, ':',
                    //        pointer.item.desc, ' > ',
                    //        pointer.to);
                    //    
                    //    pointer.wait = 
                    //}
                    
                    //state.wait = fragment.end;
                    
                    //console.log('[] ', state.id,
                    //            ' << ', left.pointer.item.desc,
                    //            ' > ',
                    //            right.end.fragment.pointer.from &&
                    //            right.end.fragment.pointer.from.id,
                    //            right.end.fragment.pointer.item.desc);
                    
                }
                else {
                    
                    state.action = {
                        type: 'link',
                        target: right.pointer.item.id
                    };
                    
                    //console.log('. ', state.id,
                    //    //' << ', left.pointer.item.desc,
                    //    ' < ', right.pointer.item.desc);
                    //    //' ? ', right.end.fragment.pointer.from,
                    //    //right.end.fragment.pointer.item &&
                    //    //right.end.fragment.pointer.item.desc);
                    
                }
                
                fragment = {
                    state: left.state,
                    pointer: left.pointer,
                    lastPointer: left.pointer,
                    end: right.end,
                    lastEnd: right.lastEnd,
                    options: null
                };
                
                stack = {
                    fragment: fragment,
                    before: stack.before
                };
                
                state = state.id;
                activity = left.active;
                
                break;
            
            // join options
            case '|':
                right = stack.fragment;
                stack = stack.before;
                left = stack.fragment;
                
                state = left.state || right.state;
                
                // create options
                options = left.options;
                if (!options) {
                    left.options = options = [
                        left.pointer.item.id
                    ];
                }
                options[options.length] = right.pointer.item.id;
                
                // join pointer
                left.lastPointer.next = right.pointer;
                
                // join ends
                left.lastEnd.next = right.end;
                
                stack = {
                    fragment: {
                        state: state,
                        pointer: left.pointer,
                        lastPointer: right.lastPointer,
                        end: left.end,
                        lastEnd: right.lastEnd,
                        options: options
                    },
                    before: stack.before
                };
                break;
            
            //  activities
            default:
                activity = mgr(item);
                
                fragment = {
                    active: activity,
                    state: null,
                    options: null
                };
                
                fragment.pointer = fragment.lastPointer = {
                    item: activity,
                    to: null,
                    next: null
                };
                
                fragment.end = fragment.lastEnd = {
                    fragment: fragment,
                    next: null
                };

                stack = {
                    fragment: fragment,
                    before: stack
                };
            }
            
            // end
            if (!l && stack) {
                fragment = stack.fragment;
                state = fragment.state;
                
                // create start state
                if (!state) {
                    pointer = fragment.pointer;
                    state = monitored = this.generateState(
                                                monitored,
                                                pointer);
                    
                    pointer.from = state;
                    fragment.state = state;
                    
                    state.action = {
                        type: 'link',
                        target: pointer.item.id
                    };
                }
                
                this.start = state.id;
                
                // create end state
                end = fragment.end;
                target = null;
                for (; end; end = end.next) {
                    
                    fragment = end.fragment;
                    pointer = fragment.pointer;
                    
                    for (; pointer; pointer = pointer.next) {
                        state = pointer.to;
                        if (!state) {
                            if (!target) {
                                target = monitored = this.generateState(
                                                                monitored);
                                ends[target.id] = true;
                                target.action = {
                                    type: 'end'
                                };
                            }
                            pointer.to = target.id;
                        }
                        else {
                            ends[state] = true;
                        }
                    }
                    
                }
                
                // map states
                for (; monitored; monitored = monitored.before) {
                    state = monitored.id;
                    pointer = monitored.pointer;
                    transition = map[state];
                    
                    if (monitored.action) {
                        actions[state] = monitored.action;
                    }
                    
                    for (; pointer; pointer = pointer.next) {
                        transition[pointer.item.desc] = pointer.to;
                        if (!pointer.from) {
                            console.log('no from :-(', state, ' > ', pointer.item.desc);
                        }
                    }
                    
                    //end = monitored.wait;
                    //if (end) {
                    //    for (; end; end = end.next) {
                    //        fragment = end.fragment;
                    //        console.log(' wait: ',
                    //            fragment.pointer.item.desc,
                    //            fragment.pointer.to
                    //        );
                    //    }
                    //    
                    //}
                }
            }
        }
        
        if (!stack || stack.before) {
            throw new Error('invalid action sequence');
        }
        
    },
    
    lookup: function (state, action) {
        var map = this.map;
        var transition;
        
        if (typeof state === 'string' &&
            state in map &&
            typeof action === 'string') {
            
            transition = map[state];
            if (action in transition) {
                return transition[action];
            }
        }
        return void(0);
    }
    
    
};








module.exports = EXPORTS;