/**
 *  SQLLiteを操作するライブラリ 
 */
var sqlite3 = require('sqlite3').verbose();
var g_db = null;

/**
 * データベースとのコネクションを返します(今回は固定で easydocker データベースとします )
 * 本メソッドは外部公開せず、コネクションは本ライブラリ内で閉じます。
 * @return DBインスタンスを渡します。( nullは接続失敗 )
 */
getConnection = function(){
    if(g_db != null){
        return g_db;
    }
    g_db = new sqlite3.Database("./easydocker.db");
    g_db.serialize();
    g_db.on('error', function(err){
        console.log(err);
        process.exit(1);
    });
    return g_db;
}

/**
 * データベースとのコネクションを返します(今回は固定で easydocker データベースとします )
 * @return DBインスタンスを渡します。( nullは接続失敗 )
 */
exports.disconnect = disconnect = function(){
    if(g_db != null){
        g_db.close();
        g_db = null;
        console.log("db closed")
    }
}

/**
 * 初期化
 * ・DBファイル( easydocker.db )を作成し
 * ・テーブル( container ) を作成します    
 */
exports.initDB = initDB = function(){
    db = getConnection();
    new Promise(function(resolve, reject){
        var stmt = db.prepare("SELECT COUNT(*) AS num FROM sqlite_master WHERE TYPE='table' AND name=?")
        stmt.get('container', (x_err, x_result)=>{
            stmt.finalize();
            if( x_err != null ){
                console.log(x_err);
                reject();
            }
            if( x_result.num == 0){
                resolve(x_result.num); // create tableへ
            } else {
                reject("already exists table");//終了
            }
        });
    }).then( function(result) {
        // create table container
        // d_createdateは 1900年から経過ミリ秒( long値 ) 
        db.run("CREATE TABLE container( v_id text, v_image text, v_port text, v_memo text, d_createdate integer )" )
        throw new Error("table created");//終了

    }).catch( (x_arg)=>{
        // 終了処理
        if( x_arg != null ){
            if( x_arg instanceof Error){
                console.log(x_arg.message);
            }else{
                console.log(x_arg);
            }
        }
    })
}

/**
 * 実行部本体
 * @returns なし(返せない)
 */
exports.insert = function insert(x_id, x_image, x_port, x_memo){
    let db = getConnection();

    let dt = new Date();
    let time = dt.getFullYear() + "-" + (dt.getMonth()+1) + "-" + dt.getDate()
    time += " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds()
    console.log(time);
    value = {
            '$id'         : x_id,
            '$image'      : x_image,
            '$port'       : x_port,
            '$memo'       : x_memo,
            '$createdate' : time
    }
    db.run('INSERT INTO container (v_id, v_image, v_port, v_memo, d_createdate) VALUES($id, $image, $port, $memo, $createdate)',
           value, 
           function (err){
                if( err != null){
                    console.log(err);
                }
            })
}

exports.updateMemo = function updateMemo(x_id, x_memo){
    let db = getConnection();

    value = {
            '$id'         : x_id,
            '$memo'       : x_memo,
    }
    db.run('UPDATE container SET v_memo=$memo WHERE v_id=$id',
           value, 
           function (err){
                if( err != null){
                    console.log(err);
                }
            })
}

exports.getContainers = function getContainers(x_callback){
    var retArray = [];
    let db = getConnection();
    console.log("getContainers()")
    db.all('SELECT * from container', (x_err, x_containers)=>{
        x_containers.forEach((x_container)=>{
            var container = {
                    "id": x_container.v_id,
                    "image": x_container.v_image,
                    "port" : x_container.v_port,
                    "memo" : x_container.v_memo,
                    "createdate" : x_container.d_createdate,
            }
            retArray.push(container)
        })
        x_callback(retArray);
    })
}
exports.getContainer = function getContainer(x_id, x_callback){
    let db = getConnection();
    logMsg = "getContainer(" + x_id + ")";
    
    var stmt = db.prepare("SELECT * FROM container WHERE v_id=?")
    stmt.get(x_id, (x_err, x_container)=>{
        stmt.finalize();
        if(x_err != null){
            console.log("SQL error");
            console.log(x_err);
            x_callback(null);
        }
        if(x_container == null){
            x_callback(null);
        }else{
            var container = {
                "id": x_container.v_id,
                "image": x_container.v_image,
                "port" : x_container.v_port,
                "memo" : x_container.v_memo,
                "createdate" : x_container.d_createdate,
            }
            console.log(logMsg)
            console.log(x_container);
            x_callback(container );
        }
})
}
//-------------------------------------------
// test 実行
//-------------------------------------------
