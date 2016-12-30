// -- Set Up API Google Scopes & IDs -- //
const GOOGLE_KEY = "AIzaSyAbe5GtlLj0VZWSvC8golSFEZY7eHiYHlQ";
const GOOGLE_CLIENT_ID = "906733969647-tsscu15blfumt6v8i79663stk8ggdn3t.apps.googleusercontent.com";
const GOOGLE_SCOPES = [
	"email", "profile",
	"https://www.googleapis.com/auth/drive.scripts",
	"https://www.googleapis.com/auth/drive"
];

const GITHUB_CLIENT_ID = "770cdacd6fa33a1a269d";
const GITHUB_CLIENT_ID_DEV = "0e6afe63555ffc47107b";
const GITHUB_SCOPES = ["basic", "gist", "repo"];
// -- Set Up API Google Scopes & IDs -- //

// -- Global Variables -- //
var global = {_before : {}, _paging : {}, _after : {}};
var nav, interaction, app;
var singlePage = window.navigator.standalone || navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i);
// -- Global Variables -- //

$(function() {

	// -- Auth Triggers & Functions -- //
	var google_SignIn = function() {
		hello.login("google", {
			force: false, display : singlePage ? "page" : "popup",
			scope : encodeURIComponent(GOOGLE_SCOPES.join(" ")),
		}).then(function(a) {
			global.flags.log("Signed into Google", a);
		}, function(e) {
			global.flags.error("Signed into Google", e);
		});
	};
	
	var google_SignOut = function() {
		hello.logout("google").then(function(a) {
			global.flags.log("Signed out of Google", a);
		}, function(e) {
			global.flags.error("Signing out of Google", e);
		});
	};
	
	var is_SignedIn = function(session) {
		var currentTime = (new Date()).getTime() / 1000;
		return session && session.access_token && session.expires > currentTime;
	};
	
	var github_LoggedIn = function(auth) {
		global.github = Github().initialise(auth.access_token, auth.token_type);	
	}
	
	var google_LoggedIn = function(auth) {
		
		global.google = Google().initialise(auth.access_token, auth.token_type);
		
		// -- Get User Info for Display -- //
		global.google.me().then(function(user) {

			// -- Variables for Display -- //
			var n = user.name, e = user.email;

			// -- Add the Auth Form -- //
			var authorise = $("<form />", {
				id: "authorise", class : "navbar-form", role : "form"
			}).appendTo($("#authorisation").empty());

			// -- Form Group to Contain Controls -- //
			var group = $("<div />", {class : "form-group"}).appendTo(authorise);

			// -- Signed in as Info -- //
			$("<p />", {id : "user", class : "navbar-text", text : "Signed in as"}).append($("<a />", {
				id : "user_details", class : "navbar-link username", text : n, target : "_blank",
				href : "https://security.google.com/settings/security/permissions",
				title : "To remove from your account (" + e + "), click & follow instructions"})).appendTo(group);

			// -- Logout Button with Logic -- //
			$("<button />", {
				id : "logout", class : "btn btn-primary btn-sm", text : "Sign Out", href : "#",
				title : "Click here to log out of this site, but keep the app authorised on your account",
			}).click(function(e) {e.preventDefault(); google_SignOut();}).appendTo(authorise);

			// Anchor the Container to below the navbar
			global.container.css("top", $("nav.navbar").height());

			// -- Create & Append Navigator, then Interaction -- //
			// -- Enable Navigator, Interaction, Load Initial Help & Instructions Document -- //
			if (!global.navigator) global.navigator = Navigator().initialise(
				global.container, global.editor, global.app.status, 
				global.app.loaded, global.app.clear, global.app.force, global.flags.debug);

			if (!global.interaction) global.interaction = Interaction().initialise(
				window, global.editor, global.navigator, {
					"save" : global.app.save, "diff" : global.app.diff,
					"load" : global.app.loaded, "remove" : global.app.remove,
					"create" : global.app.create, "commit" : global.app.commit,
					"abandon" : global.app.abandon
				}, global.flags.debug);

		});
		
	};
	
	var github_LoggedOut = function() {
		delete global.github;
	}
	
	var google_LoggedOut = function() {
		
		delete global.google;
		
		$("<form />", {id: "authorise", class: "navbar-form", role: "form"})
		.append($("<button />", {
			id : "login", class : "btn btn-success btn-sm", text : "Sign In",
			href : "#", title : "Click here to log into this site, you will be promped to authorise the app on your account if required"
		}).click(function(e) {e.preventDefault(); google_SignIn();}))
		.appendTo($("#authorisation").empty());

		// Anchor the Container to below the navbar
		global.container.css("top", $("nav.navbar").height());

		$(".auth-only").hide();
		global.editor.changeWidth("100%");

		// -- Clear Local Changes -- //
		if (global.changes) global.changes.clear().then(function() {changed = {}}); // TODO: Fix This!

		// -- Handle Github Logout -- //
		if (is_SignedIn(hello("github").getAuthResponse())) {
			hello("github").logout().then(function() {
				global.flags.log("Logged out of Github", a);
			}, function(e) {
				global.flags.log("Signing out of Github", e);
			});
		}

		// -- Load the Public Instructions -- //
		$.ajax({
			url: "PUBLIC.md", type: "get", dataType: "html",
			async: true, success: function(result) {
				if (result) global.app.loaded("Getting Started ...", result);
			}
		});
		
	};
	// -- Auth Triggers -- //
	
	// -- Auth Handlers -- //
	hello.on("auth.login", function (auth) {
		
		if (auth.network == "google") {
			
			google_LoggedIn(auth.authResponse);
			
		} else if (auth.network == "github") {
			
			github_LoggedIn(auth.authResponse);
			
		}
		
	});
	
	hello.on("auth.logout", function (auth) {
		
		if (auth.network == "google") {
			
			google_LoggedOut();
			
		} else if (auth.network == "github") {
			
			github_LoggedOut();
			
		}

	});
	// -- Auth Handler -- //
	
	// -- Get Global Flags -- //
	Flags().initialise().then(function(flags) {
			
		global.flags = flags;
			
		// -- Create and Append Editor, then the App -- //
		global.container = $(".content");
		global.editor = Editor().initialise(global.container.empty());
		// -- Create and Append Editor -- //
		
		// -- Set-Up Local Forage -- //
		global.changes = localforage.createInstance({
			name : "Scriptr-Space", version : 1.0,
			description : "Scriptr Space [Changes]",
		});

		global.settings = localforage.createInstance({
			name : "Scriptr-Space", version : 1.0, storeName : "settings",
			description : "Scriptr Space [Settings]",
		});
		// -- Set-Up Local Forage -- //
		
		var _start = function() {
			
			// -- Set Up Hello.js Auth-Flow -- //
			hello.init({
				google : GOOGLE_CLIENT_ID,
				github : global.flags.development() ? GITHUB_CLIENT_ID_DEV : GITHUB_CLIENT_ID,
			}, {
				redirect_uri : singlePage ? "" : "redirect",
				oauth_proxy : "https://auth-server.herokuapp.com/proxy"
			});
			// -- Set Up Hello.js Auth-Flow -- //

			var _loaded = {}
			global.changes.iterate(function(value, key, i) {
				_loaded[key] = value;
			}).then(function(val) {

				// -- Initialise App with Loaded Data -- //
				global.app = App().initialise(_loaded);

				// -- Start Auth Flow -- //
				var g = hello("google").getAuthResponse();
				if (is_SignedIn(g)) {
					google_LoggedIn(g);
				} else {
					google_LoggedOut();
				}
				// -- Start Auth Flow -- //

			}).catch(function(e) {

				alert(e);
				//global.flags.error("ERR", e);

			});
			
		}
			
		// -- Run Local Forage Test / Configuration -- //
		if (window.localStorage_POLYFILLED) {

			Promise.all([
				global.changes.setDriver(localforage.LOCALSTORAGE),
				global.settings.setDriver(localforage.LOCALSTORAGE),
			]).then(function() {
				_start();
			}).catch(function(e) {
				global.flags.error("ERR", e);
			});
			
		} else {
			
			_start();
			
		}
		// -- Run Local Forage Test / Configuration -- //
		

	});

});