Interaction = function() {

  // -- Returns an instance of Editor if required -- //
  if (!(this instanceof Interaction)) {return new Interaction();}

  // -- Internal Variables -- //
  var _debug = false, _surface, _editor, _navigator, _functions;
  // -- Internal Variables -- //
  
	// -- Internal Enums -- //
	var _help = {
		instructions : {name : "General > Instructions", source : "README.md"},
		license : {name : "General > License", source : "LICENSE.md"},
		shortcuts : {name : "General > Shortcuts", source : "SHORTCUTS.md"},
		todo : {name : "General > ToDo", source : "TODO.md"},
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
					case 221: // ] - Change Theme (Cycle)
						_editor.changeTheme(); e.preventDefault(); break;
					case 219: // [ - Change Font (Cycle)
						_editor.changeFont(); e.preventDefault(); break;
					case 37: // Left Arrow - Pull Out Navigator
						_navigator.show(); e.preventDefault(); break;
					case 38: // Up Arrow - Go to Full Screen Mode
						if (screenfull.enabled && !screenfull.isFullscreen) screenfull.request(); e.preventDefault(); break;
					case 39: // Right Arrow - Push Away Navigator
						_navigator.hide(); e.preventDefault(); break;
					case 40: // Down Arrow - Exit out of Full Screen Mode
						if (screenfull.enabled && screenfull.isFullscreen) screenfull.exit(); break;
					case 73: // I = Insert/Overwrite
						_editor.toggleOverwrite(); e.preventDefault(); break;
					case 83: // S - Save
						_functions.save(); e.preventDefault(); break;
					case 77: // M - Diff
						_functions.diff; e.preventDefault() ;break;
					default: return; // Exit Handler
				}
			} else if (e.altKey) {
				switch(e.which) {
					case 73: // I - Instructions
						_show(_help.instructions); e.preventDefault(); break;
					case 76: // L - License
						_show(_help.license); e.preventDefault(); break;
					case 83: // S - Shortcuts
						_show(_help.shortcuts); e.preventDefault(); break;
					case 84: // T - To-Do
						_show(_help.todo); e.preventDefault(); break;
					default: return; // Exit Handler
				}
			}
		});

	}

	var _enableEditorKeys = function() {

		// -- Add Keyboard Controls to Editor -- //
		_editor.addCommand("Pull Out Navigator", "Ctrl-Left", "Command-Shift-Left", _navigator.show);

		_editor.addCommand("Go Full Screen", "Ctrl-Up", "Command-Shift-Left", 
			function() {if (screenfull.enabled && !screenfull.isFullscreen) screenfull.request();});

		_editor.addCommand("Push Away Navigator", "Ctrl-Right", "Command-Shift-Right", _navigator.hide);

		_editor.addCommand("Exit Full Screen", "Ctrl-Down", "Command-Down",
			function() {if (screenfull.enabled && screenfull.isFullscreen) screenfull.exit();});
		// -- Add Keyboard Controls to Editor -- //

		// -- Action Editor Shortcuts -- //
		_editor.addCommand("Toggle Insert/Overwrite", "Ctrl-I", "Command-I", _editor.toggleOverwrite);

		_editor.addCommand("Save Script", "Ctrl-S", "Command-S", _functions.save);

		_editor.addCommand("Diff Script", "Ctrl-M", "Command-M", _functions.diff);

		_editor.addCommand("Change Font", "Ctrl-[", "Command-[", _editor.changeFont);

		_editor.addCommand("Change Theme", "Ctrl-]", "Command-]", _editor.changeTheme);
		// -- Action Editor Shortcuts -- //

		// -- Further Show Editor Shortcuts -- //
		_editor.addCommand("Show Instructions", "Alt-I", "Alt-I", function() {_show(_help.instructions)});

		_editor.addCommand("Show License", "Alt-L", "Alt-L", function() {_show(_help.license)});

		_editor.addCommand("Show Shortcuts", "Alt-S", "Alt-S", function() {_show(_help.shortcuts)});

		_editor.addCommand("Show To-Do", "Alt-T", "Alt-T", function() {_show(_help.todo)});	
		// -- Further Show Editor Shortcuts -- //

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