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
	var _element, _editor, _session, _mode;
  // -- Internal Variables -- //
  
	// -- Internal Functions -- //
	var _getValue = function() {
		
		if (_session) {
				
			var value = _session.getValue();
				
			// -- Run Reversed Interceptors if required -- //
			if (value && _mode.interceptors) {
				_mode.interceptors.forEach(function(interceptor) {
					value = value.replace(new RegExp(RegExp.escape(interceptor.mask), "g"), interceptor.match);
				});
			}
				
			return value;
				
		}
		
	}
	// -- Internal Functions -- //
	
  // -- External Visibility -- //
  return {

    // -- External Enums -- //
		Modes : {
			css : {mode :"ace/mode/css"},
			diff : {mode :"ace/mode/diff"},
			html : {mode : "ace/mode/html"},
			interact : {persist_position : true, mode : "ace/mode/markdown"},
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
			gas_html_css : {mode : "ace/mode/css", interceptors : [
				{match : "</style>", mask : "/* </ style > <== ** AMMENDED BY SCRIPTR ** ¯\_(ツ)_/¯ */"},
				{match : "<style>", mask : "/* < style > <==  ** AMMENDED BY SCRIPTR ** to hide mixed css/html from syntax checking, but relax...these amendments won't be saved! */"},
			]},
			gas_html_js : {mode : "ace/mode/javascript", interceptors : [
				{match : "</script>", mask : "// </ script > <== ** AMMENDED BY SCRIPTR ** ¯\_(ツ)_/¯"},
				{match : "<script>", mask : "// < script > <== ** AMMENDED BY SCRIPTR ** to hide mixed js/html from syntax checking, but relax...these amendments won't be saved!"},
			]},
			markdown : {mode : "ace/mode/markdown"},
			text : {mode : "ace/mode/text"},
			yaml : {mode : "ace/mode/yaml"},
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
			
			// -- Set default mode -- //
			_mode = this.Modes.text;
			// -- Return for Chaining -- //
			return this;
			
    },
  
		focus : function() {
			_element.focus();
			return this; // -- Return for Chaining -- //
		},
		
		getValue : function() {
			
			return _getValue();
			
		},

		setValue : function(value, mode, afterChange) {
			
			// -- Handle returning to same spot in doc -- //
			var _row, _col;
			if (mode.persist_position &&  _editor.selection && _editor.selection.lead) {
				_row = _editor.selection.lead.row;
				_col = _editor.selection.lead.column;
			}
			
			if (mode) _mode = mode;
			
			// -- Run Interceptors if required -- //
			if (_mode.interceptors) {
				_mode.interceptors.forEach(function(interceptor) {
					value = value.replace(new RegExp(RegExp.escape(interceptor.match), "g"), interceptor.mask);
				});
			}
			
			var Document = require("ace/document").Document;
			_session = ace.createEditSession(new Document(value));
			_editor.setSession(_session);
			_session.setTabSize(4);
			_session.setUseWrapMode(true);
			_session.setWrapLimitRange();
			_session.setMode(_mode.mode);
			
			if (mode.completer) {
				_editor.completers.push(_mode.completer);
			} else {
				// Remove Custom Completers?
			}
			if (afterChange) _session.on("change", function(e) {
				afterChange(_getValue());
			}); // Enable Edit Triggers
			
			// Enable Emmet for HTML Editing
			if (_debug) console.log("SETTING EMMET MODE:", _mode.mode == "ace/mode/html"); // Log Emmet Mode
			_editor.setOption("enableEmmet", _mode.mode == "ace/mode/html");
			
			// -- Got to original spot -- //
			if (_row || _col) _editor.gotoLine(_row + 1, _col, true);
			
			return this; // -- Return for Chaining -- //
		},
		
		clearValue : function() {
			this.setValue("", this.Modes.text);
			return this; // -- Return for Chaining -- //
		},

		changeFont : function(reverse) {
			var _fonts = _element.css("font-family").split(","); // Get Fonts
			if (reverse) {
				_fonts.unshift(_fonts.pop()) // Cycle Fonts (reverse)
			} else {
				_fonts.push(_fonts.shift()); // Cycle Fonts (forwards)
			}
			if (_debug) console.log("CHANGING FONT:", _fonts[_fonts.length - 1], " --> ", _fonts[0]); // Log Font
			_element.css("font-family", _fonts.join(",")); // Set Fonts
			return this; // -- Return for Chaining -- //
		},

		changeTheme : function(reverse) {
			if (reverse) {
				_Themes.unshift(_Themes.pop()) // Cycle Themes (reverse)
			} else {
				_Themes.push(_Themes.shift()); // Cycle Themes (forwards)
			}
			if (_debug) console.log("CHANGING THEME:", _Themes[_Themes.length - 1].name, " --> ", _Themes[0].name); // Log Theme
			_editor.setTheme(_Themes[0].value); // Set Theme
			return this; // -- Return for Chaining -- //
		},

		changeWidth : function(width) {
			_element.css("width", width);
			_editor.resize();
			return this; // -- Return for Chaining -- //
		},
		
		toggleOverwrite : function() {
			_editor.setOverwrite(!_editor().getOverwrite());
			return this; // -- Return for Chaining -- //
		},
		
		protect : function() {
			_editor.setReadOnly(true);
			return this; // -- Return for Chaining -- //
		},
		
		unprotect : function() {
			_editor.setReadOnly(false);
			return this; // -- Return for Chaining -- //
		},
		
		addCommand : function(details, winKeys, macKeys, func) {
			_editor.commands.addCommand({
				name: details,
				bindKey: {win: winKeys,  mac: macKeys},
				exec: function(editor) {func(editor);},
				readOnly: true,
			});
			return this; // -- Return for Chaining -- //
		},
		
		removeCommand : function(details) {
			_editor.commands.removeCommand(details, false);
			return this; // -- Return for Chaining -- //
		},
    // -- External Functions -- //
		
  };
  // -- External Visibility -- //

}