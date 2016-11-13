// -- Global Editor Variables -- //
var debug, code, editor, nav;
var hash = new Hashes.MD5(), changed = {}, saved = {};
// -- Global Variables -- //

$(function() {

	// -- Get Debug -- //
	debug = ($.url().param("debug") === "" || $.url().fparam("debug") === "");
	
	// -- Set Up LocalForage -- //
	localforage.config({name: "Scriptr-Space"});
	
	// == Functions == //
	var status = function(id) { // -- Handle Changes to Edited Document -- //
		if (id in saved) {
			return "status-saved";
		} else if (id in changed) {
			return "status-changed";
		} else {
			return "";
		}
	}
	
	var change = function(value) { // -- Handle Changes to Edited Document -- //
		if (code && code.hash != hash.hex(value)) {
			
			localforage.setItem(code.file.id, value).then(function (value) {
				changed[code.file.id] = value;
				if (nav) nav.change(code.file.id, "status-changed");
			}).catch(function(err) {if (debug) console.log("LOCAL_FORAGE ERROR", err);});
			
		} else {
			
			localforage.removeItem(code.file.id).then(function (value) {
				delete changed[code.file.id];
				if (nav) nav.change(code.file.id, "");
			}).catch(function(err) {if (debug) console.log("LOCAL_FORAGE ERROR", err);});
			
		}
	}
	
	var loaded = function(name, value, script, file, files, index) { // -- Handles a loaded file/script -- //
					
		$("#path").empty().append($("<span />", {text: name}));
		
		if (script && file) {
			
			code = {hash : hash.hex(value), value : value, index : index, file : file, script : script};
			code.script.files = files;
			value = file.id in changed && 
					hash.hex(changed[file.id]) != hash.hex(value) ? changed[file.id] : value;
			
			editor.setValue(value, file.type == "html" ? 
					editor.Modes.html : file.type == "server_js" ? editor.Modes.gas : editor.Modes.text, change);
			
		} else {
			
			code = undefined;
			editor.setValue(value, editor.Modes.markdown, undefined);
			
		}
		
	}

	var save = function(all) { // -- Handle Save Script -- //
		
		if (nav && code) nav.busy(all ? code.script.id : code.file.id, "save");
		
		if (code) {
			
			var saving;
			
			code.script.files.forEach(function(file) {
				
				if ((all || code.file.id == file.id) && changed[file.id]) {
					
					// -- Update the Script code to save with the changed value -- //
					if (!saving) saving = {};
					saving[file.id] = file.source;
					file.source = changed[file.id];
				
				}
				
			})
			
			// -- Do the save / patch -- //
			if (saving) {
				
				gapi.client.request({
					path: "/upload/drive/v3/files/" + code.script.id,
					method: "PATCH",
					params: {uploadType: "media"},
					body: JSON.stringify({files: code.script.files}),
				}).then(function() {
					
					Object.keys(saving).forEach(function(id) {
						localforage.removeItem(id).then(function() {
							delete changed[id];
							if (nav) nav.change(id, "status-saved", 5000);
						}).catch(function(err) {
							if (debug) console.log("LOCAL_FORAGE ERROR", err);
						});
					});
					
					if (nav) nav.busy(all ? code.script.id : code.file.id);
					
				}, function(err) {
					
					if (debug) console.log("SAVING ERROR", err);
					
					// -- Roll back changes -- //
					code.script.files.forEach(function(file) {
						if (saving[file.id]) file.source = saving[file.id];
					});
					
					if (nav) nav.busy(all ? code.script.id : code.file.id).error(err);
					
				});
				
			}
			
		}
		
	}

	var clear = function() {
		
		// TODO: What if there are loaded instructions?
		if (code) {
			
			// -- Clear Edited Code -- //
			code = undefined;
		
			// -- Clear Editor too -- //
			editor.clearValue();
			
			// -- Finally, clear path -- //
			$("#path").empty();
			
		}
		
	}
	
	var diff = function() { // -- Handle Change Differences -- //
		
		if (debug) console.log("DIFF");
		
		if (code && changed[code.file.id]) {
			
			if (hash.hex(changed[code.file.id]) != hash.hex(code.value)) {
				
				var _diff = JsDiff.diffLines(code.value, changed[code.file.id], {newlineIsToken: true});
				var _diff_View = "";
				
				_diff.forEach(function(part) {
					if (part.value) _diff_View += ((part.added ? "+" : part.removed ? "-" : "") + part.value);
				});
				
				editor.setValue(_diff_View, editor.Modes.diff);
				
			}
			
		}
		
	}
	// == Functions == //
	
	// -- Create and Append Editor -- //
	var _container = $(".content");
	editor = Editor().initialise($(".content").empty(), debug);
	// -- Create and Append Editor -- //
	
	// -- Auth Handler -- //
	startAuthFlow(
		function(user, after) { // Authorised

			var authorise = $("<form />", {id: "authorise", class: "navbar-form", role: "form"})
				.appendTo($("#authorisation").empty());
			var group = $("<div />", {class: "form-group"}).appendTo(authorise);

			$("<p />", {id: "user", class: "navbar-text", text: "Signed in as",})
				.append($("<a />", {
					id: "user_details", class: "navbar-link username",
					text: user.getName(), target: "_blank",
					href: "https://security.google.com/settings/security/permissions",
					title: "To remove this app from your account (" + user.getEmail() + "), click here and follow the instructions",
				})).appendTo(group);

			$("<button />", {
				id: "logout", class: "btn btn-primary btn-sm",
				text: "Sign Out", href: "#",
				title: "Click here to log out of this site, but keep the app authorised on your account",
			}).click(function(e) {
				e.preventDefault();
				var r = signOut();
				if (r && after) after;
				return r;
			}).appendTo(authorise);

			// Anchor the Container to below the navbar
			_container.css("top", $("nav.navbar").height());
			
			// -- Create & Append Navigator, then Interaction -- //
			localforage.iterate(function(value, key, i) {
				changed[key] = value;
			}).then(function() {
				
				// -- Enable Navigator, Interaction, Load Initial Help & Instructions Document -- //
				nav = Navigator().initialise(_container, editor, status, loaded, clear, debug);
				Interaction().initialise(
					window, editor, nav, {"save" : save, "diff" : diff, "load" : loaded}, debug);
			
			}).catch(function(err) {if (debug) console.log("LOCAL_FORAGE ERROR:", err);});

		}, function() { // Un-Authorised

		$("<form />", {
				id: "authorise", class: "navbar-form", role: "form"
			})
			.append($("<button />", {
				id: "login", class: "btn btn-success btn-sm", text: "Sign In", href: "#",
				title: "Click here to log into this site, you will be promped to authorise the app on your account if required"
			}).click(function(e) {
				e.preventDefault(); return signIn();
			}))
			.appendTo($("#authorisation").empty());
			
			// Anchor the Container to below the navbar
			_container.css("top", $("nav.navbar").height());

			$(".auth-only").hide();
			editor.changeWidth("100%");
			
			// -- Load the Public Instructions -- //
			$.ajax({
				url: "PUBLIC.md",
				type: "get",
				dataType: "html",
				async: true,
				success: function(result) {
					if (result) loaded("Getting Started ...", result);
				}
			});
			
	});
	// -- Auth Handler -- //

}); 