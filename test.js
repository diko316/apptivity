'use strict';

var workflow = require('./index.js');

workflow.task("createUser/render-form",
    function (data) {
        console.log('rendering!');
        return data;
    });

//workflow.task("createUser/[requestForm]",
//    function (data) {
//                
//        console.log(' guard! ');//, data);
//        
//        return data;//require('bluebird').reject('buang!');
//        
//    });

workflow.create('createUser').

        action('requestForm').
            //describe('this is a test').
            guard("createUser/[requestForm]").
            handler(function (data) {
                console.log('handler requestForm', data);
                return data;
            }).
            
        action('render').
            describe('rendering form').
            handler("createUser/render-form").
            
        condition(
            workflow.activity('renderedToHTML').
                action('renderDom1').
                    guard(function () {
                        //console.log('you cannot pass renderDom1');
                        //return require('bluebird').reject('no!');
                    }).
                    handler(function (data) {
                        console.log('handler renderedToHTML');//, data);
                        return data;
                    }),
                
            workflow.activity('failedRender').
                action('renderDom').
                    guard(function () {
                        console.log('guard! failedRender');
                        return 'good!';
                    }).
                    handler(function (data) {
                        console.log('handler failedRender');//, data);
                        return data;
                    })
                
        ).
        
        input('test-input').
            handler(function (data) {
                console.log('**********************');
                console.log('prompting! ', data);
                console.log('**********************');
                return {
                    name: 'prompt'
                };
            }).
        
        action('last').
            handler(function (data) {
                console.log('handler last');//, data);
                return { name: 'last' };
            });



function testAnswer(session, action, input) {
    console.log('----------------- answered! ', action, '<', input);
}

function testPrompt(session, action, input) {
        console.log('!!!answering! ', action, '<', input);
        //session.destroy();
        session.answer({name: 'yes!'});
        
    }

var testWorkflow = workflow('createUser');

testWorkflow.on('state-change',
        function (session, data) {
            console.log('state: ', session.state === data);
            //console.log('state: ', session.state.toJSON());
            //console.log('data: ', data.toJSON());
        }).
    
    on(/prompt/, testPrompt).
    on(/answer/, testAnswer);
    //run({ name: 'buang' });
    
    
testWorkflow.un(/answer/, testAnswer);
    
    
    
workflow.create('public/server-authenticate').
        action('showLoginPage').
            handler(function (data) {
                console.log('   !! showing login page ', data,' scope: ', this);
                return data;
            }).
        action('authInfo').
            handler(function (data) {
                console.log('   !! auth to server ', data, ' scope: ', this);
                return data;
            });
            
//console.log(
//    workflow('public/server-authenticate')
//);

var api = workflow('public/server-authenticate');
//api.run({name: 'test'}, { name: 'my context'});
//api.destroy();
//api.destroy();
//api.runOnce({name: 'another'});



workflow.transform('default', 'createUser');