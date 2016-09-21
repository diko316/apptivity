# apptivity

[![NPM](https://nodei.co/npm/apptivity.png)](https://nodei.co/npm/apptivity/)

An activity workflow player that sequentially runs action, condition, fork, merge and prompt input actions.

This library has the following features.

1. Convenient and rich [definition API](#usage_definition) to define and configure Workflow activities and actions. It helps developers to focus on overall activity logic before detailing them with their implementations.

2. Flexible definition API allows splitting of Worfklow activity definition with their implementation, keeping files and directories of Workflow modules organized.

3. Workflow activities and actions are more predictable as they each publish an [immutable](https://www.npmjs.com/package/immutable) state object containing unique state name, action name, request data, and response data per completed run of Activity action.

4. Activity action supports asynchronous runs by supplying a `callback` function that returns Promise Object when defining Action implementations using [handler(callback:Function)](#ActivityAPI_handler) or [guard(callback:Function)](#ActivityAPI_guard) methods.

5. Workflows' internal Finite State Machine can be exported into any custom JSON schema using [workflow.trasform(workflowName:String)](#transform).

## Installation

This little library is packaged by npm. Source can be found in [github repository](https://github.com/diko316/apptivity)

```sh
npm install apptivity --save
```

## Usage

<a name="usage_definition"></a>Create a Workflow activity and chain-configure actions with definition API.

```javascript
var workflow = require('./index.js');

workflow.create("createUser").
			// create action
			action("fetchFromBackend").
            	describe("fetch something from the backend",
                		"or find something to populate the initial input data",
                        "Remember: [describe], [guard] and [handler] is optional").
				guard(function (input) {
                	return Promise.resolve(input);
                }).
                handler(function (input) {
                	return Ajax.requestAndReturnPromise(input);
                }).
			// your last action
			action("renderAndExit").
            	describe("Nothing special if no [handler]").
                handler(function (data) {
                	return { name: "whatever! this will be your last data" };
                });

```
Run the newly created Workflow activity and monitor state changes.

```javascript
workflow("createUser").
	// register event listener
	on("state-change",
        function (session, data) {
        	console.log("state: ", session.state === data);
            console.log("yes! do something about this immutable [data]");
        }).
	// run the workflow
    run({ name: "first input" });
```

Listen to other running Workflow activity sessions' `state-change` event.

```javascript
var stopListening = workflow.subscribe("createUser", "state-change",
								function (session, data) {
                                	console.log("what should I do with this?");
                                });
// I change my mind, I don't have to listen to "createUser" workflow's  "state-change" events
stopListening();
```
> **Note**: You can subscribe to a workflow event anytime even if the workflow does not exist.


Export the workflow into Finite State Machine configuration to create an instance of [javascript-state-machine](https://www.npmjs.com/package/javascript-state-machine).

```javascript
var StateMachine = require("javascript-state-machine");

var createUserStateMachine = StateMachine.create(
								workflow.transform('createUser'));

```


## Documentation

API Documentation is now hosted in a separate page. You can explore it from [Apptivity Project page](https://diko316.github.io/apptivity/#api).



## License

[MIT](https://opensource.org/licenses/MIT)

