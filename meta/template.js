var cal_array = [], calnames_array=[];

$( document ).ready( function(){
	var htmlstring = "";
	var calendars = "";
	var bestFrameHeight = $( window ).height();
	
	//iOS font compatability
        if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                $("body").css({"font-family":"\"Avenir Next\", sans-serif"});
                $("h1, h2").css({"font-family":"\"Avenir Black\", sans-serif"});
        }
	
	//Build page from xml data
	//Load the xml file using ajax 
        $.get("auto.xml", function (xml) {
                //console.log("Success");
                // Parse the xml file and get data
                var xmlDoc = $.parseXML(xml), $xml = $(xmlDoc);
                var calendarthere = false;
                $(xml).children("body").children("section").each(function () {
                        //console.log("hey");
                        htmlstring+="<div class=\"body-box body-box-wide\">";
                        if($(this).children("title").text()!="")
                        {
                                htmlstring+="<h1>"+$(this).children("title").text()+"</h1>";
                        }
                        if($(this).children("content").text()!="")
                        {
                                htmlstring+="<p>"+$(this).children("content").text()+"</p>";
                        }
                        if($(this).children("docs").text()!="")
                        {
                                htmlstring+="<div class=\"docs\"><iframe class=\"doc-iframe\" src=\""+$(this).children("docs").text()+"\"></iframe></div>";
                        }
			if($(this).children("feed").text()!="")
                        {
		                htmlstring+="<div class=\"feed\"><iframe class=\"feed-frame\" src=\""+$(this).children("feed").text()+"\"></iframe></div>";
                        }
                        //OBSELETED BY GOOGLE DOCS -- GEOFEED
                        //If you'd like to revive it, place code here.
			if($(this).children("calendar").html()!=undefined)
			{
					htmlstring+="<div class=\"calendar\">";
					//var calendars = ""; //cal_array and calnames_array are defined globally.
					$(this).children("calendar").children("source").each(function(){
							cal_array.push($(this).children("src").text());
							calnames_array.push($(this).children("name").text());
					});
				        cal_array.forEach(function(element){
				                calendars+=element;
				        });
					//console.log(calendars);
					htmlstring+="<iframe id=\"gcal\" src=\"https://www.google.com/calendar/embed?mode=WEEK&showTitle=0&height=1080&wkst=1&bgcolor=%23FFFFFF&"+calendars+"ctz=America%2FChicago\" style=\" border-width:0 \" width=\"1920\" height=\"1080\" frameborder=\"0\" scrolling=\"no\"></iframe>";
					htmlstring+="</div>";
					if(cal_array.length > 1)
					{
					        htmlstring+="<div class=\"calendartoggle\"><h2>Your Calendars</h2><form id=\"calform\">";
					        cal_array.forEach(function(elem, index){
						        htmlstring+="<input class=\"checkbox\" type=\"checkbox\" name=\"calendar\" value=\""+calnames_array[index]+"\">"+calnames_array[index]+"</input><br />";
					        });
					        htmlstring+="<br /><input type=\"button\" name=\"updatecal\" value=\"Update Calendars\" onclick=\"updatePreferredCalendars(this.form)\">"
					        htmlstring+="&nbsp;<input id=\"caltoggle\" type=\"button\" name=\"togglecal\" value=\"Check All\" onclick=\"toggleCalendars(this.form)\">";
					        htmlstring+="</form>";
					        htmlstring+="</div>";
				        }
					calendarthere = true;
			}
			//Load additional plugins. Specify location by pusing to var template.
			/*window.extthis = $(this)
			var $template = "";
			if(template)
			{
			        var $template = template;
			        $(template).each(function(index, element){
			                $.getScript(element);
			                //console.log("Got "+element);
			        });
		        }*/
                        htmlstring+="</div>";
                });
		$("#auto-body").append(htmlstring);
		if(calendarthere)
		{
		        getPreferredCalendars(document.getElementById("calform"));
	        }
		$("iframe").load(function(){
		        $(this).animate({"height": bestFrameHeight*0.8});
		});
        }, "xml");
		
	$(".footer").append("<footer><p class=\"footer-text\"><a href=\"/\"><img class=\"footer-logo\" src=\"/media/IMSA_Undefined_Logo_White.png\" alt=\"IMSA Undefined\"></a>&nbsp;&nbsp;&nbsp;Copyright &copy; imsa#undefined 2015</p></footer>");
});

function getPreferredCalendars(form)
{
        if(cal_array.length > 1)
        {
                var boxes = form.calendar, found = false;
                if(getCookie("calendars")!="")
                {
                        //console.log("bong");
                        var calendars = getCookie("calendars");
                        calendars = calendars.split(",");
                        for(i=0; i<calendars.length; i++)
                        {
                                for(a=0; a<boxes.length; a++)
                                {
                                        if(boxes[a].value==calendars[i])
                                        {
                                                boxes[a].checked = true;
                                                break;
                                        }
                                        
                                }
                        }
                }
                else
                {
                        //console.log("bing");
                        for(a=0; a<boxes.length; a++)
                        {
                                boxes[a].checked = true;
                        }
                }
                updatePreferredCalendars(form)
        }
}

function toggleCalendars(form)
{
        var calendars = form.calendar;
        for(i=0; i<calendars.length; i++)
        {
                calendars[i].checked = true;
        }
}

function updatePreferredCalendars(form)
{
        ////console.log(form.calendar);
        var calendars = form.calendar, preferred = "", names = [];
        var empty = true;
        ////console.log(preferred);
        for(i=0; i<calendars.length; i++)
        {
                if(calendars[i].checked)
                {

                        var index = calnames_array.indexOf(calendars[i].value);
                        if(index!=-1)
                        {
                                preferred+=cal_array[index];
                                names.push(calnames_array[index]);
                                empty = false;
                        }
                }
        }          
        if(empty)
        {
                cal_array.forEach(function(element){
                        preferred+=element;
                });
        }
        //console.log("https://www.google.com/calendar/embed?mode=WEEK&showTitle=0&height=1080&wkst=1&bgcolor=%23FFFFFF&"+preferred+"ctz=America%2FChicago");
        $("#gcal").attr("src", "https://www.google.com/calendar/embed?mode=WEEK&;showTitle=0&height=1080&wkst=1&bgcolor=%23FFFFFF&"+preferred+"ctz=America%2FChicago");
        
        setCookie("calendars", names.toString(), 20*365);
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return "";
}

function isMyStuffScrolling(object) {
  var docHeight = $(object).scrollHeight();
  var scroll    = $(window).height() + $(window).scrollTop();
  return (docHeight == scroll);
}
