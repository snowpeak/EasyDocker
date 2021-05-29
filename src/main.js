window.onload = function(){
    this.initPage() //タブにイベントを設定する


//settingTab
    let sql = require('./libsrc/sqlite.js');
    sql.getParam(function(param){
        settingTab._i18n.locale = param.value;
        settingTab.lang = param.value;
    }, 'lang');


    this.initContainerTab()　//コンテナ一覧表示
    //this.initImageTab()     //イメージ一覧表示
    
}
function initPage() {

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var activatedTab = e.target.toString() // HtmlAnchorElement.toString()( full URL+#tabname )
        var idx = activatedTab.lastIndexOf('#');
        if(idx>0){
            activatedTab = activatedTab.substring(idx+1)
        }
        //var previous_tab = e.relatedTarget // previous tab( full URL+#tabname )

        // 処理
        if( activatedTab == "containerTab"){
            //alert('refresh container list');
            initContainerTab()
        }else if( activatedTab == "imageTab"){
            initImageTab()
        } else if (activatedTab == 'networkTab') {
            initNetworkTab();
        }
    })
}

/**
 * コンテナタブの情報を最新にする
 * @returns
 */
function initContainerTab(){
    var docker = require("./dockerAPI")
    function callbackContainers(x_containers){
        var retArray = [];
        var idContainerMap = {}
        
        x_containers.forEach(function(x_container){
            var portStr = "";
            x_container.ports.forEach(function(x_port){
                portStr += (x_port + "<br>")
            })

            var container = {
                "name" : x_container.name,
                "id": x_container.id,
                "image": x_container.image,
                "state": x_container.state,
                "port" : portStr
            }
            retArray.push(container)
            
            idContainerMap[x_container.id] = container;
        })
        
        let sql = require('./libsrc/sqlite.js');
        sql.initDB();
        sql.getContainers((x_containers)=>{
            x_containers.forEach(function(x_container){
                var foundContainer = idContainerMap[x_container.id];
                if( foundContainer != null){
                    foundContainer["port"] = x_container.port;
                    foundContainer["memo"] = x_container.memo;
                    console.log(foundContainer);
                }
            })
            vueContainerTab.setContainers(retArray);
        });
    }
    docker.getContainers(callbackContainers);
}

/**
 * イメージタブの表示を最新にする
 * @returns
 */
function initImageTab(){
    var docker = require("./dockerAPI")

    var callbackImages = function (x_images){
        var retArray = [];
        x_images.forEach(function(x_image){
            /*
            alert("---- images ----\n"
                + x_image.id + "\n"
                + x_image.size + "\n"
                + x_image.tag);
                */
               var idStr = x_image.id;
               var idx = idStr.indexOf(':')
               if(idx >= 0 ){
                   idStr = idStr.substring(idx+1)
               }
               var image = {
                "id": idStr,
                "size": parseInt(x_image.size/1024/1024)+ "MB",
                "tag": x_image.tag,
            }
            retArray.push(image)
        })
        vueImageTab.setImages(retArray);
    }
    docker.getImages(callbackImages);

}
/**
 * Update contents on Network tab.
 */
function initNetworkTab() {
    var docker = require('./dockerAPI');
    var CallbackNetwork = function(x_networks) {
        networkTab.setNetworks(x_networks);   
    }
    docker.getNetworks(CallbackNetwork);
}