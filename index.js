'use strict';

//global.Promise = require('bluebird');
//require('./fsm.js');


var DEFINE = require('./define.js');


//console.log('workflow ', DEFINE.workflow());
//
//console.log(require('util').inspect(DEFINE.workflow().constructor.prototype, { showHidden: true }));
//

console.log(
DEFINE.workflow().
        name('createForm').
            describe('stupid form'));




module.exports = {};

