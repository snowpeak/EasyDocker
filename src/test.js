dockerAPI = require('./dockerAPI.js')

if(false){
    dockerAPI.getContainers((x_data)=>{
        console.log(x_data)
    })
}

if(true){
    let dt = new Date();
    let time = dt.getFullYear() + "-" + (dt.getMonth()+1) + "-" + dt.getDate()
    time += " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds()
    
    //console.log(time);
    let cmd = ["/usr/bin/date", "-s", time]
    dockerAPI.execCmd("e26864639fc4f7555d599281d96888e1fedb5ca28f0808db0757b65a5d5f0a29", "root", cmd, (x_result, x_data)=>{
        console.log("cmd:" + x_result + "\n" + x_data)
    })
}

if(false){
    //let cmd = ["/usr/bin/date", "-s", "2020-06-05 00:45:10"]
    dockerAPI.startExec("719a5fd66e4793985f63675cbe3eff09588005b0b14ad9924f58853e0390b6df", (x_data)=>{
        console.log(x_data)
    })
}
//dockerAPI.execCmd()