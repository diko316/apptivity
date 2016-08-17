'use strict';

var DEFINITION = require('./definition.js');



DEFINITION.
    register(require('./config/action.js')).
    register(require('./config/input.js')).
    register(require('./config/describe.js')).
    register(require('./config/handler.js')).
    register(require('./config/guard.js')).
    register(require('./config/condition.js')).
    register(require('./config/fork.js')).
    register(require('./config/end.js'));
    
module.exports = DEFINITION;
    

            
//console.log(workflow.config.fsm);
//console.log(workflow);
            