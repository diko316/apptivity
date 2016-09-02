'use strict';

var INTERESTING = require('interesting'),
    SESSION = require('./session.js'),
    FSM = require('./fsm.js'),
    DEFINE = require('./define'),
    BUS = INTERESTING(),
    WORKFLOWS = {},
    WORKFLOW_GEN_ID = 0,
    EXPORTS = instantiate;

function defineWorkflow(name) {
    var list = WORKFLOWS;
    var activity, id;
    
    if (DEFINE.is(name)) {
        activity = name;
        name = activity.config.name;
    }
    else {
        activity = defineActivity(name);
    }
    
    id = ':' + name;
    
    if (id in list) {
        throw new Error('Workflow [' + name + '] is already defined');
    }
    
    list[id] = {
        fsm: null,
        activity: activity
    };
    
    return activity;

}

function defineActivity(name) {
    if (!name || typeof name !== 'string') {
        throw new Error('Invalid activity name');
    }
    return DEFINE(name);
}

function instantiate(name) {
    var list = WORKFLOWS;
    var id, workflow, fsm;
    
    if (!name || typeof name !== 'string') {
        throw new Error('Invalid workflow name');
    }
    
    id = ':' + name;
    if (!(id in list)) {
        throw new Error('Workflow [' + name + '] is not yet defined');
    }
    
    workflow = list[id];
    fsm = workflow.fsm;
    
    // finalize
    if (!fsm) {
        workflow.fsm = fsm = FSM(workflow.activity);
    }
    
    return createSession(name, fsm);
}


function createSession(name, fsm) {
    var session = new SESSION(fsm),
        event = session.event,
        id = 'workflow' + (++WORKFLOW_GEN_ID),
        subscriptions = [],
        sl = 0,
        api = {};
    
    function run(input) {
        return arguments.length ?
                    session.play(input) : session.play();
    }
    
    function subscribe(event, handler) {
        var callback;
        
        if (!event || typeof event !== 'string') {
            throw new Error('Invalid [event] parameter');
        }
        if (!(handler instanceof Function)) {
            throw new Error('Invalid [handler] parameter');
        }
        
        callback = BUS.subscribe(event,
                                function (workflow) {
                                    if (workflow === api) {
                                        handler.apply(null, arguments);
                                    }
                                });
        callback.handler = handler;
        callback.event = event;
        
        subscriptions[sl++] = callback;
        
        return api;
    }
    
    function unsubscribe(event, handler) {
        var list = subscriptions,
            l = list.length;
        var item;
        
        for (; l--;) {
            item = list[l];
            if (item.event === event && item.handler === handler) {
                item();
                delete item.event;
                delete item.handler;
                list.splice(l, 1);
            }
        }
        return api;
    }
    
    function purge() {
        var list = subscriptions,
            l = list.length;
        var item;
        for (; l--;) {
            item = list[l];
            item();
            delete item.event;
            delete item.handler;
        }
        list.length = 0;
        return api;
    }
    
    function answer(input) {
        if (!session.destroyed) {
            session.answer(input);
        }
        return api;
    }
    
    function currentPrompt() {
        var wait = session.info().wait;
        return wait || null;
    }
    
    function currentState() {
        return session.stateData;
    }
    
    function get() {
        return session;
    }
    
    api.id = id;
    api.name = name;
    api.run = run;
    api.answer = answer;
    api.currentPrompt = currentPrompt;
    api.currentState = currentState;
    api.get = get;
    api.on = subscribe;
    api.un = unsubscribe;
    api.purge = purge;
    session.workflow = api;
    
    event.once('destroy', onSessionDestroy);
    event.on('start', onSessionStart);
    event.on('change', onSessionStateChange);
    event.on('end', onSessionEnd);
    event.on('process-prompt', onSessionPrompt);

    
    return api;
}

function onSessionStart(session, data) {
    BUS.publish('process-start', session.workflow, data);
}

function onSessionStateChange(session, data) {
    BUS.publish('state-change', session.workflow, data);
}

function onSessionEnd(session, data) {
    BUS.publish('process-end', session.workflow, data);
}

function onSessionPrompt(session, name, input) {
    BUS.publish('prompt', session.workflow, name, input);
}

function onSessionDestroy(session) {
    var event = session.event;
    
    BUS.publish('destroy', session.workflow);
    
    // destroy all subscriptions
    session.workflow.purge();
    delete session.workflow;
    
    event.removeListener('start', onSessionStart);
    event.removeListener('change', onSessionStateChange);
    event.removeListener('end', onSessionEnd);
}

function subscribe(workflowName, event, handler) {
    
    if (arguments.length === 2) {
        handler = event;
        event = workflowName;
        workflowName = null;
    }
    else if (!workflowName || typeof workflowName !== 'string') {
        throw new Error('Invalid [workflowName] parameter');
    }
    
    if (!event || typeof event !== 'string') {
        throw new Error('Invalid [event] parameter');
    }
    
    if (!(handler instanceof Function)) {
        throw new Error('Invalid [handler] parameter');
    }
    
    return BUS.subscribe(event,
                        function (api) {
                            var name = workflowName;
                            if (!name || name === api.name) {
                                handler.apply(null, arguments);
                            }
                        });
    
}


module.exports = EXPORTS['default'] = EXPORTS;

EXPORTS.create = defineWorkflow;
EXPORTS.activity = defineActivity;
EXPORTS.subscribe = subscribe;

