'use strict';

var EXPORTS = instantiate,
    DEFINE = require('../define/index.js'),
    FSM = require('./fsm.js'),
    SESSION = require('./session.js');

function instantiate() {
    
}

module.exports = EXPORTS;
EXPORTS.define = DEFINE;


var workflow = DEFINE('createUser').

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
            
        fork(
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
                    
            //DEFINE('sudden').
            //    end('renderDom')
                
            //DEFINE('buang').
            //    condition(
            //        DEFINE('buangyes').
            //            action('yesaction'),
            //        DEFINE('buangno').
            //            action('noaction')
            //    ).
            //    action('finalBuang')
                
                
        ).
        
        input('test-input').
            handler(function (data) {
                console.log('**********************');
                console.log('prompting! ', data);
                console.log('**********************');
                return {
                    name: 'prompt'
                };
            }).
        
        action('last').
            handler(function (data) {
                console.log('handler last');//, data);
                return { name: 'last' };
            });



//var workflow = DEFINE('createUser').
//        condition(
//            DEFINE('renderedToHTML').
//                end(),
//                
//            DEFINE('failedRender').
//                action('renderDom').
//                action('renderagain')
//        ).
//        action('last');


var fsm = FSM(workflow);

var session = new SESSION(fsm);

console.log('workflow ',
    require('util').inspect(fsm, { depth: 10, showHidden: true })
);

//console.log('lookup: ', fsm.lookup(fsm.start));
//console.log('lookup: ', fsm.lookup('state2'));
//console.log('lookup: ', fsm.lookup('state4'));


//session.guard(session.fsm.start, session.fsm.startAction);


session.next({
    state6: {
        name: 'diko',
        value: 'test'
    }
}).then(function (data) {
    console.log(' *', data);
    //console.log('   response: ', session.frame.response);
    return session.next();
}).then(function (data) {
    console.log(' *', data);
    //console.log('forked   response: ', session.frame.response);
    PROMPTING = true;
    return session.next();

}).then(function (data) {
    console.log('ended? ', session.frame.end);
    PROMPTING = false;
    SHOULD_EXIT = true;
    console.log(' *', data);
    
    //console.log('after  response: ', session.frame.response);
    return session.next();
}).then(function (data) {
    console.log('ended? ', session.frame.end);
    console.log(' *', data);
    
    //console.log('after  response: ', session.frame.response);
});

var SHOULD_EXIT = false,
    PROMPTING = false,
    INTERVAL = setInterval(function () {
        console.log('prompting? ', PROMPTING);
        if (PROMPTING) {
            session.answer('input7', { name:'answered' });
        }
        if (SHOULD_EXIT) {
            clearInterval(INTERVAL);
            console.log('exiting!');
        }
    }, 1000);



//session.exec('state5', ':fork1', 'buang').
//    then(function (data) {
//        console.log('found? ', data);
//    });

//session.exec('state5', 'diko').
//    then(function (data) {
//        console.log('success ',
//            data.activity,
//            data.response);
//    },
//    function () {
//        console.log('failed!');
//    });
//    
//    
//session.exec('state8', 'diko').
//    then(function (data) {
//        console.log('success ', data);
//    },
//    function () {
//        console.log('failed!');
//    });



