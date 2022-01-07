ipcRenderer.send('startup');

ipcRenderer.on('startupReply', (event, arg, arg2) => {
    document.getElementById('check').checked = arg;
    // delete any previous roles
    var prevRoles = document.getElementsByClassName("role");
    for (var i = 0; i < prevRoles.length; i++) {
        prevRoles[i].remove();
    }
    // create new elements
    for (var i = 0; i < arg2.length; i++) {
        const roleName = arg2[i].name;
        const roleColor = "rgba(" + arg2[i].color.join(",") + ")"
        const checked = arg2[i].user;
        
        // create main wrapper
        let role = document.createElement("div");
        role.setAttribute("id", i);
        role.setAttribute("class", "role");
        role.onmouseenter = hover;
        role.onmouseleave = leave;
        role.style.background = roleColor;
        
        // create check mark
        let label = document.createElement("label");
        label.setAttribute("class", "roleCheck");
        let input = document.createElement("input");
        input.setAttribute("type", "checkbox");
        input.checked = checked;
        input.onchange = check;
        label.appendChild(input);
        role.appendChild(label);
        
        // create role name
        let name = document.createElement("h4");
        name.setAttribute("class", "roleName");
        name.setAttribute("charset", "UTF-8");
        name.innerHTML = roleName;
        role.appendChild(name);

        // add role to main div
        document.getElementById("roles").appendChild(role);
    }
});

function startup(event) {
    ipcRenderer.send('startup', event.target.checked);
}

function hover(event) {
    var original = window.getComputedStyle(event.target).getPropertyValue("background-color").toString();
    var rgb = original.substring(0, original.lastIndexOf(",") + 1);
    event.target.style.background = rgb + "0.8)";
}

function leave(event) {
    var original = window.getComputedStyle(event.target).getPropertyValue("background-color").toString();
    var rgb = original.substring(0, original.lastIndexOf(",") + 1);
    event.target.style.background = rgb + "0.5)";
}

function check(event) {
    var element = event.target;
    while (element.className != 'role') {
        element = element.parentElement;
    }
    ipcRenderer.send('roleChange', parseInt(element.id), event.target.checked);
}
// console.log("rgba(" + roles[0].color + ")");