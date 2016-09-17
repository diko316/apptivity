'use strict';

var INTERESTING = require('interesting'),
    SESSION = require('./session.js'),
    FSM = require('./fsm/index.js'),
    TASK = require('./define/task.js'),
    DEFINE = require('./define'),
    BUS = INTERESTING(),
    WORKFLOWS = {},
    WORKFLOW_GEN_ID = 0,
    EXPORTS = instantiate;
    
function defineActivity(name) {
    if (!name || typeof name !== 'string') {
        throw new Error('Invalid activity name');
    }
    return DEFINE(name);
}

function task() {
    var libTask = TASK;
    libTask.define.apply(libTask, arguments);
    return EXPORTS;
}

function workflowExists(name) {
    var list = WORKFLOWS;
    
    if (!name || typeof name !== 'string') {
        throw new Error('Invalid [name] parameter');
    }
    
    return ':' + name in list;
}

function defineWorkflow(name) {
    var activity;
    
    if (DEFINE.is(name)) {
        
        if (workflowExists(name)) {
            throw new Error('Workflow [' + name + '] is already defined');
        }
        
        activity = name;
        name = activity.config.name;
        
    }
    else {
        activity = defineActivity(name);
    }
    
    WORKFLOWS[':' + name] = {
        name: name,
        fsm: null,
        activity: activity
    };
    
    return activity;

}

function finalizeWorkflow(name) {
    var workflow;
    
    if (!workflowExists(name)) {
        defineWorkflow(name);
    }
    
    workflow = WORKFLOWS[':' + name];
    
    if (!workflow.fsm) {
        workflow.fsm = FSM(workflow.activity);
    }
    
    return workflow;
}

function exportWorkflow(name, type) {
    var fsmMgr = FSM,
        isString = typeof type === 'string';
    var workflow;
        
    if (!workflowExists(name)) {
        throw new Error("Workflow [" + name + "] do not exist.");
    }
    
    workflow = finalizeWorkflow(name);
    
    if (arguments.length === 1) {
        type = 'default';
        isString = true;
    }
    
    if (isString && !fsmMgr.transformerExist(type)) {
        throw new Error('transformer type [' + type + '] do not exist');
    }
    
    if (isString || type instanceof Function) {

        return fsmMgr.exportFSM(workflow.fsm, type);
    
    }
    
    throw new Error("Invalid transformer [type] parameter");
    
}





function instantiate(name) {
    var workflow;
    
    if (!workflowExists(name)) {
        throw new Error('Workflow [' + name + '] is not yet defined');
    }
    
    workflow = finalizeWorkflow(name);
    
    return createSession(workflow.name, workflow.fsm);
}


function createSession(name, fsm) {
    var session = new SESSION(fsm),
        event = session.event,
        id = 'workflow' + (++WORKFLOW_GEN_ID),
        subscriptions = [],
        sl = 0,
        api = {};
    
    function run(input, context) {
        var current = session;
        return arguments.length ?
                        current.play(context, input) : current.play(context);
    }
    
    function runOnce() {
        return run.apply(null, arguments).
                    then(function (data) {
                        destroy();
                        return data;
                    });
    }
    
    function subscribe(event, handler) {
        var isRegExp = event instanceof RegExp;
        var callback;
        
        if (!event || (typeof event !== 'string' && !isRegExp)) {
            throw new Error('Invalid [event] parameter');
        }
        if (!(handler instanceof Function)) {
            throw new Error('Invalid [handler] parameter');
        }
        
        if (!session.destroyed) {
            callback = BUS.subscribe(event,
                                    function (workflow) {
                                        if (workflow === api) {
                                            handler.apply(null, arguments);
                                        }
                                    });
            callback.handler = handler;
            callback.event = event;
            callback.isRegExp = isRegExp;
            
            subscriptions[sl++] = callback;
        }
        return api;
    }
    
    function unsubscribe(event, handler) {
        var list = subscriptions,
            l = list.length,
            isRegExp = event instanceof RegExp;
        var item, eventName;
        
        if (isRegExp) {
            event = event.toString();
        }
        
        for (; l--;) {
            item = list[l];
            eventName = item.event;
            if (item.isRegExp) {
                eventName = eventName.toString();
            }

            if (eventName === event && item.handler === handler) {
                item();
                delete item.event;
                delete item.handler;
                delete item.isRegExp;
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
        var current = session;
        if (!current.destroyed) {
            current.answer(input);
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
    
    function destroy() {
        var current = session;
        if (!current.destroyed) {
            if (current.playing) {
                event.once('play-end', destroy);
            }
            else {
                setImmediate(function () {
                    if (!current.destroyed) {
                        current.destroy();
                    }
                });
            }
        }
        return api;
    }
    
    api.id = id;
    api.name = name;
    api.run = run;
    api.runOnce = runOnce;
    api.answer = answer;
    api.currentPrompt = currentPrompt;
    api.currentState = currentState;
    api.get = get;
    api.on = subscribe;
    api.un = unsubscribe;
    api.purge = purge;
    api.destroy = destroy;
    session.workflow = api;
    
    event.once('destroy', onSessionDestroy);
    event.on('play-start', onSessionStart);
    event.on('change', onSessionStateChange);
    event.on('play-end', onSessionEnd);
    event.on('process-prompt', onSessionPrompt);
    event.on('process-answered', onSessionAnswered);

    
    return api;
}



function subscribe(workflowName, event, handler) {
    var isRegExp = event instanceof RegExp;
    
    if (arguments.length === 2) {
        handler = event;
        event = workflowName;
        workflowName = null;
    }
    else if (!workflowName || typeof workflowName !== 'string') {
        throw new Error('Invalid [workflowName] parameter');
    }
    
    if (!event || (typeof event !== 'string' && !isRegExp)) {
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

function onSessionAnswered(session, name, input) {
    BUS.publish('answer', session.workflow, name, input);
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






module.exports = EXPORTS['default'] = EXPORTS;

EXPORTS.create = defineWorkflow;
EXPORTS.activity = defineActivity;
EXPORTS.subscribe = subscribe;
EXPORTS.exist = workflowExists;
EXPORTS.task = task;


// TEMPORARY
EXPORTS.createTransformer = FSM.registerTransformer;
EXPORTS.transform = exportWorkflow;
