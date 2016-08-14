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
                        return resolver(action, data, true, null);
                    },
                    function (e) {
                        return resolver(action, data, false, e);
                    });
    };
}

function createUnguardedCallback(action, resolver) {
    return function (data) {
        return PROMISE.resolve(data).
                then(function (data) {
                        return resolver(action, data, true);
                    });
    };
}


function executeGuard(data, actions) {
    var len = actions.length;

    return new PROMISE(function (resolve, reject) {
        var create = createGuardCallback,
            createUnguarded = createUnguardedCallback,
            l = len,
            c = -1,
            processed = 0,
            unguarded = [],
            ul = 0,
            promise = PROMISE.resolve(data),
            resolved = false;
            
        var action;
        
        function resolver(action, data, success, errorMessage) {
            var all = len,
                count = ++processed;
            
            if (success) {
                resolved = true;
                resolve(action);
            }
            else if (count === all) {
                resolved = true;
                reject(errorMessage);
            }
            
            return resolved ?
                    PROMISE.reject(new Error()) : data;
        }
        
        // resolve guarded
        for (; !resolved && l--;) {
            action = actions[++c];
            if (action.guard) {
                promise = promise.then(create(action, resolver));
            }
            else {
                unguarded[ul++] = action;
            }
        }
        
        // unguarded last priority
        for (c = -1, l = ul; !resolved && l--;) {
            promise = promise.
                        then(createUnguarded(unguarded[++c], resolver));
        }
        
        promise.catch(EMPTY);
        
    });
}

function execActionOnFulfill(action, data, state, fsm) {
    var to = fsm.target(state, action.desc);
    
    return PROMISE.resolve(data).
                then(function () {
                    var handler = action.handler;
                    return handler ?
                                handler(data) : data;
                }).
                then(function (response) {
                    return {
                        activity: action,
                        from: state,
                        to: to,
                        request: data,
                        response: response
                    };
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
    
    exec: function (state, data) {
        var me = this,
            fsm = me.fsm,
            activity = fsm.lookup(state),
            mgr = ACTIVITY,
            Promise = PROMISE;
            
        var action, actions, options, c, l, responses, promises, callback;
        
        if (!activity) {
            return Promise.reject(
                    new Error('No activity found in state: ' + state));
        }
        
        switch (activity.type) {
            
        case 'link':
            action = fsm.action(state, activity.target);
            return executeGuard(data, [action], true).
                        then(function () {
                            return execActionOnFulfill(
                                        action,
                                        data,
                                        state,
                                        fsm);
                        });

        case 'condition':
            action = mgr(activity.action);
            options = activity.options;
            actions = [];
            for (c = -1, l = options.length; l--;) {
                actions[++c] = fsm.action(state, options[c]);
            }
            
            return executeGuard(data, actions, true).
                        then(function (action) {
                            return execActionOnFulfill(
                                        action,
                                        data,
                                        state,
                                        fsm);
                        });

        case 'fork':
            action = mgr(activity.action);
            options = activity.options;
            responses = {};
            promises = [];
            callback = function (action) {
                return execActionOnFulfill(action, data, state, fsm).
                        then(function (response) {
                            responses[response.activity.name] = response;
                        });
            };
            for (c = -1, l = options.length; l--;) {
                promises[++c] = executeGuard(
                        data,
                        [fsm.action(state, options[c])],
                        true).
                    then(callback);
            }
            callback = null;
            return Promise.all(promises).
                then(function () {
                    return {
                            activity: action,
                            request: data,
                            response: responses
                        };
                });
        case 'end':
            return Promise.resolve({
                        activity: mgr.end,
                        from: state,
                        to: null,
                        request: data,
                        response: data
                    });
        }
        
        return Promise.reject(new Error('Unidentified activity'));

    },
    
    start: function (data) {
        var me = this;
        
        function run() {
            
        }
        
    },
    
    stop: function () {
        
    }
    
};


module.exports = Session;