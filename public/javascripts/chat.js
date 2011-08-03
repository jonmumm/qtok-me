function log(str) {
	try{
		console.log(str);
	}
	catch(e){}
}

$(document).ready(function() {
	$("#chat-wrapper").fadeIn('fast');
  
  $("#displayCurrUrlBtn").zclip({
    path: '/assets/ZeroClipboard.swf',
    copy: $("#displayCurrUrl").text()      
  });

	var hash = window.location.pathname.slice(1, window.location.pathname.length);

	$.getJSON('/get', { hash: hash },function(response) {
		console.log(response);
		var embedApp = EmbedApp(response);
		embedApp.init();
	});
});

// main app
var EmbedApp = function(data) {
	var that = {};
	
	var constants = {};
	constants.PUBLISHER_COLUMN_WIDTH = 300;
	
	var otdata = {};
	otdata.sid = data.sessionId;
	otdata.token = data.token;
	otdata.apikey = data.apiKey;
	
	var stage = {};  // display area
	var ele = {};  // view elements
	var session;  // opentok session
	var view = {};
	
	var publisher;
	
	
	
	
	var layoutManager = function() {
		var that = {};
		
		
		var adamLayout = function(loinfo) {
			var subscriberBox = ele.subscriberBox;
			var Width = loinfo.containerWidth;
			var Height = loinfo.containerHeight;
			var spadding = 10;
			var vid_ratio = (198 + spadding) / (264 + spadding);
			// Find ideal ratio
			var count = subscriberBox.children.length;
			var min_diff;
			var targetCols;
			var targetRows;
			var availableRatio = Height / Width;
			for (var i=1; i <= count; i++) {
				var cols = i;
				var rows = Math.ceil(count / cols);
				var ratio = rows/cols * vid_ratio;
				var ratio_diff = Math.abs( availableRatio - ratio);
				if (!min_diff || (ratio_diff < min_diff)) {
					min_diff = ratio_diff;
					targetCols = cols;
					targetRows = rows;
				}
			};
			// re calc target rows and cols
			// targetRows = Math.min(Math.ceil(Math.sqrt(count / ((Width/Height)/(1/vid_ratio))) - 1), count);
			// targetCols = Math.ceil(count / targetRows);
			// log("----------");
			// log(count / ((Width/Height)/(1/vid_ratio)));
			// log(targetRows);
			// log(targetCols);
			// log(count);
			// log(Width/Height);
			// log(1/vid_ratio);
			
			var videos_ratio = (targetRows/targetCols) * vid_ratio;
			if (videos_ratio > availableRatio) {
				targetHeight = Math.floor( Height/targetRows );
				targetWidth = Math.floor( targetHeight/vid_ratio );
			} else {
				targetWidth = Math.floor( Width/targetCols );
				targetHeight = Math.floor( targetWidth*vid_ratio );
			}

			var spacesInLastRow = (targetRows * targetCols) - count;
			var lastRowMargin = (spacesInLastRow * targetWidth / 2);
			var lastRowIndex = (targetRows - 1) * targetCols;

			var firstRowMarginTop = ((Height - (targetRows * targetHeight)) / 2);
			var firstColMarginLeft = 0;

			var x = 0;
			var y = 0;
			for (i=0; i < subscriberBox.children.length; i++) {
				if (i % targetCols == 0) {
					// We are the first element of the row
					x = firstColMarginLeft;
					y += i == 0 ? firstRowMarginTop : targetHeight;
				} else {
					x += targetWidth;
				}

				var parent = subscriberBox.children[i];
				var child = subscriberBox.children[i].firstChild;
				parent.style.position = "absolute";
				parent.style.left = x + "px";
				parent.style.top = y + "px";

				child.width = targetWidth - 2*spadding;
				child.height = targetHeight - 2*spadding;
				child.style.position = "relative";
				child.style.top = spadding.toString() + "px";
				child.style.left = spadding.toString() + "px";

				parent.style.width = targetWidth + "px";
				parent.style.height = targetHeight + "px";
			};
		};
		
		
		that.createSubContainer = function(id, connection) {
			var container = document.createElement("div");
			var div = document.createElement("div");
			div.setAttribute("id", id);
			container.appendChild(div);
			ele.subscriberBox.appendChild(container);
			that.layout();
		};
		that.removeSubContainer = function(subContainer) {
			subContainer.parentNode.removeChild(subContainer);
			that.layout();
		};
		
		that.layout = function() {
			// get window viewport dimensions
			stage.width = jQuery(window).width();
			stage.height = jQuery(window).height();
			// calcs
			var topPadding = 110;
			var lo = {};
			lo.containerHeight = stage.height - topPadding;
			lo.containerWidth = Math.min(stage.width - constants.PUBLISHER_COLUMN_WIDTH, lo.containerHeight*3) - 20;
			// lo.containerWidth = stage.width - constants.PUBLISHER_COLUMN_WIDTH - 20;
			lo.containerTop = topPadding;
			lo.containerLeft = $(ele.publisherContainer).width() + 10;
			// subscriber container
			ele.subscriberBox.style.width = lo.containerWidth.toString() + "px";
			ele.subscriberBox.style.height = lo.containerHeight.toString() + "px";
			ele.subscriberBox.style.top = lo.containerTop.toString() + "px";
			ele.subscriberBox.style.left = lo.containerLeft.toString() + "px";
			// publisher
			// ele.publisherContainer.style.top = (((lo.containerHeight - $(ele.publisherContainer).height()) / 2)).toString() + "px";
			
			adamLayout( lo );
		};
		
		window.onresize = function(e){
			that.layout();
		};
		
		that.init = function() {
			that.layout();
		};
		
		return that;
	}();

	
	var removeEle = function(ele) {
		ele.parentNode.removeChild(ele);
	};
	var addEle = function(eleid, par) {
		var div = document.createElement("div");
		div.setAttribute("id", eleid);
		par.appendChild(div);		
	};
	view.showJoinCTA = function() {
		$(ele.joinCTA).show();
	};
	view.hideJoinCTA = function() {
		$(ele.joinCTA).hide();
	};
	
	
	
	// opentok 
	function sessionConnectedHandler (event) {
		log('connected');
		subscribeToStreams(event.streams);
		publish();
	}
	
	function connectionCreatedHandler(event) {
	}
	function connectedDestroyedHandler(event) {
	}
	
	function connect() {
		session.connect(otdata.apikey, otdata.token);
	}	
	
	function publish() {
		var div = document.createElement("div");
		div.setAttribute("id", "publisher");
		ele.publisherContainer.appendChild(div);
		
		publisher = session.publish("publisher", {width:230, height:160, name: ""});
		publisher.addEventListener("echoCancellationModeChanged", onEchoCancellationModeChangedHandler);
		publisher.addEventListener("accessDenied", onAccessDenied);
		publisher.addEventListener("accessAllowed", onAccessAllowed);
		
		view.hideJoinCTA();
		
		layoutManager.layout();
	}
	
	function unpublish() {
		if (session) {
			session.unpublish( publisher );
			view.showJoinCTA();
			layoutManager.layout();
		}
	}
	
	function onAccessDenied (event) {
		unpublish();
	}
	function onAccessAllowed (event) {
		if (publisher){
			var pubele = document.getElementById(publisher.id);
			pubele.style.width = "230px";
			pubele.style.height = "160px";
			pubele.style.marginLeft = "25px";
			pubele.style.marginTop = "35px";
		}
	}
	
	function onEchoCancellationModeChangedHandler (event) {
	}
	
	function sessionDisconnectedHandler (event) {
		for (var subscriber in session.subscribers) {
			removeSubscriber(session.subscribers[subscriber]);
		};
	}

	function streamCreatedHandler (event) {
		subscribeToStreams(event.streams);
	}
	
	function signalReceivedHandler (event) {
	}
	
	function removeSubscriber(subscriber) {
		var subContainer = document.getElementById(subscriber.id).parentNode;
		session.unsubscribe(subscriber);
		layoutManager.removeSubContainer(subContainer);
	}
	

	
	function numStreamsChanged (nstreams) {
		layoutManager.layout();
	}
	
	function streamDestroyedHandler (event) {
		event.preventDefault();
		
		for (var i=0; i < event.streams.length; i++) {
			var subscribers = session.getSubscribersForStream(event.streams[i]);
			for (var j=0; j < subscribers.length; j++) {
				removeSubscriber(subscribers[j]);
			};
		};
		numStreamsChanged();
	}
	
	function subscribeToStreams (streams) {
		for (var i=0; i < streams.length; i++) {
			var stream = streams[i];
			if (stream.connection.connectionId != session.connection.connectionId) {
				var divId = "subscriber_" + stream.streamId;
				layoutManager.createSubContainer(divId, stream.connection);
				session.subscribe(stream, divId, {subscribeToAudio: true});
			}
		}
		numStreamsChanged();
	}
	
	
	function initSession() {
		TB.setLogLevel(TB.DEBUG); // GTODO
		// start opentok session
		session = TB.initSession(otdata.sid);
		// add opentok event handlers
		session.addEventListener("sessionConnected", sessionConnectedHandler);
		session.addEventListener("sessionDisconnected", sessionDisconnectedHandler);
		session.addEventListener("streamCreated", streamCreatedHandler);
		session.addEventListener("streamDestroyed", streamDestroyedHandler);
		session.addEventListener("signalReceived", signalReceivedHandler);
		session.addEventListener("connectionCreated", connectionCreatedHandler);
		session.addEventListener("connectionDestroyed", connectedDestroyedHandler);
		
		session.connect(otdata.apikey, otdata.token);
	}
	
	var initUi = function() {
		ele.joinCTA.onclick = function(e) {
			publish();
			return false;
		};
		ele.shareFbBtn.onclick = function(e){
			var title = "Come chat was us!";
			var shareurl = "http://www.facebook.com/sharer.php?s=100&p[title]=" + encodeURIComponent( title ) + "&p[url]=" + encodeURIComponent( document.URL ) + "&p[summary]=";
			window.open(shareurl, "facebook", "width=550,height=500,left=500,top=100,resizable=1");
		};
		ele.shareTwBtn.onclick = function(e){
			status = "Come chat was us!";
			var shareurl = 'http://twitter.com/intent/tweet?text=' + encodeURIComponent(status) + "&url=" + encodeURIComponent(document.URL);
			window.open(shareurl, "twitter", "width=550,height=345,left=500,top=100,resizable=1");
		};
		
		ele.displayCurrUrl.innerHTML = document.URL;
	};
	
	that.init = function(){
		// swf elements
		ele.headerWrapper = document.getElementById("header-wrapper");
		ele.chat = document.getElementById("chat");
		ele.subscriberBox = document.getElementById("subscriberBox");
		ele.publisherContainer = document.getElementById("publisherContainer");
		ele.joinCTA = document.getElementById("joinCTA");
		ele.displayCurrUrl = document.getElementById("displayCurrUrl");
		ele.shareFbBtn = document.getElementById("shareFbBtn");
		ele.shareTwBtn = document.getElementById("shareTwBtn");
		
		
		//ui event handlers
		initUi();

		// LayoutContainer.init("subscriberBox", stage.width - constants.PUBLISHER_COLUMN_WIDTH, stage.height);
		layoutManager.init();
		
		initSession();
	};


	
	return that;
};



