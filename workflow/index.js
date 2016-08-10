'use strict';

var EXPORTS = instantiate,
    DEFINE = require('../define/index.js'),
    FSM = require('./fsm.js'),
    ITERATOR = require('./iterator.js');

function instantiate() {
    
}

module.exports = EXPORTS;
EXPORTS.define = DEFINE;


var workflow = DEFINE('createUser').

        action('requestForm').
            describe('this is a test').
            handler(function () {
                console.log('handler');
            }).
            
        action('render').
            describe('rendering form').
            handler(function () {
                console.log('rendering!');
            }).
            
        condition(
            DEFINE('renderedToHTML').
                action('renderDom1'),
                
            DEFINE('failedRender').
                action('renderDom'),
                
            DEFINE('buang').
                condition(
                    DEFINE('buangyes').
                        action('yesaction'),
                    DEFINE('buangno').
                        action('noaction')
                ).
                action('finalBuang')
        //);
        ).
        action('last');

//var iterator = new ITERATOR(workflow);
//
//
////console.log(iterator.lookup());
//
//console.log(iterator.lookup());
//iterator.next();
//
//console.log(iterator.lookup());
//iterator.next();
//
//console.log(iterator.lookup());
//iterator.next();


var fsm = FSM(workflow);

console.log('workflow ',
    require('util').inspect(fsm, { depth: 10, showHidden: true })
);

//console.log('lookup: ', fsm.lookup('activity3'));
//console.log('lookup: ', fsm.lookup('activity4'));

