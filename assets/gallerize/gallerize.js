/* Gallerize Simple Homebrew Photo Viewer
   Copyright (c) 2017 George Moe
   All Rights Reserved.
 */

$(document).ready(function () {

    $("body").append("<div id='gallerize-cover'></div><img id='gallerize-frame'>");

    $(".gallerize").click(function () {
        openGallerize($(this).attr("src"))
    });

    $("#gallerize-cover").click(function () {
        closeGallerize()
    });

    // $("#gallerize-frame").click(function() {
    //     window.open($(this).attr("src"), "_blank");
    // });

    $(document).keydown(function (event) {
        // Handle escape key
        if (event.keyCode === 27) {
            closeGallerize()
        }
    });
});

function openGallerize(source) {
    $("#gallerize-cover").show();
    var $frame = $("#gallerize-frame");
    $frame.attr("src", source);

    if ($frame.width() / $frame.height() > $(window).width() / $(window).height()) {
        $frame.width($(window).width() * 0.8);
        $frame.offset({
            left: $(window).width() * 0.1, top: ($(window).height() - $frame.height()) / 2
        });
    } else {
        $frame.height($(window).height() * 0.8);
        $frame.offset({
            left: ($(window).width() - $frame.width()) / 2, top: $(window).height() * 0.1
        });
    }

    $frame.show();
}

function closeGallerize() {
    var $frame = $("#gallerize-frame");
    $frame.attr("src", "");
    $frame.removeAttr("style");
    $frame.hide();
    $("#gallerize-cover").hide();
}

function rebindGallerize() {
    var $images = $(".gallerize");
    $images.off("click");
    $images.click(function () {
        openGallerize($(this).attr("src"))
    });
}