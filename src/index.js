const {app, Menu, BrowserWindow} = require('electron');
let mainWin;
let newContainerWin;

function initApp(){
  mainWin = createWindow(`file://${__dirname}/main.html`, 1200, 900, true);
}

function createWindow (x_path, x_width, x_height, x_debug) {
  // ブラウザウィンドウを作成
  var win = new BrowserWindow({
        width: x_width, 
        height: x_height,
        webPreferences: { nodeIntegration: true}
    });
    
  // ウィンドウ最大化
  // win.setSimpleFullScreen(true)

  // デベロッパーツール自動起動
  if(x_debug){
    win.webContents.openDevTools();
  }

  Menu.setApplicationMenu(null);

  //index.htmlをロード
  win.loadURL(x_path);

  //ウィンドウが閉じられると発生
  win.on('closed', () => {
    win = null
  });
  return win;
}

//---------------------------------
// 定型処理
//---------------------------------
// プロキシ設定
// https://qiita.com/dojyorin/items/12a0f63c6bea24bdfb21
/*
app.on("login", (event, webContents, request, authInfo, callback)=>{
    if(authInfo.isProxy){
        event.preventDefault();
        callback('userid', 'password');
    }
});
*/
app.on('ready', initApp);
app.on('activate', () => {
    if (win === null) {
      mainWin = createWindow(`file://${__dirname}/main.html`, 1000, 900, true);
    }
  });

// 終了処理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

//---------------------------------
// アプリ固有イベント
//---------------------------------
const {ipcMain} = require('electron');
const docker = require("./dockerAPI")
var count = 1;

/**
 * コンテナ作成 ポップアップ
 */
ipcMain.on('async_main_newContainer', function(x_event, x_imageid, x_tag){
  var path = `file://${__dirname}/newContainer.html`
  newContainerWin = createWindow(path, 600, 650, true);

  newContainerWin.webContents.on('did-finish-load', ()=>{
    // setter
    newContainerWin.webContents.send('async_newContainer_set', x_imageid, x_tag);
    console.log('newContainer win is ready!')
  })

  x_event.sender.send('asynchronous-reply', 'from index.js : ' + count++)
})

/**
 * コンテナ作成 submit
 */
ipcMain.on('async_newContainer_submit', function(x_event, x_arg){
  docker.createContainer();

})  
