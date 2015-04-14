// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");
// Helpers functions
// Helpers functions are used by the plugin functions to compute some data
// Those functions are directly related to plugin feature

// Comparison function and their dependencies

// Check if the value of the key is a function
function isFunction(obj) {
	return typeof obj == 'function' || false;
}

// Check if the value of the key is a object
function isObject(obj) {
	var type = typeof obj;
	return type === 'function' || type === 'object' && !!obj;
}

// Check if a key exist in an object
function has(obj, key) {
	return obj != null && hasOwnProperty.call(obj, key);
}

// Function abreviation form Object.keys
var nativeKeys = Object.keys;
// Check if the data is enumerable
var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');	

// Get a list of keys from an object
function getKeys(obj) {
	if (!isObject(obj)) return [];
	if (nativeKeys) return nativeKeys(obj);
	var keys = [];
	for (var key in obj) if (has(obj, key)) keys.push(key);
	if (hasEnumBug) collectNonEnumProps(obj, keys);
	return keys;
}

// Recursive function that use all previous function to test if two object are equivalent
function eq(a, b, aStack, bStack) {
	if (a === b) return a !== 0 || 1 / a === 1 / b;
	if (a == null || b == null) return a === b;
	var className = toString.call(a);
	if (className !== toString.call(b)) return false;
	switch (className) {
		case '[object RegExp]':
		case '[object String]':
		  return '' + a === '' + b;
		case '[object Number]':
		  if (+a !== +a) return +b !== +b;
		  return +a === 0 ? 1 / +a === 1 / b : +a === +b;
		case '[object Date]':
		case '[object Boolean]':
		  return +a === +b;
	}
	var areArrays = className === '[object Array]';
	if (!areArrays) {
		if (typeof a != 'object' || typeof b != 'object') return false;
		var aCtor = a.constructor, bCtor = b.constructor;
		if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
			return false;
	  }
	}
	var length = aStack.length;
	while (length--) {
		if (aStack[length] === a) return bStack[length] === b;
	}
	aStack.push(a);
	bStack.push(b);
	if (areArrays) {
	  length = a.length;
	  if (length !== b.length) return false;
	  while (length--) {
	    if (!eq(a[length], b[length], aStack, bStack)) return false;
	  }
	} else {
	  var keys = getKeys(a), key;
	  length = keys.length;
	  if (getKeys(b).length !== length) return false;
	  while (length--) {
	    key = keys[length];
	    if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
	  }
	}
	aStack.pop();
	bStack.pop();
	return true;
}

// Wrapper for the eq function
function  isEqual(a, b) {
	return eq(a, b, [], []);
}
// Comparison function and their dependencies

// Explode function
// This function explode a json object into manu nodes based on a given path and return the exploded json
// If the given path contain an error, this function return null
function jsonExplode(path, jsonObject, type) {
	var jsonPath = [];
	if (typeof(path) === 'number')
		if( Object.prototype.toString.call( jsonObject ) === '[object Array]' ) {
			path = parseInt(path);
			if (path >= 0) {
				if (type == 'set') {
					if (path >=0 && path <= jsonObject.length)
						jsonPath.push({key:path, isIndex: true, node:jsonObject});
					else
						jsonPath = null;
				}
				else if (type == 'get') {
					if (path >=0 && path < jsonObject.length)
						jsonPath.push({key:path, isIndex: true, node:jsonObject});
					else
						jsonPath = null;
				}
				else {
					jsonPath = null;
				}
			} 
			else
				jsonPath = null;			
		}
		else {
			if (type == 'set') {
				jsonPath.push({key:path.toString(), isIndex: false, node:jsonObject}); 
			}
			else if (type == 'get') {
				if (jsonObject.hasOwnProperty(path))
					jsonPath.push({key:path.toString(), isIndex: false, node:jsonObject}); 
				else
					jsonPath = null;
			}
			else {
				jsonPath = null;
			}
		}
	else {
		var firstSlice = {key:'', isIndex: false, node: jsonObject};
		jsonPath.push(firstSlice);
		for (var i = 0; i<path.length; i++) {
			if (path.charAt(i)  == '.' || path.charAt(i) == "[" || path.charAt(i) == "]") {
				if (path.charAt(i) == "]") {
					jsonPath[jsonPath.length - 1].isIndex = true;
					var currentKey = jsonPath[jsonPath.length - 1].key;
					var currentKeyLastChar = currentKey.length - 1;
					if (currentKey.charAt(0) == '"' && currentKey.charAt(currentKeyLastChar) == '"') {
						jsonPath[jsonPath.length - 1].key = currentKey.substring(1,currentKey.length - 1);
						jsonPath[jsonPath.length - 1].isIndex = false; 
					}	
					else
						jsonPath[jsonPath.length - 1].key = parseInt(currentKey);
				}
				if (jsonPath[jsonPath.length - 1].key != '' && i < path.length - 1) {
					jsonPath.push({key: '', isIndex: false});
					var currentPathIndex = jsonPath.length - 1;
					var previousPathIndex = currentPathIndex - 1;
					if( Object.prototype.toString.call( jsonPath[previousPathIndex].node ) === '[object Array]' ) { 
						if (jsonPath[previousPathIndex].isIndex && jsonPath[previousPathIndex].key >= 0 && jsonPath[previousPathIndex].key < jsonPath[previousPathIndex].node.length)
							jsonPath[currentPathIndex].node = jsonPath[previousPathIndex].node[jsonPath[previousPathIndex].key]; 
						else {
							jsonPath = null;
							break;
						}
					}
					else {
						if (jsonPath[previousPathIndex].node.hasOwnProperty(jsonPath[previousPathIndex].key))
							jsonPath[currentPathIndex].node = jsonPath[previousPathIndex].node[jsonPath[previousPathIndex].key]; 
						else {
							jsonPath = null;
							break;
						}
					}
				}
			}
			else
				jsonPath[jsonPath.length - 1].key += path.charAt(i); 
		}
		if (jsonPath) {
			var lastPathIndex = jsonPath.length - 1;
			if( Object.prototype.toString.call( jsonPath[lastPathIndex].node ) === '[object Array]' ) {
				if (type == 'set') {
					if (!jsonPath[lastPathIndex].isIndex || jsonPath[lastPathIndex].key < 0 || jsonPath[lastPathIndex].key > jsonPath[lastPathIndex].node.length)
						jsonPath = null;
				}
				else if (type == 'get') {
					if (!jsonPath[lastPathIndex].isIndex || jsonPath[lastPathIndex].key < 0 || jsonPath[lastPathIndex].key >= jsonPath[lastPathIndex].node.length)
						jsonPath = null;
				}
				else {
					jsonPath = null;
				}
			}
			else {
				if (type == 'set') {
					jsonPath = jsonPath;
				}
				else if (type == 'get') {
					if (!jsonPath[lastPathIndex].node.hasOwnProperty(jsonPath[lastPathIndex].key))
						jsonPath = null;
				}
				else {
					jsonPath = null;
				}
			}	
		}
	}
	return jsonPath;
}
// Explode function
// Helpers functions

/////////////////////////////////////
// Plugin class
// Plugin Id goes here - must match the "id" property in edittime.js
cr.plugins_.JsonMan = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	/////////////////////////////////////
	// Plugin Id goes here - must match the "id" property in edittime.js
	var pluginProto = cr.plugins_.JsonMan.prototype;
		
	/////////////////////////////////////
	// Object type class
	// C2 Specification
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	// called whenever an instance is created
	instanceProto.onCreate = function()
	{
		// The root json object
		this.json = {};
		// Current key variable used in a foreach loop to store the current key
		this.currentKey = "";
		// Curent value variable used in a foreach loop to store the current value
		this.currentValue = "";
		// Loop object used to define the indentation level (path) of an object in a foreach loop
		this.loopObject = "";
	};
	
	// called whenever an instance is destroyed
	// note the runtime may keep the object after this call for recycling; be sure
	// to release/recycle/reset any references to other objects in this function.
	instanceProto.onDestroy = function ()
	{
	};
	
	// called when saving the full state of the game
	instanceProto.saveToJSON = function ()
	{
		// return a Javascript object containing information about your object's state
		// note you MUST use double-quote syntax (e.g. "property": value) to prevent
		// Closure Compiler renaming and breaking the save format
		return {
			"json" : this.json,
			"currentKey" : this.currentKey,
			"currentValue" : this.currentValue,
			"loopObject" : this.loopObject 
		};
	};
	
	// called when loading the full state of the game
	instanceProto.loadFromJSON = function (o)
	{
		// load from the state previously saved by saveToJSON
		// 'o' provides the same object that you saved, e.g.
		// this.myValue = o["myValue"];
		// note you MUST use double-quote syntax (e.g. o["property"]) to prevent
		// Closure Compiler renaming and breaking the save format
		this.json = o["json"];
		this.currentKey = o["currentKey"];
		this.currentValue = o["currentValue"];
		this.loopObject = o["loopObject"];
	};
	
	// only called if a layout object - draw to a canvas 2D context
	instanceProto.draw = function(ctx)
	{
	};
	
	// only called if a layout object in WebGL mode - draw to the WebGL context
	// 'glw' is not a WebGL context, it's a wrapper - you can find its methods in GLWrap.js in the install
	// directory or just copy what other plugins do.
	instanceProto.drawGL = function (glw)
	{
	};
	
	// The comments around these functions ensure they are removed when exporting, since the
	// debugger code is no longer relevant after publishing.
	/**BEGIN-PREVIEWONLY**/
	instanceProto.getDebuggerValues = function (propsections)
	{
		var props = [];
		props.push({
			"name": "json", 
			"value": this.json
		});
		props.push({
			"name": "currentKey", 
			"value": this.currentKey
		});
		props.push({
			"name": "currentValue", 
			"value": this.currentValue
		});
		props.push({
			"name": "loopObject", 
			"value": this.loopObject
		});
		// Append to propsections any debugger sections you want to appear.
		// Each section is an object with two members: "title" and "properties".
		// "properties" is an array of individual debugger properties to display
		// with their name and value, and some other optional settings.
		propsections.push({
			"title": "JsonMan debugger section",
			"properties": props
		});
	};
	
	instanceProto.onDebugValueEdited = function (header, name, value)
	{
		// Called when a non-readonly property has been edited in the debugger. Usually you only
		// will need 'name' (the property name) and 'value', but you can also use 'header' (the
		// header title for the section) to distinguish properties with the same name.
		if (name === "json")
			this.json = value;
		if (name === "currentKey")
			this.currentKey = value;
		if (name === "currentValue")
			this.currentValue = value;
		if (name === "loopObject")
			this.loopObject = value;
	};
	/**END-PREVIEWONLY**/

	//////////////////////////////////////
	// Conditions
	// Contain all respectives function to the edittime.js file
	function Cnds() {};

	// Compare a given key's value to a given value
	// Check if the key exist
	// If the key value is a json / array, JsonMan will accept only = and != operator
	// If the key value is a json / array, JsonMan will try to parse the given value
	// Comparison signs with their correponding values (cmp_)
	// =    ==> 0  
	// !=	==> 1 
	// <	==> 2 
	// <=	==> 3 
	// >	==> 4 
	// >=	==> 5
	Cnds.prototype.CompareValue = function (key_, cmp_, value_)
	{
		var jsonPath = jsonExplode(key_, this.json, 'get');
		if (jsonPath && jsonPath.length > 0) {
			var valueToCompare = jsonPath[jsonPath.length - 1].node[jsonPath[jsonPath.length - 1].key];
			if (typeof(valueToCompare) === 'object') {
				if (cmp_ < 2) {
					try {
						var jsonValue = JSON.parse(value_);
						var compareResult = isEqual(valueToCompare, jsonValue);
						if (compareResult)
							return cr.do_cmp(0, 0, 0);					
						else
							return cr.do_cmp(0, 0, 1);					
					}
					catch(e) { 
						return cr.do_cmp(0, 0, 1);					
					}	
				}
				else
					return cr.do_cmp(0, 0, 1);			
			}
			else
				return cr.do_cmp(valueToCompare, cmp_, value_);		
		}
		else
			return cr.do_cmp(0, 0, 1);
	};

	// Check if the given key exist in the root object or in an indented object
	Cnds.prototype.HasKey = function (key_)
	{
		var jsonPath = jsonExplode(key_, this.json, 'get');
		if (jsonPath)
			return true;
		else
			return false;
	};
	
	// Check if the value of a given key is empty
	// Accept only json / array values
	Cnds.prototype.IsEmpty = function (key_)
	{
		var jsonPath = jsonExplode(key_, this.json, 'get');
		if (jsonPath){
			var value = jsonPath[jsonPath.length - 1].node[jsonPath[jsonPath.length - 1].key];
			switch (Object.prototype.toString.call( value )) {
				case '[object Array]':
					return value.length === 0
					break;
				case '[object Object]':
					return Object.keys(value).length === 0
					break;
				default:
					return false;
			}
		}
		else
			return true;
	};	

	// loop on a given object
	// If loopObject Variable is not set, Json Man will loop throught the root object
	Cnds.prototype.ForEachKey = function ()
	{
		var current_event = this.runtime.getCurrentEventStack().current_event;
		if (this.loopObject == '') {
			if( Object.prototype.toString.call( this.json ) === '[object Array]' ) {
				for (var i=0; i<this.json.length; i++) {
					this.currentKey = i;
					this.currentValue = this.json[i]
					this.runtime.pushCopySol(current_event.solModifiers);
					current_event.retrigger();
					this.runtime.popSol(current_event.solModifiers);
				}
			}
			else {
				for (var p in this.json)
					if (this.json.hasOwnProperty(p)) {
						this.currentKey = p;
						this.currentValue = this.json[p];
						this.runtime.pushCopySol(current_event.solModifiers);
						current_event.retrigger();
						this.runtime.popSol(current_event.solModifiers);
					}
			}
			this.currentKey = "";
			this.currentValue = "";
		}
		else {
			var jsonPath = jsonExplode(this.loopObject, this.json, 'get');
			if (jsonPath && jsonPath.length > 0) {
				var lastPath = jsonPath[jsonPath.length-1];
				var lastPathData = lastPath.node[lastPath.key];
				switch (Object.prototype.toString.call( lastPathData )) {
					case '[object Array]':
						for (var i=0; i<lastPathData.length; i++) {
							this.currentKey = i;
							this.currentValue = lastPathData[i]
							this.runtime.pushCopySol(current_event.solModifiers);
							current_event.retrigger();
							this.runtime.popSol(current_event.solModifiers);
						}
						break;
					case '[object Object]':
						for (var p in lastPathData) {
							if (lastPathData.hasOwnProperty(p)) {
								this.currentKey = p;
								this.currentValue = lastPathData[p];
								this.runtime.pushCopySol(current_event.solModifiers);
								current_event.retrigger();
								this.runtime.popSol(current_event.solModifiers);
							}
						}
						break;
				}
				if(Object.prototype.toString.call( this.json ) === '[object Array]') {
					this.CurrentKey = 0;
					this.loopObject = 0;
				}
				else {
					this.CurrentKey = '';
					this.loopObject = '';	
				}
			}
			else {
				if(Object.prototype.toString.call( this.json ) === '[object Array]') {
					this.CurrentKey = 0;
					this.loopObject = 0;
				}
				else {
					this.CurrentKey = '';
					this.loopObject = '';	
				}
			}	
		}
		return false;
	};
	pluginProto.cnds = new Cnds();
	
	// Ued only in foreach loop (but still accessible ouside foreach)
	// Compare the current value with a given value
	// All comparison constraint apply to this function
	Cnds.prototype.CompareCurrentValue = function (cmp_, value_)
	{
		if (typeof(this.currentValue) == 'object') {
			if (cmp_ < 2) {
				try {
					var jsonValue = JSON.parse(value_);
					var compareResult = isEqual(valueToCompare, jsonValue);
					if (compareResult)
						return cr.do_cmp(0, 0, 0);					
					else
						return cr.do_cmp(0, 0, 1);					
				}
				catch(e) { 
					return cr.do_cmp(0, 0, 1);					
					}	
			}
			else
				return cr.do_cmp(0, 0, 1);
		} 
		else
			return cr.do_cmp(this.currentValue, cmp_, value_);
	};
	// Conditions
	
	//////////////////////////////////////
	// Actions
	// Contain all respectives functions to the edittime.js file
	function Acts() {};

	// Load: Load a json / array from a string
	// Try parse, if the parse fail, JsonMan will put the value as the first element in an array
	Acts.prototype.JSONLoad = function (jsonString)
	{	
		try {
			this.json = JSON.parse(jsonString);
		}
		catch(e) {
			this.json = [];
			this.json.push(jsonString);
		}
		finally {
			if( Object.prototype.toString.call( this.json ) === '[object Array]' )
				this.currentKey = 0;
			else
				this.currentKey = "";
		}
	};

	// Set Key: Set a given key to the given value
	// Check if the key exist
	// Support indentation 
	Acts.prototype.SetKey = function (key_, value_)
	{
		var jsonPath = jsonExplode(key_, this.json, 'set');
		if (jsonPath && jsonPath.length > 0) {
			for (var i = jsonPath.length - 1; i>=0; i--)
				if (i != jsonPath.length - 1)
					jsonPath[i].node[jsonPath[i].key] = jsonPath[i + 1].node 
				else {
					var value;
					try {
						value = JSON.parse(value_);
					}
					catch(e) {
						value = value_;
					}
					finally {
						jsonPath[i].node[jsonPath[i].key] = value;
					}
					
				}
			this.json = jsonPath[0].node;
		}
	};

	// Delete a given key from an object or an array
	// Check if the key exist
	// Support indentation
	Acts.prototype.DeleteKey = function (key_)
	{
		var jsonPath = jsonExplode(key_, this.json, 'get');
		if (jsonPath && jsonPath.length > 0) {
			for (var i = jsonPath.length - 1; i>=0; i--)
				if (i != jsonPath.length - 1)
					jsonPath[i].node[jsonPath[i].key] = jsonPath[i + 1].node 
				else {
					if( Object.prototype.toString.call( jsonPath[i].node ) === '[object Array]')
						jsonPath[i].node.splice(jsonPath[i].key, 1);		
					else
						delete jsonPath[i].node[jsonPath[i].key];
				}
			this.json = jsonPath[0].node;
		}
	};

	// Clear: reset the object to an empty json / array
	// Work only on the root document
	Acts.prototype.Clear = function ()
	{
		if( Object.prototype.toString.call( this.json ) === '[object Array]' ){
			this.json = [];
			this.currentKey = 0;
			this.loopObject = 0;

		}
		else {
			cr.wipe(this.json);
			this.currentKey = "";
			this.loopObject = "";
		}
	};

	// Set litteral key
	// Similar to normal set key function with an only difference, this function do not try to parse the string into a json
	Acts.prototype.SetSimpleKey = function (key_, value_)
	{	
		var jsonPath = jsonExplode(key_, this.json, 'set');
		if (jsonPath && jsonPath.length > 0) {
			for (var i = jsonPath.length - 1; i>=0; i--)
				if (i != jsonPath.length - 1)
					jsonPath[i].node[jsonPath[i].key] = jsonPath[i + 1].node 
				else
					jsonPath[i].node[jsonPath[i].key] = value_;
			this.json = jsonPath[0].node;
		}
	};

	// Indixate the key to loop throught her value on the foreach loop
	// Check if the key exist
	// Work only when the supplied key contain a json / array object
	Acts.prototype.SetLoopObject = function (key_)
	{	
		this.loopObject = key_;
	};
	
	// Set the current key to the given value
	// Check if key exist
	// Similar to set key but it work only in for each loop
	Acts.prototype.SetCurrentKey = function (value_)
	{
		var jsonPath = jsonExplode(this.loopObject, this.json, 'set');
		if (jsonPath && jsonPath.length > 0) {
			for (var i = jsonPath.length - 1; i>=0; i--)
				if (i != jsonPath.length - 1)
					jsonPath[i].node[jsonPath[i].key] = jsonPath[i + 1].node 
				else {
					var value;
					try {
						value = JSON.parse(value_);
					}
					catch(e) {
						value = value_;
					}
					finally {
						jsonPath[i].node[jsonPath[i].key][this.currentKey] = value;
					}
				}
			this.json = jsonPath[0].node;
		}
	};
	pluginProto.acts = new Acts();
	// Actions

	//////////////////////////////////////
	// Expressions
	// Contain all respectives functions to the edittime.js file
	function Exps() {};
	
	// Retrieve value of a given key
	// Support indentation
	// Check the existince of the key
	Exps.prototype.Get = function (ret, key_)
	{
		var jsonPath = jsonExplode(key_, this.json, 'get');
		if (jsonPath && jsonPath.length > 0) {
			var lastPath = jsonPath[jsonPath.length - 1];
			var valueToReturn = lastPath.node[lastPath.key];
			if (typeof(valueToReturn) === 'object')
				ret.set_string(JSON.stringify(valueToReturn));
			else
				ret.set_any(valueToReturn);
		}
		else
			ret.set_int(0);
	};

	// Get the number of elemens in an object
	// Support indentation
	// Check the existence of the parent key
	Exps.prototype.KeyCount = function (ret, key_)
	{
		if (key_ == '')
			if( Object.prototype.toString.call( this.json ) === '[object Array]' )
				ret.set_int(this.json.length);
			else	
				ret.set_int(Object.keys(this.json).length);
		else {
			var jsonPath = jsonExplode(key_, this.json, 'get');
			if (jsonPath && jsonPath.length > 0) {
				var lastPath = jsonPath[jsonPath.length - 1];
				var lastPathData = lastPath.node[lastPath.key];
				switch (Object.prototype.toString.call( lastPathData )) {
					case '[object Object]':
						ret.set_int(Object.keys(lastPathData).length);	
						break;
					case '[object Array]':
						ret.set_int(lastPathData.length);
						break;
					default:
						ret.set_int(0);
				}
			}
			else
				ret.set_int(0);
		}
	};

	// Return the current key in for each loop
	// Must be used only in foreach loop
	Exps.prototype.CurrentKey = function (ret)
	{
		ret.set_any(this.currentKey);
	};	

	// Return the current key in a foreach loop
	// Must be used only in foreach loop
	Exps.prototype.CurrentValue = function (ret)
	{
		if (typeof(this.currentValue) == 'object')
			ret.set_string(JSON.stringify(this.currentValue));
		else
			ret.set_any(this.currentValue);
	};

	// Return a stringified version of the root object
	Exps.prototype.Stringify = function (ret)
	{
		ret.set_string(JSON.stringify(this.json));
	};	
	pluginProto.exps = new Exps();

}());