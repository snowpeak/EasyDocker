/**
 * loadImage.htmlのJS部分
 */

//リスナーの設定
//document.querySelector("#openFile").addEventListener('click', ()=>{
//    openFile();
//})

/**
 * @param x_callback(x_filepath) 選択したファイルパスを返す
 */
exports.openFile = function(x_callback){
    const {BrowserWindow, dialog} = require('electron').remote;
    const win = BrowserWindow.getFocusedWindow();
    dialog.showOpenDialog( win, {
        properties: ['openFile'],
    }).then(result => {
        if(!result.canceled){
            x_callback(result.filePaths[0])
        }
    })
}