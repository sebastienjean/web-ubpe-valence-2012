(function($)
{
	$.fn.initMap = function (options)
	{
		var defauts = {
			init: [44.91, 4.91],
			type: google.maps.MapTypeId.SATELLITE,
			width: '700',
			height: '500',
			zoom: 10
		};

		var params = $.extend(defauts, options);
		
		return this.each(function()
		{
			var root = this;
			var element = $(this);

			element.css({
				width: params.width,
				height: params.height,
				margin: 'auto'
			});

			var optionsAPI = {
				center: new google.maps.LatLng(params.init[0], params.init[1]),
				zoom: params.zoom,
				mapTypeId: params.type
			};

			var map = new google.maps.Map(root, optionsAPI);
			var markers = [];
			var line = [];
			element.data('map', map);
			element.data('markers', markers);
			element.data('line', line);
		});
	}

	$.fn.traceMap = function (options)
	{
		var defauts =
		{
			color: 'red',
			opacity: 1.0,
			weight: 5,
			path: new Array(2)
		};

		var params = $.extend(defauts, options);
		
		return this.each(function()
		{
			var root = this;
			var element = $(this);

			var map = element.data('map');
			var markers = element.data('markers');
			var line = element.data('line');
			
			for (var i=0; i < markers.length; i++)
				markers[i].setMap(null);
			
			if(line.setMap) {
				line.setMap(null);
			}

			var route = [];
			var texts = {};
			var openedInfoWindow = null;
			for (var i=0; i < params.path.length; i++)
			{
					var latlng = new google.maps.LatLng(params.path[i].latGPSFormat, params.path[i].longGPSFormat);
					route.push(latlng);
					var mark = new google.maps.Marker({
						position: new google.maps.LatLng(params.path[i].latGPSFormat, params.path[i].longGPSFormat),
						map: map,
						title: params.path[i].timeGPSFormat
					});
					markers.push(mark);
					var txtIdx = params.path[i].latGPSFormat +' '+ params.path[i].longGPSFormat;
					texts[txtIdx] = '<div>Données reçues le '+params.path[i].dateGPSFormat+' à '+params.path[i].timeGPSFormat+'</div>'+
						         '<div><b><span style="display:inline-block;width:100px;">Altitude :</span>'+params.path[i].altGPS+' m</b></div>'+
						         '<div><b><span style="display:inline-block;width:100px;">Vitesse :</span>'+params.path[i].speedGPS+' km/h</b></div>'+
								 '<br /><br /><a href="#" style="text-decoration:none;" onclick="'+
									'var $elm = $(\'.map\').eq(0);'+
									'if($elm.data(\'markers\')['+(markers.length-2)+']) {'+
										'var marker = $elm.data(\'markers\')['+(markers.length-2)+'];'+
										'$elm.data(\'map\').setCenter(marker.getPosition()); '+
										'google.maps.event.trigger(marker, \'click\');'+
									'}'+
								';return false;">&rarr; Point suivant</a>';
								 
					attachInfoWindow(mark, txtIdx);
					/*var infowindow = new google.maps.InfoWindow({
						//content: '<b><u><i>'+params.path[i].dateGPSFormat+' '+params.path[i].timeGPSFormat+'</i></u></b>'
						content: txt
					});
					google.maps.event.addListener(mark, 'click', function() {
						infowindow.open(map, this);
						alert(mark.getPosition());
					});*/
			}
			
			function attachInfoWindow(marker, i) {
				var infowindow = new google.maps.InfoWindow({
					//content: '<b><u><i>'+params.path[i].dateGPSFormat+' '+params.path[i].timeGPSFormat+'</i></u></b>'
					content: texts[i]
				});
				google.maps.event.addListener(marker, 'click', function() {
					if(null != openedInfoWindow) {
						openedInfoWindow.close();
					}
					infowindow.open(map, this);
					openedInfoWindow = infowindow;
				});
			}

			var line = new google.maps.Polyline({
				map: map,
				path: route,
				strokeColor: params.color,
				strokeOpacity: params.opacity,
				strokeWeight: params.weight
			});
			element.data('markers', markers);
			element.data('line', line);
		});
	}
})(jQuery);