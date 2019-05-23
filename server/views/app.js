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

    let conversations = document.querySelector(".conversations");

    // Quand on envoie un message à un client spécifique :
    document.addEventListener("keydown", e => {
        if (!e.target.classList.contains("answer-client-input") || e.code !== "Enter" || e.target.value === "") {
            return;
        }

        // el permet correspond à l'indice de wss.clients sur le serveur
        let el = e.target.parentNode.className;

        // On envoit le message au client en indiquant le client au serveur
        socket.send(newJSONMessage("admin-to-client", e.target.value, el.replace(/_/, '')));

        // On ajoute le message à la liste des messages côté admin :
        e.target.parentNode.querySelector("ul").innerHTML += "<li>Admin :" + e.target.value + "</li>"
        e.target.value = "";
    });

    socket.addEventListener("message", message => {
        messageContent = JSON.parse(message.data);

        if (messageContent.type === "dm") {
            // Si il s'agit du premier message avec ce client, une nouvelle div est créée pour afficher la conversation
            if (!document.querySelector("." + messageContent.to)) {
                conversations.innerHTML += `<div class="${messageContent.to}">
                <ul>
                    <li>Client : ${messageContent.content}</li>
                </ul>
                <input type="text" class="answer-client-input" />
                </div>`;
            } else {
                document.querySelector("." + messageContent.to + " ul").innerHTML += "<li>Client : " + messageContent.content + "</li>";
            }
        }

    });

});