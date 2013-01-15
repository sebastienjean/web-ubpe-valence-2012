
var UBPE = {};

UBPE.__DEBUG__ = true;
UBPE.dataFile = 'data/events.json';
UBPE.lastDates = {};
UBPE.timeout = 13000;
UBPE.data = [];
UBPE.rawData = [];
UBPE.stations = [];
UBPE.error = false;
UBPE._timers = {};
UBPE.timer = function(name, fn, time) {
	var timer = setTimeout(fn, time || UBPE.timeout);

	if(UBPE._timers[name]) {
		clearTimeout(UBPE._timers[name]);
	}
	
	UBPE._timers[name] = timer;
	
	return timer;
};
UBPE.clearTimer = function(name) {
	if($.isArray(name)) {
		for (key in name) {
			UBPE.clearTimer(name[key]);
		}
	}
	else {
		if(UBPE._timers[name]) {
			clearTimeout(UBPE._timers[name]);
		}
	}
};

UBPE._onPageUnload = function() {
	for (key in UBPE._timers) {
		if(UBPE._timers[key]) {
			clearTimeout(UBPE._timers[key]);
		}
	}
	
	UBPE._timers = {};
};


/**
 * Function : dump()
 * Arguments: The data - array,hash(associative array),object
 *    The level - OPTIONAL
 * Returns  : The textual representation of the array.
 * This function was inspired by the print_r function of PHP.
 * This will accept some data as the argument and return a
 * text that will be a more readable version of the
 * array/hash/object that is given.
 * Docs: http://www.openjs.com/scripts/others/dump_function_php_print_r.php
 */
function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;
	
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";
	
	if(typeof(arr) == 'object') { //Array/Hashes/Objects 
		for(var item in arr) {
			var value = arr[item];
			
			if(typeof(value) == 'object') { //If it is an array,
				dumped_text += level_padding + "'" + item + "' ...\n";
				dumped_text += dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}


function getFile (file) {
	var data = [];
	
	$.ajax({
			url: file+'?'+$.now(), // Inutile, vu que "cache: false" ?
			async: false,
			dataType: 'text', // Pas 'json' !!!
			cache: false
	}).done(function (text) {
		try
		{
			var newText = text
				.replace('//@@EVENT@@//', '')      // Suppression du commentaire
				.replace(/\](\s*)\[/, '],$1[')     // "][" --> "],["
				.replace(/,(\s*),/, ',null$1,')    // ",," --> ",null,"
				.replace(/,(\s*)\]/, ',null$1]')   // ",]" --> ",null]"
				.replace(/\[(\s*),/, '[null$1,')   // "[," --> "[null,"
			;
			
			//var json = jQuery.parseJSON(newText);
			/*
				--> C'est pas joli, mais le JSON.parse() sort une exception, 
				je pige pas pourquoi ! (Sous FF, Safari, mais pas sous IE !!)
				
				JSON.parse: expected ',' or ']' after array element
				
				Pourtant, le json est bien formé, et "eval()" marche très bien.
				Une erreur d'encodage ??
			*/
			try {
				var json = eval(' ('+newText+') ');
			}
			catch(e) {
				var newText2 = '';
				for (var i = 0; i < newText.length; i++) {
					var ascii = newText.charCodeAt(i);
					
					if((ascii >= 32 && ascii <= 126) || ascii == 10 || ascii == 9) {
						newText2 += newText.charAt(i);
					}
					else {
						newText2 += '0';
					}
				}
				
				var json = eval(' ('+newText2+') ');
			}
		
			if(!$.isArray(json)) {
				data = false;
			}
			else {
				var invalidLine = false;
				
				for (k in json) {
					if($.isArray(json[k]) && json[k].length == 27) {
						data.push(createTrameObj(json[k]));
					}
					else {
						invalidLine = true;
					}
				}
				
				if(invalidLine && UBPE.__DEBUG__) {
					alert('Attention, des lignes mal formées ont été ignorées.');
				}
			}
		}
		catch(e)
		{
			alert('Le fichier "'+file+'" contient une erreur de syntaxe qui n\'a pas pu être corrigée.\n\nErreur:\n'+e+'\n\nLes données n\'ont pas été chargées.');
			data = false;
		}
	}).error(function() {
		data = false;
	});
	
	return data;
}

function parseCoo (coo) {
	if(typeof(coo) == 'undefined' || null == coo) {
		return null;
	}

	var c = parseFloat(coo.substring(0, coo.length-1)) / 100;
	var m = Math.floor(c);
	var dm = ((c - m) * 100) / 60;
	var f = m + dm;
	var l = coo.substring(coo.length-1, coo.length);
	
	if (l == 'S' || l == 'O')
		f = -f;

	return Math.round(f * 1000000) / 1000000;
}

function createTrameObj (row) {
	var date = row[3] ? new Date(row[3]) : null;
	
	var obj = {
		dateRelay:     row[0],
		stationName:   row[1],
		objectName:    row[2],
		dateGPS:       row[3],
		dateGPSFormat: date ? date.toString('M/d/yyyy') : '',
		timeGPSFormat: date ? date.toString('HH:mm:ss') : '',
		latGPS:        row[4],
		longGPS:       row[5],
		latGPSFormat:  parseCoo(row[4]),
		longGPSFormat: parseCoo(row[5]),
		altGPS:        row[6],
		checkGPS:      row[7],
		fixGPS:        row[8],
		numSatsGPS:    row[9],
		speedGPS:      row[10],
		capGPS:        row[11],
		reset:         row[12],
		frameid:       row[13],
		flightloop:    row[14],
		tempIn:        row[15],
		tempOut:       row[16],
		pressure:      row[17],
		boussole:      row[18],
		hygro:         row[19],
		lux1:          row[20],
		lux2:          row[21],
		lux3:          row[22],
		lux4:          row[23],
		luxAverage:    (row[20] + row[21] + row[22] + row[23]) / 4,
		voltage:       row[24],
		dateLoc:       row[25],
		requests:      row[26]
	};
	
	return obj;
}

function getData (file) {
	var json = getFile(file);
	if (json !== false)
	{
		var lastDate = 0;
		for (key in json)
		{
			if (json[key].dateRelay > lastDate) {
				lastDate = json[key].dateRelay;
			}
		}
		
		UBPE.lastDates[file] = lastDate;
	}
	return json;
}

function getNewData(file) {
	var json = getFile(file);
	if (json === false) {
		return false;
	}
	else {
		var newData = [];
		if (typeof(UBPE.lastDates[file]) != 'undefined')
		{
			var newLastDate = lastDate = UBPE.lastDates[file];
			for (key in json)
			{
				if (json[key].dateRelay > lastDate)
				{
					if (json[key].dateRelay > newLastDate)
						newLastDate = json[key].dateRelay;
					newData.push(json[key]);
				}
			}
			UBPE.lastDates[file] = newLastDate;
			return newData;
		}
		else
			return getData(file);
	}
}

/**
 * Met à jour les données et retourne les nouvelles
 *
 */
function updateData () {
	var newData = [];
	var newRawData = getNewData(UBPE.dataFile);
	//alert(UBPE.dataFile +': '+newRawData.length);
	
	if(false == newRawData) {
		newRawData = [];
		UBPE.error = true;
	}
	else {
		UBPE.error = false;
	}
	
	if(newRawData && newRawData.length) {
		UBPE.rawData = $.merge( UBPE.rawData, newRawData );

		for (key in newRawData) {
			var d = filterData(newRawData[key]);
			var st = $.trim(d.stationName);
			newData.push(d);
			
			if('' != st && -1 == jQuery.inArray(st, UBPE.stations)) {
				UBPE.stations.push( st );
			}
		}
		
		UBPE.data = $.merge( UBPE.data, newData );
	}
	
	/*var newData = [];
	for(k in newRawData) {
		newData[k] = filterData(newRawData[k]);

		if(-1 == jQuery.inArray(newData[k].stationName, UBPE.stations)) {
			UBPE.stations.push( newData[k].stationName );
		}
	}*/
	
	return {
		raw: newRawData,
		filtered: newData
	};
}

function errorAccessFile () {
	alert("Erreur d'accès au fichier '"+UBPE.dataFile+"', actualisez la page.");
}
	
function retrieveChartSeries(data, property) {
	var series = [];
	
	$.each(data, function(k,v) {
		series.push( v[property] );
	});
	
	return series;
}

/**
 * Retourne une image correspondant au cap donné
 *
 * @param int cap Le cap, valeur entre 0 et 360
 */
function guessCapImgUrl(cap) {
	if(cap == null || cap == '') {
		return '';
	}

	if(cap > 337.5 && cap <= 22.5) {
		name = 'up';
	}
	else if(cap > 22.5 && cap <= 67.5) {
		name = 'rightup';
	}
	else if(cap > 67.5 && cap <= 112.5) {
		name = 'right';
	}
	else if(cap > 112.5 && cap <= 157.5) {
		name = 'rightdown';
	}
	else if(cap > 157.5 && cap <= 202.5) {
		name = 'down';
	}
	else if(cap > 202.5 && cap <= 247.5) {
		name = 'leftdown';
	}
	else if(cap > 247.5 && cap <= 292.5) {
		name = 'left';
	}
	else {
		name = 'leftup';
	}
	
	return 'img/'+name+'.png';
}

function volt(val, round) {
	var U = 5 * val / 1024;

	if(round) {
		return Math.round( U * 1000) / 1000;
	}
	else {
		return U;
	}
}

function filterData(dataArg) {
		
	var data = $.extend({}, dataArg);

	if(data.tempIn != null) {
		data.tempIn = Math.round( (20.36 * volt(data.tempIn) - 61.42) * 100) / 100;
	}

	if(data.tempOut != null) {
		data.tempOut = Math.round( (20.36 * volt(data.tempOut) - 61.42) * 100) / 100;
	}
	
	if(data.pressure != null) {
		data.pressure = Math.round( -217.39 * volt(data.pressure) + 1059.6);
	}
	
	data.luxAverage = 0;
	for(var i = 1; i < 5; i++) {
		if(data['lux'+i] != null) {
			data['lux'+i] = Math.round(25000 * volt(data['lux'+i]) - 8675);
			data.luxAverage += data['lux'+i];
			        // Ou : 16666 * volt(data['lux'+i]) + 1155
		}
	}
	data.luxAverage /= 4;
	
	if(data.hygro != null) {
		data.hygro = Math.round( (data.hygro / 1024 * 100) * 10) / 10;
	}
	
	if(data.voltage != null) {
		data.voltage = Math.round( (volt(data.voltage) * 2) * 1000) / 1000;
	}
	
	if(data.speedGPS != null) {
		data.speedGPS = Math.round( (data.speedGPS * 1.852) * 100) / 100; // km/h
	}
	
	if(data.boussole != null) {
		data.boussole = Math.round( (57 * volt(data.boussole) - 25) * 100) / 100;
	}
	
	return data;
}

$(document).ready(function (){

	$('nav ul li a').live('click', function () {
		var url = $(this).attr('href');
		$.ajax(url).done(function (data) {
			//UBPE.lastDates = []; NE PAS REMETTRE A ZERO AU CHANGEMENT DE PAGE !!!
			UBPE._onPageUnload();
			$('#content_wrapper').css('height', $('#content').height());
			$('#content').fadeOut(function() {
				$('#content').html(data);
				$('#content').fadeIn(function() {
					$('#content_wrapper').css('height', $('#content').height());
				});
			});
		}).error(function() {
			alert("Page introuvable.");
		});
		return false;
	});

});
