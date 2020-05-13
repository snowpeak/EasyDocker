window.onload = function(){
    this.initPage()

    var docker = require("./dockerAPI")

    function callback(images){
        images.forEach(function(image){
            alert(image.id + "\n" + image.size + "\n" + image.tag);
        })
    }
    docker.getImages(callback);
}
function initPage() {

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var activated_tab = e.target // activated tab
        var previous_tab = e.relatedTarget // previous tab
        // 処理
        alert(activated_tab + " activated")
    })
}