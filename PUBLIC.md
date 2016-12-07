
🐧 SCRIPTR.SPACE 🐧
===================
A web-based tool for authoring Google Apps Scripts. Allows for easier editing, local storage, saving, diff'ing and committing to Github. Built atop of [Ace][1] for speed, familiarity and ease of use.

To use this tool, first need to 'Sign In' using the button above (into your Google Account). If this is the first time using this tool with your account, you will need to authorise the code to access your profile information (email address, name) and the File/Apps Scripts in your Google Drive. You name and email address is not stored anywhere, it is simply displayed at the top of the page, useful if you are using multiple Google Accounts or forget yourself once in a while. This tool is run entirely client side, so doesn't send any information back to our servers - apart from Google Analytics information, to see how widely it is being used.

Once you are signed in, all your scripts will be loaded in a navigator bar (which can easily be hidden) and further instructions (such as keyboard shortcuts) will be displayed. The tool itself works on a wide variety of devices, including tablets if you prefer to code on the move! You can change themes and fonts for the ace editor to suit your own desires.

Whilst this tool (the HTML, some of the javascript & CSS) is served over HTTP (by Github Pages), rather than HTTPS, all the communication with the Google/Github APIs (signing in, loading, saving, committing) is all done securely over HTTPS. If you are using an IOS / Android tablet, you can add this site to your home screen to get a better full-screen experience, or add it to [your shelf][3] if you're developing using Chrome OS.

You can find out more, and view all the source code (it's entirely open), or fork your own version at [Github][2].

Happy Scripting,

JD

  [1]: https://ace.c9.io/ "Ace - The high performance code editor for the web"
  [2]: https://github.com/scriptr-space/scriptr-space.github.io "Scriptr.space on Github"
  [3]: https://support.google.com/chrome_webstore/answer/3060053