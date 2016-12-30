Flags = function() {

	// -- Internal Variables -- //
	var _alert = false, _debug = false, _development = false;
	
	// -- Internal Functions -- //
	var _parse = function() {
		
		// -- Parse Url -- //
		var _url = $.url();

		// -- Set Variables -- //
		_alert = (_url.param("alert") === "" || _url.fparam("alert") === "");
		if (_alert) {
			window.onerror = function (m, u, l, c, o) {
    		alert("Error: " + m + " Script: " + u + " Line: " + l  + " Column: " + c + " Trace: " +  o);
			}
		}
		
		_debug = _alert ? _alert : (_url.param("debug") === "" || _url.fparam("debug") === "");
		if (_debug) {
			window.onerror = function (m, u, l, c, o)  {
    		console.error("Error: " + m + " Script: " + u + " Line: " + l  + " Column: " + c + " Trace: " +  o);
			}
		}
		
		_development = (_url.attr("host").split(".")[0] == "dev" || _url.param("dev") === "" || _url.fparam("dev") === "");
		
		// -- Load Remote Console Script Function -- //
		var _load = function (id) {
    	return new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.onload = resolve;
        script.onerror = reject;
        script.src = "https://jsconsole.com/js/remote.js?" + id;
        document.getElementsByTagName("head")[0].appendChild(script);
    	});
		}
		
		// -- Return Promise -- //
		if (_url.param("remote") && _url.param("remote").length > 0) {
			return _load(_url.param("remote"));
		} else if (_url.fparam("remote") && _url.fparam("remote").length > 0) {
			return _load(_url.fparam("remote"));
		} else {
			return Promise.resolve();
		}
		
	}
	
	// -- External Visibility -- //
  return {

    // -- External Functions -- //
    initialise : function() {
			
			// -- Call Parse Method internally -- //
			return _parse().then(function() {
				
				var _return = {
				
					alert : function() {
						return _alert;
					},
		
					debug : function() {
						return _debug;
					},
		
					development : function() {
						return _development;
					},
		
					error : function(message, exception) {
						if (_alert) {
							alert("ERROR - " + message + " : " + JSON.stringify(exception));
						} else if (_debug && console) {
							console.log("ERROR - " + message, exception);
						}
						return this;
					},
		
					log : function() {
						if (_debug && console) {
							console.log.apply(console, arguments);
						}
						return this;
					},
			
				}
				
				return Promise.resolve(_return);
			
			});
			
    },
		
	}
	// -- External Visibility -- //
	
}