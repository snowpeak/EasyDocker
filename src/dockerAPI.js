exports.getContainers = getContainers = function(){
  options = getOptions("/containers/json?all=true", "GET", "")
  http = require('http');
  let req = http.request(options, (res) => {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      containers = JSON.parse(chunk)
      //console.log(containers)

        containers.forEach(function(container){
          console.log("------------ container ------------")
          //console.log(container)
          console.log("ID=" + container['Id'])
          console.log("Image=" + container['Image'])
          console.log("State=" + container['State'])

          container['Ports'].forEach(function(port){
            console.log("localhost:" + port['PublicPort'] + "-->" + port['PrivatePort'])
          })
        })
      });
    });
    req.on('error', (e) => {
    console.log('problem with request: ' + e.message);
  });
  req.end();
}

exports.createContainer = createContainer = function(){
  let postData = {
    "Hostname": "rakwf21",
    "Cmd": ["/sbin/init"],
    "Image" : "rakwf21:7610",
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
  let postDataStr = JSON.stringify(postData);

  var containerID = null;
  options = getOptions("/containers/create", "POST", 'application/json', postDataStr)
  http = require('http');
  let req = http.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      retJson = JSON.parse(chunk)
      console.log(retJson)
      containerID = retJson['Id'];
      startContainer(containerID)
      getContainers();
    });
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
    })
  })
  req.write(postDataStr);
  req.end();
}

exports.startContainer = startContainer = function( x_id ){
  path = "/containers/" + x_id + "/start"
  console.log(path)
  options = getOptions(path, "POST")
  http = require('http');
  let req = http.request(options, (res) => {
    console.log('STATUS: ' + res.statusCode); // 204 success
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
    })
  })
  req.end();
}

exports.stopContainer = stopContainer = function( x_id ){
  path = "/containers/" + x_id + "/stop"
  console.log(path)
  options = getOptions(path, "POST")
  http = require('http');
  let req = http.request(options, (res) => {
    console.log('STATUS: ' + res.statusCode); //204 success
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
    })
  })
  req.end();
}

exports.prune = prune = function (x_id) {
  path = "/containers/prune"
  options = getOptions(path, "POST")
  http = require('http');
  let req = http.request(options, (res) => {
    console.log('STATUS: ' + res.statusCode); //204 success
    res.on('data', (chunk) => {
      retJson = JSON.parse(chunk)
      console.log(retJson)
    });
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
    })
  })
  req.end();
}

exports.exportContainer = exportContainer = function (x_id, x_filepath) {
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
      console.log('STATUS: ' + res.statusCode); //204 success
    });
  });
  req.on('error', function (err) {
    console.log('Error: ', err);
    return;
  });
}

//--------------------------------------
// images
//--------------------------------------
exports.getImages = getImages = function () {
  options = getOptions("/images/json?all=true", "GET", "")
  http = require('http');
  let req = http.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      images = JSON.parse(chunk)
      images.forEach(function (image) {
        console.log("------------ container ------------")
        //console.log(container)
        console.log("ID=" + image['Id'])
        console.log("Size=" + image['Size'])

        image['RepoTags'].forEach(function (repotag) {
          console.log(repotag);
        })
      })
    });
  });
  req.on('error', (e) => {
    console.log('problem with request: ' + e.message);
  });
  req.end();
}

exports.importImage = importImage = function(x_imgFile){
  var containerID = null;
  options = getOptions("/images/create?fromSrc=-&repo=test&tag=test1", "POST")
  http = require('http');
  let req = http.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      retJson = JSON.parse(chunk)
      console.log(retJson)
    });
    req.on('error', (e) => {
      console.log('problem with request: ' + e.message);
    })
  })

  // アップロードするImaege
  length = 0;
  fs = require('fs')
  inStream = fs.createReadStream(x_imgFile);
  inStream.pipe(req)
  /*
  inStream.on('data', (chunk) => {
    length += chunk.byteLength
    req.write(chunk);
  })
  inStream.on('end', () => {
    console.log("upload finished:" + length)
    req.end();
  })
  */
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
