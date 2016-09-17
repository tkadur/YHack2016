var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(
	window.innerWidth,
	window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

var fontLoader = new THREE.FontLoader();
fontLoader.load("fonts/helvetiker_regular.typeface.json", function(font) {
	init(font);
	alert("!");
});

// class letter
// parameter character must be of length 1
// parameter font must be loaded font
var letter = function(character, font) {
	this.text = character // the actual character
	
	this.objectID = -1 // the ID of the object (potentially) formed by this character
	
	this.position = new THREE.Vector3(0, 0, 0)
	this.velocity = new THREE.Vector3(0, 0, 0)
	this.destination = new THREE.Vector3(0, 0, 0)

	this.isFree = true

	this.geometry = new THREE.TextGeometry(
		this.text,
		{
			font: font,
			size: 100
		}
		);
	this.material = new THREE.MeshBasicMaterial({
		color: 0xffffff
	});
	this.mesh = new THREE.Mesh(this.geometry, this.material);
}

letter.prototype.render = function(scene) {
	scene.add(this.mesh);
}

function init(font) {
	var l = new letter("t", font);
	l.render(scene);
}

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);
}

render();