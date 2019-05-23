function newJSONMessage(t, c, target = "") {
    let returnObj = {
        type: t,
        content: c
    }
    if (target !== "") {
        returnObj.to = target;
    }
    
    return JSON.stringify(returnObj);
}

document.addEventListener("DOMContentLoaded", () => {

    const socket = new WebSocket('ws://localhost:8080');

    // L'admin se connecte :
    socket.addEventListener("open", () => {
        socket.send(newJSONMessage("admin-login", "1234"));
    })

    document.querySelector(".send").addEventListener("click", e => {
        socket.send(newJSONMessage("admin-dm", document.querySelector(".input-text").value));
    });

    socket.addEventListener("message", message => {

        console.log(message);

    });

});