const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const { MongoClient } = require('mongodb');
const settings = require('electron-settings');
const https = require('https');
const secrets = require(path.join(__dirname, '../secrets.json'));

const clientID = secrets.clientID;
const clientSecret = secrets.clientSecret;
const mongoPassword = secrets.mongoPassword;


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow;
let loggedIn;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    icon: path.join(__dirname, '../assets/HomeworkDesktopIcon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'redirect.js'),
    },
  });

  // check if token is valid
  loggedIn = false;
  if (settings.hasSync("token") && settings.getSync('token') != null) {
    loggedIn = true;
  }
  if (loggedIn) {
    mainWindow.loadFile(path.join(__dirname, 'school.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, 'login.html'));
  }
  mainWindow.setMenuBarVisibility(false);
};

// const uri = `mongodb+srv://SteveS:${mongoPassword}@homeworkdesktop.i6fzb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle navigation between pages
ipcMain.on('redirect', (event, arg) => {
  loggedIn = false;
  if (settings.hasSync("token") && settings.getSync('token') != null) {
    loggedIn = true;
  }
  if (loggedIn) {
    mainWindow.loadFile(path.join(__dirname, `${arg}.html`));
  } else {
    mainWindow.loadFile(path.join(__dirname, 'login.html'));
  }
})

// Send loggedIn status
ipcMain.on('loggedIn', (event, arg) => {
  event.sender.send('loggedInReply', loggedIn);
})

let userID;
// OAuth
ipcMain.on('oauth', (event, arg) => {
  var authWindow = new BrowserWindow({
    width: 800, 
    height: 800, 
    show: false, 
    'node-integration': false,
    'web-security': false
  });
  // This is just an example url - follow the guide for whatever service you are using
  var authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientID}&redirect_uri=http%3A%2F%2Flocalhost%2Foauth%2Fredirect&response_type=code&scope=identify`;

  authWindow.loadURL(authUrl);
  authWindow.show();
  
  let successfulAuth = false;
  authWindow.webContents.on('will-navigate', function (event, newUrl) {
      var code = (new URL(newUrl)).searchParams.get("code");
      const data = `client_id=${clientID}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}&redirect_uri=http%3A%2F%2Flocalhost%2Foauth%2Fredirect`
      const options = {
        hostname: 'discord.com',
        path: '/api/v8/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
      const req = https.request(options, res => {
        if (res.statusCode != 200) {
          authWindow.close();
          authWindow = null;
          return;
        }
      
        let data = '';

        res.on('data', d => {
          data += d;
        })

        res.on('end', () => {
          settings.setSync('token', JSON.parse(data.toString()));
          const idOptions = {
            hostname: 'discord.com',
            path: '/api/v8/users/@me',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${JSON.parse(data.toString()).access_token}`
            }
          }
          const idReq = https.request(idOptions, res => {
            if (res.statusCode != 200) {
              return;
            }

            let data = '';

            res.on('data', d => {
              data += d;
            })

            res.on('end', () => {
              userID = JSON.parse(data.toString()).id;
              var obj = settings.getSync('token');
              obj.id = userID;
              settings.setSync('token', obj);
              const rolesOptions = {
                hostname: 'Homework-Desktop.stevesajeev.repl.co',
                path: `/user?id=${userID}`,
                method: 'GET',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                }
              }
              const rolesReq = https.request(rolesOptions, res => {
                if (res.statusCode != 200) {
                  return;
                }
    
                let data = '';
    
                res.on('data', d => {
                  data += d;
                })
    
                res.on('end', () => {
                  successfulAuth = true;
                  authWindow.close();
                  authWindow = null;
                  var roles = data.toString().split(" ");
                  var obj = settings.getSync('token');
                  obj.roles = roles;
                  settings.setSync('token', obj);
                })
              })
              
              rolesReq.on('error', error => {
                console.error(error)
              })
              rolesReq.end()
            })
          })
          
          idReq.on('error', error => {
            console.error(error)
          })
          
          idReq.end()
        })
      })
      
      req.on('error', error => {
        console.error(error)
      })

      req.write(data);
      req.end()
  });

  authWindow.on('closed', function() {
      if (successfulAuth) {
        mainWindow.loadFile(path.join(__dirname, 'school.html'));
      }
      authWindow = null;
  });
})

// Logout
ipcMain.on('logout', (event, arg) => {
  settings.unset('token');
})

// Get personal
ipcMain.on('personal', (event, arg) => {
  var personal = JSON.stringify(settings.getSync('personal'));
  if (settings.hasSync("personal") && settings.getSync('personal') != null) {
    event.sender.send('personalReply', personal);
  } else {
    event.sender.send('personalReply', null);
  }
})

// Create personal
ipcMain.on('createPersonal', (event, arg1, arg2) => {
  var name = arg1;
  var date = Date.parse(arg2);
  var personalArray = settings.getSync('personal');
  var reminder = {
    name: name,
    date: date
  }
  if (personalArray == null) {
    personalArray = [reminder];
  } else {
    personalArray.push(reminder);
  }
  personalArray.sort(function(a, b) {
    return new Date(a.date) - new Date(b.date);
  })
  settings.setSync('personal', personalArray);
  event.sender.send('personalReply', JSON.stringify(settings.getSync('personal')));
});

// Personal event time reached
ipcMain.on('personalComplete', (event, arg) => {
  var personalArray = settings.getSync('personal');
  // Send notification
  if (process.platform === "win32") {
    app.setAppUserModelId("Homework Desktop");
  } 
  const notif = {
    title: 'Personal Reminder',
    body: 'Reminder for now: ' + personalArray[0].name,
    icon: path.join(__dirname, '../assets/HomeworkDesktopIcon.png')
  }
  new Notification(notif).show();
  // Send Discord notification
  var id = settings.getSync('token').id;
  var data = `id=${id}&reminder=${personalArray[0].name}`;
  var options = {
    hostname: 'Homework-Desktop.stevesajeev.repl.co',
    path: '/personal',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  var req = https.request(options, (res) => {
    if (res.statusCode != 200) {
      successfulAuth = false;
      settings.unset('personal');
      event.sender.send('personalReply', null, true);
      return;
    }
  });
  req.on('error', (e) => {
    console.error(e);
  });
  req.write(data);
  req.end();
  
  // Clear from array
  personalArray.shift();
  if (personalArray.length == 0) {
    settings.unset('personal');
    event.sender.send('personalReply', null);
  } else {
    settings.setSync('personal', personalArray);
    event.sender.send('personalReply', JSON.stringify(settings.getSync('personal')));
  }
})

// Personal reminder wants to be delete
ipcMain.on('personalDelete', (event, arg) => {
  var personalArray = settings.getSync('personal');
  personalArray.splice(parseInt(arg), 1);
  if (personalArray.length == 0) {
    settings.unset('personal');
    event.sender.send('personalReply', null);
  } else {
    settings.setSync('personal', personalArray);
    event.sender.send('personalReply', JSON.stringify(settings.getSync('personal')));
  }
})

// Personal reminder was edited
ipcMain.on('personalEdit', (event, arg1, arg2, arg3) => {
  var personalArray = settings.getSync('personal');
  personalArray[parseInt(arg1)] = {
    name: arg3, 
    date: arg2
  }
  personalArray.sort(function(a, b) {
    return new Date(a.date) - new Date(b.date);
  })
  console.log(personalArray);
  settings.setSync('personal', personalArray);
  event.sender.send('personalReply', JSON.stringify(settings.getSync('personal')));
})

// Discord rich presence
const DiscordRPC = require('discord-urpc');
const uRPC = new DiscordRPC({ clientID: clientID, debug: false });
 
uRPC.on('ready', () => {
    const args = {
        pid: process.pid,
        activity: {
            details: '🏫 Listening to reminders!',
            timestamps: {
                start: new Date().getTime()
            },
            assets: {
                large_image: 'homeworkdesktop',
                large_text: 'Homework Desktop',
                small_image: 'hackerman',
                small_text: 'Made by Steve S',
            },
            instance: false
        }
    };
 
    uRPC.send('SET_ACTIVITY', args);
});