'use strict';

var FSM = require('./fsm.js'),
    ACTIVITY = require('../define/activity.js'),
    PROMISE = require('bluebird'),
    SESSION_GEN_ID = 0;
    
    


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
                    reject(action);
                }
                else if (count === all) {
                    resolved = true;
                    resolve(actions);
                }
            }
            
            return resolved ?
                    PROMISE.reject(new Error()) : data;
        }
        
        for (; !resolved && l--;) {
            action = actions[++c];
            if (action.guard) {
                promise = promise.then(create(action, resolver, onlyOne));
            }
            else {
                unguarded[ul++] = action;
            }
        }
        
        // last priority
        if (onlyOne && ul) {
            ul = 1;
        }
        
        for (c = -1, l = ul; !resolved && l--;) {
            promise = promise.
                        then(createUnguarded(unguarded[++c], resolver));
        }
        
    });
}

function executeAction(action, data, applyGuard) {
    if (applyGuard === true) {
        
    }
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
    
    next: function (data) {
        
        var current = this.current,
            fsm = this.fsm,
            activity = ACTIVITY;
            
        var config, action, guard, promise, request;
            
        if (!current) {
            this.current = current = {
                state: fsm.start,
                data: null
            };
        }
        
        config = fsm.lookup(current.state);
        
        switch (config.type) {
        case 'link':
            action = activity(config.target);
            
            executeGuard(data, [action], true).
                then(function (data) {
                    console.log('gud! ', data);
                });

            break;
        
        case 'condition':
        }
        
        
        
        
        console.log(config);
        
        
        
    }
};


module.exports = Session;