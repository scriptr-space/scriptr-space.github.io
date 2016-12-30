// == Lightweight Hello Modules == //
(function(hello) {
  'use strict';
	
  hello.init({

		google: {

			name: 'Google',

			// See: http://code.google.com/apis/accounts/docs/OAuth2UserAgent.html
			oauth: {
				version: 2,
				auth: 'https://accounts.google.com/o/oauth2/auth',
				grant: 'https://accounts.google.com/o/oauth2/token'
			},

			// API base URI
			base: 'https://www.googleapis.com/',

		},
		
		github: {

			name: 'GitHub',

			oauth: {
				version: 2,
				auth: 'https://github.com/login/oauth/authorize',
				grant: 'https://github.com/login/oauth/access_token',
				response_type: 'code'
			},

			base: 'https://api.github.com/',

		}
		
	});

})(hello);
// == Lightweight Hello Modules == //


// -- Test Storage Availability (inc Mobile Safari | Incognito Mode) --//
var isStorageAvailable = function (storage) {

	if (typeof storage == "undefined") return false;
	try { // hack for safari incognito
		storage.setItem("storage", "");
		storage.getItem("storage");
		storage.removeItem("storage");
		return true;
	}
	catch (err) {
		return false;
	}
};
// -- Test Storage Availability (inc Mobile Safari | Incognito Mode) --//


// == Local Object Storage for LocalForage | Polyfill == //
(function () {

  var localStorageAvailable = isStorageAvailable(window.localStorage),
    sessionStorageAvailable = isStorageAvailable(window.sessionStorage);

  if (!localStorageAvailable || !sessionStorageAvailable) {

    var Storage = function (id, cookie) {
			
      function createCookie(name, value, days) {
        var date, expires;

        if (days) {
          date = new Date();
          date.setTime(date.getTime() + (days*24*60*60*1000));
          expires = "; expires=" + date.toGMTString();
        } else {
          expires = "";
        }
        document.cookie = name + "=" + value + expires + "; path=/";
      }

      function readCookie(name) {
        var nameEQ = name + "=", ca = document.cookie.split(';'), c;

        for (var i = 0; i < ca.length; i++) {
          c = ca[i];
          while (c.charAt(0) == " ") {
            c = c.substring(1,c.length);
          }

          if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length,c.length);
          }
        }
        return null;
      }

      function setData(data) {
        data = JSON.stringify(data);
        if (cookie) {
				 createCookie(id, data, 365);
        } else {
         window[id] = data;
        }
      }

      function clearData() {
        if (cookie) {
					createCookie(id, "", 365);
        } else {
          delete window[id];
        }
      }

      function getData() {
        var data = cookie ? readCookie(id) : window[id];
        return data ? JSON.parse(data) : {};
      }

      // initialise if there's already data
      var data = getData();

      return {
        length: 0,
        clear: function () {
          data = {};
          this.length = 0;
          clearData();
        },
        getItem: function (key) {
          return data[key] === undefined ? null : data[key];
        },
        key: function (i) {
          // not perfect, but works
          var ctr = 0;
          for (var k in data) {
            if (ctr == i) return k;
            else ctr++;
          }
          return null;
        },
        removeItem: function (key) {
          if (data[key] === undefined) this.length--;
          delete data[key];
          setData(data);
        },
        setItem: function (key, value) {
          if (data[key] === undefined) this.length++;
          data[key] = value+'';
          setData(data);
        }
      };
			
    };

    if (!localStorageAvailable) {
			window.localStorage.__proto__ = new Storage("__local");
			window.localStorage_POLYFILLED = true;
		}
    if (!sessionStorageAvailable) {
			window.sessionStorage.__proto__ = new Storage("__session");
			window.sessionStorage_POLYFILLED = true;
		}

  }

})();
// == Local Object Storage for LocalForage | Polyfill == //