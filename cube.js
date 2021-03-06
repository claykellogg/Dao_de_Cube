// ------------------------------------------------------------ Scene ------------------------------------------------------------
var canvas = document.getElementById('canvas');
var renderer = new THREE.WebGLRenderer({canvas:canvas});
renderer.setClearColor( 0x000000 );
renderer.setPixelRatio( window.devicePixelRatio );
//renderer.setSize( window.innerWidth, window.innerHeight );

var w = canvas.offsetWidth;
var h = canvas.offsetHeight;
renderer.setSize(w, h);
//canvas.appendChild(renderer.domElement);

var scene = new THREE.Scene( );
var camera = new THREE.PerspectiveCamera( 45, w / h, 0.1, 3000 );
var controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set( 0, 8, 12 );
controls.update( );

/*
window.addEventListener( 'resize', function( ) {
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer.setSize( width, height );
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
} );
*/

var ambientLight = new THREE.AmbientLight( 0xFFFFFF, 1.0 );
scene.add( ambientLight );

//var pointLight = new THREE.PointLight( 0xFFFFFF, 0.5 );
//pointLight.position.set( 0, 20, 20 );
//scene.add( pointLight );

function render( ) {
	requestAnimationFrame( render );
	renderer.render( scene, camera );
}
render( );
// ------------------------------------------------------------ End Scene ------------------------------------------------------------

// ------------------------------------------------------------ Objects ------------------------------------------------------------

var cubieSize = 1;
var colors = { 
	'white':0xFFFFFF, 'yellow':0xFFFF00, 'red':0xFF0000, 'orange':0xFFA000, 
	'blue':0x0000FF, 'green':0x00FF00, 'gray':0x505050
};
var colorScheme = { 'R':'red', 'L':'orange', 'U':'yellow', 'D':'white', 'F':'blue', 'B':'green' };
var opposite = {'R':'L', 'L':'R', 'U':'D', 'D':'U', 'F':'B', 'B':'F'};
var keys = [
	'LUF', 'UF', 'RUF', 'LU', 'U', 'RU', 'LUB', 'UB', 'RUB',
	'LF', 'F', 'RF', 'L', 'C', 'R', 'LB', 'B', 'RB', 
	'LDF', 'DF', 'RDF', 'LD', 'D', 'RD', 'LDB', 'DB', 'RDB' 
]

function getCubieColorScheme( key ) {
	var cubieColorScheme = { 'R':'gray', 'L':'gray', 'U':'gray', 'D':'gray', 'F':'gray', 'B':'gray' };  // Default face color is gray until properly computed.
	if ( key == 'C' ) {
		return cubieColorScheme;  // Center cubie is the only default colored cubie.
	}
	for (var index in key ) {
		cubieColorScheme[key[index]] = colorScheme[key[index]];
	}
	return cubieColorScheme;
}

function getCubieFaceColors( cubieColorScheme ) {
	var cubieFaceColors = [ ];
	for (var key in cubieColorScheme) { 	// Each square face is two triangles, so 12 faces to color.
		cubieFaceColors.push( colors[ cubieColorScheme[key] ] );
		cubieFaceColors.push( colors[ cubieColorScheme[key] ] );
	}
	return cubieFaceColors;
}

function color(geometry, faceColors) {
	for ( var i = 0; i < 12; i ++ ) {    // 12 faces because each square is two triangles.
		geometry.faces[ i ].color.setHex( faceColors[i] );
	}
}

var geometries = []		// Create a geometry for each cubie so that they can be colored separately.
for ( let i = 0; i < 27; i++ ) {
	geometries.push( new THREE.BoxGeometry( cubieSize, cubieSize, cubieSize ) );
}		
for ( let i = 0; i < 27; i++ ) {    // Color the 27 cubies.
	color(geometries[i], getCubieFaceColors(getCubieColorScheme(keys[i])));
}			

var material = new THREE.MeshPhongMaterial( {
	//color: 0xffffff,
	side: THREE.DoubleSide,
	vertexColors: THREE.FaceColors,
	polygonOffset: true,
	polygonOffsetFactor: 1, // positive value pushes polygon further away
	polygonOffsetUnits: 1
} );


function addEdges( mesh ) { 	// SOURCE: https://stackoverflow.com/questions/31539130/display-wireframe-and-solid-color
	var geometry = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
	var material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } );
	var edges = new THREE.LineSegments( geometry, material );
	mesh.add( edges );	
}

var cubies = [];		// Holds 27 cubie meshes.

for (let i = 0; i < 27; i++) {
	cubies.push( new THREE.Mesh( geometries[ i ], material ) );
}

for (let i = 0; i < 27; i++) {		
	addEdges( cubies[ i ] );    // Add black edges to cubies to make them more distinguishable.
	cubies[ i ].position.set( -1 + i%3 , 1 - Math.floor(i/9), 1 - Math.floor(i/3)%3 );    // Position the cubies left-to-right, front-to-back, top-to-bottom.
	scene.add( cubies[ i ] );    // Add each cubie  to the scene after its edges and position are computed.
	//cubies[i].matrixAutoUpdate = false;
}

function printObject(object){
	var output = ""
	for (var key in object){
		output = output + key + ": " + object[key] + "\n";
	}
	alert(output);
}
function cloneObject(object){
	var output = {};
	for (var key in object){
		output[key] = object[key];
	}
	return output;
}
function mapObject(func, object){
	var output = cloneObject(object);
	for (var item in output){
		output[item] = func(output[item]);
	}
	return output;
}

function indexOfValue(val, object){
	for (var index in object){
		if (object[index] == val){
			return index;
		}
	}
	return -1;
}

function oppositeColor(color){
	let side = indexOfValue(color, colorScheme);
	return colorScheme[opposite[side]];
}
// ------------------------------------------------------------ End Objects ------------------------------------------------------------

// ------------------------------------------------------------ Start Transformations ------------------------------------------------------------

var orientations = [];
for (let i = 0; i < 27; i++){
	orientations.push(getCubieColorScheme(keys[i]));	// default color scheme enumerates colors of faces of unrotated cubie
}

function computeOrientation(orientation, slice, inverse){
	var clone = cloneObject(orientation);
	var dict = {'R':'DBUF', 'L':'FUBD', 'U':'BLFR', 'D':'RFLB', 'F':'ULDR', 'B':'RDLU', 'M':'FDBU', 'E':'FRBL', 'S':'RDLU', 'X':'FDBU', 'Y':'FRBL', 'Z':'ULDR'};
	var cycle = inverse ? dict[slice].split("").reverse().join("") : dict[slice];    // for example (R not inverse), cycle = 'FUBD'
	for (var i = 0; i < 4; i++){    // D gets B color, B gets U color, U gets F color
		clone[cycle[i]] = orientation[cycle[(i+1)%4]];
	}
	return clone;
}
function computeOrientationGeneral(orientation,move){
	if (move.length == 0) return orientation;
	if (move.length == 1) return computeOrientation(orientation,move,false);
	if (move[1] == "'") return computeOrientation(orientation,move[0],true);
	if (move[1] == "2") return computeOrientation(computeOrientation(orientation,move[0],false),move[0],false);
}
function replaceCharacter(word, oldCharacter, newCharacter){
	if (word.indexOf(oldCharacter) == -1) return word;
	word = word.split("");
	index = word.indexOf(oldCharacter);
	word.splice(index,1,newCharacter);
	word = word.join("");
	return word;
}

var keyPermutations = {		// X,Y,Z hardcoded, X',Y',Z' computed from those using Python
	"X":[6,7,8,15,16,17,24,25,26,3,4,5,12,13,14,21,22,23,0,1,2,9,10,11,18,19,20],
	"X'":[18,19,20,9,10,11,0,1,2,21,22,23,12,13,14,3,4,5,24,25,26,15,16,17,6,7,8],
	"Y":[6,3,0,7,4,1,8,5,2, 15,12,9,16,13,10,17,14,11, 24,21,18,25,22,19,26,23,20],
	"Y'":[2,5,8,1,4,7,0,3,6,11,14,17,10,13,16,9,12,15,20,23,26,19,22,25,18,21,24],
	"Z":[2,11,20,5,14,23,8,17,26,1,10,19,4,13,22,7,16,25,0,9,18,3,12,21,6,15,24],
	"Z'":[18,9,0,21,12,3,24,15,6,19,10,1,22,13,4,25,16,7,20,11,2,23,14,5,26,17,8]
}

function updateKeys(move, inverse){
	let dict = {'X':'FDBU', 'Y':'FRBL', 'Z':'ULDR'};
	let cycle = inverse ? dict[move].split("").reverse().join("") : dict[move];
	if (inverse) move = move + "'";
	let perm = keyPermutations[move];
	let newKeys = Array(27).fill("");
	//let newOrientations = Array(27);
	for (let i = 0; i < 27; i++){
		newKeys[i] = keys[perm[i]];
		//newOrientations[i] = orientations[perm[i]];
	}
	keys = newKeys;
	//orientations = newOrientations;
	let newColorScheme = colorScheme;
	let firstColor = colorScheme[cycle[0]];
	for (let i = 0; i < 3; i++){
		newColorScheme[cycle[i]] = colorScheme[cycle[(i+1)%4]];
	}
	newColorScheme[cycle[3]] = firstColor;
	colorScheme = newColorScheme;
}
function updateKeysGeneral(move){
	if (move.length == 0){
		// pass
	}else if (move.length == 1){
		updateKeys(move[0],false);
	}else if (move[1] == "'"){
		updateKeys(move[0],true);
	}else if (move[1] == "2"){
		updateKeys(updateKeys(move[0],false),move[0],false);
	}
}

var steps = 20;
var theta = Math.PI / ( 2 * steps );
var rotationMatrices = {
	'R':new THREE.Matrix4().makeRotationX( -1*theta ) , 'L':new THREE.Matrix4().makeRotationX( theta ) ,
	'U':new THREE.Matrix4().makeRotationY( -1*theta ) , 'D':new THREE.Matrix4().makeRotationY( theta ) ,
	'F':new THREE.Matrix4().makeRotationZ( -1*theta ) , 'B':new THREE.Matrix4().makeRotationZ( theta ),
	'M':new THREE.Matrix4().makeRotationX( theta ), 'E':new THREE.Matrix4().makeRotationY( theta ),
	'S':new THREE.Matrix4().makeRotationZ( -1*theta ), 'X':new THREE.Matrix4().makeRotationX( -1*theta ),
	'Y':new THREE.Matrix4().makeRotationY( -1*theta ), 'Z':new THREE.Matrix4().makeRotationZ( -1*theta ),

	"R'":new THREE.Matrix4().makeRotationX( theta ) , "L'":new THREE.Matrix4().makeRotationX( -1*theta ) ,
	"U'":new THREE.Matrix4().makeRotationY( theta ) , "D'":new THREE.Matrix4().makeRotationY( -1*theta ) ,
	"F'":new THREE.Matrix4().makeRotationZ( theta ) , "B'":new THREE.Matrix4().makeRotationZ( -1*theta ),
	"M'":new THREE.Matrix4().makeRotationX( -1*theta ), "E'":new THREE.Matrix4().makeRotationY( -1*theta ),
	"S'":new THREE.Matrix4().makeRotationZ( theta ), "X'":new THREE.Matrix4().makeRotationX( theta ),
	"Y'":new THREE.Matrix4().makeRotationY( theta ), "Z'":new THREE.Matrix4().makeRotationZ( theta )
};

//var allowed = {'value':true};
function interpretSequence(sequence) {
	if (sequence == "") return null;    // Cancel function if no moves left in the sequence
	function multiplier(match, p1, p2){
		var _p1 = p1;
		p2--;
		for(var i = 0; i < p2; i++) {
			p1 += _p1;
		}
		return p1;
	}
	function cleaner(match) {
		return ""
	}
	sequence = sequence.replace(/\s+/g, '');
	sequence = sequence.replace(/([RLUDFBMESXYZ])(\d)/g, multiplier);	// if single character is followed by a number
	sequence = sequence.replace(/([(][RLUDFBMESXYZ']+[)])(\d)/g, multiplier);    // if block of characters inside parentheses is followed by a number
	sequence = sequence.replace(/[()]/g, cleaner);    // remove parentheses
	return sequence;
}

function executeMove(move) {
//	if (allowed.value) {
	//	allowed.value = false;
	var slice = move[0];
	var inverse;
	if (move.length > 1 && move[1] == "'") {
		inverse = true;
	}
	else {
		inverse = false;
	}
	
	var step = 0;
	var sliceCubies = [ ]; 
	var dict = {'R':['x',1], 'L':['x',-1], 'U':['y',1], 'D':['y',-1], 'F':['z',1], 'B':['z',-1], 'M':['x',0], 'E':['y',0], 'S':['z',0]}; // Eace slice is determined by the value of the relevant coordinate
	var rotationMatrix = rotationMatrices[move];
	
	if ("XYZ".indexOf(slice) !== -1){
		for (var i = 0; i < 27; i++){
			sliceCubies.push(cubies[i]);
		}
		updateKeys(slice,inverse);
	} else{
		for ( var i = 0 ; i < 27 ; i++ ) {		// Get slice
			if ( cubies[ i ].position[ dict[ slice ][0] ] == dict[ slice ][1] ) { // if relevant coordinate of cubie equals corresponding value in dict, extract that cubie.
				sliceCubies.push( cubies[ i ] );
				//orientations[i] = computeOrientation(orientations[i], slice, inverse);
			}
		}
	}
	for (var i = 0; i < sliceCubies.length; i++) {
		let cubieIndex = cubies.indexOf(sliceCubies[i]);
		orientations[cubieIndex] = computeOrientation(orientations[cubieIndex], slice, inverse);
	}
	
	var animate = function( ){
		if (step < steps){ 
			for (var i = 0; i < sliceCubies.length; i++){
				sliceCubies[i].applyMatrix(rotationMatrix);
			}
			step++
			requestAnimationFrame( animate );
		}
		if (step == steps){
			for ( var i = 0 ; i < sliceCubies.length ; i++ ){
				// Clean up matrix
				let elements = sliceCubies[i].matrix.elements;
				for (var j = 0 ; j < 16; j++){
					elements[j] = (Math.round(elements[j]));
				}
				sliceCubies[i].matrix.set(		// Perhaps a more elegant way to set these values?
					elements[0], elements[1], elements[2], elements[3],
					elements[4], elements[5], elements[6], elements[7],
					elements[8], elements[9], elements[10], elements[11],
					elements[12], elements[13], elements[14], elements[15]
				);
				
				// Clean up position
				sliceCubies[ i ].position.x = Math.round(sliceCubies[ i ].position.x);
				sliceCubies[ i ].position.y = Math.round(sliceCubies[ i ].position.y);
				sliceCubies[ i ].position.z = Math.round(sliceCubies[ i ].position.z);
				
				// Clean up quaternion (Doesn't seem to matter, but might as well do it)
				let q = sliceCubies[i].quaternion;    // quaternion
				let c = [q.x, q.y, q.z, q.w];    // components of quaternion
				for (var k = 0; k < 4; k++) {
					if (Math.abs(c[k]) < .001) c[k] = 0;
				}
				q.set(c[0], c[1], c[2], c[3]);
			}	// end for loop
		}	// end if
	};	// end animate definition
	requestAnimationFrame( animate );
	//}
}	

var waitTime = 450;
function executeSequence(sequence){
	sequence = interpretSequence(sequence);
	if (sequence !== null){
		let move = sequence[0];
		if (sequence.length > 1 && sequence[1] == "'"){
			sequence = sequence.substring(2, sequence.length);
			executeMove(move+"'");
		} else{
			sequence = sequence.substring(1, sequence.length);
			executeMove(move);
		}
		setTimeout(()=>executeSequence(sequence), waitTime);
	}
}

var tperm = "(RUR'U')(R'F)R2U'R'U'RU(R'F')";

function currentPosition(key){
	var position = cubies[keys.indexOf(key)].position;
	var keyposition = [];
	x = position.x;
	y = position.y;
	z = position.z;
	if (x == 1) keyposition.push("R");
	if (x == -1) keyposition.push("L");
	if (y == 1) keyposition.push("U");
	if (y == -1) keyposition.push("D");
	if (z == 1) keyposition.push("F");
	if (z == -1) keyposition.push("B");
	return keyposition.join("");
}

function correctPosition(key){
	return (key == currentPosition(key));
}
function currentOrientation(key){
	return orientations[keys.indexOf(key)];
}
function correctOrientation(key){
	var correct = true;
	var orientation = orientations[keys.indexOf(key)];
	for (var i = 0; i < key.length; i++){
		let centerOrientation = orientations[keys.indexOf(key[i])];
		for (var side in centerOrientation){
			if (centerOrientation[side] == 'gray'){
				continue;
			}
			correct = correct && (orientation[side] == centerOrientation[side]);
			break;
		}
	}
	return correct
}
function cubieSolved(key){
	return correctOrientation(key);
}
function keyAtPosition(position){
	for (let i = 0; i < 27; i++){
		key = keys[i];
		if (currentPosition(key) == position){
			return key;
		}
	}
}
function inverse(turn){
	if (turn == "") return turn;
	if (turn.length == 1) return turn + "'";
	if (turn[1] == "'") return turn[0];
	return turn;
}

var opposite = {'R':'L', 'L':'R', 'U':'D', 'D':'U', 'F':'B', 'B':'F'};
var moveSlice = {		// All of this is hardcoded to make my life easy later.
	"R":{"U":{"U":"","F":"R'","B":"R","D":"R2"},"F":{"F":"","U":"R","B":"R2","D":"R'"},"B":{"B":"","D":"R","U":"R'","F":"R2"},"D":{"D":"","U":"R2","F":"R","B":"R'"}},
	"L":{"U":{"U":"","F":"L","B":"L'","D":"L2"},"F":{"F":"","U":"L'","B":"L2","D":"L"},"B":{"B":"","D":"L'","U":"L","F":"L2"},"D":{"D":"","U":"L2","F":"L'","B":"L"}},
	"U":{"R":{"R":"","L":"U2","F":"U","B":"U'"},"L":{"R":"U2","L":"","F":"U'","B":"U"},"F":{"R":"U'","L":"U","F":"","B":"U2"},"B":{"R":"U","L":"U'","F":"U2","B":""}},
	"D":{"R":{"R":"","L":"D2","F":"D'","B":"D"},"L":{"R":"D2","L":"","F":"D","B":"D'"},"F":{"R":"D","L":"D'","F":"","B":"D2"},"B":{"R":"D'","L":"D","F":"D2","B":""}},
	"F":{"R":{"R":"","L":"F2","U":"F'","D":"F"},"L":{"L":"","R":"F2","U":"F","D":"F'"},"U":{"U":"","D":"F2","R":"F","L":"F'"},"D":{"D":"","U":"F2","R":"F'","L":"F"}},
	"B":{"R":{"R":"","L":"B2","U":"B","D":"B'"},"L":{"L":"","R":"B2","U":"B'","D":"B"},"U":{"U":"","D":"B2","R":"B'","L":"B"},"D":{"D":"","U":"B2","R":"B","L":"B'"}},
	"Y":{"R":{"R":"","F":"Y","L":"Y2","B":"Y'"},"L":{"L":"","B":"Y","R":"Y2","F":"Y'"},"F":{"F":"","L":"Y","B":"Y2","R":"Y'"},"B":{"B":"","R":"Y","F":"Y2","L":"Y2"}}
}

function movePiece(slice, from, to){
	if (from.length !== to.length) return "";
	from = from.split("");
	to = to.split("");
	from.splice(from.indexOf(slice),1);
	to.splice(to.indexOf(slice),1);
	if (from.length == 1){
		return moveSlice[slice][from[0]][to[0]];
	}
	else{
		var from1 = from[0];
		var from2 = from[1];
		var to1 = to[0];
		var to2 = to[1];
		return (moveSlice[slice][from1][to1] == moveSlice[slice][from2][to2]) ? moveSlice[slice][from2][to2] : moveSlice[slice][from1][to2];
	}
}
var moveCube = {
	"Y":{"R":{"R":"","F":"Y","L":"Y2","B":"Y'"},"L":{"L":"","B":"Y","R":"Y2","F":"Y'"},"F":{"F":"","L":"Y","B":"Y2","R":"Y'"},"B":{"B":"","R":"Y","F":"Y2","L":"Y2"}}
}
function shiftRight(string, n){
	while (n !== 0){
		let c = string[string.length - 1];
		string = c + replaceCharacter(string,c,"");
		n--
	}
	return string
}

function combine(m1,m2,face){ 
	// m1 and m2 are two rotations of the same face
	// returns modified m2
	let dict = {};
	dict[""] = 0;
	dict[face] = 1;
	dict[face+"2"] = 2;
	dict[face+"'"] = 3;
	m1 = dict[m1];
	m2 = dict[m2];
	return indexOfValue(shiftRight("0123",m1)[m2], dict);
}

var solutionSteps = [];
var currentSolutionStep = 0;

var fle = ['DF', 'LD', 'RD', 'DB'];
var flc = ['LDF', 'RDF', 'LDB', 'RDB'];
var sle = ['LF', 'RF', 'LB', 'RB'];
var tle = ['UF', 'LU', 'RU', 'UB'];
var tlc = ['LUF', 'RUF', 'LUB', 'RUB'];

function beginnerMethod(){
	var fleSolved = false;
	var flcSolved= false;
	var sleSolved = false;
	var tleOriented = false;
	var tlcOriented = false;
	var tlcPermuted = false;
	var tlePermuted = false;
	var unsolvedFLE = [];
	var unsolvedFLC = [];
	var orientedTLE = [];
	
	function pickCubie(){
		for (let i = 0; i < 4; i++){ 
			if (!cubieSolved(fle[i])){
				return fle[i];
			}
		}
		for (let i = 0; i < 4; i++){ 
			if (!cubieSolved(flc[i])){
				return flc[i];
			}
		}
		for (let i = 0; i < 4; i++){ 
			if (!cubieSolved(sle[i])){
				return sle[i];
			}
		}
		return -1;
	}	
	
	function pickLLcase(){
		let countTLEO = 0;
		for (let i = 0; i < 4; i++){
			if (currentOrientation(tle[i]).U == colorScheme.U){
				orientedTLE.push(tle[i]);
				countTLEO++;
			}
		}
		if (countTLEO == 0){
			return "TLEO1";
		}
		if (countTLEO == 2){
			if (replaceCharacter(currentPosition(orientedTLE[0]),"U","") !== opposite[replaceCharacter(currentPosition(orientedTLE[1]),"U","")]){
				return "TLEO2";
			}else{
				return "TLEO3";
			}
		}
		
		let countTLCO = 0;
		for (let i = 0; i < 4; i++){
			if (currentOrientation(tlc[i]).U !== colorScheme.U){
				countTLCO++;
			}
		}
		if (countTLCO !== 0){
			return "TLCO";
		}
		
		let goodCorners = 1;
		let c1 = currentOrientation(keyAtPosition("LUF"));
		let c2 = currentOrientation(keyAtPosition("RUF"));
		let c3 = currentOrientation(keyAtPosition("RUB"));
		let c4 = currentOrientation(keyAtPosition("LUB"));
		if (c1.F == c2.F) goodCorners++;
		if (c2.R == c3.R) goodCorners++;
		if (goodCorners < 3){
			return "TLCP";
		}
		
		let goodEdges = 0;
		let e1 = currentOrientation(keyAtPosition("UF"));
		let e2 = currentOrientation(keyAtPosition("RU"));
		let e3 = currentOrientation(keyAtPosition("UB"));
		let e4 = currentOrientation(keyAtPosition("LU"));
		if (e1.F == c1.F){
			goodEdges++;
		}
		if (e2.R == c2.R){
			goodEdges++;
		}
		if (e3.B == c3.B){
			goodEdges++;
		}
		if (e4.L == c4.L){
			goodEdges++;
		}
		if (goodEdges < 4){
			return "TLEP";
		}
		if (goodEdges == 4){
			return "FINAL";
		}
	}
	
	var solution = "";    // this will store the solution to the current step, not necessarily the full solution
	var explanation = "";
	var key = pickCubie();
	//alert(key);
	//printObject(currentOrientation(key));
	//alert(currentPosition(key));
	if (key !== -1){
		var position = currentPosition(key);
		var orientation = currentOrientation(key);
		explanation = explanation + "Cubie colors: ";
		for (let i = 0; i < key.length - 1; i++){
			explanation = explanation + colorScheme[key[i]] + "-";
		}
		explanation = explanation + colorScheme[key[key.length - 1]] + "\n";
		explanation = explanation + "Current position: " + position + "\n";
		explanation = explanation + "Target position: " + key + "\n";
		if (fle.indexOf(key) !== -1){    // if cubie is fle
			var Dcolor = colorScheme.D;
			let facing = indexOfValue(Dcolor, orientation);
			explanation = explanation + "On this cubie, the " + Dcolor + " colored sticker is facing " + facing + ".\n";
			if (position.indexOf("U") !== -1){    // if cubie is in third layer
				let keyMinusD = replaceCharacter(key,"D","");
				let Ymove = moveCube["Y"][keyMinusD]["F"];
				if (Ymove !== ""){
					explanation = explanation + "Turn the cube about the Y (vertical) axis such that the target position is in the front; that is, do a  " + Ymove + " move.\n";
				}
				let YmoveU = replaceCharacter(Ymove,"Y","U");
				let Umove = movePiece("U",position,"UF");
				if (Umove !== ""){
					explanation = explanation + "Turn the U face such that the cubie is in the front. ";
				}
				Umove = combine(YmoveU,Umove,"U");
				solution = solution + Ymove + Umove;
				if (facing == "U"){
					solution = solution + "F2"
					explanation = explanation + "Since the " + Dcolor + " sticker is facing up, just do an F2 to move the cubie to the bottom, and the " + Dcolor + " sticker will be facing down.";
				}else{
					solution = solution + "U'R'FR";
					explanation = explanation + "Since the " + Dcolor + " sticker is facing forward, in order to move the cubie to the bottom with the " + Dcolor + " sticker facing down, ";
					explanation = explanation + "do U'R'F to move it, and then R to restore the R face."
				}
			}
			if (position.indexOf('U') == -1 && position.indexOf('D') == - 1){    // if cubie is in second layer
				let keyMinusD = replaceCharacter(key,"D","");
				let Ymove = moveCube["Y"][keyMinusD]["F"];
				solution = solution + Ymove;
				orientation = computeOrientationGeneral(orientation,Ymove);
				facing = indexOfValue(colorScheme.D,orientation);
				let cycle = ["RF","LF","LB","RB"];
				if (Ymove.length == 1) position = cycle[(cycle.indexOf(position)+1)%4];
				if (Ymove.length == 2){
					if (Ymove[1] == "'"){
						position = cycle[(cycle.indexOf(position)+3)%4];
					}else{
						position = cycle[(cycle.indexOf(position)+2)%4];
					}
				}
				let slice1 = position[0];
				let slice2 = position[1];
				if (facing == slice1){
					solution = solution + moveSlice[slice1][slice2]["F"] + moveSlice["F"][slice1]["D"] + moveSlice[slice1]["F"][slice2];
				}else{
					solution = solution + moveSlice["D"]["F"][slice1] + moveSlice[slice1][slice2]["D"] + moveSlice["D"][slice1]["F"];
				}
			}
			if (position.indexOf("D") !== -1){    // if cubie is in first layer
				let posMinusD = replaceCharacter(position,"D","");
				solution = solution + posMinusD + "2";
				if (facing == "D") facing = "U";
				position = replaceCharacter(position,"D","U");
				let keyMinusD = replaceCharacter(key,"D","");
				let Ymove = moveCube["Y"][keyMinusD]["F"];
				let YmoveU = replaceCharacter(Ymove,"Y","U");
				let Umove = movePiece("U",position,"UF");
				Umove = combine(YmoveU,Umove,"U");
				solution = solution + Ymove + Umove;
				if (facing == "U"){
					solution = solution + "F2"
				}else{
					solution = solution + "U'R'FR";
				}
				
			}
		}
		if (flc.indexOf(key) !== -1){    // if cubie is flc
			let facing = indexOfValue(colorScheme.D, orientation);
			if (position.indexOf("U") !== -1){    // if cubie is in third layer
				let Ymove = "";
				if (key.indexOf("B") !== -1){    // if target location is in B slice
					if (key.indexOf("R") !== -1){  // if target is in R slice
						Ymove = "Y";	
					}else{    // if target is in L slice
						Ymove = "Y'";
					}
				}
				solution = solution + Ymove;    // move target location to the front
				let cycle = ["RUF","LUF","LUB","RUB"]; 
				key = replaceCharacter(key,"D","U");
				if (Ymove.length == 1){
					position = cycle[(cycle.indexOf(position)+1)%4];
					key = cycle[(cycle.indexOf(key)+1)%4];
				}
				if (Ymove.length == 2){
					if (Ymove[1] == "'"){
						position = cycle[(cycle.indexOf(position)+3)%4];
						key = cycle[(cycle.indexOf(key)+3)%4];
					}else{
						position = cycle[(cycle.indexOf(position)+2)%4];
						key = cycle[(cycle.indexOf(key)+2)%4];
					}
				}
				let above = key;
				key = replaceCharacter(key,"U","D");
				orientation = computeOrientationGeneral(orientation,Ymove);    // update orientation
				let Umove = movePiece("U",position,above);
				solution = solution + Umove;    // move piece above target
				position = above;
				orientation = computeOrientationGeneral(orientation,Umove);
				facing = indexOfValue(colorScheme.D,orientation);
				let chirality = position[0];
				if (facing == "U"){
					sequence = (chirality == "R") ? "U'U'RUR'URU'R'" : "UUL'U'LU'L'UL";
				}
				if (facing == "F"){
					sequence = (chirality == "R") ? "URU'R'" : "U'L'UL";
				}
				if (facing == "L" || facing == "R"){
					sequence = (chirality == "R") ? "YU'L'UL" : "Y'URU'R'";
				}
				solution = solution + sequence;
			}else{ //cubie is in first layer
				let m1 = moveSlice[position[0]][position[2]]["U"];
				solution = solution + m1 + "U2" + inverse(m1);
			}
		}
		if (sle.indexOf(key) !== -1){    // if cubie is sle
			if (position.indexOf("U") !== -1){    // if cubie is U layer
				let colorU = orientation.U;
				let colorSide = orientation[replaceCharacter(position,"U","")];
				let colorSideSlice = indexOfValue(colorSide,colorScheme);
				let Ymove = moveCube["Y"][colorSideSlice]["F"];
				solution = solution + Ymove;    // move target location to the front
				let cycleU = ["RU","UF","LU","UB"];
				let cycleE = ["RF","LF","LB","RB"];
				if (Ymove.length == 1){
					position = cycleU[(cycleU.indexOf(position)+1)%4];
					key = cycleE[(cycleE.indexOf(key)+1)%4];
				}
				if (Ymove.length == 2){
					if (Ymove[1] == "'"){
						position = cycleU[(cycleU.indexOf(position)+3)%4];
						key = cycleE[(cycleE.indexOf(key)+3)%4];
					}else{
						position = cycleU[(cycleU.indexOf(position)+2)%4];
						key = cycleE[(cycleE.indexOf(key)+2)%4];
					}
				}
				let newPosition = opposite[replaceCharacter(key,"F","")]+"U";
				let Umove = movePiece("U",position,newPosition);
				solution = solution + Umove;
				position = newPosition;
				let chirality = position[0];
				let sequences = {"L":"RU'R'YU'L'UL", "R":"L'ULY'URU'R'"};
				solution = solution + sequences[chirality];
			}else{
				let tempColorScheme = colorScheme;
				let Ymove = "";
				if (position.indexOf("B") !== -1){    // if position is in B slice
					if (position.indexOf("R") !== -1){  // if position is in R slice
						Ymove = "Y";	
					}else{    // if target is in L slice
						Ymove = "Y'";
					}
				}
				solution = solution + Ymove;    // move target location to the front
				let cycleE = ["RF","LF","LB","RB"];
				let cycleU = ["RU","UF","LU","UB"];
				if (Ymove.length == 1){
					position = cycleE[(cycleE.indexOf(position)+1)%4];
					key = cycleE[(cycleE.indexOf(key)+1)%4];
				}
				if (Ymove.length == 2){
					if (Ymove[1] == "'"){
						position = cycleE[(cycleU.indexOf(position)+3)%4];
						key = cycleE[(cycleE.indexOf(key)+3)%4];
					}else{
						position = cycleE[(cycleU.indexOf(position)+2)%4];
						key = cycleE[(cycleE.indexOf(key)+2)%4];
					}
				}
				tempColorScheme = computeOrientationGeneral(tempColorScheme,Ymove);
				orientation = computeOrientationGeneral(orientation,Ymove);
				let chirality = opposite[position[0]];
				let sequences = {"L":"RU'R'YU'L'UL", "R":"L'ULY'URU'R'"};
				let Umoves = {"L":["U","U'"],"R":["U'","U"]};
				let Ymoves = {"L":"Y","R":"Y'"};
				if (indexOfValue("yellow",orientations[keys.indexOf(keyAtPosition(chirality+"U"))]) !== -1){
					solution = solution + sequences[chirality];
				} else if (indexOfValue("yellow",orientations[keys.indexOf(keyAtPosition("UF"))]) !== -1){
					solution = solution + Umoves[chirality][0] + sequences[chirality];
				} else if (indexOfValue("yellow",orientations[keys.indexOf(keyAtPosition("UB"))]) !== -1){
					solution = solution + Umoves[chirality][1] + sequences[chirality];
				} else{
					solution = solution + "U2" + sequences[chirality];
				}
				Ymove = Ymoves[chirality];
				if (Ymove.length == 1){
					position = cycleU[(cycleU.indexOf(position)+1)%4];
					key = cycleE[(cycleE.indexOf(key)+1)%4];
				}
				if (Ymove.length == 2){
					if (Ymove[1] == "'"){
						position = cycleU[(cycleU.indexOf(position)+3)%4];
						key = cycleE[(cycleE.indexOf(key)+3)%4];
					}else{
						position = cycleU[(cycleU.indexOf(position)+2)%4];
						key = cycleE[(cycleE.indexOf(key)+2)%4];
					}
				}
				tempColorScheme = computeOrientationGeneral(tempColorScheme,Ymove);
				orientation = computeOrientationGeneral(orientation,opposite[chirality]);					
				let colorU = orientation.U;
				let colorSide = orientation[replaceCharacter(position,"U","")];
				let colorSideSlice = indexOfValue(colorSide,tempColorScheme);	
				Ymove = moveCube["Y"][colorSideSlice]["F"];
				solution = solution + Ymove;    // move target location to the front
				
				if (Ymove.length == 1){
					position = cycleU[(cycleU.indexOf(position)+1)%4];
					key = cycleE[(cycleE.indexOf(key)+1)%4];
				}
				if (Ymove.length == 2){
					if (Ymove[1] == "'"){
						position = cycleU[(cycleU.indexOf(position)+3)%4];
						key = cycleE[(cycleE.indexOf(key)+3)%4];
					}else{
						position = cycleU[(cycleU.indexOf(position)+2)%4];
						key = cycleE[(cycleE.indexOf(key)+2)%4];
					}
				}
				let newPosition = opposite[replaceCharacter(key,"F","")]+"U";
				let Umove = movePiece("U",position,newPosition);
				solution = solution + Umove;
				position = newPosition;
				chirality = position[0];
				solution = solution + sequences[chirality];
			}
		}
	}else{    // Solve third layer
		let LLcase = pickLLcase();
		if (LLcase == "TLEO1"){
			solution = solution + "FRUR'U'F'";
		}
		if (LLcase == "TLEO2"){
			let cubie1 = orientedTLE[0];
			let cubie2 = orientedTLE[1];
			if (movePiece("U",currentPosition(cubie1),"LU") == movePiece("U",currentPosition(cubie2),"UB")){
				solution = solution + movePiece("U",currentPosition(cubie1),"LU");
			}else{
				solution = solution + movePiece("U",currentPosition(cubie1),"UB");
			}
			solution = solution + "FRUR'U'F'";
		}
		if (LLcase == "TLEO3"){
			if (currentPosition(orientedTLE[0]) == "LU" || currentPosition(orientedTLE[0]) == "RU"){
				solution = solution + "FRUR'U'F'";
			}else{
				solution = solution + "UFRUR'U'F'";
			}
		}
		if (LLcase == "TLCO"){
			let uc = colorScheme.U;
			let seq1 = "R'D'RDR'D'RD";
			let seq2 = "R'D'RDR'D'RDR'D'RDR'D'RD";
			let o1 = currentOrientation(keyAtPosition("RUF"));
			let o2 = currentOrientation(keyAtPosition("RUB"));
			let o3 = currentOrientation(keyAtPosition("LUB"));
			let o4 = currentOrientation(keyAtPosition("LUF"));
			if (o1.U == uc){
				solution = solution + "U";
			}else if (o1.R == uc){
				
				solution = solution + seq1 + "U";
				
			}else{
				solution = solution + seq2 + "U";
			}
			if (o2.U == uc){
				solution = solution + "U";
			}else if (o2.B == uc){
				solution = solution + seq1 + "U";
			}else{
				solution = solution + seq2 + "U";
			}
			if (o3.U == uc){
				solution = solution + "U";
			}else if (o3.L == uc){
				solution = solution + seq1 + "U";
			}else{
				solution = solution + seq2 + "U";
			}
			if (o4.U == uc){
				// done
			}else if (o4.F == uc){
				solution = solution + seq1;
			}else{
				solution = solution + seq2;
			}
		}
		if (LLcase == "TLCP"){
			let seq1 = "R' U R' U' R U2 R D R' U2 R D' R2 U R U' R";;
			let o1 = currentOrientation(keyAtPosition("RUF"));
			let o2 = currentOrientation(keyAtPosition("RUB"));
			let o3 = currentOrientation(keyAtPosition("LUB"));
			let o4 = currentOrientation(keyAtPosition("LUF"));
			if (o1.F !== oppositeColor(o2.B) && o1.R !== oppositeColor(o2.L)){
				solution = solution + seq1;
			}else{
				if (o1.F == o2.F){
					solution = solution + "U2" + seq1;
				}
				if (o1.R == o2.R){
					solution = solution + "U'" + seq1;
				}
				if (o2.B == o3.B){
					solution = solution + seq1;
				}
				if (o3.L == o4.L){
					solution = solution + "U" + seq1;
				}
			}
		}
		if (LLcase == "TLEP"){
			let seq1 = "RU'RURURU'R'U'R2";
			let seq2 = "L'UL'U'L'U'L'ULU(L')2";
			let e1 = currentOrientation(keyAtPosition("UF"));
			let e2 = currentOrientation(keyAtPosition("RU"));
			let e3 = currentOrientation(keyAtPosition("UB"));
			let e4 = currentOrientation(keyAtPosition("LU"));
			let c1 = currentOrientation(keyAtPosition("LUF"));
			let c2 = currentOrientation(keyAtPosition("RUF"));
			let c3 = currentOrientation(keyAtPosition("RUB"));
			let c4 = currentOrientation(keyAtPosition("LUB"));
			let goodEdges = 0;
			let goodEdge = "";
			if (e1.F == c1.F){
				goodEdges++;
				goodEdge = "UF";
			}
			if (e2.R == c2.R){
				goodEdges++;
				goodEdge = "RU";
			}
			if (e3.B == c3.B){
				goodEdges++;
				goodEdge = "UB";
			}
			if (e4.L == c4.L){
				goodEdges++;
				goodEdge = "LU";
			}
			
			if (goodEdges == 0){
				solution = solution + seq1;
			}else if (goodEdges == 1){
				solution = solution + movePiece("U",goodEdge,"UB") + seq1;
			}
		}
		if (LLcase == "FINAL"){
			solution = solution + movePiece("U","UF",keyAtPosition("UF"));
		}
	}
	/*
	var paragraph = document.createElement("p");
	var textNode = document.createTextNode(explanation);
	paragraph.appendChild(textNode);
	document.getElementById("output").appendChild(paragraph);*/
	document.getElementById("explanation").innerText = explanation;
	executeSequence(solution);
}

//var promise = navigator.mediaDevices.getUserMedia({audio:false,video:true});

function handleKeyDown(e){
	if (e.key=='r'||e.key=='l'||e.key=='u'||e.key=='d'||e.key=='f'||e.key=='b'||e.key=='m'||e.key=='e'||e.key=='s'||e.key=='x'||e.key=='y'||e.key=='z'){
		executeMove(e.key.toUpperCase());
	}
	if (e.key=='R'||e.key=='L'||e.key=='U'||e.key=='D'||e.key=='F'||e.key=='B'||e.key=='M'||e.key=='E'||e.key=='S'||e.key=='X'||e.key=='Y'||e.key=='Z'){
		executeMove(e.key + "'");
	}	
	if (e.key == 'o'){
		alert(keys);
	}
	if (e.key == 'p'){
		console.log("B'  L2  D2  R2  F2  R  D'  U  F  U'  R  U2  F2  L'  U'  F'  D'  L  B2  U2  B'  U  B'  L2  F2");
		executeSequence("B'  L2  D2  R2  F2  R  D'  U  F  U'  R  U2  F2  L'  U'  F'  D'  L  B2  U2  B'  U  B'  L2  F2");
	}
	if (e.key == 'k'){
		beginnerMethod();
	}
}

function handleExecute(e){
	var sequenceInput = document.getElementById("sequenceInput");
	var contents = sequenceInput.value;
	executeSequence(contents);
}

document.getElementById("content").addEventListener('click', e => e.target.focus());
canvas.addEventListener("keydown", handleKeyDown, false);
document.getElementById("execute").addEventListener('click', e => handleExecute(e));

// ------------------------------------------------------------ End Transformations ------------------------------------------------------------