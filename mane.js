//little stub to make work in heroku


const http = require('http');
http.createServer(function (req, res) {
    console.log('got request')
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('it is running\n');
}).listen(process.env.PORT || 5000);

const reload = () => {
    http.get(`http://rednimer.herokuapp.com/`, (resp) => {})
}

setInterval(reload, 5*60*1000)

process.env.NTBA_FIX_319 = 1;
const tg = require('node-telegram-bot-api')
const token = '1173021450:AAF8K0w7XrJ-z-KYUlO442iu-qeZ9W6ITE0'

const help = `
/single text @ YYYY-MM-DD:hours:minutes:seconds ; set single remind
/text %txt% ;send you message to remind;
/interval xx:yy:zz ;set interval
/list; list reminders
/destroy i; delete it when you want
`


const bot = new tg(token, {polling: true});

let was = {}
let rems = {}
let last_int = {}
let last_txt = {}

const parseTime = (txt) => {
    let [hours, mins, secs] = txt.split(':').map(e => {return parseInt(e)})
    let res = secs + mins*60 + hours*3600
    console.log(`parsed ${txt} with ${res}`)
    return res
}

const createReminder = (id) => {
    console.log('createReminder called')
    let elem = (txt) => {
        bot.sendMessage(id, txt);
    }
    elem.txt = last_txt[id]
    elem.int = last_int[id]
    last_txt[id] = undefined
    last_int[id] = undefined

    elem.intId = setInterval(elem, elem.int*1000, elem.txt)

    if (!rems[id]) {
        rems[id] = []
    }
    rems[id].push(elem)
    bot.sendMessage(id, `created reminder with text ${elem.txt} and interval ${elem.int}`)
}

const destroyReminder = (id, i) => {
    if (!rems[id]) {
        bot.sendMessage(id, 'you have no reminders.')
        return
    }
    if (!rems[id][i]) {
        bot.sendMessage(id, 'no such reminder.')
        return
    }
    clearInterval(rems[id][i].intId)
    rems[id].splice(i,1)
    bot.sendMessage(id, `destroyed ${i}'s reminder`)
}

bot.onText(/\/interval (.+)/, (msg, match) => {
    const id = msg.chat.id;
    console.log(`interval called from ${id}`)
    was[id] = true
    const resp = match[1];
    last_int[id] = parseTime(resp)
    bot.sendMessage(id, `recieved interval ${last_int[id]} seconds.`);
    if (last_txt[id]) {
        createReminder(id);
    }
});



bot.onText(/\/text (.+)/, (msg, match) => {
    const id = msg.chat.id;
    console.log(`text called from ${id}`)
    was[id] = true
    last_txt[id] = match[1];
    bot.sendMessage(id, `recieved txt.`);
    if (last_int[id]) {
        createReminder(id);
    }
});

bot.onText(/\/list/, (msg) => {
    const id = msg.chat.id;
    console.log(`list called from ${id}`)
    was[id] = true
    let mes = ''
    if (!rems[id] || rems[id].length === 0) {
        bot.sendMessage(id, 'you have no reminders.')
        return
    }
    console.log(rems[id])
    let i = 0
    for (let e of rems[id]) {
        console.log('in loop')
        console.log(e)
        mes = mes.concat(`${i}: ${e.txt}, ${e.int}\n`)
        i += 1
    }
    console.log(mes)
    bot.sendMessage(id, mes)
});


bot.onText(/\/destroy (.+)/, (msg, match) => {
    const id = msg.chat.id;
    was[id] = true
    let i = parseInt(match[1]);
    console.log(`destroy called from ${id} with ${i}`)
    destroyReminder(id, i)
});

bot.onText(/\/start/, (msg) => {
    const id = msg.chat.id;
    console.log(`start called from ${id}`)
    was[id] = true
    bot.sendMessage(id, help)
})

bot.onText(/\/single (.+)/, (msg) => {
    const id = msg.chat.id;
    console.log(`start called from ${id}`)
    was[id] = true
    let [txt, date] = match[1].split('@');
    date = Date.parse(date)
    if (!date) {
        bot.sendMessage(id, 'unable to resolve date value.')
        return
    }
    let interval = date - Date.now()
    if (interval < 0) {
        bot.sendMessage(id, 'you probably should write date in the future except the case you can travel in the past.')
        return
    }

    let elem = (txt) => {
        bot.sendMessage(id, txt);
    }

    elem.int = interval
    elem.txt = txt

    setTimeout(elem, elem.int, elem.txt)
    bot.sendMessage(id, `alright, ya have ${interval} seconds.`)
})

bot.on('message', (msg) => {
    const id = msg.chat.id;
//    console.log(msg)
    if (was[id]) {
        was[id] = false
        return
    }
    bot.sendMessage(id, 'what?')
});
