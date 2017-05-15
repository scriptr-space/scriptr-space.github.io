Interaction = function() {

  // -- Returns an instance of Editor if required -- //
  if (!(this instanceof Interaction)) {return new Interaction();}

  // -- Internal Variables -- //
  var _debug = false, _surface, _editor, _navigator, _functions;
  // -- Internal Variables -- //
  
	// -- Internal Enums -- //
	var _help = {
		instructions : {name : "General > Instructions", source : "README.md"},
		license : {name : "General > License", source : "LICENSING.md"},
		shortcuts : {name : "General > Shortcuts", source : "SHORTCUTS.md"},
		todo : {name : "General > ToDo", source : "TODO.md"},
		details : {name : "General > Detailed Instructions", source : "DETAILS.md"},
		versions : {name : "General > Versions", source : "VERSIONS.md"},
	};
	// -- Internal Enums -- //
	
  // -- Internal Functions -- //
	var _show = function(help) {
		$.ajax({
			url: help.source,
			type: "get",
			dataType: "html",
			async: true,
			success: function(result) {
				if (result) _functions.load(help.name, result);
			}
		});
	}
	
	var _enableSurfaceKeys = function() {
	
		// == Add Keyboard Shortcuts to Window == //
		_surface.keydown(function(e) {
			if (e.altKey && e.ctrlKey) {
				return;
			} else if (e.ctrlKey || e.metaKey) {
				switch(e.which) {
					case 13: // Enter - Deploy Script to another Script
						e.preventDefault(); _functions.deploy(); break;
					
					case 66: // B = Add (HTML) File to Script
						e.preventDefault(); _functions.create(e.shiftKey); break;
					case 71: // G - (Custom) Commit to Github
						e.preventDefault(); _functions.commit(e.shiftKey); break;
					case 73: // I = Insert/Overwrite
						e.preventDefault(); _editor.toggleOverwrite(); break;
					case 77: // M - Diff
						e.preventDefault(); _functions.diff(); break;
					case 81: // Q - Remove File from Script
						e.preventDefault(); _functions.remove(); break;
					case 83: // S - Save
						e.preventDefault(); _functions.save(e.shiftKey); break;
					case 88: // X - Abandon Local Changes from Script
						if (e.shiftKey) {
							e.preventDefault();
							_functions.abandon();
						}
						break;
					default: return; // Exit Handler
				}
			} else if (e.altKey) {
				switch(e.which) {
					case 55: // 7 - Change Font (Cycle Backwards)
						if (e.shiftKey) {
							e.preventDefault();
							_editor.changeFont(true);
						}
						break;
					case 56: // 8 - Change Font (Cycle Forwards)
						if (e.shiftKey) {
							e.preventDefault();
							_editor.changeFont(false);
						}
						break;
					case 57: // 9 - Change Theme (Cycle Backwards)
						if (e.shiftKey) {
							e.preventDefault();
							_editor.changeTheme(true);
						}
						break;
					case 48: // 0 - Change Theme (Cycle Forwards)
						if (e.shiftKey) {
							e.preventDefault();
							_editor.changeTheme(false);
						}
						break;
					case 68: // D - Details
						e.preventDefault(); _show(_help.details); break;
					case 73: // I - Instructions
						e.preventDefault(); _show(_help.instructions); break;
					case 76: // L - License
						e.preventDefault(); _show(_help.license); break;
					case 82: // R - Readme, often pronounced Instructions
						e.preventDefault(); _show(_help.instructions); break;
					case 83: // S - Shortcuts
						e.preventDefault(); _show(_help.shortcuts); break;
					case 84: // T - To-Do
						e.preventDefault(); _show(_help.todo); break;
					case 109: // M - Toggle Full Screen
						e.preventDefault(); 
						if (screenfull.enabled) {
							if (screenfull.isFullscreen) {
								screenfull.exit();
							} else {
								screenfull.request();
							}
						}
						break;
					case 110: // N - Toggle Navigator
						e.preventDefault(); _navigator.toggle(); break;
					case 118: // V - Versions
						e.preventDefault(); _show(_help.versions); break;
					default: return; // Exit Handler
				}
			}
		});

	}

	var _enableEditorKeys = function() {

		// -- Action Editor Shortcuts -- //
		_editor.addCommand("Toggle Insert/Overwrite", "Ctrl-I", "Command-I", _editor.toggleOverwrite);

		_editor.addCommand("Save File", "Ctrl-S", "Command-S", function() {
			_functions.save();
		});
		_editor.addCommand("Save Entire Script", "Ctrl-Shift-S", "Command-Shift-S",
											 function() {_functions.save(true)});
		
		_editor.addCommand("Diff Script", "Ctrl-M", "Command-M", function() {
			_functions.diff();
		});
		_editor.addCommand("Diff Script to Github", "Ctrl-Shift-M", "Command-Shift-M",
											 function() {_functions.diff(true)});
		
		_editor.addCommand("Create File in Script", "Ctrl-B", "Command-B", function() {
			_functions.create();
		});
		_editor.addCommand("Create HTML File in Script", "Ctrl-Shift-B", "Command-Shift-B", function() {
			_functions.create(true);
		});
		
		_editor.addCommand("Remove File from Script", "Ctrl-Q", "Command-Q", function() {
			_functions.remove();
		});
		
		_editor.addCommand("Abandon Local File Changes from Script", "Ctrl-Shift-X", "Command-Shift-X", function() {
			_functions.abandon();
		});
		
		_editor.addCommand("Commit to Github", "Ctrl-G", "Command-G", function() {
			_functions.commit();
		});
		_editor.addCommand("Custom Commit to Github", "Ctrl-Shift-G", "Command-Shift-G",
			 function() {_functions.commit(true)});
		_editor.addCommand("Deploy to another Script", "Ctrl-Enter", "Command-Enter", function() {
			_functions.deploy();
		});
		// -- Action Editor Shortcuts -- //

		// -- Display Shortcuts -- //
		_editor.addCommand("Change Font", "Alt-Shift-7", "Option-Shift-6", function() {
			_editor.changeFont(true); // Change Font (Reverse)
		});
		_editor.addCommand("Change Font", "Alt-Shift-8", "Option-Shift-7", function() {
			_editor.changeFont(false); // Change Font (Forwards)
		});
		
		_editor.addCommand("Change Theme", "Alt-Shift-9", "Option-Shift-8", function() {
			_editor.changeTheme(true); // Change Theme (Reverse)
		});
		_editor.addCommand("Change Theme", "Alt-Shift-0", "Option-Shift-9", function() {
			_editor.changeTheme(false); // Change Theme (Forwards)
		});
		
		_editor.addCommand("Toggle Full-Screen On/Off", "Alt-M", "Option-M", function() {
			if (screenfull.enabled) {
				if (screenfull.isFullscreen) {
					screenfull.exit();
				} else {
					screenfull.request();
				}
			}
		});
		
		_editor.addCommand("Toggle Navigator On/Off", "Alt-N", "Option-N", function() {_navigator.toggle()});
		// -- Display Shortcuts -- //
		
		// -- Further Show Editor Shortcuts -- //
		_editor.addCommand("Show Instructions", "Alt-I", "Option-I", function() {_show(_help.instructions)});
		
		_editor.addCommand("Show Readme", "Alt-R", "Option-R", function() {_show(_help.instructions)});
		
		_editor.addCommand("Show License", "Alt-L", "Option-L", function() {_show(_help.license)});

		_editor.addCommand("Show Shortcuts", "Alt-S", "Option-S", function() {_show(_help.shortcuts)});

		_editor.addCommand("Show To-Do", "Alt-T", "Option-T", function() {_show(_help.todo)});
		
		_editor.addCommand("Show Detailed Instructions", "Alt-D", "Option-D", function() {_show(_help.details)});
		
		_editor.addCommand("Show Versions", "Alt-V", "Option-V", function() {_show(_help.versions)});
		// -- Further Show Editor Shortcuts -- //

		
		// -- Test Command -- //
		_editor.addCommand("Test Command", "Ctrl-Y", "Command-Y", function () {});
		// -- Test Command -- //
		
	}

	var _enableTouchEvents = function() {

		// -- Swipe and touch controls -- //
		var swipe_control = new Hammer(_surface[0]);
		swipe_control.get("pinch").set({ enable : true });
		swipe_control.get("swipe").set({ direction : Hammer.DIRECTION_HORIZONTAL });
		swipe_control.on("pinchend", function(e) {
			if (e.pointerType == "touch" && e.additionalEvent == "pinchin") {
				if (screenfull && screenfull.enabled && screenfull.isFullscreen) screenfull.exit();
			} else if (e.pointerType == "touch" && e.additionalEvent == "pinchout") {
				if (screenfull && screenfull.enabled && !screenfull.isFullscreen) screenfull.request();
			}
		});
		swipe_control.on("swipe", function(e) {
			if (e.pointerType == "touch") {
				if (_debug) console.log("SWIPE", e);
				if (e.type == "swipeleft" || (e.type == "swipe" && e.direction == 2)) {
					_navigator.show();
				} else if (e.type == "swiperight" || (e.type == "swipe" && e.direction == 4)) {
					_navigator.hide();
				}
			}
		});
		// -- Swipe and touch controls -- //

	}
	// -- Internal Functions -- //

  // -- External Visibility -- //
  return {

    // -- External Functions -- //
    initialise : function(surface, editor, navigator, functions, debug) {
			
			// -- Set Interaction Surface -- //
			_surface = surface instanceof jQuery ? surface : $(surface);
			
			// -- Set Variables -- //
			if (debug) _debug = true;
			_editor = editor;
			_navigator = navigator;
			_functions = functions;
			
			// -- Get/Configure Session -- //
			_enableSurfaceKeys();
			_enableEditorKeys();
			_enableTouchEvents();
      
			// -- Start by displaying Instructions -- //
			_show(_help.instructions);
			
			// -- Return for Chaining -- //
			return this;
			
    },
    // -- External Functions -- //
  };
  // -- External Visibility -- //

}