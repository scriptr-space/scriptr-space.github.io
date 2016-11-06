Navigator = function() {

  // -- Returns an instance of Editor if required -- //
  if (!(this instanceof Navigator)) {return new Navigator();}

  // -- Internal Variables -- //
	var _id = uuid.v4(), _debug = false;
	var _element, _editor, _navigator, _onLoad, _status;
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
			_navigator.append($("<li />", {id: script.id})
				.append($("<a />", {text: script.name, href: "#"}).data("id", script.id).click(function(e) {
				
					e.preventDefault();
					var _this = $(this);
					
					if (_this.parent().children("ul").length === 0) {
						var request = gapi.client.drive.files.export({
							fileId : script.id, mimeType: "application/vnd.google-apps.script+json"
						}).then(function(response) {
							
							var _list = $("<ul />").appendTo(_this.parent());
							if (response.result && response.result.files && response.result.files.length > 0) {
								
								response.result.files.forEach(function(file, index, files) {
									
									$("<li />", {id: file.id}).appendTo(_list).append($("<a />", 
										{class : _status(file.id), text: file.name + (file.type == "html" ? ".html" : ".gs")})
											.click(function() {

												// -- Handle Visuals -- //
												_navigator.find("a").removeClass("current");
												$(this).addClass("current");

												// -- Handle OnLoad -- //
												if (_onLoad) 
													_onLoad(script.name + " > " + file.name, file.source, script, file, files, index);
												
											}
									));
									
								});
							}
						});
					} else {
						_this.parent().children("ul").remove();
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
				pageToken: response.nextPageToken,
			}).then(_handleFileResponse);
		} else {
			_show();
		}
	}
	// -- Internal Functions -- //

  // -- External Visibility -- //
  return {

    // -- External Functions -- //
    initialise : function(appendTo, editor, status, onLoad, debug) {
			
			// -- Set Variables -- //
			if (debug) _debug = true;
      _editor = editor;
			_status = status;
			_onLoad = onLoad;
			
			// -- Create & Append Navigator -- //
			_element = $("<div />", {id : _id, class : "navigator auth-only", style: "display: none;"})
				.appendTo(appendTo);
			_navigator = $("<ul />").appendTo(_element);

			// -- Load Scripts from Google Drive -- //
			gapi.client.load("drive", "v3", function() {
				var request = gapi.client.drive.files.list({
					q: "mimeType = 'application/vnd.google-apps.script'",
					orderBy: "modifiedByMeTime desc,name",
				});
				request.execute(function (response) {
					_navigator.empty();
					_handleFileResponse(response);
				});
			});
			// -- Create & Append Navigator -- //
			
			// -- Return for Chaining -- //
			return this;
    },
		
		show : function() {
			_show();
		},
		
		hide : function() {
			_hide();
		},
		
		blah : function() {console.log("BLAH")},
		
		change : function(id, status) {
			$("li#" + id + " a").removeClass(function(index, css) {
				return (css.match (/(^|\s)status-\S+/g) || []).join(' ');
			}).addClass(status);
		},
		
    // -- External Functions -- //
  };
	
  // -- External Visibility -- //

}