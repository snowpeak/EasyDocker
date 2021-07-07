/**
 * exportContainer.htmlのJS部分
 */

//リスナーの設定
//document.querySelector("#openFile").addEventListener('click', ()=>{
//    openFile();
//})

/**
 * @param x_callback(x_filepath) 選択したファイルパスを返す
 */
exports.saveFile = function(x_callback){
    const {BrowserWindow, dialog} = require('@electron/remote');
    const win = BrowserWindow.getFocusedWindow();
    dialog.showSaveDialog( win, {
        filters:[ { name: "tar.gz", extensions:["tar.gz"]} ]
    }).then(result => {
        if(!result.canceled){
            x_callback(result.filePath)
        } else {
            x_callback(null)
        }
    })
}
