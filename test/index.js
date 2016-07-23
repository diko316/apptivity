'use strict';


var path = require('path'),
    mainPath = path.resolve(".");

global.assert = require('chai').assert;

global.use = function (id) {
    return require(path.resolve(mainPath, id));
};


describe('fsm API',
    function () {
        require('./fsm/define.js');
    });