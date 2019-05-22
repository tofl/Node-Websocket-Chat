'use strict';

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let currentUsers = [];

// Stocker la liste des messages :
/*
    [
        {
            between: [],
            messages: [
                {
                    from: xxx,
                    content: xxx
                }
            ]
        }
    ]
*/
let exchanges = [];

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

// On établit la connexion :
wss.on('connection', function connection(ws) {
    // Dès qu'on reçoit un message :
    ws.on('message', function incoming(content) {
        let message = JSON.parse(content);

        // Dès qu'il y a une nouvelle connexion, on informe tous les utilisateurs du nouvel utilisateur :
        if (message.type === "connexion") {
            let currentDate = new Date();
            let newClient = {
                name: message.content,
                client: ws,
                lastPong: currentDate.getTime()
            };
            currentUsers.push(newClient);
            //console.log(wss.clients);

            sendUsersList();
        }

        // Pour savoir quels clients ne sont plus connectés
        if (message.type === "pong") {
            currentUsers.forEach((c) => {
                if (c.client == ws) {
                    let currentDate = new Date();
                    c.lastPong = currentDate.getTime();
                }
            });
        }

        // Pour les DMs :
        if (message.type === "dm") {
            // Récupérer le nom de la personne qui a envoyé le message :
            let to = message.to;
            console.log(message);
            let from;
            currentUsers.forEach(c => {
                if (c.client === ws) {
                    from = c.name;
                }
            });

            // Ajouter le message à l'historique :
            let m = {
                from: from,
                content: message.content
            };
            let modified = false;
            exchanges.forEach(conv => {
                if (conv.between.includes(to) && conv.between.includes(from)) {
                    conv.messages.push(m);
                    modified = true;
                }
            });

            // Si le message n'a pas été sauvegardé parce qu'il n'y a pas d'historique disponible :
            if (!modified) {
                // Créer une nouvelle correspondance :
                let correspondance = {
                    between: [from, to],
                    messages: [
                        {
                            from: from,
                            content: message.content
                        }
                    ]
                };

                exchanges.push(correspondance);
            }

            // Envoyer la notification :
            currentUsers.forEach(c => {
                if (c.name === message.to) {
                    c.client.send(newJSONMessage("notification", from));
                }
            });
        }

        if (message.type === "return-the-fucking-dms") {
            let from = message.content;
            let target = message.to;

            // Récupérer le client :
            let clientToSendMessageTo;
            currentUsers.forEach(c => {
                if (c.name === from) {
                    clientToSendMessageTo = c.client;
                }
            });

            let sent = false;
            console.log("From : " + from + "; Target : " + target)

            exchanges.forEach(obj => {
                if (obj.between.includes(from) && obj.between.includes(target)) {
                    // On envoit la liste des messages :
                    clientToSendMessageTo.send(newJSONMessage("messages-list", JSON.stringify(obj.messages)));
                    console.log("Historique des messages retrouvé");
                    sent = true;
                }
            });

            if (!sent) {
                clientToSendMessageTo.send(newJSONMessage("messages-list", "false"));
            }
        }
    });
});

// Fonction qui envoit un ping à chaque client
function sendPing() {
    currentUsers.forEach(c => {
        c.client.send(newJSONMessage("ping", ""));
    });
}

// Supprimer les connexions anciennes
function deleteOldConnections() {
    let currentDate = new Date();
    let i = 0;
    currentUsers.forEach(c => {
        if (currentDate.getTime() - c.lastPong > 10000) {
            currentUsers.splice(i, 1);
        }
        i++;
    });
}

// Envoyer la liste des utilisateurs connectés
function sendUsersList() {
    let userNames = [];
    
    currentUsers.forEach(obj => {
        userNames.push(obj.name);
    });

    currentUsers.forEach(c => {
        c.client.send(newJSONMessage("users-list", JSON.stringify(userNames)));
    });
}

// Créer un timer. Toutes les 5 secondes, on envoit le ping avec sendPing()
const interval = setInterval(() => {
    // Envoyer le ping
    sendPing();

    // Supprimer les connexions anciennes
    deleteOldConnections();

    // Renvoyer la nouvelle liste à chaque client
    sendUsersList();
}, 5000);