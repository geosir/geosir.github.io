$( document ).ready(function(){
        $("#main-menu").load("/meta/main-menu.html", function(){
                    document.getElementById("main-menu-list").selected=pageid;
        });
});
