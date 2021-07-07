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
getConnection = function () {
    if (g_db != null) {
        return g_db;
    }
    g_db = new sqlite3.Database("./easydocker.db");
    g_db.serialize();
    g_db.on('error', function (err) {
        console.log(err);
        process.exit(1);
    });
    return g_db;
}

/**
 * データベースとのコネクションを返します(今回は固定で easydocker データベースとします )
 * @return DBインスタンスを渡します。( nullは接続失敗 )
 */
exports.disconnect = disconnect = function () {
    if (g_db != null) {
        g_db.close();
        g_db = null;
        console.log("db closed")
    }
}

/**
 * 初期化
 * ・DBファイル( easydocker.db )を作成し
 * ・テーブル( container, configuration ) を作成します    
 */
exports.initDB = initDB = function () {
    db = getConnection();
    //container テーブルの初期化処理
    new Promise(function (resolve, reject) {
        var stmt = db.prepare("SELECT COUNT(*) AS num FROM sqlite_master WHERE TYPE='table' AND name=?")
        stmt.get('container', (x_err, x_result) => {
            stmt.finalize();
            if (x_err != null) {
                console.log(x_err);
                reject();
            }
            if (x_result.num == 0) {
                resolve(x_result.num); // create tableへ
            } else {
                reject("already exists table");//終了
            }
        });
    }).then(function (result) {
        // create table container
        // d_createdateは 1900年から経過ミリ秒( long値 ) 
        db.run("CREATE TABLE container( v_id text, v_image text, v_port text, v_memo text, d_createdate integer )")
        throw new Error("table created");//終了
    }).catch((x_arg) => {
        // 終了処理
        if (x_arg != null) {
            if (x_arg instanceof Error) {
                console.log(x_arg.message);
            } else {
                console.log(x_arg);
            }
        }
    })
    //configuration テーブルの初期化処理
    var thisInstance = this;
    new Promise(function (resolve, reject) {
        var stmt = getConnection().prepare("SELECT COUNT(*) AS num FROM sqlite_master WHERE TYPE='table' AND name=?")
        stmt.get('configuration', (x_err, x_result) => {
            stmt.finalize();
            if (x_err != null) {
                console.log(x_err);
                reject();
            }
            if (x_result.num == 0) {
                //テーブル作成処理へ
                resolve(x_result.num);
            } else {
                //作成処理はスキップ
                reject("The table \"configuration\" already exists.");
            }
        });
    }).then(function (result) {
        db.run("CREATE TABLE configuration( v_parameter text, v_value text)");
        //初期データの登録
        thisInstance.insertParam('lang', 'ja', function () { });
        throw new Error("Configuration table was created.");
    }).catch((x_arg) => {
        // 終了処理
        if (x_arg != null) {
            if (x_arg instanceof Error) {
                console.log(x_arg.message);
            } else {
                console.log(x_arg);
            }
        }
    })
}

/**
 * 実行部本体
 * @returns なし(返せない)
 */
exports.insert = function insert(x_id, x_image, x_port, x_memo, x_callback) {
    let db = getConnection();

    let dt = new Date();
    let time = dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate()
    time += " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds()
    value = {
        '$id': x_id,
        '$image': x_image,
        '$port': x_port,
        '$memo': x_memo,
        '$createdate': time
    }
    db.run('INSERT INTO container (v_id, v_image, v_port, v_memo, d_createdate) VALUES($id, $image, $port, $memo, $createdate)',
        value,
        function (err) {
            x_callback(err);
        })
}

exports.updateMemo = function updateMemo(x_id, x_memo, x_callback) {
    let db = getConnection();

    value = {
        '$id': x_id,
        '$memo': x_memo,
    }
    db.run('UPDATE container SET v_memo=$memo WHERE v_id=$id',
        value,
        function (err) {
            x_callback(err);
        })
}

exports.getContainers = function getContainers(x_callback) {
    var retArray = [];
    let db = getConnection();
    console.log("getContainers()")
    db.all('SELECT * from container', (x_err, x_containers) => {
        x_containers.forEach((x_container) => {
            var container = {
                "id": x_container.v_id,
                "image": x_container.v_image,
                "port": x_container.v_port,
                "memo": x_container.v_memo,
                "createdate": x_container.d_createdate,
            }
            retArray.push(container)
        })
        x_callback(retArray);
    })
}

exports.getContainer = function getContainer(x_id, x_callback) {
    let db = getConnection();
    logMsg = "getContainer(" + x_id + ")";

    var stmt = db.prepare("SELECT * FROM container WHERE v_id=?")
    stmt.get(x_id, (x_err, x_container) => {
        stmt.finalize();
        if (x_err != null) {
            console.log("SQL error");
            console.log(x_err);
            x_callback(null);
        }
        if (x_container == null) {
            x_callback(null);
        } else {
            var container = {
                "id": x_container.v_id,
                "image": x_container.v_image,
                "port": x_container.v_port,
                "memo": x_container.v_memo,
                "createdate": x_container.d_createdate,
            }
            console.log(logMsg)
            console.log(x_container);
            x_callback(container);
        }
    })
}

/**
 * 設定パラメータの値を取得します。
 * @param {*} x_callback コールバック関数
 * @param {*} x_parameter パラメータ名
 */
exports.getParam = function getParam(x_callback, x_parameter) {
    var stmt = getConnection().prepare("SELECT * FROM configuration WHERE v_parameter=?")
    stmt.get(x_parameter, (x_err, x_result) => {
        stmt.finalize();
        if (x_err != null) {
            console.log("SQL error.");
            console.log(x_err);
            x_callback(null);
        }
        var param = null;
        if (x_result != null) {
            param = {
                "parameter": x_result.v_parameter,
                "value": x_result.v_value,
            }
        }
        x_callback(param);
    })
}

/**
 * 設定パラメータを登録します。
 * @param {*} x_parameter 登録するパラメータ名
 * @param {*} x_value パラメータ値
 * @param {*} x_callback コールバック関数
 */
exports.insertParam = function insertParam(x_parameter, x_value, x_callback) {
    value = {
        '$parameter': x_parameter,
        '$value': x_value,
    }
    this.execSQL('INSERT INTO configuration (v_parameter, v_value) VALUES($parameter, $value)', value, function (err) { x_callback(err) });
}

/**
 * 設定パラメータを更新します。
 * @param {*} x_parameter 更新するパラメータ名
 * @param {*} x_value パラメータ値
 * @param {*} x_callback コールバック関数
 */
exports.updateParam = function updateParam(x_parameter, x_value, x_callback) {
    value = {
        '$value': x_value,
        '$parameter': x_parameter,
    }
    this.execSQL('UPDATE configuration SET v_value=$value WHERE v_parameter=$parameter', value, function (err) { x_callback(err) });
}

/**
 * 引数で指定した SQL を実行します。
 * @param {*} sql SQL 文
 * @param {*} x_parameters ストアドプロシージャのパラメータ配列(key:$パラメータ名、value:パラメータの値) 
 * @param {*} x_callback コールバック関数
 */
exports.execSQL = function execSQL(sql, x_parameters, x_callback) {
    getConnection().run(sql, x_parameters, x_callback);
}


//-------------------------------------------
// test 実行
//-------------------------------------------
