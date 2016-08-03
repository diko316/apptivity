'use strict';

var EXPORTS = instantiate,
    DEFINE = require('../define/index.js'),
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
                action('renderToHTML'),
                
            DEFINE('failedRender').
                action('doNothing')
        ).
        
        finalize();

var iterator = new ITERATOR(workflow);


//console.log(iterator.lookup());

console.log(iterator.lookup());
iterator.next();

console.log(iterator.lookup());
iterator.next();

console.log(iterator.lookup());
iterator.next();



console.log('workflow ', workflow.config.fsm);
