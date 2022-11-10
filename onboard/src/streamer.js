const cp = require("child_process")
const kill  = require('tree-kill');

module.exports = {
    init: (socket, config) => {
        console.log("Initiating stream");
        initiate(socket, config)
    }
}

function initiate(socket, config) {
    var bitrate = config.video.rate
    var fps = config.video.fps
    var stream
    var command = `raspivid -w ${config.video.width} -h ${config.video.height} -t 0 -fps ${fps} -ih -b ${bitrate} -pf baseline -mm average -ISO 800 -awb off -awbg 1.0,2.5 -ex fixedfps -ev 0 -co 50 -br ${config.video.brightness} -o - | socat - udp-sendto:${config.host}:${config.port},shut-none`

    console.log(command);


    socket.on("car-conf", async conf => {
        if (conf.buttons.padUp == 1 || conf.buttons.padDown == 1) {
            if (stream != undefined) {
                kill(stream.pid)
                await sleep(1000)
            }
            if (conf.buttons.padUp == 1) {
                bitrate = Math.round(bitrate * 2)
            }
            if (conf.buttons.padDown == 1) {
                bitrate = Math.round(bitrate * 0.5)
            }

            if (bitrate < 300000) {
                fps = 10
            }
            else if (bitrate > 1500000) {
                fps = 40
            }
            else {
                fps = 30
            }
            command = `raspivid -w ${config.video.width} -h ${config.video.height} -t 0 -fps ${fps} -ih -b ${bitrate} -pf baseline -mm average -ISO 800 -awb off -awbg 1.0,2.5 -ex fixedfps -ev 0 -co 50 -br ${config.video.brightness} -o - | socat - udp-sendto:${config.host}:${config.port_udp},shut-none`
            stream = spawner(command)
        }
    })

    stream = spawner(command)
}

function spawner(command) {
    const process = cp.spawn(command, [], { shell: true })

    process.stdout.on('data', (data) => {
        console.log(`[Streamer]: ${data}`);
    });
      
    process.stderr.on('data', (data) => {
        console.error(`[Streamer Error]: ${data}`);
    });
    
    process.on('close', (code) => {
        console.log(`[Streamer] Process ended: ${code}`);
    });

    return process
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}