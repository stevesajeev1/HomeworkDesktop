const { ipcRenderer } = require('electron');

ipcRenderer.send('loggedIn');

ipcRenderer.on('loggedInReply', function (event, arg) {
  if (!arg) {
    if (!document.URL.endsWith('login.html')) {
        redirectToLogin();
    } else {
        for (var element of document.getElementsByClassName('item')) {
            element.style.display = 'none';
        }
    }
  }
});