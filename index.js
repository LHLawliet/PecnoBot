const Discord = require('discord.js');
const cheerio = require('cheerio');
const request = require('request');
const mysql = require('mysql');
const config = require('./config.json');

const client = new Discord.Client();
let oldAlmanax = null;

client.login(config.config.token);

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "PecnoBot"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to mysql");
});

client.on('ready', () => {
    console.log("Connected to discord");
    setTimeout(setAlmanax, 1500);
});

client.on('guildCreate', guild => {
    console.log("Connected to a new server");
    GuildId = guild.id
    let sql = "SELECT * FROM serverconfig WHERE ServerId=?"
    con.query(sql, [GuildId.toString()], function(err, result) {
        if (err) throw err;
        if (!result[0]) {
            sql = "INSERT INTO serverconfig (ServerId) VALUES (?)";
            con.query(sql, [GuildId.toString()], function(err, result) {
                if (err) throw err;
            });
        }
    });
});

client.on('message', msg => {
    if (msg.content === '!ping') {
        msg.reply('Pong!');
    }
    if (msg.content === '!almanax') {
        request({
            method: 'GET',
            url: 'http://www.krosmoz.com/fr/almanax'
        }, (err, res, body) => {

            if (err) return console.error(err);

            let $ = cheerio.load(body);

            let var1 = $('.more');
            var1 = var1['0'].children[0].data
            let var2 = $('.more');
            var2 = var2['0'].children[0].next.children[0].data;
            let bonus = ltrim(var1 + var2);

            let nomquete = $('.more-infos');
            nomquete = ltrim(nomquete['0'].children[0].next.children[0].data);
            let quete = $('.fleft');
            quete = ltrim(quete['0'].children[0].data);
            let urlobject = $('.more-infos-content');
            urlobject = urlobject['0'].children[0].next.attribs.src

            let embeds = {
                "color": 65313,
                "thumbnail": {
                    "url": urlobject
                },
                "footer": {
                    "text": "http://www.krosmoz.com/"
                },
                "fields": [{
                        "name": nomquete,
                        "value": quete,
                    },

                    {
                        "name": "Bonus du jour",
                        "value": bonus,
                    },
                ]
            }
            msg.channel.send({ embed: embeds });
        });
    }


    if (msg.content === '!SetupAlmanax') {
        let channelId = msg.channel.id.toString()
        let guildId = msg.guild.id.toString()
        let sql = "UPDATE serverconfig SET almanax = ? WHERE ServerId = ?";
        con.query(sql, [channelId.toString(), guildId], function(err, result) {
            if (err) throw err;
            msg.channel.send("Channel Almanax configuré")
        })
    }

    if (msg.content === '!test') {
        console.log("test")
        let sql = "SELECT * FROM serverconfig"
        con.query(sql, function(err, result) {
            if (err) throw err;
            for (var i = 0; i < Object.keys(result).length; i++) {
                if (result[i].almanax != 'false') {
                    let almanax = result[i].almanax
                    console.log(almanax)
                    client.channels.get(almanax).send("almanax activé")
                }
            }
        });
    }

    if (msg.content === '!DisableAlmanax') {
        let guildId = msg.guild.id
        let sql = "UPDATE serverconfig SET almanax = 'false' WHERE ServerId = ?";
        con.query(sql, [guildId], function(err, result) {
            if (err) throw err;
            msg.channel.send("Notification Almanax désactivé")
        })
    }

    if (msg.content.startsWith('!SetupGuilde')) {
        let args = msg.content.slice(1).trim().split(/ +/g);

        let guild = args[1];
        let server = args[2];

        if ((guild) && (server)) {
            let guildId = msg.guild.id;
            //let sql = "UPDATE serverconfig SET guild = '" + guild + "', server = '" + server + "' WHERE ServerId = " + guildId;
            let sql = "UPDATE serverconfig SET guild = ?, server = ? WHERE ServerId = ?";
            con.query(sql, [guild, server, guildId], function(err, result) {
                if (err) throw err;
                msg.channel.send("Guilde configuré")
            })
        } else {
            msg.channel.send("Merci d'écrire le message sous cette forme : !SetupGuilde NomDeLaGuilde ServeurDofus")
        }

    }

    if ((msg.content === '!guilde') || (msg.content === '!name') || (msg.content === '!nom') || (msg.content === '!server') || (msg.content === '!serv')) {
        let GuildId = msg.guild.id
        let sql = "SELECT * FROM serverconfig WHERE ServerId=?"
        con.query(sql, [GuildId.toString()], function(err, result) {
            if (err) throw err;
            msg.reply("guilde : " + result[0].guild + ", serveur : " + result[0].server);
        });
    }
    if ((msg.content === '!credit') || (msg.content === '!crédit')) {
        msg.reply("développé par : " + config.information.creator + " version : " + config.information.version);
    }
    if (msg.content.startsWith("!chemin")) {
        let args = msg.content.slice(1).trim().split(/ +/g);

        let args1 = parseInt(args[1], 10)
        let args2 = parseInt(args[2], 10)
        let args3 = parseInt(args[3], 10)
        let args4 = parseInt(args[4], 10)

        if ((!args1) || (!args2) || (!args3) || (!args4)) {
            msg.reply("Merci de mettre les arguments sous la forme suivante, !chemin posa[x] posa[y] posb[x] posb[y]")
        } else {
            if (args[5] == "false") {
                msg.reply("Sans zaap la distance est de " + Distance({
                    ["x"]: args1,
                    ["y"]: args2
                }, {
                    ["x"]: args3,
                    ["y"]: args4
                }))
            } else {
                let transport = FindClosest({
                    ["x"]: args1,
                    ["y"]: args2
                }, {
                    ["x"]: args3,
                    ["y"]: args4
                })
                if (transport.zaap1) {
                    msg.reply("Le chemin le plus court passe par le zaap " + transport.zaap1.name + " et le zaap " + transport.zaap2.name + ", zaap1 [" + transport.zaap1.pos["x"] + "," + transport.zaap1.pos["y"] + "] et zaap2 [" + transport.zaap2.pos["x"] + "," + transport.zaap2.pos["y"] + "], la distance de marche est de " + transport.distance)
                } else {
                    msg.reply("Inutile de passer par un zaap la distance est de " + transport.distance)
                }
            }
        }
    }
});






function ltrim(str) {
    if (str == null) return str;
    return str.replace(/^\s+/g, '');
};

function FindClosest(posa, posb) {
    let min = Distance(posa, posb);
    let zaap1 = null;
    let zaap2 = null;
    for (var i = 0; i < Object.keys(config.zaap).length; i++) {
        let distanceZaap1 = Distance(posa, config.zaap[i].pos);
        let distanceZaap2 = 10000;
        for (var n = 0; n < Object.keys(config.zaap).length; n++) {
            let tmp = Distance(config.zaap[n].pos, posb)
            if ((distanceZaap2) && (tmp < distanceZaap2)) {
                distanceZaap2 = tmp

                if ((distanceZaap1 + distanceZaap2) < min) {
                    min = distanceZaap1 + distanceZaap2
                    zaap1 = config.zaap[i]
                    zaap2 = config.zaap[n]
                }

            }
        }

    }

    return { "distance": min, "zaap1": zaap1, "zaap2": zaap2 }
    //console.log(config.zaap[0].pos["x"])
}

function Distance(posa, posb) {
    let distance = Math.abs(Math.abs(posa["x"] - posb["x"]) + Math.abs(posa["y"] - posb["y"]))
    return distance
}




function setAlmanax() {
    request({
        method: 'GET',
        url: 'http://www.krosmoz.com/fr/almanax'
    }, (err, res, body) => {
        if (err) return console.error(err);

        let $ = cheerio.load(body);

        let var1 = $('.more');
        var1 = var1['0'].children[0].data
        let var2 = $('.more');
        var2 = var2['0'].children[0].next.children[0].data;
        let bonus = ltrim(var1 + var2);

        let nomquete = $('.more-infos');
        nomquete = ltrim(nomquete['0'].children[0].next.children[0].data);
        let quete = $('.fleft');
        quete = ltrim(quete['0'].children[0].data);
        let urlobject = $('.more-infos-content');
        urlobject = urlobject['0'].children[0].next.attribs.src

        if (oldAlmanax != nomquete) {
            client.user.setActivity("Almanax : " + quete + "(!almanax)", { type: 0, url: "http://www.krosmoz.com/fr/almanax" })
                //client.user.setAvatar(urlobject)
            let sql = "SELECT * FROM serverconfig"
            con.query(sql, function(err, result) {
                if (err) throw err;
                for (var i = 0; i < Object.keys(result).length; i++) {
                    if (result[i].almanax != 'false') {
                        let almanax = result[i].almanax
                        console.log(almanax)
                        let embeds = {
                            "color": 65313,
                            "thumbnail": {
                                "url": urlobject
                            },
                            "footer": {
                                "text": "http://www.krosmoz.com/"
                            },
                            "fields": [{
                                    "name": nomquete,
                                    "value": quete,
                                },

                                {
                                    "name": "Bonus du jour",
                                    "value": bonus,
                                },
                            ]
                        }
                        client.channels.get(almanax).send({ embed: embeds })
                    }
                }
            });
        }
        omdAlmanax = nomquete;
    });
    setTimeout(setAlmanax, 1500000);
}