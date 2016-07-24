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
                        '>getWebForm',
                            '# get from from http server',
                            
                        '>render',
                            '# render webform'
                    
                ]),
            instance = new Workflow();
        
        //console.log(require('util').inspect(instance, { showHidden: true }));
        instance.getWebForm('test').
            then(function () {
                console.log('after getWebform ', arguments);
            });
    });
