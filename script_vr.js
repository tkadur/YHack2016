THREE.DeviceOrientationControls = function ( object ) {
 
        var scope = this;
 
        this.object = object;
        this.object.rotation.reorder( "YXZ" );
 
        this.enabled = true;
 
        this.deviceOrientation = {};
        this.screenOrientation = 0;
 
        var onDeviceOrientationChangeEvent = function ( event ) {
 
                scope.deviceOrientation = event;
 
        };
 
        var onScreenOrientationChangeEvent = function () {
 
                scope.screenOrientation = window.orientation || 0;
 
        };
 
        // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''
 
        var setObjectQuaternion = function () {
 
                var zee = new THREE.Vector3( 0, 0, 1 );
 
                var euler = new THREE.Euler();
 
                var q0 = new THREE.Quaternion();
 
                var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis
 
                return function ( quaternion, alpha, beta, gamma, orient ) {
 
                        euler.set( beta, alpha, - gamma, 'YXZ' );                       // 'ZXY' for the device, but 'YXZ' for us
 
                        quaternion.setFromEuler( euler );                               // orient the device
 
                        quaternion.multiply( q1 );                                      // camera looks out the back of the device, not the top
 
                        quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) );    // adjust for screen orientation
 
                }
 
        }();
 
        this.connect = function() {
 
                onScreenOrientationChangeEvent(); // run once on load
 
                window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
                window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
 
                scope.enabled = true;
 
        };
 
        this.disconnect = function() {
 
                window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
                window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
 
                scope.enabled = false;
 
        };
 
        this.update = function () {
 
                if ( scope.enabled === false ) return;
 
                var alpha  = scope.deviceOrientation.alpha ? THREE.Math.degToRad( scope.deviceOrientation.alpha ) : 0; // Z
                var beta   = scope.deviceOrientation.beta  ? THREE.Math.degToRad( scope.deviceOrientation.beta  ) : 0; // X'
                var gamma  = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''
                var orient = scope.screenOrientation       ? THREE.Math.degToRad( scope.screenOrientation       ) : 0; // O
 
                setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );
 
        };
 
        this.connect();
 
};
THREE.StereoEffect = function ( renderer ) {

	var _stereo = new THREE.StereoCamera();
	_stereo.aspect = 0.5;

	this.setEyeSeparation = function ( eyeSep ) {

		_stereo.eyeSep = eyeSep;

	};

	this.setSize = function ( width, height ) {

		renderer.setSize( width, height );

	};

	this.render = function ( scene, camera ) {

		scene.updateMatrixWorld();

		if ( camera.parent === null ) camera.updateMatrixWorld();

		_stereo.update( camera );

		var size = renderer.getSize();

		if ( renderer.autoClear ) renderer.clear();
		renderer.setScissorTest( true );

		renderer.setScissor( 0, 0, size.width / 2, size.height );
		renderer.setViewport( 0, 0, size.width / 2, size.height );
		renderer.render( scene, _stereo.cameraL );

		renderer.setScissor( size.width / 2, 0, size.width / 2, size.height );
		renderer.setViewport( size.width / 2, 0, size.width / 2, size.height );
		renderer.render( scene, _stereo.cameraR );

		renderer.setScissorTest( false );

	};

};

var timer = 0;

var gyroPresent = false;
window.addEventListener("devicemotion", function(event){
    if(event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma)
        gyroPresent = true;
});

var final_transcript = '';
var interim_transcript = '';
//var resetSentence = 0;
// start speech
//make sure api is supported by browser
if (!('webkitSpeechRecognition' in window)) {
    //Speech API not supported here…
    //alert("This won't work here");
} else { //Let’s do some cool stuff :)
    var recognition = new webkitSpeechRecognition(); //That is the object that will manage our whole recognition process. 
    recognition.continuous = true;   //Suitable for dictation. 
    recognition.interimResults = false;  //If we want to start receiving results even if they are not final.
    //Define some more additional parameters for the recognition:
    recognition.lang = "en-US"; 
    recognition.maxAlternatives = 1; //Since from our experience, the highest result is really the best...
}

//what should happen while the voice is being processed
recognition.onstart = function() {
    //Listening (capturing voice from audio input) started.
    //This is a good place to give the user visual feedback about that (i.e. flash a red light, etc.)
};

recognition.onend = function() {
    //Again – give the user feedback that you are not listening anymore. If you wish to achieve continuous recognition – you can write a script to start the recognizer again here.
//final_transcript = '';
console.log('Speech recognition service disconnected');
recognition.start();

};

recognition.onerror=function() {
	recognition.start();
}


recognition.onresult = function(event) { //the event holds the results
//Yay – we have results! Let’s check if they are defined and if final or not:
 	for (var i = event.resultIndex; i < event.results.length; ++i) {
 		console.log("Running")
      if (event.results[i].isFinal) {

      	if(final_transcript.length > 15)
      	{
      		final_transcript = '';
      	}

        final_transcript += event.results[i][0].transcript;
        interim_transcript = '';
        console.log("Final:" + final_transcript);
        timer = (new Date()).getTime();
      } else {
        interim_transcript += event.results[i][0].transcript;
        console.log("Interim:" + interim_transcript);
      }
    }
    recognition.start();

}; 

var camVector = new THREE.Vector3();


var scene = new THREE.Scene();
var consoleScene = new THREE.Scene();
/*
var platform_geo, platform_material, platform_mesh;

var platformAdded = false;
var arriveMsg = false;

platform_geo = new THREE.BoxGeometry(100, 10, 100);
//platform_material = new THREE.MeshBasicMaterial({color: 0xadd8e6});
platform_mesh = new THREE.Mesh(platform_geo, platform_material);

platform_mesh.position.set(1600, -150, 0);
*/
var camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	500);

var controls;
controls = new THREE.DeviceOrientationControls( camera );

 controls.noZoom = true;
 controls.noPan = true;

// http://stackoverflow.com/a/29269912/1517227
var renderer = new THREE.WebGLRenderer({
	antialias: true
});
renderer.setClearColor(0xffffff);
renderer.autoClear = true;
renderer.setSize(
	1280,
	720);
effect = new THREE.StereoEffect(renderer);
//effect.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

var wscale = window.innerWidth / 1280;
var hscale = window.innerHeight / 720;

renderer.domElement.style.width = renderer.domElement.width * wscale + 'px';
renderer.domElement.style.height = renderer.domElement.height * hscale + 'px';

var dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(100, 100, 50);
scene.add(dirLight);
consoleScene.add(dirLight);

var negativeZ = 0;
var negativeX = 1;
var positiveZ = 2;
var positiveX = 3;

var cameraDistance = 0;
var cameraDir = 0;
var cameraYRotation = 0;
var cameraPosition = new THREE.Vector3(0, 0, cameraDistance);
var rotationX = 0;
var rotationY = 0;

camera.position.z = cameraDistance;
//consoleCamera.position.z = cameraDistance;

var font;
var fontLoader = new THREE.FontLoader();
var arrayOfAlphabets = []

fontLoader.load("fonts/lmmrfont.typeface.json", function(response) {
	font = response;
	makeTextGeometries(font);
	init(font);
});

var smallTextGeometries = [];
//var largeTextGeometries = [];

var allString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,. *:'"

var letterHeight = 9;
var reserveMultiplier = 0.7;

function makeTextGeometries(font) {
	for (var i = 0; i < allString.length; i++) {
		var smallGeometry = new THREE.TextGeometry(
			allString[i],
			{
				font: font,
				size: letterHeight * reserveMultiplier,
				height: 0.1
			}
			);
		smallTextGeometries.push(smallGeometry);
	}
}

function getSmallTextGeometry(character) {
	var index = allString.indexOf(character);
	if (character != -1) {
		return smallTextGeometries[index];
	}
}

// thing types
var player_type = -1;

function getFormerString(type) {
	return allString
}

var things = [];
//var encounters = [false]; // length = # of types of things

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

// class thing
var thing = function(type, position) {
	this.ID = things.length;
	this.type = type;
	this.isDisplayed = false;
	this.isFormed = false;
	this.position = position;

	this.numLettersRequired;
	this.numLettersFormed = 0;
	this.positions = [];
	this.colors = [];

	if (gyroPresent) {
		this.numLettersRequired = 500;
	} else {
		this.numLettersRequired = 500;
	}
	this.isBlob = true;
	
	for (var x = 0; x < this.numLettersRequired; x++) {
		var vec = new THREE.Vector3(
			Math.random() * 30 - 15,
			Math.random() * 30 - 15,
			Math.random() * 30 - 15
			);
		vec.setLength(15);
		vec.add(new THREE.Vector3(0, 80, 0));
		this.positions.push(vec);
		if (Math.random() > 0.5) {
			this.colors.push(0x000044);
		} else {
			this.colors.push(0x000022);
		}
	}
			
}

thing.prototype.assignNewDestination = function() {
	if (!this.isBlob) {
		return;
	}

	return new THREE.Vector3(
		Math.random() * 1000 - 500,
		Math.random() * 50 - 70,
		Math.random() * 1000 - 500
	);

}

function makeThing(type, position) {
	things.push(new thing(type, position));
}

makeThing(player_type, new THREE.Vector3(0, 0, 0));

var scene_type = 0;
var console_type = 1;

// class letter
// parameter character must be of length 1
// parameter font must be loaded font
var letter = function(type, character, font) {
	this.type = type;
	this.text = character; // the actual character

	this.thingID = -1; // the ID of the thing (potentially) formed by this character

	this.position = new THREE.Vector3(0, 0, 0);
	this.velocity = new THREE.Vector3(0, 0, 0);
	this.destination = new THREE.Vector3(0, 0, 0);
	this.speed = Math.random() * 1 + 1.5;

	this.isFree = false;
	this.isDead = false;

	this.geometry;
	this.geometry = getSmallTextGeometry(this.text);

	this.waving = false;
	this.wave = 0;

	this.material = new THREE.MeshBasicMaterial({
		color: 0x000000,
		transparent: true,
		opacity: 0
	});
	this.mesh = new THREE.Mesh(this.geometry, this.material);

	this.width = 0;

	this.randomFactor = Math.random() - 0.5;

	// console letters
	this.consoleTickElapsed = 0;
	this.consoleLineIndex = 0;

	// scene letters
	this.sceneTick = 0;
	this.sceneTickToForm = 100;
	this.sceneArrived = false;

	this.stuck = false;

	
	// snowflakes
	this.isSnowflake = false;
	
}

letter.prototype.calculateWidth = function() {
	this.geometry.computeBoundingBox();
	this.width = this.geometry.boundingBox.max.x - this.geometry.boundingBox.min.x;
}

letter.prototype.setPosition = function(x, y, z) {
	this.position = new THREE.Vector3(x, y, z);
	this.mesh.position.set(this.position.x, this.position.y, this.position.z);
}

letter.prototype.setDestination = function(x, y, z) {
	this.destination = new THREE.Vector3(x, y, z);
}

letter.prototype.update = function() {
	/*
	if (this.text == "A") {
		//this.free();
		this.setPosition(camera.position.x, 100, 100);
		this.speed = 0;
		return;
	}
	*/
	if (this.isFree) {
		this.material.opacity -= 0.01;
		if (this.material.opacity < 0.05) {
			this.isDead = true;
		}

		if (this.type == console_type) {
			this.velocity.add(new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.5, Math.random() - 0.5)) * 0.5;
			if (this.velocity.length() > this.speed) {
				this.velocity.setLength(this.speed);
			}

			this.position.add(this.velocity);
			this.mesh.position.set(this.position.x, this.position.y, this.position.z);
		} else {
			this.velocity.add(new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.5, Math.random() - 0.5)) * 0.5;
			if (this.velocity.length() > this.speed) {
				this.velocity.setLength(this.speed);
			}

			this.position.add(this.velocity);
			this.mesh.position.set(this.position.x, this.position.y, this.position.z);
		}
	}
	else
	{
		this.material.opacity += 0.1;
		if (this.material.opacity > 1) {
			this.material.opacity = 1;
		}
		this.velocity.subVectors(this.destination, this.position);
		this.velocity.divideScalar(10);
		if (this.velocity.length() > this.speed) {
			this.velocity.setLength(this.speed);
		}

		this.position.add(this.velocity);
		this.mesh.position.set(this.position.x, this.position.y, this.position.z);

		if (this.type == scene_type) {
			this.sceneTickToForm--;
			this.sceneTick++;

			if (this.sceneTickToForm <= 0) {
				this.mesh.rotation.y = Math.PI - this.sceneTick * this.randomFactor * 0.01;

				if (this.mesh.position.distanceTo(this.destination) < 2) {
					this.sceneArrived = true;
				}
			}
		}
	}
}

letter.prototype.free = function() {
	this.isFree = true;
}

var sceneLetters = [];
var consoleLetters = [];

var sceneString = "";
var consoleString = "";

var reserveX = 200;
var reserveY = 100;
var currentReserveX = reserveX;
var currentReserveY = reserveY;
var reserveWidth = 150;
var spikeBool = false;
var spikeCounter = 0;
var smallNoiseBool = false;

function addReserveString(s, id) {
	for (var i = 0; i < s.length; i++) {
		var l = new letter(scene_type, s[i], font);
		l.thingID = id;
		l.setDestination(currentReserveX, currentReserveY, 0);
		l.setPosition(currentReserveX, currentReserveY - 20 - Math.random() * 5, 0);

		scene.add(l.mesh);
		sceneLetters.push(l);

		currentReserveX += letterWidth * reserveMultiplier;
		if (currentReserveX >= reserveX + reserveWidth) {
			currentReserveX = reserveX;
			currentReserveY -= letterHeight;
		}

	}
}

function checkDisplayAndStuff() {
	var player = things[0];
	
	for (var i = 0; i < things.length; i++) {
		var t = things[i];
		//var dist = t.position.distanceToSquared(player.position);
		//if (i == 0 || dist <= visibility * visibility) {
			t.isDisplayed = true;

			/*
			if (!encounters[t.type]) {
				encounters[t.type] = true;
			}
			*/

			if (!t.isFormed) {
				t.isFormed = true;
				var numLetters = t.numLettersRequired;
				var numLettersPerString = allString.length;
				var numStrings = Math.ceil(numLetters / numLettersPerString);
				for (var x = 0; x < numStrings; x++) {
					addReserveString(allString, t.ID);
				}
			}
		/*
		} else {
			t.isDisplayed = false;
			if (t.isFormed) {
				t.isFormed = false;
				for (var j = 0; j < sceneLetters.length; j++) {
					var nl = sceneLetters[j];
					if (nl.thingID == t.ID) {
						nl.free();
					}
				}
				t.numLettersFormed = 0;
			}
		}
		*/
	}
	
	//playerReadyToMove = true;
}

function init(font) {
	var l = new letter(console_type, "a", font);
	l.calculateWidth();
	letterWidth = l.width;

	// main code

	// check which things to display
	// accordingly introduce new things with addConsoleString
	// form the to-be-displayed things, free the no-longer-displayed things
	checkDisplayAndStuff();

	// ask the player to make a move
}

var tick = 0;

var targetStr = "";


recognition.start();

var clock = new THREE.Clock();

function render() {
	
	var timeout;

	if (gyroPresent) {
		timeout = 25000;
	} else {
		timeout = 10000;
	}

	if ((new Date()).getTime() - timer > timeout) { final_transcript = ""; }

	targetStr = final_transcript;

	var target = targetStr.split("");
	var counter = 0;
	var vc = 0;
	
	requestAnimationFrame(render);

	//effect.clear();
	/*
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render(consoleScene, consoleCamera);

	renderer.clearDepth();
	*/
	//effect.setViewport(0, 0, window.innerWidth, window.innerHeight);
	//renderer.render(scene, camera);

	//update(clock.getDelta());
	//effect.render(clock.getDelta());
	effect.render(scene, camera);

	tick++;
	if (gyroPresent) {
		controls.update();
	} else {
		camera.rotation.x += (rotationX - camera.rotation.x) / 20;
		camera.rotation.y += ((cameraYRotation + rotationY) - camera.rotation.y) / 20;
	}
	
	var camVector = new THREE.Vector3( 0, 0, - 1 );
	camVector.applyQuaternion( camera.quaternion );

	camera.getWorldDirection(camVector);

	
	for (var iter = 0; iter < 1; iter++) {
		var flake = new letter(console_type, "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)], font);
		flake.isSnowflake = true;
		flake.setPosition(Math.random() * 1600 - 800, Math.random() * 1000, Math.random() * 1600 - 800);
		flake.setDestination(flake.position.x + Math.random() * 100 - 50, -200, flake.position.z + Math.random() * 100 - 50);
		flake.speed = 2;

		var color;
		var r = Math.floor(Math.random() * 3);
		if (r == 0) {
			color = 0xdddddd;
		}
		else if (r == 1) {
			color = 0xcccccc;
		}
		else if (r == 2) {
			color = 0xaaaaaa;
		}

		flake.mesh.material.color.setHex(color);
		scene.add(flake.mesh);
		consoleLetters.push(flake);
	}
	
	
	for (var i = 0; i < consoleLetters.length; i++) {
		var l = consoleLetters[i];
		if (l.isDead) {
			scene.remove(l.mesh);
			consoleLetters.splice(i, 1);
		}
		
		
		if (l.isSnowflake && l.position.y < -100) {
			l.free();
		}
		
		
		l.update();
	}

	for (var i = 0; i < target.length; i++) {
		var tmp = sceneLetters.shift();
		tmp.text = target[i];
		sceneLetters.unshift(tmp);
	}

	for (var i = 0; i < sceneLetters.length; i++) {
		var l = sceneLetters[i];
		if (l.isDead) {
			scene.remove(l.mesh);
			sceneLetters.splice(i, 1);
		}
		else if ((l.sceneTickToForm == 0) && l.text != " ") {
			l.sceneTickToForm = -1;
			// move them towards characters!
			var t = things[l.thingID];
			if (t.numLettersFormed < t.numLettersRequired) {
				var newDest = t.positions[t.numLettersFormed];
				newDest.add(new THREE.Vector3(
					Math.random() * 4 - 2,
					Math.random() * 4 - 2,
					Math.random() * 4 - 2
					));
				l.mesh.material.color.setHex(t.colors[t.numLettersFormed]);
				l.setDestination(newDest.x, newDest.y, newDest.z);

				t.numLettersFormed++;
			}
			else
			{
				l.free();
			}
		} else if (target.length > 0 && l.text == target[0]) {
			var t = things[l.thingID];
			if (t.isBlob) {
				target.shift();
				counter++;

				if (counter > 15 && l.text == " ") { counter = 0; vc++; }
				//console.log(target.toString());
				var extra = - (3 * counter)

				var targetVector = new THREE.Vector3(0, 25- 10 * vc, 75);
				targetVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), extra * Math.PI / 180 + Math.PI / 8);
				targetVector.applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 36);

				l.setDestination(targetVector.x, targetVector.y, targetVector.z);
				//l.mesh.rotation.y = Math.PI;
				//console.log(camVector);
				l.randomFactor = 0;
				l.sceneArrived = false;
			}
		}
		//Creates spike and disperses after a certain number of cycles
		var vect =  l.position;
		currentDirect = l.destination;
		var lowerBoundX = -100; //Hardcoded rectangular bounds for spike
		var higherBoundX = -50;
		var lowerBoundZ = -100;
		var higherBoundZ = -50;
		if ((vect.x>lowerBoundX) && (vect.x<higherBoundX) &&
		         (vect.z>lowerBoundZ) && (vect.z<higherBoundZ) &&
		         spikeBool)
		{
			var midX = (lowerBoundX+higherBoundX)/2;
			var midZ = (lowerBoundZ+higherBoundZ)/2;
			l.setDestination(midX,10,midZ);
			spikeCounter+=1;
			if (spikeCounter>3000){
				spikeCounter = 0;
				spikeBool = false;
			}
		}
		var offset = 100; //Slightly wider bound
		//Continously creates waves until pressed again...letters however disperse after cycle counter
		if (((vect.x>lowerBoundX-offset) && (vect.x<higherBoundX+offset) &&
		    (vect.z>lowerBoundZ-offset) && (vect.z<higherBoundZ+offset) &&
		         smallNoiseBool) || l.waving)
		{ //Wave generator
			l.setDestination(vect.x+10,vect.y+20*Math.cos(l.wave),currentDirect.z);
			l.wave+=Math.PI/50;
			l.waveCounter+=1;
			//console.log("Testing sin wave");
			if (l.waveCounter>1000){
				l.waveCounter = 0;
				l.waving = false;
			}
		} else if (l.sceneArrived) {
			var t = things[l.thingID];
			if (t.isBlob) {
				l.randomFactor = Math.random() - 0.5;
				var newDest = t.assignNewDestination();
				l.setDestination(newDest.x, newDest.y, newDest.z);
				l.sceneArrived = false;
			}
		}
		l.update();
	}

}

render();

$(document).ready(function() {

  if (navigator.userAgent.match(/Android/i)) {
    window.scrollTo(0,0); // reset in case prev not scrolled  
    var nPageH = $(document).height();
    var nViewH = window.outerHeight;
    if (nViewH > nPageH) {
      nViewH -= 250;
      $('BODY').css('height',nViewH + 'px');
    }
    window.scrollTo(0,1);
  }

});
$("body").on("mousemove", function(event) {
	rotationY = -(event.pageX - window.innerWidth / 2) * 0.01;
	rotationX = -(event.pageY - window.innerHeight / 2) * 0.01;
});

$("body").bind("keypress", function(event) {		
 	if (event.which == 97) {		
 		
 	} else if (event.which == 98) {	
 		//console.log(final_transcript);	
 		//targetStr = final_transcript;
 	} else if (event.which == 99) {		
 		//recognition.stop();
 	} else if (event.which == 32){ //Press Space to see spike
 		spikeBool = !spikeBool;
 	}  else if (event.which == 122){
 		console.log("Z key Pressed");
 		smallNoiseBool = !smallNoiseBool;
 	}
 })