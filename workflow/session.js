'use strict';

var FSM = require('./fsm.js'),
    ACTIVITY = require('../define/activity.js'),
    PROMISE = require('bluebird'),
    SESSION_GEN_ID = 0;
    
    
function createRequestObject(session, state, data) {
    return {
        state: state,
        session: session,
        cancelled: false,
        error: false,
        request: data,
        response: data
    };
}

function executeAction(action, session, state, data) {
    
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
        
        var old = this.current,
            fsm = this.fsm,
            activity = ACTIVITY,
            Promise = PROMISE,
            state = old && old.state;
            
        var config, action, guard, promise, request;
            
        if (!old) {
            old = {
                state: fsm.start,
                data: null
            };
        }
        
        config = fsm.lookup(old.state);
        
        switch (config.type) {
        case 'link':
            action = activity(config.target);
            request = createRequestObject(this, state, data);
            promise = Promise.resolve(request);
            
            // execute guard
            guard = action.guard;
            //if (guard) {
            //    promise = promise.
            //                then(guard).
            //                then(function () {
            //                        return request;
            //                    },
            //                    function () {
            //                        request.
            //                        return 
            //                    });
            //}

            console.log('action: ', action);
            break;
        
        case 'condition':
        }
        
        
        
        
        console.log(config);
        
        
        
    }
};


module.exports = Session;