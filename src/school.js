ipcRenderer.send('school');

var currentDate = new Date();
const dateInput = document.getElementById('dateInput');
if (dateInput != null) {
    var date = currentDate.getFullYear() + "-" + proper(currentDate.getMonth() + 1) + "-" + proper(currentDate.getDate()) + "T" + proper(currentDate.getHours()) + ":" + proper(currentDate.getMinutes());
    dateInput.value = date;
    dateInput.min = date;
}

// Update value
if (dateInput != null) {
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
}

if (dateInput != null) {
    dateInput.addEventListener('input', function (event) {
        if (new Date(dateInput.value) < new Date()) {
            currentDate = new Date();
            var date = currentDate.getFullYear() + "-" + proper(currentDate.getMonth() + 1) + "-" + proper(currentDate.getDate()) + "T" + proper(currentDate.getHours()) + ":" + proper(currentDate.getMinutes());
            dateInput.value = date;
            dateInput.min = date;
        }
    })
}

var timer;
var editing;
var school;
var schoolDate;
ipcRenderer.on('schoolReply', (event, arg1, arg2, arg3, arg4) => {
    // Add options for selecting roles
    var roles = arg4;
    for (var i = 0; i < roles.length; i++) {
        let roleOption = document.createElement("option");
        roleOption.setAttribute("value", roles[i].id);
        roleOption.innerHTML = roles[i].name;
        document.getElementById('roleSelect').appendChild(roleOption);
    }
    // delete any previous reminders
    var prevReminders = document.getElementsByClassName("reminder");
    while (prevReminders[0]) {
        prevReminders[0].remove();
    }
    if (timer != null) {
        clearInterval(timer);
        timer = null;
    }
    schoolDate = arg2.sort(function(a, b) {
        return new Date(a.date) - new Date(b.date);
    })
    if (!arg3) {
        school = arg2.sort(function(a, b) {
            if (a.roleID < b.roleID) {
                return -1;
            } else if (a.roleID > b.roleID) {
                return 1;
            } else {
                return new Date(a.date) - new Date(b.date);
            }
        })
    } else {
        school = schoolDate;
    }
    if (school.length == 0) {
        editing = null;
        document.getElementById('none').style.display = 'flex';
        document.getElementById('countdown').style.display = 'none';
        document.getElementById('sort').style.display = 'none';
    } else {
        // create new elements
        for (var i = 0; i < school.length; i++) {
            // check if user is signed up for notifications
            for (var i = 0; i < roles.length; i++) {
                if (school[i].roleID == roles[j].id) {
                    if (!roles[j].user) {
                        return;
                    }
                }
            }
            const date = new Date(school[i].date);
            var hours = date.getHours();
            hours = ((hours + 11) % 12 + 1); 
            const dateString = proper(date.getMonth() + 1) + "/" + proper(date.getDate()) + "/" + date.getFullYear() + " " + proper(hours) + ":" + proper(date.getMinutes()) + " " + (date.getHours() >= 12 ? 'PM' : 'AM');
            
            // create main wrapper
            let reminder = document.createElement("div");
            reminder.setAttribute("class", "reminder");
            reminder.setAttribute("id", i.toString());
            if (arg1) {
                reminder.onmouseover = overlay;
                reminder.onmouseleave = stopEdit;
            }
            // set background color of reminder based on role
            for (var j = 0; j < roles.length; j++) {
                if (school[i].roleID == roles[j].id) {
                    const roleColor = "rgba(" + roles[j].color.join(",") + ")"
                    reminder.style.background = roleColor;
                    break; 
                }
            }
            
            // create reminder date
            let dateElement = document.createElement("h1");
            dateElement.setAttribute("class", "reminderDate");
            dateElement.innerHTML = dateString;
            reminder.appendChild(dateElement);
            
            if (arg1) {
                // create edit date
                let editDate = document.createElement("input");
                editDate.setAttribute("class", "editDate");
                editDate.setAttribute("type", "datetime-local");
                reminder.appendChild(editDate);
            }
            
            // create reminder name
            let nameElement = document.createElement("div");
            nameElement.setAttribute("class", "reminderName");
            nameElement.innerHTML = school[i].name;
            reminder.appendChild(nameElement);
            
            if (arg1) {
                // create edit name
                let editName = document.createElement("textarea");
                editName.setAttribute("class", "editName");
                editName.setAttribute("maxlength", "122");
                reminder.appendChild(editName);
            }
            
            if (arg1) {
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
            }
            
            // add reminder to main div
            document.getElementById("scroll").appendChild(reminder);
        }
        editing = new Array(school.length).fill(false);
        document.getElementById('countdown').style.display = 'flex';
        document.getElementById('sort').style.display = 'flex';
        document.getElementById('none').style.display = 'none';
        document.getElementById('sortDate').checked = arg3;
        document.getElementById('sortClass').checked = !arg3;
        // interval for countdown
        timer = setInterval(function instant() {
            var distance = new Date(schoolDate[0].date) - new Date();
            if (distance < 0) {
                enforceStopEdit(0);
                ipcRenderer.send('schoolComplete');
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
    if (arg1) {
        // is mod
        document.getElementById('addContainer').style.display = 'initial';
    } else {
        document.getElementById('addContainer').style.display = 'none';
    }
})

function createSchool() {
    var schoolName = document.getElementById('nameInput').value;
    var schoolDateVal = dateInput.value;
    var roleID = document.getElementById('roleSelect').value;
    if (!schoolName || schoolName.length === 0) {
        return;
    }
    ipcRenderer.send('createSchool', schoolName, schoolDateVal, roleID);
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
    var schoolDateVal = new Date(school[parseInt(element.id)].date);
    var schoolValue = schoolDateVal.getFullYear() + "-" + proper(schoolDateVal.getMonth() + 1) + "-" + proper(schoolDateVal.getDate()) + "T" + proper(schoolDateVal.getHours()) + ":" + proper(schoolDateVal.getMinutes());
    element.querySelector(".editDate").addEventListener('input', enforceDate);
    element.querySelector(".editDate").value = schoolValue;
    element.querySelector(".editDate").min = date;
    element.querySelector(".editDate").style.display = 'flex';
    element.querySelector(".reminderName").style.display = 'none';
    element.querySelector(".editName").placeholder = school[parseInt(element.id)].name;
    element.querySelector(".editName").style.display = 'flex';
    editing[parseInt(element.id)] = true;
}

function stopEdit(event) {
    var element = event.target;
    while (element.className != 'reminder') {
        element = element.parentElement;
    }
    const oldDate = school[parseInt(element.id)].date;
    const oldName = school[parseInt(element.id)].name;
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
    var id = parseInt(element.id);
    // Get equivalent when sorting by date
    for (var i = 0; i < schoolDate.length; i++) {
        if (schoolDate[i] == school[id]) {
            id = i;
            break;
        }
    }
    if ((isNaN(newDate) || newDate == oldDate) && newName && newName.length > 0 && newName != oldName) {
        ipcRenderer.send("schoolEdit", id, oldDate, newName, school[id].roleID);
        return;
    } else if (!isNaN(newDate) && newDate != oldDate && newName && newName.length > 0 && newName != oldName) {
        ipcRenderer.send("schoolEdit", id, newDate, newName, school[id].roleID);
        return;
    } else if (!isNaN(newDate) && newDate != oldDate && (!newName || newName.length == 0 || newName == oldName)) {
        ipcRenderer.send("schoolEdit", id, newDate, oldName, school[id].roleID);
        return;
    }
}

function del(event) {
    var element = event.target;
    while (element.className != 'reminder') {
        element = element.parentElement;
    }
    enforceStopEdit(parseInt(element.id));
    var id = parseInt(element.id);
    // Get equivalent when sorting by date
    for (var i = 0; i < schoolDate.length; i++) {
        if (schoolDate[i] == school[id]) {
            id = i;
            break;
        }
    }
    ipcRenderer.send("schoolDelete", id);
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
    var element = document.getElementById(index);
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

function toggle(event) {
    if (event.target.id == 'sortDate') {
        document.getElementById('sortClass').checked = !event.target.checked;
    } else {
        document.getElementById('sortDate').checked = !event.target.checked;
    }
    ipcRenderer.send('school', true);
}

function proper(time) {
    return ("0" + time).slice(-2);
}