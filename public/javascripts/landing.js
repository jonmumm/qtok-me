window.qtok = {};

$(document).ready(function() {
	qtok.hash = hash.create();

	$("#link-input").text(document.location.href + qtok.hash);
  $("#success-url span").text(document.location.href + qtok.hash);

  $("#header-wrapper").fadeIn('fast');
  $("#landing-wrapper").fadeIn('fast');
  
  $("#api-link").click(function() {
	  $("#landing-wrapper").hide('fast');
    $("#api-wrapper").show('fast');
	});
    
  $("#videochat-link").click(function() {
    $("#api-wrapper").hide('fast');
    $("#landing-wrapper").show('fast');
	});
    
  $("#help-link").click(function() {
    $("#api-wrapper").hide('fast');
    $("#landing-wrapper").show('fast');
    $("#help-wrapper").fadeIn('fast');
    setTimeout(function() {
      $("#help-wrapper").fadeOut('fast');
    }, 2000);
	});
  
  $("#just-copy-button").zclip({
    path: '/assets/ZeroClipboard.swf',
    copy: $("#link-input").text(),
    afterCopy: function() {
	    $("#links-wrapper").fadeOut('fast', function() {
				$("#copied-wrapper").fadeIn('fast');
			});
		}
	});

  $("#copy-join-button").zclip({
    path: '/assets/ZeroClipboard.swf',
    copy: $("#link-input").text(),
    afterCopy: function() {
      $("#copy-join-button").css('background-position', '0px -258px');
			
			$.post('/reserve', { hash: qtok.hash }, function(response) {
				window.location = document.location.href + response.hash;
			});
		}
  });

});