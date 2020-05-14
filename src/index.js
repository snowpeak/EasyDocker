const {app, Menu, BrowserWindow} = require('electron');
let win;

function createWindow () {
  // ブラウザウィンドウを作成
  win = new BrowserWindow({
        width: 1000, 
        height: 900,
        webPreferences: { nodeIntegration: true}
    });
    
  // ウィンドウ最大化
  // win.setSimpleFullScreen(true)

  // デベロッパーツール自動起動
  win.webContents.openDevTools();

  Menu.setApplicationMenu(null);

  //index.htmlをロード
  win.loadURL(`file://${__dirname}/main.html`);

  //ウィンドウが閉じられると発生
  win.on('closed', () => {
    win = null
  });

}

//---------------------------------
// 定型処理
//---------------------------------
// プロキシ設定
// https://qiita.com/dojyorin/items/12a0f63c6bea24bdfb21
app.on("login", (event, webContents, request, authInfo, callback)=>{
    if(authInfo.isProxy){
        event.preventDefault();
        callback('aa130030', 'i4smatsuda');
    }
});
app.on('ready', createWindow);
app.on('activate', () => {
    if (win === null) {
      createWindow();
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