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
            }).
            
        action('render').
            describe('rendering form').
            handler(function () {
                console.log('rendering!');
            }).
            
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
                        return 'good!';
                    }),
                
            DEFINE('buang').
                condition(
                    DEFINE('buangyes').
                        action('yesaction'),
                    DEFINE('buangno').
                        action('noaction')
                ).
                action('finalBuang')
                
        ).
        action('last');



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


session.exec('state5', 'diko').
    then(function (data) {
        console.log('success ',
            data.activity,
            data.response);
    },
    function () {
        console.log('failed!');
    });
    
    
session.exec('state8', 'diko').
    then(function (data) {
        console.log('success ', data);
    },
    function () {
        console.log('failed!');
    });

