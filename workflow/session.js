'use strict';

var FSM = require('./fsm.js'),
    PROCESSOR = require('./processor.js'),
    ACTIVITY = require('../define/activity.js'),
    PROMISE = require('bluebird'),
    SESSION_GEN_ID = 0;
    
// TODO: create processor


function EMPTY() {
    
}


function createGuardCallback(action, resolver) {
    var guard = action.guard;
    return function (data) {
        return PROMISE.resolve(guard(data)).
                then(function () {
                        return resolver(action, data, true);
                    },
                    function () {
                        return resolver(action, data, false);
                    }).
                    catch(EMPTY);
    };
}

function createUnguardedCallback(action, resolver) {
    return function (data) {
        return PROMISE.resolve(data).
                then(function (data) {
                    return resolver(action, data, true);
                }).
                catch(EMPTY);
    };
}


function executeGuard(data, actions, getOne) {
    
    var len = actions.length;

    return new PROMISE(function (resolve, reject) {
        var create = createGuardCallback,
            createUnguarded = createUnguardedCallback,
            l = len,
            c = -1,
            processed = 0,
            errors = 0,
            unguarded = [],
            ul = 0,
            promise = PROMISE.resolve(data),
            resolved = false,
            onlyOne = getOne !== false;
            
        var action;
        
        function resolver(action, data, success) {
            var all = len,
                count = ++processed,
                errorCount = success ? errors : ++errors;
            
            // one guard only
            if (onlyOne) {
                if (!errorCount) {
                    resolved = true;
                    resolve(action);
                }
                else if (count === all) {
                    resolved = true;
                    reject(false);
                }
            }
            // execute all
            else {
                if (errorCount) {
                    resolved = true;
                    reject(null);
                }
                else if (count === all) {
                    resolved = true;
                    resolve(actions);
                }
            }
            
            return resolved ?
                    PROMISE.reject(new Error()) : data;
        }
        
        // resolve guarded
        for (; !resolved && l--;) {
            action = actions[++c];
            if (action.guard) {
                promise = promise.then(create(action, resolver, onlyOne));
            }
            else {
                unguarded[ul++] = action;
            }
        }
        
        
        if (onlyOne && ul) {
            ul = 1;
        }
        
        // unguarded last priority
        for (c = -1, l = ul; !resolved && l--;) {
            promise = promise.
                        then(createUnguarded(unguarded[++c], resolver));
        }
        
    });
}



function Session(fsm) {
    if (!FSM.is(fsm)) {
        throw new Error('invalid [fsm] object parameter');
    }
    this.id = 'sid' + (++SESSION_GEN_ID);
    this.fsm = fsm;
}

Session.prototype = {
    id: void(0),
    fsm: void(0),
    current: null,
    constructor: Session,
    
    start: function () {
        
    },
    
    stop: function () {
        
    }
    
    
    //hasPendingProcess: function () {
    //    var current = this.current;
    //    
    //    for (; current; current = current.next) {
    //        if (current.processing()) {
    //            return true;
    //        }
    //    }
    //    
    //    return false;
    //},
    //
    //next: function (data) {
    //    
    //    var me = this,
    //        current = me.current,
    //        fsm = me.fsm,
    //        activity = ACTIVITY,
    //        processor = PROCESSOR;
    //        
    //    var state, config;
    //    
    //    // do not proceed if there are pending process
    //    if (me.hasPendingProcess()) {
    //        return new PROMISE(function (resolve) {
    //            var p = processor,
    //                subscriptions = [
    //                    p.subscribe('complete', execOnNoPending),
    //                    p.subscribe('cancel', execOnNoPending),
    //                    p.subscribe('before-kill', execOnNoPending)
    //                ];
    //                
    //            function execOnNoPending() {
    //                var list = subscriptions;
    //                var l, len;
    //                if (!me.hasPendingProcess()) {
    //                    
    //                    // remove event listener
    //                    for (l = len = list.length; l--;) {
    //                        list[l]();
    //                    }
    //                    list.splice(0, len);
    //                    resolve(me.next(data));
    //                }
    //            }
    //        });
    //    }
    //    
    //    
    //        
    //    //var config, action, guard, promise, request;
    //    //    
    //    //if (!current) {
    //    //    this.current = current = {
    //    //        state: fsm.start,
    //    //        data: null
    //    //    };
    //    //}
    //    //
    //    //config = fsm.lookup(current.state);
    //    //
    //    //switch (config.type) {
    //    //case 'link':
    //    //    action = activity(config.target);
    //    //    
    //    //    return executeGuard(data, [action], true).
    //    //                then(function () {
    //    //                    console.log('action ready ', action); 
    //    //                    //return executeAction(data, action);
    //    //                });
    //    //
    //    //case 'condition':
    //    //}
    //    //
    //    //
    //    //
    //    //
    //    //console.log(config);
    //    //
    //    //
    //    
    //}
};


module.exports = Session;