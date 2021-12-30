ipcRenderer.send('personal');

var currentDate = new Date();
const dateInput = document.getElementById('dateInput');
var date = currentDate.getFullYear() + "-" + proper(currentDate.getMonth() + 1) + "-" + proper(currentDate.getDate()) + "T" + proper(currentDate.getHours()) + ":" + proper(currentDate.getMinutes());
dateInput.value = date;
dateInput.min = date;

// Update value
setInterval(function() {
    if (document.getElementById('dateInput') != document.activeElement) {
        if (new Date(dateInput.value) < new Date()) {
            currentDate = new Date();
            var date = currentDate.getFullYear() + "-" + proper(currentDate.getMonth() + 1) + "-" + proper(currentDate.getDate()) + "T" + proper(currentDate.getHours()) + ":" + proper(currentDate.getMinutes());
            dateInput.value = date;
            dateInput.min = date;
        }
    }
}, 1000 * 60);

dateInput.addEventListener('input', function (event) {
    if (new Date(dateInput.value) < new Date()) {
        currentDate = new Date();
        var date = currentDate.getFullYear() + "-" + proper(currentDate.getMonth() + 1) + "-" + proper(currentDate.getDate()) + "T" + proper(currentDate.getHours()) + ":" + proper(currentDate.getMinutes());
        dateInput.value = date;
        dateInput.min = date;
    }
})

var timer;
var editing;
var personal;
ipcRenderer.on('personalReply', (event, arg, arg2) => {
    // delete previous elements
    var prevReminders = document.getElementsByClassName("reminder");
    for (var i = 0; i < prevReminders.length; i++) {
        prevReminders[i].remove();
    }
    if (timer != null) {
        clearInterval(timer);
        timer = null;
    }
    if (arg2) {
        redirectToLogin();
    }
    personal = JSON.parse(arg);
    if (personal == null) {
        editing = null;
        document.getElementById('none').style.display = 'flex';
        document.getElementById('countdown').style.display = 'none';
    } else {
        // delete any previous reminders
        var prevReminders = document.getElementsByClassName("reminder");
        for (var i = 0; i < prevReminders.length; i++) {
            prevReminders[i].remove();
        }
        // create new elements
        for (var i = 0; i < personal.length; i++) {
            const date = new Date(personal[i].date);
            var hours = date.getHours();
            hours = ((hours + 11) % 12 + 1); 
            const dateString = proper(date.getMonth() + 1) + "/" + proper(date.getDate()) + "/" + date.getFullYear() + " " + proper(hours) + ":" + proper(date.getMinutes()) + " " + (date.getHours() >= 12 ? 'PM' : 'AM');
            
            // create main wrapper
            let reminder = document.createElement("div");
            reminder.setAttribute("class", "reminder");
            reminder.setAttribute("id", i.toString());
            reminder.onmouseover = overlay;
            reminder.onmouseleave = stopEdit;
            
            // create reminder date
            let dateElement = document.createElement("h1");
            dateElement.setAttribute("class", "reminderDate");
            dateElement.innerHTML = dateString;
            reminder.appendChild(dateElement);
            
            // create edit date
            let editDate = document.createElement("input");
            editDate.setAttribute("class", "editDate");
            editDate.setAttribute("type", "datetime-local");
            reminder.appendChild(editDate);
            
            // create reminder name
            let nameElement = document.createElement("div");
            nameElement.setAttribute("class", "reminderName");
            nameElement.innerHTML = personal[i].name;
            reminder.appendChild(nameElement);
            
            // create edit name
            let editName = document.createElement("textarea");
            editName.setAttribute("class", "editName");
            editName.setAttribute("maxlength", "122");
            reminder.appendChild(editName);
            
            // create overlay
            let overlayElement = document.createElement("div");
            overlayElement.setAttribute("class", "overlay");
            // create edit button
            let editElement = document.createElement("img");
            editElement.setAttribute("class", "edit");
            editElement.setAttribute("src", "../assets/EditIcon.png");
            editElement.onclick = edit;
            overlayElement.appendChild(editElement);
            // create delete button
            let delElement = document.createElement("img");
            delElement.setAttribute("class", "delete");
            delElement.setAttribute("src", "../assets/DeleteIcon.png");
            delElement.onclick = del;
            overlayElement.appendChild(delElement);
            reminder.appendChild(overlayElement);
            
            // add reminder to main div
            document.getElementById("scroll").appendChild(reminder);
        }
        editing = new Array(personal.length).fill(false);
        document.getElementById('countdown').style.display = 'flex';
        document.getElementById('none').style.display = 'none';
        // interval for countdown
        timer = setInterval(function instant() {
            var distance = new Date(personal[0].date) - new Date();
            if (distance < 0) {
                enforceStopEdit(0);
                ipcRenderer.send('personalComplete');
                clearInterval(timer);
                timer = null;
                return;
            }
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            document.querySelector('#countdown > h1').innerHTML = proper(days) + ":" + proper(hours) + ":" + proper(minutes) + ":" + proper(seconds);
            return instant;
        }(), 1000);
    }
})

function createPersonal() {
    var personalName = document.getElementById('nameInput').value;
    var personalDate = dateInput.value;
    if (!personalName || personalName.length === 0) {
        return;
    }
    ipcRenderer.send('createPersonal', personalName, personalDate);
    document.getElementById('nameInput').value = '';
}

function overlay(event) {
    var element = event.target;
    while (element.className != 'reminder') {
        element = element.parentElement;
    }
    if (editing[parseInt(element.id)] == true) {
        element.querySelector(".overlay").style.visibility = 'hidden';
    } else {
        element.querySelector(".overlay").style.visibility = 'visible';
    }
}

function edit(event) {
    var element = event.target;
    while (element.className != 'reminder') {
        element = element.parentElement;
    }
    element.querySelector(".overlay").style.visibility = 'hidden';
    element.querySelector(".reminderDate").style.display = 'none';
    currentDate = new Date();
    var date = currentDate.getFullYear() + "-" + proper(currentDate.getMonth() + 1) + "-" + proper(currentDate.getDate()) + "T" + proper(currentDate.getHours()) + ":" + proper(currentDate.getMinutes());
    var personalDate = new Date(personal[parseInt(element.id)].date);
    var personalValue = personalDate.getFullYear() + "-" + proper(personalDate.getMonth() + 1) + "-" + proper(personalDate.getDate()) + "T" + proper(personalDate.getHours()) + ":" + proper(personalDate.getMinutes());
    element.querySelector(".editDate").addEventListener('input', enforceDate);
    element.querySelector(".editDate").value = personalValue;
    element.querySelector(".editDate").min = date;
    element.querySelector(".editDate").style.display = 'flex';
    element.querySelector(".reminderName").style.display = 'none';
    element.querySelector(".editName").placeholder = personal[parseInt(element.id)].name;
    element.querySelector(".editName").style.display = 'flex';
    editing[parseInt(element.id)] = true;
}

function stopEdit(event) {
    var element = event.target;
    while (element.className != 'reminder') {
        element = element.parentElement;
    }
    const oldDate = personal[parseInt(element.id)].date;
    const oldName = personal[parseInt(element.id)].name;
    const newDate = Date.parse(element.querySelector(".editDate").value);
    const newName = element.querySelector(".editName").value.replace(/(\r\n|\n|\r)/gm, "");
    element.querySelector(".overlay").style.visibility = 'hidden';
    element.querySelector(".reminderDate").style.display = 'initial';
    element.querySelector(".editDate").removeEventListener('input', enforceDate);
    element.querySelector(".editDate").style.display = 'none';
    element.querySelector(".reminderName").style.display = 'flex';
    element.querySelector(".editName").style.display = 'none';
    if (editing[parseInt(element.id)] == true) {
        editing[parseInt(element.id)] = false;
    }
    if ((isNaN(newDate) || newDate == oldDate) && newName && newName.length > 0 && newName != oldName) {
        ipcRenderer.send("personalEdit", element.id, oldDate, newName);
        return;
    } else if (!isNaN(newDate) && newDate != oldDate && newName && newName.length > 0 && newName != oldName) {
        ipcRenderer.send("personalEdit", element.id, newDate, newName);
        return;
    } else if (!isNaN(newDate) && newDate != oldDate && (!newName || newName.length == 0 || newName == oldName)) {
        ipcRenderer.send("personalEdit", element.id, newDate, oldName);
        return;
    }
}

function del(event) {
    var element = event.target;
    while (element.className != 'reminder') {
        element = element.parentElement;
    }
    enforceStopEdit(parseInt(element.id));
    ipcRenderer.send("personalDelete", element.id);
}

enforceDate = function(event) {
    if (new Date(event.target.value) < new Date()) {
        currentDate = new Date();
        var date = currentDate.getFullYear() + "-" + proper(currentDate.getMonth() + 1) + "-" + proper(currentDate.getDate()) + "T" + proper(currentDate.getHours()) + ":" + proper(currentDate.getMinutes());
        event.target.value = date;
        event.target.min = date;
    }
}

function enforceStopEdit(index) {
    var element = document.getElementById("0");
    if (editing[index] == true) {
        editing[index] = false;
        element.querySelector(".overlay").style.visibility = 'hidden';
        element.querySelector(".reminderDate").style.display = 'initial';
        element.querySelector(".editDate").removeEventListener('input', enforceDate);
        element.querySelector(".editDate").style.display = 'none';
        element.querySelector(".reminderName").style.display = 'flex';
        element.querySelector(".editName").style.display = 'none';
    }
}

function proper(time) {
    return ("0" + time).slice(-2);
}

function resizeFont() {

}

global.overlay = overlay;
global.createPersonal = createPersonal;
global.del = del;
global.stopEdit = stopEdit;