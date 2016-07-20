'use strict';

var Definition = require('./definition.js');

// extend Workflow and create
function create() {
    var definition = new Definition(),
        state = null,
        description = null,
        properties = extend(Workflow.prototype).prototype,
        F = Function,
        A = Array,
        augment = augmentStateToMethod;
    var c, l, item, dl;
    
    
    for (c = -1, l = arguments.length; l--;) {
        item = arguments[++c];
        if (item) {
            if (typeof item === 'string' && item !== 'constructor') {
                if (!state) {
                    state = item;
                }
                else if (!description) {
                    description = [item];
                    dl = 0;
                }
                else {
                    description[dl++] = item;
                }
            }
            else if (item instanceof F) {
                if (state) {
                    // save handler
                    definition.handle(state, item);
                    
                    // describe
                    if (description) {
                        definition.describe.apply(definition, description);
                        description = null;
                    }
                    
                    // augment if state handler
                    if (definition.is('state', state)) {
                        properties[state] = augment(state, item);
                    }
                    state = null;
                }
                else {
                    throw new Error(
                            'unable to define handler without a [state]');
                }
            }
            else if (item instanceof A) {
                definition.link.apply(definition, item);
                continue;
            }
        }
    }
    
    return properties;

}

function extend(instance, properties) {
    var E = empty,
        SuperClass = instance.constructor;
    var Prototype, name, hasOwn;
    
    function Workflow() {
        SuperClass.apply(this, arguments);
    }
    
    E.prototype = instance;
    Workflow.prototype = Prototype = new E();
    
    if (properties) {
        hasOwn = Object.prototype.hasOwnProperty;
        for (name in properties) {
            if (hasOwn.call(properties, name)) {
                Prototype[name] = properties[name];
            }
        }
    }
    
    Prototype.constructor = Workflow;
    
    return Workflow;
}

function augmentStateToMethod(state, handler) {
    
    return function () {
        
    };
}

function empty() {
    
}

function Workflow(definition) {
    
}

Workflow.prototype = {
    constructor: Workflow
};


console.log(
    create(
        
        ['start', 'end'],
        'start', function () {
                    console.log('started!');
                },
        [
            'start',
            ['action3', 'action4'],
            'allow'
        ],
        [
            ['action3', 'action4'],
            'end'
        ]
    )
);


//var definition = new Definition();
//
//definition.
//    link('start', 'end').
//    link('start', ['action3', 'action4'], 'allow').
//    link(['action3', 'action4'], 'end');
//    
//    
//    
//console.log(definition.states);