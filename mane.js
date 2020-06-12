process.env.NTBA_FIX_319 = 1;
const tg = require('node-telegram-bot-api')
const token = '1173021450:AAF8K0w7XrJ-z-KYUlO442iu-qeZ9W6ITE0'

const help = `
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
    let res = secs + mins*60 + hours*360
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

    console.log(last_int[id])
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

bot.on('message', (msg) => {
    const id = msg.chat.id;
//    console.log(msg)
    if (was[id]) {
        was[id] = false
        return
    }
    bot.sendMessage(id, 'what?')
});
