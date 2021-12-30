const {ipcRenderer} = require('electron');
function redirect(e) {
    ipcRenderer.send('redirect', e.target.id);
}
function redirectToLogin() {
    ipcRenderer.send('redirect', 'login');
}
global.redirect = redirect;
global.redirectToLogin = redirectToLogin;