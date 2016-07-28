'use strict';


var SYMBOL = require('./define/symbol.js'),
    Prototype = SYMBOL.methods;

function Define() {
    
}

Define.prototype = Prototype;
Prototype.constructor = Define;

module.exports = new Define();


require('./define/guard.js');
require('./define/action.js');
require('./define/workflow.js');

