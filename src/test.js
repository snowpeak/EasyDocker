dockerAPI = require('./dockerAPI.js')

if(false){
    dockerAPI.getContainers((x_data)=>{
        console.log(x_data)
    })
}

if(false){
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

if(false){
    sql = require('./libsrc/sqlite.js');
    sql.initDB();
    //sql.insert('idです', 'imageです', 'ポートです', 'メモです')
    sql.getContainers((x_containers)=>{
        console.log("DBの戻り値");
        x_containers.forEach(function(x_container){
            console.log(x_container);
        })
    });
}

if(true){
    sql = require('./libsrc/sqlite.js');
    sql.initDB();
    sql.getContainer("0b9bc6b5ef7eaf140f62bff98694197917091cdde20f742a3142cb958e325d82", (x_container)=>{
        console.log(x_container);
    });
}
