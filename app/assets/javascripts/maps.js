var map;

function initMap(x, y, image){
	image = typeof image !== 'undefined' ? image : currentLocationImage;
	
	//init map
  var mapOptions = {
    zoom: 15,
    center: new google.maps.LatLng(x, y)
  };

  map = new google.maps.Map(document.getElementById('mapArea'),
      mapOptions);

	  //set marker at current location
	  var myLatLng = new google.maps.LatLng(x, y);
	  
	  var currentLocation = new google.maps.Marker({
		  position: myLatLng,
		  map: map,
		  icon: image
	  });
	  
}


function getPoint(string, callback){


		//google Geocoding API
		var url = "http://maps.googleapis.com/maps/api/geocode/json?address=" + string.replace(" ", "+") + "&sensor=false";
		$.get( url, function( data ) {
			if(data && data.results){
				if(data.results.length > 0){
					callback(data.results[0].geometry.location);
				}
			}
		});
}

function placeMarker(lat, lng, content, number){

	//create marker
	var marker = new numberedCircle(new google.maps.LatLng(lat,lng), circleMarkerImage, number, map, content);
	
}

function generateContent(data){
	var item = $(".listItem[data-id=" + data.id + "]");
	var container = $("<div class='markerPopup' />");
	container.append(item.clone());

	return container;
}

function setPoint(data, number){
	if(data.latitude && data.longitude){
		placeMarker(data.latitude, data.longitude, generateContent(data), number);
	}
}


/*
* Create a new marker that allows text
*/
numberedCircle.prototype = new google.maps.OverlayView();

function numberedCircle(center, image, text, map, content) {
	
	// Initialize all properties.
	this.center_ = center;
	this.image_ = image;
	this.text_ = text;
	this.map_ = map;
	this.content_ = content;
	
	
	
	// this will hold the div displayed on the map
	this.div_ = null;

	// Place on map
	this.setMap(map);
}

numberedCircle.prototype.onAdd = function() {
	var me = this;

	//generate the content
	//TODO: move all style to css using className
	var div = document.createElement('div');
	div.style.borderStyle = 'none';
	div.style.borderWidth = '0px';
	div.style.position = 'absolute';
	div.className = "numberCircle";
	div.onclick = function(){
		me.openPopup(me.content_);
		};
	
	var img = document.createElement('img');
	img.className = "mapIconImage";
	img.src = this.image_;
	img.style.position = 'absolute';
	div.appendChild(img);
	
	var textDiv = document.createElement('div');
	textDiv.className = "numberCircleText";
	textDiv.style.position = 'absolute';
	textDiv.style.top = 0;
	textDiv.style.left = 0;
	textDiv.style.width = '100%';
	textDiv.style.height = '100%';
	textDiv.innerHTML = this.text_;
	div.appendChild(textDiv);
	
	this.content_.appendTo(div);

	this.div_ = div;

	// Add the element to the "overlayLayer" pane.
	var panes = this.getPanes();
	panes.overlayMouseTarget.appendChild(div);
};

numberedCircle.prototype.draw = function() {

	// retrieve the projection from the overlay.
	var overlayProjection = this.getProjection();

	// convert the lat/lng to pixel units
	var center = overlayProjection.fromLatLngToDivPixel(this.center_);

	//get image for size calculations
	var div = this.div_;
	var image = div.getElementsByTagName("IMG")[0];
	
	//detect if image has loaded yet or not (we can't get the size until it's loaded)
	if(image.width == 0){
		//set div's location, only thing we can do until image loads
		div.style.left = center.x + 'px';
		div.style.top = center.y + 'px';
		
		image.onload = function(){
			var parent = this.parentNode;
			//offset the parent div so that the image is centered
			parent.style.left = (parent.offsetLeft - (this.width / 2)) + 'px';
			parent.style.top = (parent.offsetTop - (this.height / 2)) + 'px';
			parent.style.width = this.width + 'px';
			parent.style.height = this.height + 'px';
		}
	}else{
		//the image is loaded so we can easily access the size
		//offset the div so that the image is centered
		if(map.getZoom() <= 14){
			image.width = image.naturalWidth / 2;
		}else{
			image.width = image.naturalWidth;
		}
		div.style.left = (center.x - (image.width / 2)) + 'px';
		div.style.top = (center.y - (image.height / 2)) + 'px';
		div.style.width = image.width + 'px';
		div.style.height = image.height + 'px';
		
		//adjust line-height to center text
		div.children[1].style.lineHeight = image.height + 'px';
	}
	console.log(this.content_[0]);
  
};

numberedCircle.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);
  this.div_ = null;
};

numberedCircle.prototype.openPopup = function(content){
	$(content).show();
	
	//hide popup after 10 seconds
	setTimeout(function(){
		content.fadeOut();
		}, 10000);
}

/*
* Geocoding
*/

var currentLocationText = "Current Location";

function searchLocation(search){
	if (search == currentLocationText) {
		searchCurrent();
		return;
	}
	
	if(search == ""){
		handleSearchResults(37.7577, -122.4376);
		return;
	}
	
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({
	  'address': search
	}, function (results, status) {
	  // if match
	  if (status == google.maps.GeocoderStatus.OK) {
			handleSearchResults(results[0].geometry.location.lat(), results[0].geometry.location.lng());
	  } else {
		  emitError("Geocoder failed due to: " + status);
	  }
	});

}

function handleSearchResults(lat, lng){
	$("#lat").val(lat);
	$("#long").val(lng);
	$(".search").find("form").submit();
}

function searchCurrent(){
	getCurrent(function (pos) {
			// set map
			console.log("lat: %s , long: %s", pos.coords.latitude, pos.coords.longitude);
			$("#search").val(currentLocationText);
			handleSearchResults(pos.coords.latitude, pos.coords.longitude);

		});
}

/*
 * Error Handling
 */

function emitError(error){
	alert(error);	
}

function getCurrent (callback) {
	if (navigator.geolocation) {
		$('.currentLocationButton').addClass('currentLocationButtonLocating')

		navigator.geolocation.getCurrentPosition(callback, function (error) {
			// we only need to kill the animation if detection fails
			// — otherwise it can run while the next page loads
			$('.currentLocationButton').removeClass('currentLocationButtonLocating')
			emitError("Location dectection failed due to:" + error);
		});
	}else{
		emitError("Unable to aquire current location");
	}
}

function guessPosition (coords, callback) {
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({
	  'location': new google.maps.LatLng(coords.latitude, coords.longitude)
	}, function (results, status) {
	  // if match
	  if (status == google.maps.GeocoderStatus.OK) {
			callback(results);
	  } else {
		  emitError("Geocoder failed due to: " + status);
	  }
	});
}