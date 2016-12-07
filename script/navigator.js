Navigator = function() {

  // -- Returns an instance of Editor if required -- //
  if (!(this instanceof Navigator)) {return new Navigator();}

	// -- JQuery Plugins -- //
	$.fn.isBusy = function() {
		return this.find("span.busy").length > 0;
	}
	
	$.fn.busy = function(status) {
		if (this.find("span.busy").length > 0) {
			this.find("span.busy").remove();
		} else {
			this.children("a").after($("<span />", {
					class : "busy"
				}).append($("<span />", {class : (status ? status : "")})));
		}
		return this;
	}
	
	$.fn.err = function(err) {
		console.log("EXCEPTION CALLED", err);
		if (this.find("span.error").length > 0) {
			this.find("span.error").remove();
		} else {
			this.children("a").after($("<span />", {
				class : "error", title : (typeof err == "string" ? err : JSON.stringify(err)),
			}).delay(10000).queue(function() {$(this).fadeOut().remove().dequeue()}));
		}
		return this;
	}
	// -- JQuery Plugins -- //
	
  // -- Internal Variables -- //
	var _id = uuid.v4(), _debug = false;
	var _element, _editor, _navigator, _onLoad, _unload, _status, _force;
  // -- Internal Variables -- //
  
  // -- Internal Functions -- //
	var _show = function() {
		_element.show();
		_editor.changeWidth("75%"); // WIDTH HANDLING FROM CSS???
	}
	
	var _hide = function() {
		_element.hide();
		_editor.changeWidth("100%");
	}
	
	var _toggleScript = function(container, script, select, new_File_Name) {
	
		if (container.children("ul").length === 0) {
			
			container.busy("load");

			var request = gapi.client.drive.files.export({
					fileId : script.id, mimeType: "application/vnd.google-apps.script+json"
				}).then(function(response) {
						if (response.result && response.result.files) {
							
							var files = response.result.files.sort(function(a, b) {
								return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
							});
							
							_appendFiles(container, script, files);
							if (select) {
								var file;
								_navigator.find("li a, li input").removeClass("current");
								if (new_File_Name) {
									file = files.find(function(f) {return f.name == new_File_Name;})
								} else {
									file = files[files.length - 1];
								}
								_navigator.find("#" + file.id + " a").addClass("current");
								if (_onLoad) _onLoad(script.name + " > " + 
																		 file.name, file.source, script, file, files, files.indexOf(file));
							}
						} else {
							if (container.isBusy()) container.busy();
						}
					}, function(err) {
						if (container.isBusy()) container.busy();
						container.err(err);
						if (_debug) console.log("LOAD ERROR", err);
					});
			
		} else {
				
			// -- Clear existing list & Close down script -- //
			container.children("ul").remove();
			if (_unload) _unload();
			
		}
		
	}
	
	var _clickFile = function(e, script, file, files, index, element) {
		
		if (e.ctrlKey && file.name != ".git") {
						
			// -- Rename File in Script -- //
			var _name = element.text();
			if (file.type == "html" && _name.endsWith(".html")) {
				_name = _name.substr(0, _name.length - ".html".length);
			} else if (_name.endsWith(".gs")) {
				_name = _name.substr(0, _name.length - ".gs".length);
			}
			
			var _editing = $("<input />", {
				id : element.attr("id"),
				type : "text",
				title : element.attr("title"),
				class : element.attr("class"),
			}).data("previous", element.text()).val(_name);
						
			_editing.bind("rename", function(e) {
				
				var _this = $(this);
				var _new = _this.val();
				
				if (_new != ".git") {
					
					// -- Prep the Re-Name & Change type if required -- //
					var _previous = _this.data("previous");
					if (_new.endsWith(".html") && file.type != "html") {
						file.name = _new.substr(0, _new.length - ".html".length);
						file.type = "html"; // Doesn't seem to work, e.g. Google API says yes, but means no.
					} else if (_new.endsWith(".gs") && file.type != "server_js") {
						file.name = _new.substr(0, _new.length - ".gs".length);
						file.type = "server_js"; // Doesn't seem to work, e.g. Google API says yes, but means no.
					} else {
						file.name = _new;
					}
					files[index] = file;
					
					var _a = $("<a />", {
						id : _this.attr("id"),
						text : _new + (file.type == "html" ? ".html" : ".gs"),
						title : _this.attr("title"),
						class : _this.attr("class"),
					}).click((function(_script, _file,  _files, _index, _element) {
						return function(e) {
							_clickFile(e, _script, _file, _files, _index, $(this));
						};
					})(script, file, files, index))
					_this.replaceWith(_a);
					
					// -- Rename -- //
					_a.parent().busy("save");
					
					gapi.client.request({
						path: "/upload/drive/v3/files/" + script.id,
						method: "PATCH",
						params: {uploadType: "media"},
						body: JSON.stringify({files : files}),
					}).then(function() {

						// -- Force reload -- //
						var _element = $("#" + script.id);
						_element.children("ul").remove();
			 			_toggleScript(_element, script, true);
						
					}, function(err) {

						if (debug) console.log("SAVING/RENAMING ERROR", err);
						_a.text(_previous).parent().busy("save");
						
					});
					
				}
				
			});
						
			_editing.bind("cancel", function(e) {
							
				var _this = $(this);
				_this.replaceWith($("<a />", {
					id : _this.attr("id"),
					text : _this.data("previous"),
					title : _this.attr("title"),
					class : _this.attr("class"),
				}).click((function(_script, _file,  _files, _index, _element) {
					return function(e) {
						_clickFile(e, _script, _file, _files, _index, $(this));
					};
				})(script, file, files, index)));
							
			});

			_editing.keyup(function(e) {
							
				if (e.keyCode == 13) {
					$(this).trigger("rename");
				} else if (e.keyCode == 27) {
					$(this).trigger("cancel");
				}
							
			});
						
			element.replaceWith(_editing);
						
		} else {
						
			// -- Handle Visuals -- //
			var position = _editor.getPosition();
			_navigator.find("li a.current, li input.current")
				.data("pos-row", position.row)
				.data("pos-col", position.column)
				.removeClass("current");
			element.addClass("current");

			// -- Handle OnLoad -- //
			if (_onLoad) _onLoad(script.name + " > " + file.name, 
													 file.source, script, file, files, index, false, true,
													 element.data("pos-row"), element.data("pos-col"));
						
		}
		
	}
	
	var _appendFiles = function(container, script, files) {
		
		var _list = $("<ul />").appendTo(container), _lines = 0;

			files.forEach(function(file, index, files) {

				// -- Get the line count for the source file -- //
				var _count = file.source.split(/\r\n|\r|\n/).length;
										
				$("<li />", {
					id: file.id,
					class: "file",
				}).appendTo(_list).append($("<a />", {
					class : _status(file.id) + (file.name == ".git" ? " git" : ""),
					text: file.name + (file.name == ".git" ? "" : (file.type == "html" ? ".html" : ".gs")),
					title: _count ? _count + (_count > 1 ? " lines" : " line") : "",
				}).click((function(_script, _file, _files, _index) {
					return function(e) {
						_clickFile(e, _script, _file, _files, _index, $(this));
					};
				})(script, file, files, index)));
				
				_lines += _count;

			});

			container.busy();
		
			if (_lines) container.attr("title", 
				_lines + (_lines > 1 ? " lines" : " line") + " v" + script.version);

	}

	var _appendScripts = function(scripts) {
		
		scripts.forEach(function(script) {
			
			_navigator.append($("<li />", {
				id: script.id,
				title : script.description,
				class : "script",
			}).append($("<a />", {
				text: script.name,
				href: "#"
			}).data("id", script.id).click(function(e) {
					e.preventDefault();
					var _parent = $(this).parent();
					if (!_parent.isBusy()) _toggleScript(_parent, script);
				}))
			);
			if (_debug) console.log("SCRIPT", script);
		})
	}

	var _handleFileResponse = function(response) {
		if (response.files && response.files.length > 0) _appendScripts(response.files);
		if (response.nextPageToken) {
			var request = gapi.client.drive.files.list({
				q: "mimeType = 'application/vnd.google-apps.script' and trashed = false",
				orderBy: "modifiedByMeTime desc,name",
				fields: "files(description,id,modifiedByMeTime,name,version)",
				pageToken: response.nextPageToken,
			}).then(function(response) {_handleFileResponse(response.result);});
		} else {
			_show();
		}
	}
	// -- Internal Functions -- //

  // -- External Visibility -- //
  return {

    // -- External Functions -- //
    initialise : function(appendTo, editor, status, onLoad, unload, force, debug) {
			
			// -- Set Variables -- //
			if (debug) _debug = true;
      _editor = editor;
			_status = status;
			_onLoad = onLoad;
			_unload = unload;
			_force = force;
			
			// -- Create & Append Navigator -- //
			_element = $("<div />", {id : _id, class : "navigator auth-only", style: "display: none;"})
				.appendTo(appendTo);
			_navigator = $("<ul />").appendTo(_element);

			// -- Load Scripts from Google Drive -- //
			gapi.client.load("drive", "v3", function() {
				var request = gapi.client.drive.files.list({
					q: "mimeType = 'application/vnd.google-apps.script' and trashed = false",
					orderBy: "modifiedByMeTime desc,name",
					fields: "files(description,id,modifiedByMeTime,name,version)",
				}).then(function(response) {
					_navigator.empty();
					_handleFileResponse(response.result);
				});
			});
			// -- Create & Append Navigator -- //
			
			// -- Return for Chaining -- //
			return this;
    },
		
		show : function() {
			_show();
			return this;
		},
		
		hide : function() {
			_hide();
			return this;
		},
		
		busy : function(id, status) {
			$("li#" + id).busy(status);
			return this;
		},
		
		error : function(id, err) {
			$("li#" + id).err(err);
			return this;
		},
		
		change : function(id, status, for_time, remove) {
			var _element = $("li#" + id + " a").removeClass(function(index, css) {
				return (css.match (/(^|\s)status-\S+/g) || []).join(' ');
			}).addClass(status);
			if (for_time) {
				if (remove) {
					_element.delay(for_time).queue(function() {$(this).fadeOut().remove().dequeue();});
				} else {
					_element.delay(for_time).queue(function(_class) {
						return function() {$(this).removeClass(_class).dequeue();}
					}(status));
				}
			}
			return this;
		},
		
		is : function(id, status) {
			return $("li#" + id + " a").hasClass(status);
		},
		
		reload : function(script, new_File_Name) {
			var _element = $("#" + script.id);
			_element.children("ul").remove();
			 _toggleScript(_element, script, true, new_File_Name);
		},
		
		refresh : function(script) {
			var _element = $("#" + script.id);
			if (_element.length > 0) {
				_element.children("ul").remove();
				_appendFiles(_element, script, script.files);
			}
			return this;
		},
		
		select : function(script, index) {
			
			var _file = script.files[index] ? script.files[index] : script.files[0];
			
			_navigator.find("li a, li input").removeClass("current");
			_navigator.find("#" + _file.id + " a").addClass("current");
			if (_onLoad) _onLoad(script.name + " > " + _file.name, _file.source, script, _file, script.files, index);
			
		}
	
  // -- External Visibility -- //
	}
	
}