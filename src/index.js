const s_debug = false

const {app, Menu, BrowserWindow} = require('electron');
const sql = require('./libsrc/sqlite.js');
require('@electron/remote/main').initialize();

let s_mainWin;
let s_exportContainerWin;
let s_editContainerMemo;
let s_newContainerWin;
let s_loadImageWin;
let s_createNetworkWin;

function initApp(){
  s_mainWin = createWindow(`file://${__dirname}/main.html`, 1200, 900, s_debug);
  Menu.setApplicationMenu(null);

  //ウィンドウが閉じられると発生
  s_mainWin.on('closed', () => {
    s_mainWin = null
  });
  
  sql.initDB();
}

function createWindow (x_path, x_width, x_height, x_debug) {
  // ブラウザウィンドウを作成
  let thisWin = new BrowserWindow({
        width: x_width, 
        height: x_height,
        webPreferences: { nodeIntegration: true,
        contextIsolation:false,
        enableRemoteModule: true}
    });
    
  // ウィンドウ最大化
  // s_mainWin.setSimpleFullScreen(true)

  // デベロッパーツール自動起動
  if(x_debug){
    thisWin.webContents.openDevTools();
  }

  //index.htmlをロード
  thisWin.loadURL(x_path);

  return thisWin;
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
      s_mainWin = createWindow(`file://${__dirname}/main.html`, 1000, 900, s_debug);
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
 * メイン画面をリロードしてコンテナ一覧を更新表示する。
 */
ipcMain.on('async_main_refreshContainer', function(x_event){
    console.log('async_main_refreshContainer');
    s_mainWin.webContents.send('async_to_main_refreshContainer');
})

/**
 * container --(export)--> Image ポップアップ表示
 */
ipcMain.on('async_main_exportContainer', function(x_event, x_id, x_tag, x_locale){
  var path = `file://${__dirname}/exportContainer.html`
  s_exportContainerWin = createWindow(path, 800, 400, s_debug);
  s_exportContainerWin.webContents.on('did-finish-load', ()=>{
      // setter
      s_exportContainerWin.webContents.send('async_exportContainer_set', x_id, x_tag, x_locale);
    })
})
/**
 * container --(export)--> Image 実行
 */
ipcMain.on('async_exportContainer_save', function(x_event, x_id, x_filepath){
    dockerAPI.exportContainer(x_id, x_filepath, (x_errMsg)=>{
        if(x_errMsg == null){
            s_exportContainerWin.close();
        }else{
            console.log('exportContainer error :' + x_errMsg);
            x_event.sender.send('async_exportContainer_save_res', x_errMsg);
        }
    });
})

/**
 * container メモ編集 ポップアップ表示
 */
ipcMain.on('async_main_editContainerMemo', function(x_event, x_id, x_locale){
  var param_id = x_id;
    
  var path = `file://${__dirname}/editContainerMemo.html`
  s_editContainerWin = createWindow(path, 600, 650, s_debug);
  s_editContainerWin.webContents.on('did-finish-load', ()=>{
      // setter
      sql.getContainer(param_id, (x_container)=>{
          console.log(x_container);
          var thisMemo = "";
          if(x_container != null){
              thisMemo = x_container.memo;
          }
          s_editContainerWin.webContents.send('async_editContainerMemo_set', param_id, thisMemo, x_locale);
      });
    })
})
/**
 * container メモ保存
 */
ipcMain.on('async_editContainerMemo_save', function(x_event, x_id, x_memo){
    sql.getContainer(x_id, (x_container)=>{
        if(x_container ==  null){
            sql.insert(x_id, null, null, x_memo, (err)=>{
                s_editContainerWin.close();
                s_mainWin.webContents.send('async_to_main_refreshContainer');
            });
        } else {
            sql.updateMemo(x_id, x_memo, (err)=>{
                s_editContainerWin.close();
                s_mainWin.webContents.send('async_to_main_refreshContainer');
            });
        }
    });
})


/**
 * Imageロード ポップアップ表示
 */
ipcMain.on('async_main_loadImage', function(x_event, x_locale){
    var path = `file://${__dirname}/loadImage.html`
    s_loadImageWin = createWindow(path, 600, 400, s_debug);
    s_loadImageWin.webContents.on('did-finish-load', ()=>{
      s_loadImageWin.webContents.send('async_loadImage_set', x_locale);
    })
})
/**
 * Display create network popup.
 */
ipcMain.on('async_main_createNetwork', function(x_event, x_locale){
  var path = `file://${__dirname}/createNetwork.html`
  s_createNetworkWin = createWindow(path, 600, 400, s_debug);
  s_createNetworkWin.webContents.on('did-finish-load', ()=>{
  s_createNetworkWin.webContents.send('async_createNetwork_set', x_locale);
  })
})
/**
 * Imageロード 実行
 */
ipcMain.on('async_loadImage_load', function(x_event, x_filepath, x_repo, x_tag){
    dockerAPI.importImage(x_filepath, x_repo, x_tag, (x_errMsg)=>{
        if(x_errMsg == null){
            s_mainWin.webContents.send('async_to_main_refreshImage');
            s_loadImageWin.close();
        }else{
            console.log('importImage error :' + x_errMsg);
            x_event.sender.send('async_loadImage_load_res', x_errMsg);
            
        }
    });
})
/**
 * Execute network creation.
 */
ipcMain.on('async_createNetwork_create', function(x_event, x_name){
  dockerAPI.createNetwork(x_name, function (){
    s_mainWin.webContents.send('async_createNetwork_create_res');
    s_mainWin.webContents.send('async_to_main_refreshNetwork');
    s_createNetworkWin.close();
  });
})

/**
 * コンテナ作成 ポップアップ表示
 */
ipcMain.on('async_main_newContainer', function(x_event, x_imageid, x_tag, x_locale){
  var path = `file://${__dirname}/newContainer.html`
  s_newContainerWin = createWindow(path, 850, 950, s_debug);

  s_newContainerWin.webContents.on('did-finish-load', ()=>{
    // setter
    s_newContainerWin.webContents.send('async_newContainer_set', x_imageid, x_tag, x_locale);
    //s_mainWin.webContents.send('async_to_main_refreshContainer');
  })
})

/**
 * コンテナ作成 submit
 */
ipcMain.on('async_newContainer_submit', function(x_event, x_arg){
    dockerAPI.createContainer();
})  
