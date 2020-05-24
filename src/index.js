const {app, Menu, BrowserWindow} = require('electron');
let s_mainWin;
let s_newContainerWin;
let s_loadImageWin;

function initApp(){
  mainWin = createWindow(`file://${__dirname}/main.html`, 1200, 900, true);
}

function createWindow (x_path, x_width, x_height, x_debug) {
  // ブラウザウィンドウを作成
  s_mainWin = new BrowserWindow({
        width: x_width, 
        height: x_height,
        webPreferences: { nodeIntegration: true}
    });
    
  // ウィンドウ最大化
  // s_mainWin.setSimpleFullScreen(true)

  // デベロッパーツール自動起動
  if(x_debug){
    s_mainWin.webContents.openDevTools();
  }

  Menu.setApplicationMenu(null);

  //index.htmlをロード
  s_mainWin.loadURL(x_path);

  //ウィンドウが閉じられると発生
  s_mainWin.on('closed', () => {
    s_mainWin = null
  });
  return s_mainWin;
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
    if (s_mainWin === null) {
      s_mainWin = createWindow(`file://${__dirname}/main.html`, 1000, 900, true);
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
const dockerAPI = require("./dockerAPI")
var count = 1;

/**
 * Imageロード ポップアップ表示
 */
ipcMain.on('async_main_loadImage', function(x_event){
  var path = `file://${__dirname}/loadImage.html`
  s_loadImageWin = createWindow(path, 600, 650, true);

//  win.webContents.on('did-finish-load', ()=>{
//    // setter
//    newContainerWin.webContents.send('async_newContainer_set', x_imageid, x_tag);
//    console.log('newContainer win is ready!')
//  })
})
/**
 * Imageロード 実行
 */
ipcMain.on('async_loadImage_load', function(x_event, x_filepath, x_repo, x_tag){
    dockerAPI.importImage(x_filepath, x_repo, x_tag, (x_errMsg)=>{
        if(x_errMsg == null){
            s_loadImageWin.close();
        }else{
            console.log('importImage error :' + x_errMsg);
            x_event.sender.send('async_loadImage_load_res', x_errMsg);
        }
    });
})



/**
 * コンテナ作成 ポップアップ表示
 */
ipcMain.on('async_main_newContainer', function(x_event, x_imageid, x_tag){
  var path = `file://${__dirname}/newContainer.html`
  s_newContainerWin = createWindow(path, 600, 650, true);

  s_newContainerWin.webContents.on('did-finish-load', ()=>{
    // setter
    s_newContainerWin.webContents.send('async_newContainer_set', x_imageid, x_tag);
    console.log('newContainer win is ready!')
  })

  x_event.sender.send('asynchronous-reply', 'from index.js : ' + count++)
})
/**
 * コンテナ作成 submit
 */
ipcMain.on('async_newContainer_submit', function(x_event, x_arg){
    dockerAPI.createContainer();
})  
