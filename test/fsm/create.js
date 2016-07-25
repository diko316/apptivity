'use strict';

var fsm = use('fsm/index.js');

it('should create workflow without errors',
    function () {
        var Workflow = fsm.create([
                    'createUser',
                        '# create a User',
                        '>formLaunched',
                            '# launch create form',
                            
                        '[validated]',
                            '# must validate before anything else',
                            function () {
                                console.log('data must be validated');
                            },
                            
                        '>submit',
                            '# at this stage, this state must wait',
                            function () {
                                console.log('submitting!');
                            },
                            
                    'formLaunched',
                        function () {
                            console.log('form launched!');
                            return 'form launch data';
                        },
                        '>getWebForm',
                            '# get from from http server',
                            
                        '>render',
                            '# render webform',
                            function () {
                                console.log('render!');
                                return 'render data';
                            },
                    
                ]),
            instance = new Workflow();
        
        //console.log(require('util').inspect(instance, { showHidden: true }));
        instance.getWebForm('test').
            then(function () {
                console.log('after getWebform ', arguments);
                return instance.render('render');
            }).
            then(function () {
                console.log('after render', arguments, instance.iterator.get());
            });
    });