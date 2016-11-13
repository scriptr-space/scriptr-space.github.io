Navigator = function() {

  // -- Returns an instance of Editor if required -- //
  if (!(this instanceof Navigator)) {return new Navigator();}

	// -- JQuery Plugins -- //
	$.fn.isBusy = function() {
		return this.children(".busy").length > 0;
	}
	
	$.fn.busy = function(status) {
		if (this.children(".busy").length > 0) {
			this.children(".busy").remove();
		} else {
			this.children("a").after($("<span />", {
					class : "busy"
				}).append($("<span />", {
					class : status ? status : ""
				})));
		}
		return this;
	}
	
	$.fn.error = function(err) {
		if (this.children(".error").length > 0) {
			this.children(".error").remove();
		} else {
			this.children("a").after($("<span />", {
				class : "error",
				title : err
			}));
		}
		return this;
	}
	// -- JQuery Plugins -- //
	
  // -- Internal Variables -- //
	var _id = uuid.v4(), _debug = false;
	var _element, _editor, _navigator, _onLoad, _unload, _status;
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
	
	var _appendFiles = function(scripts) {
		
		scripts.forEach(function(script) {
			
			_navigator.append($("<li />", {
				id: script.id,
				title : script.description,
			}).append($("<a />", {
				text: script.name,
				href: "#"
			}).data("id", script.id).click(function(e) {
				
					e.preventDefault();
					var _this = $(this), _parent = _this.parent();
				
					if (!_parent.isBusy()) {
						
						if (_parent.children("ul").length === 0) {
						
							// -- Clear existing list -- //
							_parent.busy("load").children("ul").remove();

							var request = gapi.client.drive.files.export({
								fileId : script.id, mimeType: "application/vnd.google-apps.script+json"
							}).then(function(response) {

								var _list = $("<ul />").appendTo(_this.parent());
								if (response.result && response.result.files && response.result.files.length > 0) {

									var _lineTotal = 0;

									response.result.files.forEach(function(file, index, files) {

										// -- Get the line count for the source file -- //
										var _count = file.source.split(/\r\n|\r|\n/).length;

										$("<li />", {
											id: file.id,
										}).appendTo(_list).append($("<a />", 
											{
												class : _status(file.id),
												text: file.name + (file.type == "html" ? ".html" : ".gs"),
												title: _count ? _count + (_count > 1 ? " lines" : " line") : "",
											}).click(function() {

													// -- Handle Visuals -- //
													_navigator.find("a").removeClass("current");
													$(this).addClass("current");

													// -- Handle OnLoad -- //
													if (_onLoad)  _onLoad(script.name + " > " + file.name, 
																								file.source, script, file, files, index);

												}
										));

										_lineTotal += _count;

									});

									if (_lineTotal)
										_parent.attr("title", _lineTotal + (_lineTotal > 1 ? " lines" : " line"));

									_parent.busy();

								}
							}, function(err) {
								_parent.busy().error(err);
								if (_debug) console.log("LOAD ERROR", err);
							});
						} else {
							
							// -- Close down script -- //
							_parent.children("ul").remove();
							if (_unload) _unload();
							
						}
					}
					
				}))
			);
			if (_debug) console.log("SCRIPT", script);
		})
	}

	var _handleFileResponse = function(response) {
		if (response.files && response.files.length > 0) _appendFiles(response.files);
		if (response.nextPageToken) {
			var request = gapi.client.drive.files.list({
				q: "mimeType = 'application/vnd.google-apps.script'",
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
    initialise : function(appendTo, editor, status, onLoad, unload, debug) {
			
			// -- Set Variables -- //
			if (debug) _debug = true;
      _editor = editor;
			_status = status;
			_onLoad = onLoad;
			_unload = unload;
			
			// -- Create & Append Navigator -- //
			_element = $("<div />", {id : _id, class : "navigator auth-only", style: "display: none;"})
				.appendTo(appendTo);
			_navigator = $("<ul />").appendTo(_element);

			// -- Load Scripts from Google Drive -- //
			gapi.client.load("drive", "v3", function() {
				var request = gapi.client.drive.files.list({
					q: "mimeType = 'application/vnd.google-apps.script'",
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
			$("li#" + id).error(err);
			return this;
		},
		
		change : function(id, status, for_time) {
			var _element = $("li#" + id + " a").removeClass(function(index, css) {
				return (css.match (/(^|\s)status-\S+/g) || []).join(' ');
			}).addClass(status);
			if (for_time) _element.delay(for_time).queue(function(_class) {
        return function() {
					$(this).removeClass(_class).dequeue();
        }
    	}(status));
		},
		
    // -- External Functions -- //
  };
	
  // -- External Visibility -- //

}