function GetPluginSettings()
{
	return {
		"name":			"JsonMan",				// as appears in 'insert object' dialog, can be changed as long as "id" stays the same
		"id":			"JsonMan",				// this is used to identify this plugin and is saved to the project; never change it
		"version":		"1.0",					// (float in x.y format) Plugin version - C2 shows compatibility warnings based on this
		"description":	"A powerfull json handler",
		"author":		"Digital Mania S.A.R.L",
		"help url":		"http://www.digitalmaniastudio.com",
		"category":		"Data & Storage",		// Prefer to re-use existing categories, but you can set anything here
		"type":			"object",				// "object" means that the plugin is available to the whole project
		"rotatable":	false,					// only used when "type" is "world".  Enables an angle property on the object.
		"flags":		0						// uncomment lines to enable flags...
	};
};

////////////////////////////////////////
// Conditions
// Conditions are use to check an event on runtime until it happen and trig a list of actions
// AddCondition(id,					// any positive integer to uniquely identify this condition
//				flags,				// (see docs) cf_none, cf_trigger, cf_fake_trigger, cf_static, cf_not_invertible,
//									// cf_deprecated, cf_incompatible_with_triggers, cf_looping
//				list_name,			// appears in event wizard list
//				category,			// category in event wizard list
//				display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//				description,		// appears in event wizard dialog when selected
//				script_name);		// corresponding runtime function name

// Compare the value of the key to the given value
// Check if the key exist (on the root object or in indented object)
// If the key is not existing, compare condition will return false
// If the value of the key is an object / array, comparison operator must be only = or !=
// If the value of the key is an object / array, JsonMan will try to parse the given value
AddAnyTypeParam("Key", "The name of the key to test.");
AddCmpParam("Comparison", "How to compare the key's value.");
AddAnyTypeParam("Value", "The value to compare to.");
AddCondition(0, 0, "Compare value", "JSON", "Key <b>{0}</b> {1} <b>{2}</b>", "Compare the value at a key.", "CompareValue");

// Check if the key exist in the root object or in the indented object
// In the case of an array, the key must be a positive integer and less than the length of the array
AddAnyTypeParam("Key", "The name of the key to check if exists.");
AddCondition(1, 0, "Has key", "JSON", "Has key <b>{0}</b>", "Check if a key name has been stored.", "HasKey");

// Check if the root object or an indented object is empty
// In the case of a json object, empty mean {}, in the case or array object, empty mean []
AddAnyTypeParam("Key", "The name of the key to check");
AddCondition(2, 0, "Is empty", "JSON", "Is empty", "True if no keys are in storage.", "IsEmpty");

// Loop on object keys for json object and on array index for array object
// To loop on an indented object we must set the loopObject variable
AddCondition(3, cf_looping, "For each key", "For Each", "For each key", "Repeat the event for each key/value pair that has been stored.", "ForEachKey");

// Used only in foreach loop (But it's accessible outside foreach)
// Compare current value to the supplied value
// All constaint applied to the simple comparison function are applied to the for each comparison
AddCmpParam("Comparison", "How to compare the value of the current key in the for-each loop.");
AddAnyTypeParam("Value", "The value to compare to.");
AddCondition(4, 0, "Compare current value", "For Each", "Current value {0} <b>{1}</b>", "Compare the value at the current key in the for-each loop.", "CompareCurrentValue");
// Conditions

////////////////////////////////////////
// Actions
// Actions are executed when their container's condition are satisfied
// AddAction( 0: id,				// any positive integer to uniquely identify this action
//			  1: flags,				// (see docs) af_none, af_deprecated
//			  2: list_name,			// appears in event wizard list
//			  3: category,			// category in event wizard list
//			  4: display_str,		// as appears in event sheet - use {0}, {1} for parameters and also <b></b>, <i></i>
//			  5: description,		// appears in event wizard dialog when selected
//			  6: script_name);		// corresponding runtime function name

// Load (String): Load a json object from valide json string
// The string can be a json representation or an array representation
// If an error occur when parsing json, JsonMan will put the whole string as one (first) element in an array
AddStringParam("JSON", "A string to parse, it can be a valid json, valid array or any data");
AddAction(0, 0, "Load", "JSON", "Load json, array or data from string <i>{0}</i>", "Load from string.", "JSONLoad");

// Set the value of the key to the supplied value
// Check if the key exist (indentation also is accepted)
// Try to parse an object from the string, if the parse fail, the string will be inserted as string (or it can be a number)
AddAnyTypeParam("Key", "The name of the key.");
AddAnyTypeParam("Value", "The value to store for the key.");
AddAction(1, 0, "Set key", "Keys", "Set key <i>{0}</i> to value <i>{1}</i>", "Set a key / value pair. If it does not exist, it will be created.", "SetKey");        

// Delete a key with their value, in the case of an array JsonMan will delete the value at the index
// Check if the key exist
// Indentation accepted
AddAnyTypeParam("Key", "The name of the key to delete.");
AddAction(2, 0, "Delete key", "Keys", "Delete key <i>{0}</i>", "Delete a key from json.", "DeleteKey");

// Clear the json object
// Assign a new object: {} if the previous state is a json object, [] if the previous state is an array object
AddAction(3, 0, "Clear", "JSON", "Clear", "Delete all keys and values from storage, returning to empty.", "Clear");

// This action is very similar to set key
// The only difference that JsonMan will not perform a parse on the given string
AddAnyTypeParam("Key", "The name of the key.");
AddAnyTypeParam("Value", "The value to store for the key.");
AddAction(4, 0, "Set key (litteral value)", "Keys", "Set key (litteral) <i>{0}</i> to value <i>{1}</i>", "Set a key / value pair. If it does not exist, it will be created.", "SetSimpleKey");        

// Use generally before for each loop to set the path of the object to loop throught it
// if is not specified JsonMan will loop on the root object / array
AddAnyTypeParam("Object", "The object to loop throught.");
AddAction(5, 0, "Set loop object", "For each", "Set loop object to <i>{0}</i>", "Set loop object.", "SetLoopObject");        

// This action is very similar to set key, the only difference is that SetCurrenKey used on a foreach loop
AddAnyTypeParam("Object / Value", "The object / value to store for the key.");
AddAction(6, 0, "Set current key (object / value)", "For each", "Set current key to object / value <i>{0}</i>", "Set current to value. If it does not exist, it will be created.", "SetCurrentKey");        
// Actions

////////////////////////////////////////
// Expressions
// Expressions are used to retrieve some data used or received by the plugin
// AddExpression(id,			// any positive integer to uniquely identify this expression
//				 flags,			// (see docs) ef_none, ef_deprecated, ef_return_number, ef_return_string,
//								// ef_return_any, ef_variadic_parameters (one return flag must be specified)
//				 list_name,		// currently ignored, but set as if appeared in event wizard
//				 category,		// category in expressions panel
//				 exp_name,		// the expression name after the dot, e.g. "foo" for "myobject.foo" - also the runtime function name
//				 description);	// description in expressions panel

// Return the of the given key
// Check if the key exit
// Return a stringified json if the value of the key is an object
AddAnyTypeParam("Key", "The name of the key to retrieve.");
AddExpression(0, ef_return_any, "Get", "JSON", "Get", "Get the value from a key. 0 is returned if it does not exist.");

// Return keys count of an object / array
// The object / array can be the root object or any indented object
// Check if the key exist
AddAnyTypeParam("Key", "The name of the key to retrieve elements count.");
AddExpression(1, ef_return_number, "KeyCount", "JSON", "KeyCount", "Get the number of keys in storage.");

// Return the current key on foreach loop
AddExpression(2, ef_return_any, "CurrentKey", "For Each", "CurrentKey", "Get the current key name in a for-each loop.");

// Return the current value inside a foreach loop
AddExpression(3, ef_return_any, "CurrentValue", "For Each", "CurrentValue", "Get the current key value in a for-each loop.");

// Return a stringified version of the whole document
AddExpression(4, ef_return_any, "Stringify", "JSON", "Stringify", "Stringify the json object");
// Expressions
////////////////////////////////////////
ACESDone();

////////////////////////////////////////
// Array of property grid properties for this plugin
// new cr.Property(ept_integer,		name,	initial_value,	description)		// an integer value
// new cr.Property(ept_float,		name,	initial_value,	description)		// a float value
// new cr.Property(ept_text,		name,	initial_value,	description)		// a string
// new cr.Property(ept_color,		name,	initial_value,	description)		// a color dropdown
// new cr.Property(ept_font,		name,	"Arial,-16", 	description)		// a font with the given face name and size
// new cr.Property(ept_combo,		name,	"Item 1",		description, "Item 1|Item 2|Item 3")	// a dropdown list (initial_value is string of initially selected item)
// new cr.Property(ept_link,		name,	link_text,		description, "firstonly")		// has no associated value; simply calls "OnPropertyChanged" on click

var property_list = [];
	
// Called by IDE when a new object type is to be created
function CreateIDEObjectType()
{
	return new IDEObjectType();
}

// Class representing an object type in the IDE
function IDEObjectType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new object instance of this type is to be created
IDEObjectType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called when inserted via Insert Object Dialog for the first time
IDEInstance.prototype.OnInserted = function()
{
}

// Called when double clicked in layout
IDEInstance.prototype.OnDoubleClicked = function()
{
}

// Called after a property has been changed in the properties bar
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}

// For rendered objects to load fonts or textures
IDEInstance.prototype.OnRendererInit = function(renderer)
{
}

// Called to draw self in the editor if a layout object
IDEInstance.prototype.Draw = function(renderer)
{
}

// For rendered objects to release fonts or textures
IDEInstance.prototype.OnRendererReleased = function(renderer)
{
}