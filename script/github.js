// Version 0.0.1 //
Github = function() {
	
	// -- Returns an instance of App if required -- //
  if (!(this instanceof Github)) {return new Github();}
	
	// -- Internal Variables -- //
	var _api, _before, _paging, _after;
  // -- Internal Variables -- //
	
	// -- Internal Functions -- //
	var _get = function(url) {
		
		return new Promise(function(resolve, reject) {
			
			$.ajax({
				method : "GET", url : url,
				beforeSend: _before, complete: _after,
			}).done(function(value, status, request) {
				resolve(value);
			}).fail(function(status, request) {
				reject(Error(request.status + ": " + request.statusText));
			});
			
		});

	}
											
	var _list = function(url, list) {
		
		return new Promise(function(resolve, reject) {
			
			$.ajax({
				method : "GET", url : url,
				beforeSend: _before, complete: _after,
			}).done(function(values, status, request) {
				request = _paging(request, status);
				list = list.concat(values);
				if (request.next) {
					_list(request.next, list).then(function(list) {resolve(list)});
				} else {
					resolve(list);
				}
			}).fail(function(status, request) {
				reject(Error(request.status + ": " + request.statusText));
			});
			
		});
		
	}
	
	var _post = function(url, data) {
		
		return new Promise(function(resolve, reject) {
			
			var s = {method : "POST", url : url, beforeSend : _before, complete : _after, 
							 contentType : "application/json", dataType : "json", data : JSON.stringify(data)};
			
			$.ajax(s).done(function(value, status, request) {
				resolve(value);
			}).fail(function(status, request) {
				reject(Error(request.status + ": " + request.statusText));
			});
			
		});

	}
	
	var _patch = function(url, data) {
		
		return new Promise(function(resolve, reject) {
			
			var s = {method : "PATCH", url : url, beforeSend : _before, complete : _after,
							 contentType : "application/json", dataType : "json", data : JSON.stringify(data)};
			
			$.ajax(s).done(function(value, status, request) {
				
				resolve(value);
				
			}).fail(function(status, request) {
				
				reject(Error(request.status + ": " + request.statusText));
			
			});
			
		});
		
	}
	
	var _put = function(url, data) {
		
		return new Promise(function(resolve, reject) {
			
			var s = {method : "PUT", url : url, beforeSend : _before, complete : _after, 
							 contentType : "application/json", dataType : "json", data : JSON.stringify(data)};
			
			$.ajax(s).done(function(value, status, request) {
				
				resolve(value);
				
			}).fail(function(status, request) {
				
				reject(Error(request.status + ": " + request.statusText));
			
			});
			
		});
		
	}
	// -- Internal Functions -- //

	// -- External Visibility -- //
  return {

    // -- External Functions -- //
    initialise : function(github_token, github_token_type) {
			
			// -- Set Up Scoped Variables -- //
			_api = "https://api.github.com";
			
			// -- Before Ajax Call : Request Authorisation Closure -- //
			_before = (function(token, type) {
				//"Authorization: token OAUTH-TOKEN"
				return function(a) {
					a.setRequestHeader("Authorization", "token" + " " + token);
					a.setRequestHeader("Accept", "application/vnd.github.v3+json");
				};
			})(github_token, github_token_type)
		
			// -- Parse Paging : From Request / Response Headers -- //
			_paging = function(request, status) {
				if (status == "success") {
					var next_Page = request.getAllResponseHeaders().match(/<(.*)>; rel="next"/);
					if (next_Page) request.next = next_Page[1];				
				}
				return request;
			}
		
			// -- After Ajax Call : Do Nothing -- //
			_after = function(request, status) {}
			
			// -- Return for Chaining -- //
			return this;
			
    },
		
		branch : function(owner, repo, name) {
			return _get(_api + "/repos/" + owner + "/" + repo + "/branches/" + name);
		},
		
		contents : function(owner, repo) {
			return _list(_api + "/repos/" + owner + "/" + repo + "/contents", []);
		},
		
		create_Commit : function(owner, repo, message, tree, parent) {
			return _post(_api + "/repos/" + owner + "/" + repo + "/git/commits", 
				{
					"message" : message,
					"tree" : tree,
					"parents" : [parent],
				}						
			)
		},
		
		create_Tree : function(owner, repo, base, tree) {
			return _post(_api + "/repos/" + owner + "/" + repo + "/git/trees", 
				{
					"base_tree" : base,
					"tree" : tree,
				}						
			)
		},
		
		file : function(owner, repo, path) {
			return _get(_api + "/repos/" + owner + "/" + repo + "/contents/" + path);
		},
		
		add_File : function(owner, repo, path, message, source, branch) {
			return _put(_api + "/repos/" + owner + "/" + repo + "/contents/" + path,
				{
					"message" : message,
					"content" : btoa(source),
					"branch" : branch ? branch : "master",
				}
			)
		},
		
		update_File : function(owner, repo, path, message, source, sha, branch) {
			return _put(_api + "/repos/" + owner + "/" + repo + "/contents/" + path,
				{
					"message" : message,
					"content" : btoa(source),
					"sha" : sha,
					"branch" : branch ? branch : "master",
				}
			)
		},
		
		// -- Get Repos for the current user (don't pass parameter) or a named user -- //
		repos : function(user) {
			if (user) {
				return _list(_api + "/users/" + user + "/repos", []);
			} else {
				return _list(_api + "/user/repos", []);
			}
		},
		
		update_Reference : function(owner, repo, reference, commit) {
			return _patch(_api + "/repos/" + owner + "/" + repo + "/git/refs/" + path,
				{"sha": commit.sha}
			)
		},
		
	}
	
}