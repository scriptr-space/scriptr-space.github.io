// Version 0.0.1 //
Google = function() {
	
	// -- Returns an instance of App if required -- //
  if (!(this instanceof Google)) {return new Google();}
	
	// === Internal Visibility === //
	
	// -- Internal Constants -- //
	const URL = "https://www.googleapis.com";
	const KEY = "AIzaSyAbe5GtlLj0VZWSvC8golSFEZY7eHiYHlQ";
	// -- Internal Constants -- //
	
	// -- Internal Variables -- //
	var _scope, _before, _after;
  // -- Internal Variables -- //
	
	// -- Internal Functions -- //
	var _init = function(token, type) {
		
		// -- Before Ajax Call : Request Authorisation Closure -- //
		_before = (function(t, w) {
			//"Authorization: token OAUTH-TOKEN"
			return function(a) {a.setRequestHeader("Authorization", w + " " + t)};
		})(token, type)

		// -- After Ajax Call : Do Nothing -- //
		_after = function(request, status) {}
			
	}
	
	var _get = function(url, data) {
		
		return new Promise(function(resolve, reject) {
			
			var s = {method : "GET", url : url, beforeSend: _before, complete: _after};
			if (data) s.data = data;
			
			$.ajax(s).done(function(value, status, request) {
			
				resolve(value);
			
			}).fail(function(status, request) {
			
				reject(Error(request.status + ": " + request.statusText));
			
			});
			
		});
		
	}
	
	var _list = function(url, property, list, data, next) {
		
		return new Promise(function(resolve, reject) {
			
			var s = {method : "GET", url : url, beforeSend: _before, complete: _after};
			
			if (data) {
				s.data = data;
				if (next) s.data.pageToken = next;
			} else if (next) {
				s.data = {pageToken: next};
			}
			
			$.ajax(s).done(function(value, status, request) {
				
				list = list.concat(value[property]);
				if (value.nextPageToken) {
					_list(url, property, list, data, value.nextPageToken).then(function(list) {resolve(list)});
				} else {
					resolve(list);
				}
				
			}).fail(function(status, request) {
				
				reject(Error(request.status + ": " + request.statusText));
			
			});
			
		});
		
	}
		
	var _patch = function(url, data, type, meta) {
		
		return new Promise(function(resolve, reject) {
			
			var s = {method : "PATCH", url : url, beforeSend : _before, complete : _after,
							 data : JSON.stringify(data), contentType: type};
			
			$.ajax(s).done(function(value, status, request) {
				
				resolve(value);
				
			}).fail(function(status, request) {
				
				reject(Error(request.status + ": " + request.statusText));
			
			});
			
		});
		
	}
	// -- Internal Functions -- //
	
	// === Internal Visibility === //

	
	// === External Visibility === //
  return {

    // -- External Functions -- //
    initialise : function(token, type) {
			
			_init(token, type);

			// -- Return for Chaining -- //
			return this;
			
    },
		
		// -- Get Repos for the current user (don't pass parameter) or a named user -- //
		me : function() {
			return _get(URL + "/oauth2/v1/userinfo?alt=json&key=" + GOOGLE_KEY);
		},
		
		scripts : function() {
			return _list(
			 URL + "/drive/v3/files", "files", [],
			 {
					q: "mimeType = 'application/vnd.google-apps.script' and trashed = false",
					orderBy: "modifiedByMeTime desc,name",
					fields: "files(description,id,modifiedByMeTime,name,version)",
				}
			);
		},
		
		export : function(id) {
		 return _get(
			 URL + "/drive/v3/files/" + id + "/export", 
			 {mimeType : "application/vnd.google-apps.script+json"}
			);
		},
		
		save : function(id, files) {
			return _patch(
				URL + "/upload/drive/v3/files/" + id + "?uploadType=media",
				{files : files}, "application/json"
			);
		}
		
	}
	// === External Visibility === //
	
}