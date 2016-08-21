'use strict';

var PROMISE = require('bluebird'),
    SESSION = require('./session/index.js'),
    FSM = SESSION.fsm,
    DEFINE = require('./define/index.js'),
    EXPORTS = instantiate,
    WORKFLOWS = {},
    SESSIONS = {};

function instantiate(name) {
    var workflows = WORKFLOWS,
        sessions = SESSIONS;
    var id, workflow, session;
    
    if (!name || typeof name !== 'string') {
        throw new Error('invalid activity [name] parameter');
    }
    
    id = ':' + name;
    if (id in workflows) {
        workflow = workflows[id];
        
        session = function (data) {
            
            if (!session.complete) {
                
            }
            
        };
        
        session.subscribe = function (name, handler) {
            
        };
        
        //session = new SESSION(fsm);
        
        //return session.run(data).
        
        
        
    }
    //session = new SESSION(fsm);
}

function register(activity) {
    var workflows = WORKFLOWS;
    var id;
    
    if (!DEFINE.is(activity)) {
        throw new Error('invalid [activity] parameter.');
    }
    
    id = ':' + activity.name;
    
    if (id in workflows) {
        if (workflows[id].activity === activity) {
            return EXPORTS;
        }
        throw new Error(
                '[activity] name is conflict to already registered activity');
    }
    
    workflows[id] = {
        activity: activity,
        fsm: FSM(activity)
    };
    
    return EXPORTS;
}



module.exports = EXPORTS['default'] = EXPORTS;
EXPORTS.activity = DEFINE;
EXPORTS.register = register;

