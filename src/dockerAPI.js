/**
 * コンテナの一覧を取得する
 * @param x_callback(containers)
 * containers=[{id, state, image, ports=[port]}]
 */
exports.getContainers = getContainers = function (x_callback) {
  var options = getOptions("/containers/json?all=true", "GET", "")
  var http = require('http');
  let req = http.request(options, (res) => {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');

    var retValues = []

    var jsonStr = ""
    res.on('data', (chunk) => {
      jsonStr += chunk
    })

    res.on('end', () => {
      var containers = null
      try {
        containers = JSON.parse(jsonStr)
      } catch (e) {
        console.log("------------ getContainers() error: " + jsonStr)
        throw e
      }

      //console.log(containers)

      containers.forEach(function (container) {
        //console.log(container)
        var name = container['Names'][0];
        var id = container['Id'];
        var image = container['Image']
        var state = container['State']
        /*
        console.log("ID=" + container['Id'])
        console.log("Image=" + container['Image'])
        console.log("State=" + container['State'])
        */
        var ports = []
        container['Ports'].forEach(function (x_port) {
          if (x_port.PublicPort != undefined) {
            port = "localhost:" + x_port['PublicPort'] + " --> " + x_port['PrivatePort'];
            ports.push(port)
          }
        })
        var value = { 'name': name, 'id': id, 'image': image, 'state': state, 'ports': ports }
        retValues.push(value);
      })

      x_callback(retValues)
    });
  });
  req.on('error', (e) => {
    console.log('problem with request: ' + e.message);
  });
  req.end();
}

/**
 * @param x_image イメージID(または イメージのrepo:tag)
 * @param x_start true(コンテナを開始する) false(作成のみ)
 * @param x_callback(x_id, x_err) 生成したイメージのID, x_err失敗時エラー内容
 */
exports.createContainer = createContainer = function (x_postData, x_start, x_callback) {
  /*
let postData = {
  "Hostname": "rakwf21",
  "Cmd": ["/sbin/init"],
  "Image" : x_image,
  "ExposedPorts":{
    "8080/tcp":{},
    "22/tcp":{},
  },
  "HostConfig":{
    "Privileged":true,
    "PortBindings":{
      "8080/tcp":[ {"HostPort":"8080"} ],
      "22/tcp":[ {"HostPort":"22"} ],
    }
  }
};
*/
  let postDataStr = JSON.stringify(x_postData);
  //  console.log( postDataStr );

  var containerID = null;
  options = getOptions("/containers/create", "POST", 'application/json', postDataStr)
  http = require('http');
  let req = http.request(options, (res) => {
    res.setEncoding('utf8');

    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })
    res.on('end', () => {
      //console.log('create container : '  + jsonStr);
      var retJson = JSON.parse(jsonStr)
      containerID = retJson['Id'];

      console.log("createContainer statusCode:" + res.statusCode)
      if (res.statusCode != 201) {
        // 失敗
        x_callback(null, jsonStr);
      }

      if (x_start) {
        console.log("start container");
        this.startContainer(containerID, function (x_err) {
          if (x_err == null) {
            x_callback(containerID)
          } else {
            x_callback(containerID, x_err)
          }
        })
      } else {
        x_callback(containerID)
      }
    });

    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
    })
  })
  req.write(postDataStr);
  req.end();
}

/**
 * createしたコンテナを開始する
 * @param x_id コンテナID
 * @param x_callback( x_status ) //204は成功, -1は通信失敗
 */
exports.startContainer = startContainer = function (x_id, x_callback) {
  path = "/containers/" + x_id + "/start"
  //console.log(path)
  options = getOptions(path, "POST")
  http = require('http');
  let req = http.request(options, (res) => {

    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })
    res.on('end', () => {
      if (res.statusCode == 204) {
        // 成功, 起動時に時刻合わせをしておく
        let dt = new Date();
        let time = dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate()
        time += " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds()
        let cmd = ["/usr/bin/date", "-s", time]
        execCmd(x_id, "root", cmd, (x_result, x_data) => {
          x_callback(null)
        })
      } else {
        x_callback(jsonStr)
      }
    })
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
      x_callback(-1);
    })
  })
  req.end();
}

/**
 * コンテナを停止する
 * @param x_id 停止対象のコンテナID
 * @param x_callback( x_err ) 成功時はx_err=null
 */
exports.stopContainer = stopContainer = function (x_id, x_callback) {
  path = "/containers/" + x_id + "/stop"
  console.log(path)
  options = getOptions(path, "POST")
  http = require('http');
  let req = http.request(options, (res) => {
    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })
    res.on('end', () => {
      if (res.statusCode == 204) {
        // 成功
        x_callback(null)
      } else {
        x_callback(jsonStr)
      }
    })
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
      x_callback(-1);
    })
  })
  req.end();
}

/**
 * コンテナを削除する
 * @param x_id コンテナID
 * @param x_callback(x_errMsg) 成功時は x_errMsg = null
 */
exports.deleteContainer = function (x_id, x_callback) {
  console.log("delete: " + x_id)
  var options = getOptions("/containers/" + x_id + "?force=true", "DELETE", "")
  var http = require('http');
  let req = http.request(options, (res) => {
    res.setEncoding('utf8');

    var jsonStr = "";
    // deleteImages完了時にreturnする
    res.on('data', (chunk) => {
      jsonStr += chunk;
    })

    res.on('end', () => {
      var json = null
      try {
        if (jsonStr.length > 0) {
          json = JSON.parse(jsonStr)
        }
      } catch (e) {
        console.log("------------ deleteContainer() error: " + jsonStr);
        throw e
      }
      console.log('STATUS: ' + res.statusCode); //204 success
      if (res.statusCode != 204) {
        x_callback(jsonStr);
      } else {
        x_callback(null);
      }
    });
  });
  req.on('error', (e) => {
    console.log('problem with request: ' + e.message);
  });
  req.end() // 送信
}

/**
 * createしたコンテナを開始する
 * @param x_id コンテナID
 * @param x_cmd 配列[ cmd, arg1, arg2, ...]
 * @param x_callback( x_status, x_output ) //x_status:true成功, falase:失敗 // x_output 出力
 */
exports.execCmd = execCmd = function (x_id, x_user, x_cmd, x_callback) {
  let cmdJson = {
    "AttachStdin": false,
    "AttachStdout": true,
    "AttachStderr": true,
    "DetachKeys": "ctrl-c",
    "Tty": false,
    "Cmd": x_cmd,
    "User": x_user
  }
  let postDataStr = JSON.stringify(cmdJson);
  path = "/containers/" + x_id + "/exec"
  options = getOptions(path, "POST", 'application/json', postDataStr)

  http = require('http');
  let req = http.request(options, (res) => {

    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })
    res.on('end', () => {
      //console.log(jsonStr);
      if (res.statusCode == 201) {
        // 成功
        let execInfo = JSON.parse(jsonStr)
        startExec(execInfo.Id, (x_success, x_output) => {
          x_callback(x_success, x_output)
        })
      } else {
        x_callback(false, x_output)
      }
    })
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
      x_callback(-1);
    })
  })
  req.write(postDataStr);
  req.end();
}

/**
 * execCmd で準備した環境を実際に実行する(戻り値は標準出力)
 * @param x_id コンテナID
 * @param x_cmd 配列[ cmd, arg1, arg2, ...]
 * @param x_callback( x_status, x_output ) //x_status:true成功, falase:失敗 // x_output 出力
 */
startExec = function (x_id, x_callback) {
  let cmdJson = {
    "Detach": false,
    "Tty": false,
  }
  let postDataStr = JSON.stringify(cmdJson);
  path = "/exec/" + x_id + "/start"
  options = getOptions(path, "POST", 'application/json', postDataStr)

  http = require('http');
  let req = http.request(options, (res) => {

    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })
    res.on('end', () => {
      //console.log(jsonStr);
      if (res.statusCode == 200) {
        // 成功
        x_callback(true, jsonStr)
      } else {
        x_callback(false, jsonStr)
      }
    })
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
      x_callback(-1);
    })
  })
  req.write(postDataStr);
  req.end();
}

/**
 * 不要コンテナを削除する
 * @param x_callback( x_err ) 成功時はx_err=null
 */
exports.prune = prune = function (x_callback) {
  path = "/containers/prune"
  options = getOptions(path, "POST")
  http = require('http');
  let req = http.request(options, (res) => {
    //console.log('STATUS: ' + res.statusCode); //204 success

    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })

    res.on('end', () => {
      if (res.statusCode == 204) {
        x_callback(null)
      } else {
        x_callback(jsonStr)
      }
    });
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
      x_callback(-1);
    })
  })
  req.end();
}

/**
 * コンテナをエクスポートする
 * @param x_id コンテナID
 * @param x_filepath 書き出し先( tar.gzで書き出します )
 * @param x_callback(x_errMsg) 成功時は x_errMsg = null
 */
exports.exportContainer = exportContainer = function (x_id, x_filepath, x_callback) {
  // 出力先
  fs = require('fs')
  outFile = fs.createWriteStream(x_filepath);

  url = "http://localhost:2375/containers/" + x_id + "/export"

  // ダウンロード開始
  http = require('http');
  zlib = require('zlib');
  var gz = zlib.createGzip();

  var req = http.get(url, function (res) {
    res.pipe(gz).pipe(outFile);
    gz.on('end', function () {
      gz.close();
      outFile.close()
    });
    res.on('end', function () {
      //console.log('STATUS: ' + res.statusCode); // 200 success
      if (res.statusCode != 200) {
        x_callback(res.statusCode);
      } else {
        x_callback(null);
      }
    });
  });
  req.on('error', function (err) {
    console.log('Error: ', err);
    x_callback(-1)
  });
}

//--------------------------------------
// images
//--------------------------------------
/**
 * @param x_callback(data) 処理完了時の戻り値伝達用関数
 * data = [{id, size, tag}]
 * 
 */
exports.getImages = getImages = function (x_callback) {
  var retImages = []

  var options = getOptions("/images/json", "GET", "")
  var http = require('http');
  let req = http.request(options, (res) => {
    res.setEncoding('utf8');

    var jsonStr = "";
    // getImages完了時にreturnする
    res.on('data', (chunk) => {
      jsonStr += chunk;
    })

    res.on('end', () => {
      var images = null
      try {
        images = JSON.parse(jsonStr)
      } catch (e) {
        console.log("------------ getImages() error: " + jsonStr);
        throw e
      }
      images.forEach(function (image) {
        //console.log(container)
        var id = image['Id']
        var size = image['Size']
        //console.log("ID=" + id + ", Size=" + size)

        var tag = ""
        image['RepoTags'].forEach(function (repotag) {
          if (tag != "") {
            tag += ","
          }
          tag += repotag
        })
        retImages.push({ 'id': id, 'size': size, 'tag': tag });
      })
      x_callback(retImages);
    });
  });
  req.on('error', (e) => {
    console.log('problem with request: ' + e.message);
  });
  req.end() // 送信

  //return new Promise(function(resolve, reject){})
}

/**
 * イメージをロードする
 * @param x_imgFile イメージファイルのパス
 * @param x_repo
 * @param x_tag
 * @param x_callback(x_errMsg)  エラー発生時のみエラーメッセージを返す
 */
exports.importImage = importImage = function (x_imgFile, x_repo, x_tag, x_callback) {
  var containerID = null;
  url = "/images/create?fromSrc=-"
  if (x_repo != null & x_repo != "") {
    url += ("&repo=" + x_repo)
  }
  if (x_tag != null & x_tag != "") {
    url += ("&tag=" + x_tag)
  }
  var options = getOptions(url, "POST")

  http = require('http');
  let req = http.request(options, (res) => {
    res.setEncoding('utf8');

    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })
    res.on('end', () => {
      var retJson = JSON.parse(jsonStr)
      //console.log(retJson)
      if (res.statusCode == 200) {
        // 成功
        x_callback(null)
      } else {
        // 成功
        x_callback(jsonStr)
      }
    });

    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
    })
  })

  // アップロードするImaege
  try {
    fs = require('fs')
    fs.statSync(x_imgFile); // if no file --> throw e

    inStream = fs.createReadStream(x_imgFile);
    inStream.pipe(req);
  } catch (e) {
    x_callback("指定したファイルが存在しません")
    return;
  }
}

/**
 * イメージを削除するする
 * @param x_id イメージID
 * @param x_callback(x_errMsg) 成功時は x_errMsg = null
 */
exports.deleteImage = function (x_id, x_callback) {

  var options = getOptions("/images/" + x_id + "?force=true", "DELETE", "")
  var http = require('http');
  let req = http.request(options, (res) => {
    res.setEncoding('utf8');

    var jsonStr = "";
    // deleteImages完了時にreturnする
    res.on('data', (chunk) => {
      jsonStr += chunk;
    })

    res.on('end', () => {
      var json = null
      try {
        json = JSON.parse(jsonStr)
      } catch (e) {
        console.log("------------ deleteImages() error: " + jsonStr);
        throw e
      }
      //console.log('STATUS: ' + res.statusCode); //200 success
      if (res.statusCode != 200) {
        x_callback(jsonStr);
      } else {
        x_callback(null);
      }
    });
  });
  req.on('error', (e) => {
    console.log('problem with request: ' + e.message);
  });
  req.end() // 送信
}
//------------------------
//API for Docker network
//----------------------- 
/**
 * Get all docker network info.
 * @param {*} x_callback Callback function
 * @author Latte Beo
 */
exports.getNetworks = function (x_callback) {
  sendHttpRequest(getOptions("/networks", "GET", ""), function (x_data) {
    var networks = [];
    x_data.forEach(function (network) {
      networks.push({ 'name': network['Name'], 'id': network['Id'] });
    })
    x_callback(networks);
  });
}
/**
 * Get docker network info.
 * @param {*} x_id Network ID.
 * @param {*} x_callback Callback function.
 * @author Latte Beo
 */
exports.getNetwork = function (x_id, x_callback) {
  sendHttpRequest(getOptions("/networks/" + x_id, "GET", ""), function (x_data) {
    var result = { "id": x_id, "name": x_data['Name'], "containers": Object.entries(x_data['Containers']) }
    x_callback(result);
  });
}
/**
 * Create network.
 * @param {*} x_name Network name 
 * @param {*} x_callback  Callback function
 * @author Latte Beo
 */
exports.createNetwork = function (x_name, x_callback) {
  var jsonstr = JSON.stringify({ "Name": x_name });
  sendHttpRequest(getOptions("/networks/create", "POST", "application/json", jsonstr), function () {
    x_callback(null);
  }, jsonstr);
}
/**
 * Delete network.
 * @param {*} x_id Network ID 
 * @param {*} x_callback Callback function
 * @author Latte Beo
 */
exports.deleteNetwork = function (x_id, x_callback) {
  sendHttpRequest(getOptions("/networks/" + x_id, "DELETE", "", ""), x_callback, null);
}

/**
 * Send Http request.
 * @param x_callback Callback function.
 * @param x_options Request options(got from getOptions method).
 * @param x_postData Post data.
 */
sendHttpRequest = function (x_options, x_callback, x_postData) {
  var http = require("http");
  let req = http.request(x_options, (res) => {
    res.setEncoding('utf8');
    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk;
    })
    res.on('end', () => {
      var result = null;
      try {
        result = JSON.parse(jsonStr);
      } catch (e) {
        console.log("--- Error occured at sendHttpRequest.---------");
      }
      x_callback(result);
    });
  });
  req.on('error', (e) => {
    console.log("error!");
  });
  if (x_postData != null) {
    req.write(x_postData);
  }
  req.end();
}

//------------------
// private method
//------------------
/**
 * x_path コンテキスト以下のパス (例: /RakWF21/webapi/echo)
 * x_method 'GET' または 'POST'
 * x_contentType 空文字 または 'application/json'
 * x_postData 'POST'の際の送信データ(文字列)
 */
getOptions = function (x_path, x_method, x_contentType, x_postData) {
  options = {
    host: 'localhost',
    port: 2375,
    path: x_path,
    method: x_method
  }
  if (x_contentType != null && x_contentType != ""
    && x_postData != null && x_postData != "") {
    options.headers = {
      'Content-Type': x_contentType,
      'Content-Length': Buffer.byteLength(x_postData)
    }
  }
  return options
}

//------------------
// test code
//------------------
if (require.main === module) {
  //this.getContainers();
  //this.createContainer();
  //this.stopContainer("507c49aafcbc197d7d80c6a2083c48f1a328e2111e602570bbd7ebadb5d5e78c")
  //this.prune()

  //this.getImages()
  /*
  this.exportContainer(
    "414d1417427c35f7d285dfe22c6c1df8183f740d20e07d1e185c32537a087be7",
   "C:\\aa130030\\Docker\\test.tar.gz");
  */
  this.importImage("C:\\mydisk\\docker\\ssh.tar")
}
