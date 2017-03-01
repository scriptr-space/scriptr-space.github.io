
TODO LIST 
=========

* Handle COMPLETE Clone Sync from Github including addition of new files??

* BUG - no splash screens showing on IOS? | https://forums.developer.apple.com/thread/23924 & http://stackoverflow.com/questions/31471603/ios-9-status-bar-meta-tag-and-startup-image-links-not-working
* Touch controls - including full screen menu for small screens?
* Whole screen navigator on small screen
* Right click menu for navigator
* Global code store object and background updates
* Scroll Performance on IOS
* Register (for automatic removal) temporary interaction commands (or handle 'states' in the Interaction.js module)
* Owner / Owning Organisation on each script? <-- Check API Response

Complete
--------
* What happens if we try to remove the _last_ file from a script?? | Get a 500 Error (good test for error handling) <-- DONE
* Sort Files in Script by name <-- DONE
* BUG: Current is only cleared in current script, not the whole thing! <-- DONE
* CTRL Click to rename files <-- DONE
* Add / Delete Files <-- DONE
* Bug on Save after add... < NOT being set after change (event hookup) RELOAD seems to fail <-- DONE
* Busy on non-changed/deleted files shouldn't appear! -> Need formal 'state' enum? <-- DONE
* Create File / Delete File Function <-- DONE
* Add Image onto Google App / API <-- DONE
* Cycle Reverse/Forward through themes and fonts <-- DONE
* Make Diffs work... <-- DONE
* Clear text when folding down a script. <-- DONE
* Visual Feedback for Loading/Saving - block 'double' actions with pendings <-- DONE
* Fade out element <-- DONE
* Save-All Function - CRTL-SHIFT-S? <-- DONE
* Can we pull descriptions for script files to add as title attributes? <-- DONE
* Add Line numbers to attributes on file / script levels <-- DONE
* Authorisation / Permissions Bug for loading on some accounts? <-- DONE
* Interpret 'AS' functionality, or infer from pre .html extension (e.g. .js.html) + Add CSS mode and deal with ALL the problems.
* Does rename to HTML mode actually work?? <-- NO / DONE
* Abandon Local Changes to File - Shortcut Key <-- DONE
* BUG: Reload after add doesn't seem to SHOW current... <-- DONE
* Clear all cached changes on logout??? - Maybe post a change file to GD? (Application Data - could be retrieved next time you sign in?) <-- DONE but not Save back (yet)
* Changes are not highlighted as changes when app is reloaded (they are loaded, just not shown) BUG introduced by .git <-- DONE
* [BUG] When you delete .git and re-call COMMIT, it just seems to hang - grrr <-- DONE
* Set focus after NAV click to editor? <-- DONE
* After remove / delete - need to trigger (from home) to select the (last) file in the current selection? <-- DONE
* Diff to Github <-- DONE
* CSS Error Display (like busy) - Need testing with forced errors <-- DONE
* Why does Oktocat not call error functions on then()? Swapped to Native Promises (now does) <-- DONE
* Finish GitHub Functionality [Use .git file to store properties in YAML] <-- DONE
* Write detailed instructions -> DETAILS.md <-- DONE
* Change CTRL-X binding to CTRL-SHIFT-X <-- DONE
* Double Check all keyboard shortcuts are consistent... <-- DONE
* Two-Way Github Sync -- Just Line 659 in Home.js to DO! <-- DONE
* Would be nice to return to line number on a particular file when editing? Perhaps store as a data attribute on the LI? <-- DONE
* Centralise Log calls in Flags -> With debug & errors check <-- DONE
* BUG - IOS Home-Screen App pinning (after auth, nothing happens :[<]) ... redirection issue <-- This is going to need a GAPI removal and auth flow re-write. <-- DONE
* Sign In doesn't trigger NAVIGATOR? <-- DONE
* Auth flow is broken on IOS <-- DONE
* Sign in doesn't trigger Drive Load? <-- DONE
* Make IOS Homescreen Icons a lot better... <-- DONE
* Save Visual Settings (font & themes) upon Sign Out <-- DONE
* Token Expiration for Google Drive - need to handle automatically <-- DONE
* Gracefully handle Google Drive token expiration ... <-- DONE

ᕕ( ᐛ )ᕗ JD ♑ - 2017-01-01