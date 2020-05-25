/**
 * コンテナの一覧を取得する
 * @param x_callback(containers)
 * containers=[{id, state, image, ports=[port]}]
 */
exports.getContainers = getContainers = function(x_callback){
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
      try{
        containers = JSON.parse(jsonStr)
      }catch(e){
        console.log("------------ getContainers() error: " + jsonStr)
        throw e
      }

      //console.log(containers)

      containers.forEach(function (container) {
        //console.log(container)
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
          if(x_port.PublicPort != undefined){
            port = "localhost:" + x_port['PublicPort'] + " --> " + x_port['PrivatePort'];
            ports.push(port)
          }
        })
        var value = { 'id': id, 'image': image, 'state': state, 'ports': ports }
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
 * @param x_callback(x_id) 生成したイメージのID
 */
exports.createContainer = createContainer = function( x_postData, x_start, x_callback ){
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
  console.log( postDataStr );

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
      console.log('create container : '  + jsonStr);
      var retJson = JSON.parse(jsonStr)
      containerID = retJson['Id'];
      
      if(x_start){
          
          this.startContainer(containerID, function(x_status){
              if(x_status == 204){
                  x_callback( containerID )
              }else{
                  alert('error:' + containerID + ":" + x_status)
              }
          })
      }else{
          x_callback( containerID )
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
exports.startContainer = startContainer = function( x_id, x_callback ){
  path = "/containers/" + x_id + "/start"
  console.log(path)
  options = getOptions(path, "POST")
  http = require('http');
  let req = http.request(options, (res) => {

    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })
    res.on('end', () => {
        console.log('STATUS: ' + res.statusCode); // 204 success
        console.log(jsonStr);
        
        x_callback(res.statusCode)
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
 * @param x_callback( x_status ) // 204は成功
 */
exports.stopContainer = stopContainer = function( x_id, x_callback ){
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
          console.log('STATUS: ' + res.statusCode); // 204 success
          console.log(jsonStr);
          
          x_callback(res.statusCode)
      })
      req.on('error', (e) => {
        console.log('problem with request: ' + e.message);
        x_callback(-1);
      })
  })
  req.end();
}

/**
 * 不要コンテナを削除する
 * @param x_callback(x_status) //204は成功
 */
exports.prune = prune = function (x_callback) {
  path = "/containers/prune"
  options = getOptions(path, "POST")
  http = require('http');
  let req = http.request(options, (res) => {
    console.log('STATUS: ' + res.statusCode); //204 success

    var jsonStr = "";
    res.on('data', (chunk) => {
      jsonStr += chunk
    })

    res.on('end', () => {
      var retJson = JSON.parse(jsonStr)
      console.log(retJson)
      x_callback(res.statusCode)

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
      console.log('STATUS: ' + res.statusCode); // 200 success
      if( res.statusCode != 200 ){
          x_callback(res.statusCode);
      }else{
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
      try{
        images = JSON.parse(jsonStr)
      }catch(e){
        console.log("------------ getImages() error: " + jsonStr);
        throw e
      }
      images.forEach(function (image) {
        //console.log(container)
        var id = image['Id']
        var size = image['Size']
        console.log("ID=" + id + ", Size=" + size)
       
        var tag = ""
        image['RepoTags'].forEach(function (repotag) {
          if(tag != ""){
            tag += ","
          }
          tag += repotag
        })
        retImages.push({'id':id, 'size':size, 'tag': tag});
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
exports.importImage = importImage = function(x_imgFile, x_repo, x_tag, x_callback){
  var containerID = null;
  url = "/images/create?fromSrc=-"
  if(x_repo != null & x_repo != ""){
    url += ("&repo=" + x_repo)
  }
  if(x_tag != null & x_tag != ""){
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
      console.log(retJson)
      if(res.statusCode == 200){
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
   } catch(e) {
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
    
    var options = getOptions("/images/" + x_id +"?force=true", "DELETE", "")
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
        try{
          json = JSON.parse(jsonStr)
        }catch(e){
          console.log("------------ deleteImages() error: " + jsonStr);
          throw e
        }
        console.log('STATUS: ' + res.statusCode); //200 success
        if( res.statusCode != 200 ){
            x_callback(jsonStr);
        }else{
            x_callback(null);
        }
      });
    });
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
    });
  req.end() // 送信
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
getOptions = function(x_path, x_method, x_contentType, x_postData){
  options = {
    host: 'localhost',
    port: 2375,
    path: x_path,
    method: x_method
  }
  if(x_contentType != null && x_contentType != ""
      && x_postData != null && x_postData != ""){
      options.headers = {
        'Content-Type' : x_contentType,
        'Content-Length' : Buffer.byteLength(x_postData)
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
