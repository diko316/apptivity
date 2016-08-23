'use strict';


var path = require('path'),
    mainPath = path.resolve(".");

global.assert = require('chai').assert;

global.use = function (id) {
    return require(path.resolve(mainPath, id));
};

// preload bluebird (very slow to load)
//require('bluebird');
//
//describe('fsm API',
//    function () {
//        
//        describe('fsm.define(config:array)',
//            function () {
//                require('./fsm/define.js');
//            });
//        
//        describe('fsm.create(config:array)',
//            function () {
//                require('./fsm/create.js');
//            });
//        
//    });


describe('define API',
    function () {
        
        require('./activity.js');

    });