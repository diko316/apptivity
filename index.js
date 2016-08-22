'use strict';

var PROMISE = require('bluebird'),
    BUS = require('interesting')(),
    SESSION = require('./session/index.js'),
    FSM = SESSION.fsm,
    DEFINE = require('./define/index.js'),
    EXPORTS = instantiate,
    WORKFLOWS = {};

function instantiate(name) {
    var workflows = WORKFLOWS;
    var id, workflow, session;
    
    if (!name || typeof name !== 'string') {
        throw new Error('invalid activity [name] parameter');
    }
    
    id = ':' + name;
    if (id in workflows) {
        workflow = workflows[id];
        session = new SESSION(workflow.fsm);
        
        return createSessionAPI(session);
        
    }
    return void(0);
}

function register(activity) {
    var workflows = WORKFLOWS;
    var id;
    
    if (!DEFINE.is(activity)) {
        throw new Error('invalid [activity] parameter.');
    }
    
    id = ':' + activity.config.name;
    
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

function createSessionAPI(session) {
    var subscriptions = [],
        event = session.event,
        pubsub = BUS;
        
    function onDestroy() {
        var list = subscriptions,
            l = list.length;
            
        for (; l--;) {
            list[l]();
        }
    }
    
    function onTransition(session, action, data) {
        var state = {
                        state: data.to,
                        type: action,
                        data: data.response
                    };
                    
        run.state = state;
        
        pubsub.publish('state-change', session, state,
                                                {
                                                    type: action,
                                                    from: data.from,
                                                    data: data.request
                                                });
    }
    
    function subscribe(handler) {
        var list = subscriptions;
        
        if (handler instanceof Function) {
            
            list[list.length] = pubsub.subscribe(
                'state-change',
                function (current, state, action) {
                    if (current === session) {
                        handler(state, action);
                    }
                });
            
            
        }
        return run;
    }
    
    function run(data) {
        return session.play(data);
    }
    
    function answer(name, data) {
        return session.answer(name, data);
    }
    
    run.subscribe = subscribe;
    run.answer = answer;
    
    event.on('transition', onTransition);
    event.once('session-destroyed', onDestroy);
    
    return run;
}



module.exports = EXPORTS['default'] = EXPORTS;
EXPORTS.activity = DEFINE;
EXPORTS.register = register;



// sample

register(
    
DEFINE('createUser').

        action('requestForm').
            describe('this is a test').
            guard(function (data) {
                
                console.log(' guard! ');//, data);
                
                return data;//require('bluebird').reject('buang!');
                
            }).
            handler(function (data) {
                console.log('handler requestForm', data);
                return data;
            }).
            
        //action('render').
        //    describe('rendering form').
        //    handler(function (data) {
        //        console.log('rendering!');
        //        return data;
        //    }).
            
        condition(
            DEFINE('renderedToHTML').
                action('renderDom1').
                    guard(function () {
                        //console.log('you cannot pass renderDom1');
                        //return require('bluebird').reject('no!');
                    }).
                    handler(function (data) {
                        console.log('handler renderedToHTML');//, data);
                        return data;
                    }),
                
            DEFINE('failedRender').
                action('renderDom').
                    guard(function () {
                        console.log('guard! failedRender');
                        return 'good!';
                    }).
                    handler(function (data) {
                        console.log('handler failedRender');//, data);
                        return data;
                    })
                
        ).
        
        //input('test-input').
        //    handler(function (data) {
        //        console.log('**********************');
        //        console.log('prompting! ', data);
        //        console.log('**********************');
        //        return {
        //            name: 'prompt'
        //        };
        //    }).
        
        action('last').
            handler(function (data) {
                console.log('handler last');//, data);
                return { name: 'last' };
            })
);


instantiate('createUser').
    subscribe(function (state, action) {
        console.log('transition ', state, action);
        
    })({ name: 'buang'});