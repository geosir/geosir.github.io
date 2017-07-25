$(document).ready(function () {
    setTimeout(function () {
        $("#cover").animate({opacity: 0.4}, 800);
        $("#logobox").fadeOut(500);
    }, 500);


    var target = window.location.hash.replace("#", "");
    if (window.location.hash == "") target = "home";
    loadPage(target)

    updateMenu();

    window.onhashchange = function () {
        updateMenu();
        var target = window.location.hash.replace("#", "");
        changeToPage(target);
    };

    function updateMenu() {
        $("#menulist a").removeClass("present");

        var matched = false;
        $("#menulist a").each(function () {
            if ($(this).attr("href") == window.location.hash) {
                $(this).addClass("present");
                matched = true;
                return false;
            }
        });
        if (!matched) {
            $("#menulist a").each(function () {
                if ($(this).attr("href") == window.location.hash.split("/")[0] || (window.location.hash == "" && $(this).attr("href") == "#home")) {
                    $(this).addClass("present");
                    return false;
                }
            });
        }
    }

    function changeToPage(target) {
        loadPage(target);
    }

    function loadPage(page, callback) {
        $.get("/pages/" + page + "/", function (data) {
            $("#contentarea").html(data);
            if (page.indexOf("#") > -1) {
                var anchor = page.split("#")[1];
                $('html, body').animate({
                    scrollTop: $("#" + anchor).offset().top
                }, 500);
            }
        }).fail(function () {
            $.get("/pages/404/", function (data) {
                $("#contentarea").html(data);
            }).always(callback);
            ;
        }).done(callback);
    }
});

function hideMenu() {
    $("#content-column").attr("class", "twelve columns");
    $("#sidebar-column").attr("class", "");
    $("#sidebar-column").hide();
    $(".showmenu").show();
    $(".hidemenu").hide();
}

function showMenu() {
    $("#content-column").attr("class", "nine columns");
    $("#sidebar-column").attr("class", "three columns");
    $("#sidebar-column").show();
    $(".hidemenu").show();
    $(".showmenu").hide();
}