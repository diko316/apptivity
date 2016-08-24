'use strict';

var DEFINE = require('./define/index.js'),
    SESSION = require('./session/index.js'),
    BUS = require('./session/pubsub'),
    FSM = SESSION.fsm,
    EXPORTS = instantiate,
    WORKFLOWS = {};
    

function instantiate(name) {
    var workflows = WORKFLOWS;
    var id, workflow, session, fsm, subscriptions, api, destroyed;
    
    if (!name || typeof name !== 'string') {
        throw new Error('invalid activity [name] parameter');
    }
    
    id = ':' + name;
    if (id in workflows) {
        workflow = workflows[id];
        fsm = workflow.fsm;
        if (!fsm) {
            workflow.fsm = fsm = FSM(workflow.activity);
        }
        
        session = SESSION.create(workflow.fsm);
        subscriptions = null;
        destroyed = false;
        
        api = {
            
            get: function () {
                return session;
            },
            
            run: function (data) {
                return session.play(data);
            },
            
            answer: function () {
                var instance = session;
                if (!destroyed) {
                    instance.answer.apply(instance, arguments);
                }
                return api;
            },
            
            on: function (event, handler) {
                var item, next;
                if (!destroyed && event && typeof event === 'string' &&
                    handler instanceof Function) {
                    item = subscriptions;
                    subscriptions = next = {
                        event: event,
                        handler: handler,
                        stop: subscribe(event,
                                function (current) {
                                    if (current === session) {
                                        handler.apply(this, arguments);
                                    }
                                }),
                        previous: subscriptions,
                        next: null
                    };
                    if (item) {
                        item.next = next;
                    }
                }
                return api;
            },
            
            un: function (event, handler) {
                var item = subscriptions,
                    current = item;
                var previous, next;
                for (; item; ) {
                    // found
                    if (item.event === event && item.handler === handler) {
                        item.stop();
                        
                        previous = item.previous;
                        next = item.next;
                        
                        if (previous) {
                            previous.next = next;
                        }
                        if (next) {
                            next.previous = previous;
                        }
                        if (item === current) {
                            subscriptions = current = previous || next;
                        }
                        item.handler = item.stop =
                        item.previous = item.next = null;
                        item = previous;
                    }
                    else {
                        item = item.previous;
                    }
                }
                return api;
            }
        };
        
        session.event.once('session-destroyed',
            function () {
                var item = subscriptions;
                var next;
                destroyed = true;
                for (; item; ) {
                    next = item.previous;
                    item.stop();
                    item.handler = item.stop = item.previous = item.next = null;
                    item = next;
                }
            });
        
        return api;
        
    }
    return void(0);
}

function register(activityName) {
    var workflows = WORKFLOWS;
    var id, activity;
    
    if (!activityName || typeof activityName !== 'string') {
        throw new Error('invalid [activityName] parameter.');
    }
    
    id = ':' + activityName;
    
    if (id in workflows) {
        throw new Error('[' + activityName + ']' +
            ' name is conflict to already registered activity');
    }
    
    workflows[id] = {
        activity: activity = DEFINE(activityName),
        fsm: null
    };
    
    return activity;
}

function subscribe(event, handler) {
    if (!event || typeof event !== 'string') {
        throw new Error('Invalid [event] parameter');
    }
    if (!(handler instanceof Function)) {
        throw new Error('Invalid [handler] parameter');
    }
    return BUS.subscribe(event, handler);
}

module.exports = EXPORTS['default'] = EXPORTS;
EXPORTS.workflow = register;
EXPORTS.activity = DEFINE;
EXPORTS.subscribe = subscribe;







// sample
//EXPORTS.workflow('createUser').
//
//        action('requestForm').
//            describe('this is a test').
//            guard(function (data) {
//                
//                console.log(' guard! ');//, data);
//                
//                return data;//require('bluebird').reject('buang!');
//                
//            }).
//            handler(function (data) {
//                console.log('handler requestForm', data);
//                return data;
//            }).
//            
//        action('render').
//            describe('rendering form').
//            handler(function (data) {
//                console.log('rendering!');
//                return data;
//            }).
//            
//        condition(
//            EXPORTS.activity('renderedToHTML').
//                action('renderDom1').
//                    guard(function () {
//                        //console.log('you cannot pass renderDom1');
//                        //return require('bluebird').reject('no!');
//                    }).
//                    handler(function (data) {
//                        console.log('handler renderedToHTML');//, data);
//                        return data;
//                    }),
//                
//            EXPORTS.activity('failedRender').
//                action('renderDom').
//                    guard(function () {
//                        console.log('guard! failedRender');
//                        return 'good!';
//                    }).
//                    handler(function (data) {
//                        console.log('handler failedRender');//, data);
//                        return data;
//                    })
//                
//        ).
//        
//        input('test-input').
//            handler(function (data) {
//                console.log('**********************');
//                console.log('prompting! ', data);
//                console.log('**********************');
//                return {
//                    name: 'prompt'
//                };
//            }).
//        
//        action('last').
//            handler(function (data) {
//                console.log('handler last');//, data);
//                return { name: 'last' };
//            });
//
//
//
//
//
//instantiate('createUser').
//
//    on('state-change',
//        function (session) {
//            console.log('state: ', session.destroyed, session.state.toJS());
//        }).
//    
//    on('prompt',
//        function (session, action) {
//            console.log('answering! ', action);
//            session.destroy();
//            session.answer(action, {name: 'yes!'});
//            
//        }).
//    
//    run({ name: 'buang' });

