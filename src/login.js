ipcRenderer.send('loggedIn');

let loggedIn;
ipcRenderer.on('loggedInReply', function (event, arg) {
    loggedIn = arg;
    if (arg) {
        document.getElementById('title').innerHTML = 'Logout';
        document.getElementById('text').innerHTML = 'Logout';
    }
});

function logClick() {
    if (!loggedIn) {
        ipcRenderer.send('oauth');
    } else {
        ipcRenderer.send('logout');
        for (var element of document.getElementsByClassName('item')) {
            element.style.display = 'none';
            document.getElementById('title').innerHTML = 'Login';
            document.getElementById('text').innerHTML = 'Login with Discord';
        }
        loggedIn = false;
    }
}

global.logClick = logClick;