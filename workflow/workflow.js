'use strict';

var Definition = require('./definition.js'),
    PROMISE = require('bluebird');

// extend Workflow and create
function create() {
    var definition = new Definition(),
        state = null,
        description = null,
        properties = extend(Workflow.prototype).prototype,
        F = Function,
        A = Array;
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
                    //if (definition.is('state', state)) {
                    //    properties[state] = augment(definition, state, item);
                    //}
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
    
    console.log(definition.states);
    
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

function createTransition(definition, state) {
    
}

//function augmentStateToMethod(definition, state, handler) {
//    //var id = ':' + state;
//    
//    return function () {
//        //var transitions = definition.states[id],
//        //    me = this,
//        //    handlers = definition.handler,
//        //    l = transitions.length,
//        //    c = -1,
//        //    targetStates = [],
//        //    promises = [],
//        //    P = PROMISE,
//        //    args = arguments;
//        //    
//        //var item, target, guard;
//        //
//        //for (c = -1, l = transitions.length; l--;) {
//        //    item = transitions[++c];
//        //    target = item[0];
//        //    guard = item[1];
//        //    
//        //    if (!(guard in handlers)) {
//        //        throw new Error(
//        //                'transition to state "' +
//        //                    target +
//        //                    '" has undefined guard [' +
//        //                    guard +
//        //                    ']');
//        //    }
//        //    targetStates[c] = target;
//        //    promises[c] = P.method(guard).apply(me, args);
//        //}
//        //
//        //
//        //if (targetStates.length) {
//        //    PROMISE.
//        //}
//        //// end state
//        //else {
//        //    
//        //}
//        //
//        //// execute guard
//        //
//        //// execute others
//    };
//}

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
        '[allow]',
            function (data) {
                return data;
            },
        [
            ['action3', 'action4'],
            'end'
        ]
    )
);

PROMISE.all([
    (function () {
        return 'buang';
    })
]);
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