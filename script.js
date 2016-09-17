var scene = new THREE.Scene();
var consoleScene = new THREE.Scene();


var platform_geo, platform_material, platform_mesh;

platform_geo = new THREE.BoxGeometry(200, 10, 100);
platform_material = new THREE.MeshLambertMaterial({color: 0x0000ff, wireframe: true});
platform_mesh = new THREE.Mesh(platform_geo, platform_material);
scene.add(platform_mesh);
platform_mesh.position.set(0, -50, 50);


var camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000);
var consoleCamera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000);

// http://stackoverflow.com/a/29269912/1517227
var renderer = new THREE.WebGLRenderer({
	antialias: true
});
renderer.setClearColor(0xffffff);
renderer.autoClear = false;
renderer.setSize(
	window.innerWidth,
	window.innerHeight);
document.body.appendChild(renderer.domElement);

var dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(100, 100, 50);
scene.add(dirLight);
consoleScene.add(dirLight);

var negativeZ = 0;
var negativeX = 1;
var positiveZ = 2;
var positiveX = 3;

var cameraDistance = 300;
var cameraDir = 0;
var cameraYRotation = 0;
var cameraPosition = new THREE.Vector3(0, 0, cameraDistance);
var rotationX = 0;
var rotationY = 0;

function cameraFollowsLeftTurn(nextPlayerPosition) {
	console.log("l " + nextPlayerPosition);

	cameraDir++;

	cameraYRotation = Math.PI / 2 * cameraDir;
	cameraPosition = new THREE.Vector3(map[nextPlayerPosition].x, map[nextPlayerPosition].y, map[nextPlayerPosition].z);
	cameraPosition.add(new THREE.Vector3(
		Math.sin(cameraYRotation) * cameraDistance,
		0,
		Math.cos(cameraYRotation) * cameraDistance
		));
}

function cameraFollowsRightTurn(nextPlayerPosition) {
	console.log("r " + nextPlayerPosition);

	cameraDir--;

	cameraYRotation = Math.PI / 2 * cameraDir;
	cameraPosition = new THREE.Vector3(map[nextPlayerPosition].x, map[nextPlayerPosition].y, map[nextPlayerPosition].z);
	cameraPosition.add(new THREE.Vector3(
		Math.sin(cameraYRotation) * cameraDistance,
		0,
		Math.cos(cameraYRotation) * cameraDistance
		));
}

camera.position.z = cameraDistance;
consoleCamera.position.z = cameraDistance;

var font;
var fontLoader = new THREE.FontLoader();
fontLoader.load("fonts/lmmrfont.typeface.json", function(response) {
	font = response;
	init(font);
});

// thing types
var player_type = -1;
var line_type = 0;

function getIntroString(type) {
	switch (type) {
		case line_type:
			return "He comes across a line. ";
			break;
		case player_type:
			return "The player? He is surely going to die! ";
			break;
	}
}

function getFormerString(type) {
	if (type == line_type) {
		return "The line is straight and finite. "
	}
}

var things = [];
var encounters = [false]; // length = # of types of things

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

	if (this.type == line_type) {
		this.numLettersRequired = 50;

		var bottom = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
		var top = new THREE.Vector3(this.position.x, this.position.y - 100, this.position.z);

		var total = (this.numLettersRequired - 1);
		for (var x = 0; x <= total; x++) {
			this.positions.push(new THREE.Vector3(
				bottom.x + (top.x - bottom.x) * x / total,
				bottom.y + (top.y - bottom.y) * x / total,
				bottom.z + (top.z - bottom.z) * x / total
			));
		}
		shuffle(this.positions);
	}
}

// 0 = east
// 1 = north
// 2 = west
// 3 = south

var eastOkay = false;
var northOkay = false;
var westOkay = false;
var southOkay = false;

var forwardOkay = false;
var leftOkay = false;
var backOkay = false;
var rightOkay = false;

var map = [
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(40, 0, 0),
	new THREE.Vector3(40, 0, -40),
	new THREE.Vector3(40, 0, 40)
];
var coordsMap = [
	[0, 0],
	[1, 0],
	[1, -1],
	[1, 1]
];

function getMapIndexFromCoords(x, z) {
	for (var i = 0; i < coordsMap.length; i++) {
		if (coordsMap[i][0] == x && coordsMap[i][1] == z) {
			return i;
		}
	}
}

var currentDirection = 0;
var currentCoordX = 0;
var currentCoordZ = 0;
var playerPosition = 0;
var visibility = 50;

function makeThing(id, type, position) {
	things.push(new thing(id, type, position));
}

makeThing(player_type, new THREE.Vector3(0, 0, 0));
makeThing(line_type, new THREE.Vector3(0, 0, -10));
makeThing(line_type, new THREE.Vector3(30, 0, -10));
makeThing(line_type, new THREE.Vector3(30, 0, -40));

makeThing(line_type, new THREE.Vector3(0, 0, 10));
makeThing(line_type, new THREE.Vector3(30, 0, 10));
makeThing(line_type, new THREE.Vector3(30, 0, 40));

var letterHeight = 9;
var reserveMultiplier = 0.7;

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
	this.speed = Math.random() * 1 + 5;

	this.isFree = false;
	this.isDead = false;

	this.geometry = new THREE.TextGeometry(
		this.text,
		{
			font: font,
			size: letterHeight * ((this.type == scene_type) ? reserveMultiplier : 1),
			height: 0.1
		}
		);
	this.material = new THREE.MeshLambertMaterial({
		color: 0x000000,
		transparent: true,
		opacity: 0
	});
	this.mesh = new THREE.Mesh(this.geometry, this.material);

	this.width = 0;

	this.randomFactor = Math.random() - 0.5

	// console letters
	this.consoleTickElapsed = 0;
	this.consoleLineIndex = 0;

	// scene letters
	this.sceneTick = 0;
	this.sceneTickToForm = 100;
	this.sceneArrived = false;
}

letter.prototype.calculateWidth = function() {
	this.geometry.computeBoundingBox();
	this.width = this.geometry.boundingBox.max.x - this.geometry.boundingBox.min.x;
}

function logvector(v, header) {
	console.log(header + ": " + v.x + ", " + v.y + ", " + v.z);
}

letter.prototype.setPosition = function(x, y, z) {
	this.position = new THREE.Vector3(x, y, z);
	this.mesh.position.set(this.position.x, this.position.y, this.position.z);
}

letter.prototype.setDestination = function(x, y, z) {
	this.destination = new THREE.Vector3(x, y, z);
}

letter.prototype.update = function() {
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
		// if (this.type == console_type) {
			this.velocity.subVectors(this.destination, this.position);
			this.velocity.divideScalar(10);
			if (this.velocity.length() > this.speed) {
				this.velocity.setLength(this.speed);
			}

			this.position.add(this.velocity);
			this.mesh.position.set(this.position.x, this.position.y, this.position.z);
		// }

		if (this.type == scene_type) {
			this.sceneTickToForm--;
			this.sceneTick++;

			if (this.sceneTickToForm <= 0) {
				this.mesh.rotation.y = this.sceneTick * this.randomFactor * 0.01;

				if (this.position.distanceTo(this.destination) <= 2) this.sceneArrived = true;
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

		// alert("reset us senpai!");
	}
}

var consoleX = 70;
var consoleY = -120;
var currentConsoleX = consoleX;
var currentConsoleY = consoleY;
var currentLineIndex = 0;
var consoleWidth = 200;
var consoleHeight = -200;
var letterSpacing = 0.275;
var letterWidth = 0;

var gameOver = false;
var playerReadyToMove = false;
var playerMakingMove = false;
var playerMadeMove = false;

function checkDisplayAndStuff() {
	var player = things[0];
	for (var i = 1; i < things.length; i++) {
		var t = things[i];
		var dist = t.position.distanceTo(player.position);
		logvector(t.position, "t.p: ");
		logvector(player.position, "p.p: ");
		console.log(dist);
		if (dist <= visibility) {
			t.isDisplayed = true;

			if (!encounters[t.type]) {
				encounters[t.type] = true;
				addConsoleString(getIntroString(t.type));
			}

			console.log(t.ID + "; " + t.isFormed);
			if (!t.isFormed) {
				t.isFormed = true;
				console.log("come on");
				var numLetters = t.numLettersRequired;
				var numLettersPerString = getFormerString(t.type).length;
				var numStrings = Math.ceil(numLetters / numLettersPerString);
				for (var x = 0; x < numStrings; x++) {
					console.log("yea");
					addReserveString(getFormerString(t.type), t.ID);
				}
			}
		} else {
			t.isDisplayed = false;
			if (t.isFormed) {
				t.isFormed = false;
				console.log(t.ID + ": " + t.isFormed);
				for (var j = 0; j < sceneLetters.length; j++) {
					var nl = sceneLetters[j];
					if (nl.thingID == t.ID) {
						nl.free();
					}
				}
				t.numLettersFormed = 0;
			}
		}
	}

	playerReadyToMove = true;
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

function addConsoleString(s) {
	for (var i = 0; i < s.length; i++) {
		if (s[i] != "\n") {
			var l = new letter(console_type, s[i], font);
			l.setDestination(currentConsoleX, currentConsoleY, 0);
			l.setPosition(currentConsoleX, currentConsoleY + Math.random() - 0.5, 0);
			l.consoleLineIndex = currentLineIndex;

			consoleScene.add(l.mesh);
			consoleLetters.push(l);

			currentConsoleX += letterWidth;
			if (currentConsoleX >= consoleX + consoleWidth) {
				currentConsoleX = consoleX;
				currentConsoleY -= letterHeight * 1.3;
				currentLineIndex++;
			}
		} else {
			currentConsoleX = consoleX;
			currentConsoleY -= letterHeight * 1.3;
			currentLineIndex++;
		}

		if (currentConsoleY < consoleHeight) {
			currentConsoleY += letterHeight * 1.3;
			currentLineIndex--;

			for (var j = 0; j < consoleLetters.length; j++) {
				var nl = consoleLetters[j];
				if (nl.consoleLineIndex == 0) {
					nl.free();
				} else {
					nl.destination.add(new THREE.Vector3(0, letterHeight * 1.3, 0));
					nl.consoleLineIndex--;
				}
			}
		}
	}
}

var tick = 0;

function render() {
	requestAnimationFrame(render);

	renderer.clear();
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render(consoleScene, consoleCamera);

	renderer.clearDepth();
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);

	tick++;
	camera.position.x += (cameraPosition.x - camera.position.x) / 50;
	camera.position.y += (cameraPosition.y - camera.position.y) / 50;
	camera.position.z += (cameraPosition.z - camera.position.z) / 50;

	camera.rotation.x += (rotationX - camera.rotation.x) / 50;
	camera.rotation.y += ((cameraYRotation + rotationY) - camera.rotation.y) / 50;

	for (var i = 0; i < consoleLetters.length; i++) {
		var l = consoleLetters[i];
		if (l.isDead) {
			scene.remove(l.mesh);
			consoleLetters.splice(i, 1);
		}
		l.update();
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
				l.setDestination(newDest.x, newDest.y, newDest.z);

				t.numLettersFormed++;
			}
			else
			{
				l.free();
			}
		}
		else
		{
			if (t.type == player_type)
			{
				if (t.sceneArrived)
				{
					t.sceneArrived = false;
				}
			}
		}
		l.update();
	}

	if (playerReadyToMove) {
		if (!playerMakingMove) {
			addConsoleString("\nThe player... ");

			eastOkay = false;
			northOkay = false;
			westOkay = false;
			southOkay = false;

			forwardOkay = false;
			leftOkay = false;
			backOkay = false;
			rightOkay = false;

			for (var m = 0; m < coordsMap.length; m++) {
				var x = coordsMap[m][0];
				var z = coordsMap[m][1];

				var direction = -1;

				if (x - currentCoordX == 1 && z - currentCoordZ == 0) {
					direction = 0;
					eastOkay = true;
				}
				else if (x - currentCoordX == 0 && z - currentCoordZ == -1) {
					direction = 1;
					northOkay = true;
				}
				else if (x - currentCoordX == -1 && z - currentCoordZ == 0) {
					direction = 2;
					westOkay = true;
				}
				else if (x - currentCoordX == 0 && z - currentCoordZ == 1) {
					direction = 3;
					southOkay = true;
				}

				if (direction != -1) {
					console.log(currentDirection + " .. " + direction + " -> " + x + ", " + z);
					if ((direction - currentDirection + 4) % 4 == 0) {
						forwardOkay = true;
						addConsoleString("\nf: moves forward. ");
						console.log("forward!");
					}
					else if ((direction - currentDirection + 4) % 4 == 1) {
						leftOkay = true;
						addConsoleString("\nl: turns left. ");
						console.log("left!");
					}
					else if ((direction - currentDirection + 4) % 4 == 2) {
						backOkay = true;
						addConsoleString("\nb: goes back. ");
						console.log("back!");
					}
					else if ((direction - currentDirection + 4) % 4 == 3) {
						rightOkay = true;
						addConsoleString("\nr: turns right. ");
						console.log("right!");
					}
				}
			}

			playerMakingMove = true;
		}
	}

	if (playerMadeMove) {
		playerReadyToMove = false;
		playerMakingMove = false;
		playerMadeMove = false;

		// senpai will reset you
		currentReserveX = reserveX;
		currentReserveY = reserveY;

		checkDisplayAndStuff();
	}
}

render();

$("body").on("mousemove", function(event) {
	rotationY = -(event.pageX - window.innerWidth / 2) * 0.001;
	rotationX = -(event.pageY - window.innerHeight / 2) * 0.001;
});

$("body").bind("keypress", function(event) {
	if (event.which >= 97 && event.which <= 122) {
		result = -3;
		if (event.which == 102 && forwardOkay) {
			result = 0;
		} else if (event.which == 108 && leftOkay) {
			result = 1;
		} else if (event.which == 98 && backOkay) {
			result = 2;
		} else if (event.which == 114 && rightOkay) {
			result = 3;
		}

		if (playerMakingMove) {
			if ((!playerMadeMove) && (result != -3)) {
				playerMadeMove = true;

				currentDirection += result;
				currentDirection %= 4;

				if (currentDirection % 4 == 0) {
					currentCoordX++;
				}
				else if (currentDirection % 4 == 1) {
					currentCoordZ--;
				}
				else if (currentDirection % 4 == 2) {
					currentCoordX--;
				}
				else if (currentDirection % 4 == 3) {
					currentCoordZ++;
				}

				playerPosition = getMapIndexFromCoords(currentCoordX, currentCoordZ);
				console.log("get " + currentCoordX + ", " + currentCoordZ + " -> " + playerPosition);

				var movement = new THREE.Vector3();
				movement.subVectors(map[playerPosition], things[0].position);

				things[0].position.add(movement);

				if (result == 0) {
					cameraPosition.add(movement);
				}
				else if (result == 1) {
					cameraFollowsLeftTurn(playerPosition);
				}
				else if (result == 2) {
					cameraPosition.add(movement);
				}
				else if (result == 3) {
					cameraFollowsRightTurn(playerPosition);
				}
			}
		}
	} else {
		addConsoleString("abcdefhiijidjsfkl");
	}
})
