// -- Set Up API Google Scopes & IDs -- //
var API_KEY = "AIzaSyAbe5GtlLj0VZWSvC8golSFEZY7eHiYHlQ";
var API_CLIENT_ID = "906733969647-tsscu15blfumt6v8i79663stk8ggdn3t.apps.googleusercontent.com";
var API_SCOPES = "profile email https://www.googleapis.com/auth/drive.scripts https://www.googleapis.com/auth/userinfo.email";
// -- Set Up API Google Scopes & IDs -- //

// -- Authorisation Methods -- //
var AUTH, AUTH_SUCCESS, AUTH_FAILURE; // Methods to call

function startAuthFlow(authorised, unauthorised) {
	
	AUTH_SUCCESS = authorised;
	AUTH_FAILURE = unauthorised;

	// Load the API client and auth library
	gapi.load("client:auth2", _startAuth);
}

function signIn() {
	gapi.auth2.getAuthInstance().signIn();
}

function signOut() {
	 gapi.auth2.getAuthInstance().signOut();
}

function _startAuth() {
	
  // gapi.client.setApiKey(API_KEY);
  AUTH = gapi.auth2.init({
      client_id: API_CLIENT_ID,
      scope: API_SCOPES,
			fetch_basic_profile: true,
  })
	AUTH.then(function () {
    
		// Listen for changes in 'isSignedIn'
    gapi.auth2.getAuthInstance().isSignedIn.listen(_updateStatus);

    // Handle the initial sign-in state.
    _updateStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		
  });
}

function _updateStatus(isAuthenticated) {
	if (isAuthenticated) {
		if (AUTH_SUCCESS) AUTH_SUCCESS(AUTH.currentUser.get().getBasicProfile());
  } else {
    if (AUTH_FAILURE) AUTH_FAILURE();
  }
}
// -- Authorisation Methods -- //