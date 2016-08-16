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
                
                console.log(' guard! ', data);
                
                return data;//require('bluebird').reject('buang!');
                
            }).
            handler(function (data) {
                console.log('handler ', data);
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
                    }),
                
            DEFINE('failedRender').
                action('renderDom').
                    guard(function () {
                        console.log('guard! failedRender');
                        return 'good!';
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
        action('last').
            handler(function (data) {
                return { name: 'end' };
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
    state5: {
        name: 'diko',
        value: 'test'
    }
}).then(function () {
    console.log(session.frame.request);
    return session.next();
}).then(function () {
    console.log(session.frame.request);
    return session.next();
//}).then(function () {
//    console.log(session.frame.request);
//    return session.next();
//}).then(function () {
//    console.log(session.frame.request);
//    return session.next();
}).then(function () {
    console.log(session.frame.request);
    return session.next();
}).then(function () {
    console.log('frame? ', session.frame.end);
});



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

