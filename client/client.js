
// Username de l'utilisateur courant :
let name;

// On initie une nouvelle websocket :
const socket = new WebSocket('ws://localhost:8080');

// Utilisateur à qui envoyer le message :
let sendMessageTo;

// Utilisateurs actuellement connectés :
let usersList

// Liste des notifications :
/*
[
    {
        name: xxx,
        number: x
    }
]
*/
let notifications = [];


// Paramétrer un nouveau message :
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


axios.get("https://randomuser.me/api/").then(data => {
    let response = JSON.parse(data.request.response);
    let firstname = response.results[0].name.first.charAt(0).toUpperCase() + response.results[0].name.first.slice(1);
    let lastname = response.results[0].name.last.charAt(0).toUpperCase() + response.results[0].name.last.slice(1);
    name = firstname + " " + lastname;
}).then(() => {
    document.querySelector("h1").innerText = "Bonjour " + name;
    socket.send(newJSONMessage('connexion', name));
});



socket.addEventListener('message', (message) => {
    let messageContent = JSON.parse(message.data);

    // Si le serveur nous envoit la liste des utilisateurs :
    if (messageContent.type === "users-list") {
        // On remplace la liste actuelle par la nouvelle liste
        let list = document.querySelector("ul");
        list.innerHTML = ""

        usersList = JSON.parse(messageContent.content);

        usersList.forEach(element => {

            if (element !== name) {
                notifications.forEach(obj => {
                    if (obj.name === element) {
                        element = element + " <span>(" + obj.number + ")</span>";
                    }
                });

                list.innerHTML = list.innerHTML + "<li>" + element + "</li>";
            }
        });
    }

    // Ping : on envoit un pong pour dire au serveur qu'on est encore connecté
    if (messageContent.type === "ping") {
        socket.send(newJSONMessage("pong", ""));
    }

    // Si on reçoit un DM de la part d'un autre utilisateur :
    if (messageContent.type === "notification") {
        let messageFrom = messageContent.content;

        let modified = false;
        notifications.forEach(n => {
            if (n.name === messageFrom) {
                n.number++;
                modified = true;
            }
        });

        if (!modified) {
            let obj = {
                name: messageFrom,
                number: 1
            };
            notifications.push(obj);
        }

    }

    // Si on reçoit une conversation complète :
});


// Quand l'utilisateur choisit quelqu'un à qui envoyer un message :
document.addEventListener('click', (e) => {

    if (usersList.includes(e.srcElement.innerHTML)) {
        sendMessageTo = e.srcElement.innerHTML;
        document.querySelector(".messages .input").innerHTML = '<label>Message à ' + sendMessageTo + ' : </label> <input type="text" />';

        // Quand l'utilisateur envoit le message :
        document.querySelector("input").addEventListener("keydown", (e) => {
            if (e.code !== "Enter") {
                return;
            }
            
            let messageContent = document.querySelector("input").value;
            socket.send(newJSONMessage("dm", messageContent, sendMessageTo));
        });

        // Demander la liste des derniers messages avec cet utilisateur
        socket.send(newJSONMessage("return-the-fucking-dms", name));
    }

});