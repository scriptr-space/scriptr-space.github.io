Editor = function() {

  // -- Returns an instance of Editor if required -- //
  if (!(this instanceof Editor)) {return new Editor();}
  
  // -- Internal Enums -- //
	_Themes = [{
		value: "ace/theme/twilight",
		name: "Twilight"
	}, {
		value: "ace/theme/ambiance",
		name: "Ambiance"
	}, {
		value: "ace/theme/chaos",
		name: "Chaos"
	}, {
		value: "ace/theme/clouds_midnight",
		name: "Clouds Midnight"
	}, {
		value: "ace/theme/cobalt",
		name: "Cobalt"
	}, {
		value: "ace/theme/idle_fingers",
		name: "Idle Fingers"
	}, {
		value: "ace/theme/kr_theme",
		name: "krTheme"
	}, {
		value: "ace/theme/merbivore",
		name: "Merbivore"
	}, {
		value: "ace/theme/merbivore_soft",
		name: "Merbivore Soft"
	}, {
		value: "ace/theme/mono_industrial",
		name: "Mono Industrial"
	}, {
		value: "ace/theme/monokai",
		name: "Monokai"
	}, {
		value: "ace/theme/pastel_on_dark",
		name: "Pastel on Dark"
	}, {
		value: "ace/theme/solarized_dark",
		name: "Solarized Dark"
	}, {
		value: "ace/theme/terminal",
		name: "Terminal"
	}, {
		value: "ace/theme/tomorrow_night",
		name: "Tomorrow Night"
	}, {
		value: "ace/theme/tomorrow_night_blue",
		name: "Tomorrow Night Blue"
	}, {
		value: "ace/theme/tomorrow_night_bright",
		name: "Tomorrow Night Bright"
	}, {
		value: "ace/theme/tomorrow_night_eighties",
		name: "Tomorrow Night 80s"
	}, {
		value: "ace/theme/vibrant_ink",
		name: "Vibrant Ink"
	},]
  // -- Internal Enums -- //

  // -- Internal Variables -- //
  var _id = uuid.v4(), _debug = false, Document;
	var _element, _editor, _session;
  // -- Internal Variables -- //
  
	// -- Internal Functions -- //

  // -- External Visibility -- //
  return {

    // -- External Enums -- //
		Modes : {
			diff : {mode :"ace/mode/diff"},
			html : {mode : "ace/mode/html"},
			javascript : {mode : "ace/mode/javascript"},
			gas : {mode : "ace/mode/javascript", completer : {
				getCompletions: function(editor, session, pos, prefix, callback) {
					var base_Namespaces = ["BigNumber", "Browser", "CacheServer", "CalendarApp", "Charts", "ContactsApp", "ContentService", "DocumentApp",
															 "Drive", "DriveApp", "FormApp", "GmailApp", "GroupsApp", "HtmlService", "JSON", "Jdbc", "LanguageApp", "LinearOptimizationService",
															"LockService", "Logger", "MailApp", "Maps", "Math", "MimeType", "Object", "PropertiesService", "ScriptApp", "Session", "SitesApp",
															"SpreadsheetApp", "UrlFetchApp", "Utilities", "XmlService"];
					callback(null, base_Namespaces.map(function(word) {
						return {
							caption: word,
							value: word,
							meta: "google-apps-script"
						};
					}));
    		}
			}},
			markdown : {mode : "ace/mode/markdown"},
			text : {mode : "ace/mode/text"},
		},
    // -- External Enums -- //
    
    // -- External Functions -- //
    initialise : function(appendTo, debug) {
			
			// -- Set Debug -- //
			if (debug) _debug = true;
			
			// -- Create/Append Editor Holding Element -- //
			_element = $("<div />", {id : _id}).appendTo(appendTo);
			
			// -- Set Up Document -- //
			Document = require("ace/document").Document;
			
			// -- Get/Configure Editor -- //
			_editor = ace.edit(_element[0]);
			_editor.setOptions({
				enableBasicAutocompletion: true,
				enableSnippets: true,
				enableLiveAutocompletion: true,
				showPrintMargin: false,
				theme: _Themes[0].value,
				enableEmmet: true,
			});
			_editor.$blockScrolling = Infinity;
      
			// -- Set up Default 'Help' Keyboard Shortcut -- //
			_editor.commands.addCommand({
        name: "Show Keyboard Shortcuts",
        bindKey: {win: "Ctrl-Alt-h", mac: "Command-Alt-h"},
        exec: function(editor) {
					ace.config.loadModule("ace/ext/keybinding_menu", function(module) {
						module.init(editor);
						editor.showKeyboardShortcuts()
					})
				}
			})
			
			// -- Return for Chaining -- //
			return this;
			
    },
  
		getValue : function() {
			return _session ? _session.getValue() : undefined;
		},

		setValue : function(value, mode, afterChange) {
			
			var Document = require("ace/document").Document;
			_session = ace.createEditSession(new Document(value));
			_editor.setSession(_session);
			_session.setTabSize(4);
			_session.setUseWrapMode(true);
			_session.setWrapLimitRange();
			_session.setMode(mode.mode);
			if (mode.completer) {
				_editor.completers.push(mode.completer);
			} else {
				// Remove Custom Completers?
			}
			if (afterChange) _session.on("change", function(e) {
				afterChange(_session.getValue());
			}); // Enable Edit Triggers
		},

		changeFont : function() {
			console.log("CHANGING FONT");
			var _fonts = _element.css("font-family").split(","); // Get Fonts
			_fonts.push(_fonts.shift()); // Cycle Fonts
			if (_debug) console.log("FONT:", _fonts[_fonts.length - 1], " --> ", _fonts[0]); // Log Font
			_element.css("font-family", _fonts.join(",")); // Set Fonts
		},

		changeTheme : function() {
			_Themes.push(_Themes.shift()); // Cycle Themes
			if (_debug) console.log("THEME:", _Themes[_Themes.length - 1].name, " --> ", _Themes[0].name); // Log Theme
			_editor.setTheme(_Themes[0].value); // Set Theme
		},

		changeWidth : function(width) {
			_element.css("width", width);
			_editor.resize();
		},
		
		toggleOverwrite : function() {
			_editor.setOverwrite(!_editor().getOverwrite());
		},
		
		addCommand : function(details, winKeys, macKeys, func) {
			_editor.commands.addCommand({
				name: details,
				bindKey: {win: winKeys,  mac: macKeys},
				exec: function(editor) {func();},
				readOnly: true
			});
		},
    // -- External Functions -- //
		
  };
  // -- External Visibility -- //

}