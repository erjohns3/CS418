
var gl;
var canvas;
var shaderProgram;

var eyeQuatUD = quat.create();
var eyeQuatLR = quat.create();

var transformVec = vec3.create();

//moves the plane
var rollLeft = false;
var rollRight = false;
var pitchUp = false;
var pitchDown = false;
var speedUp = false;
var speedDown = false;

// Create a place to store terrain geometry
var tVertexPositionBuffer;

//Create a place to store normals for shading
var tVertexNormalBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

// Create a place to store the color for each vertex
var tvertexColorBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

// View parameters
var eyePt = vec3.fromValues(-2.0,0.0,0.0);
//var eyePt = vec3.fromValues(-20.0,30.0,-20.0);
var viewDir = vec3.fromValues(0.0,0.0,-0.5);
//var viewDir = vec3.fromValues(1.0,-1.0,1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);
var axisToRot = vec3.fromValues(1.0,0.0,0.0);

var speed = 0.002;

var fog = true;

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

//set up terrain buffers and generate terrain
//-------------------------------------------------------------------------
function setupTerrainBuffers() {
    
	var vTerrain=[];
	var fTerrain=[];
	var nTerrain=[];
	var eTerrain=[];
	var cTerrain=[];  // initialize the array with the color values
	var gridN=128;

	var numT = terrainFromIteration(gridN, -2,2,-2,2, vTerrain,fTerrain,nTerrain,cTerrain); // pass in color values into the terrain generator
	//var numT =  planeFromSubdivision(gridN, -1,1,-1,1, vTerrain,fTerrain,nTerrain);
	console.log("Generated ", numT, " triangles");

	tVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
	tVertexPositionBuffer.itemSize = 3;
	//tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
	tVertexPositionBuffer.numItems = numT*3;

	// Specify normals to be able to do lighting calculations
	tVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain), gl.STATIC_DRAW);
	tVertexNormalBuffer.itemSize = 3;
	//tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
	tVertexNormalBuffer.numItems = numT*3;

	// Specify faces of the terrain 
	tIndexTriBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain), gl.STATIC_DRAW);
	tIndexTriBuffer.itemSize = 1;
	tIndexTriBuffer.numItems = numT*3;

	// Specify the color of each vertex based off of cTerrain
	tvertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tvertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cTerrain), gl.STATIC_DRAW);
	tvertexColorBuffer.itemSize = 3;
	tvertexColorBuffer.numItems = numT*3;

	//Setup Edges
	generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
	tIndexEdgeBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain), gl.STATIC_DRAW);
	tIndexEdgeBuffer.itemSize = 1;
	tIndexEdgeBuffer.numItems = eTerrain.length; 
}


//draws the terrain
//-------------------------------------------------------------------------
function drawTerrain(){
	gl.polygonOffset(0,0);

	// Bind position buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// Bind normal buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);   

	// Bind color buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, tvertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, tvertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	//Draw 
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
	gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);
	//    gl.drawArrays(gl.TRIANGLES, 0, tVertexPositionBuffer.numItems);      
}

//send mvMatrix to the shader
//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//send pMatrix to shader
//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

//send nMatrix to shader
//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
	//create your nMatrix here
	//this line sets the nMatrix to the mvMatrix
	mat3.fromMat4(nMatrix,mvMatrix);

	//the normal matrix is the inverse transpose of the mvMatrix.
	mat3.transpose(nMatrix,nMatrix);
	mat3.invert(nMatrix,nMatrix);

	//this line send the nMatrix to the shader
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//push a mvMatrix onto the stack to save transformations
//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

//pop a mvMatrix off the stack to erase transformations
//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//send all matrix to the shader
//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//converts deg to rad
//----------------------------------------------------------------------------------
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

//creates the web gl canvas
//----------------------------------------------------------------------------------
function createGLContext(canvas) {
	var names = ["webgl", "experimental-webgl"];
	var context = null;
	for (var i=0; i < names.length; i++) {
		try {
			context = canvas.getContext(names[i]);
		} catch(e) {}
		if (context) {
			break;
		}
	}
	if (context) {
		context.viewportWidth = canvas.width;
		context.viewportHeight = canvas.height;
	} else {
		alert("Failed to create WebGL context!");
	}
	return context;
}

//loads the shaders
//----------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
	var shaderScript = document.getElementById(id);

	// If we don't find an element with the specified id
	// we do an early exit 
	if (!shaderScript) {
		return null;
	}

	// Loop through the children for the found DOM element and
	// build up the shader source code as a string
	var shaderSource = "";
	var currentChild = shaderScript.firstChild;
	while (currentChild) {
		if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
			shaderSource += currentChild.textContent;
		}
		currentChild = currentChild.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	} 
	return shader;
}

//hooks stuff up to the shaders
//----------------------------------------------------------------------------------
function setupShaders() {
	vertexShader = loadShaderFromDOM("shader-vs");
	fragmentShader = loadShaderFromDOM("shader-fs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Failed to setup shaders");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

	// set the attribute pointer of the color to aVertexColor
	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
	shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "aVertexColor");  
	shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
	shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
	shaderProgram.uniformFogDensityLoc = gl.getUniformLocation(shaderProgram, "uFogDensity");
}

//send lights to the shader
//-------------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
	gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
	gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
	gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
	gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//sets up the buffers for the objects
//----------------------------------------------------------------------------------
function setupBuffers() {
    setupTerrainBuffers();
}

//renders the objects with the specified transfromations
//----------------------------------------------------------------------------------
function draw() {

	if(rollLeft){		// if left arrow key is pressed
		quat.setAxisAngle(eyeQuatLR, viewDir, degToRad(-2.0))		// rotate in the direction that the camera is facing
        vec3.transformQuat(axisToRot,axisToRot,eyeQuatLR);			// change the axis that pitch rotates on
		vec3.transformQuat(up,up,eyeQuatLR);						// change the up direction for the camera
	}
	if(rollRight){		// if right arrow key is pressed
		quat.setAxisAngle(eyeQuatLR, viewDir, degToRad(2.0))		// rotate in the direction that the camera is facing
        vec3.transformQuat(axisToRot,axisToRot,eyeQuatLR);			// change the axis that pitch rotates on
        vec3.transformQuat(up,up,eyeQuatLR);						// change the up direction for the camera
	}
	if(pitchUp){		// if up arrow key is pressed
		quat.setAxisAngle(eyeQuatUD, axisToRot, degToRad(0.75))		// rotate the camera on the pitch axis
        vec3.transformQuat(viewDir,viewDir,eyeQuatUD);				// apply the rotation to the the camera
		vec3.transformQuat(up,up,eyeQuatUD);						// change the up direction for the camera
	}
	if(pitchDown){		// if down arrow key is pressed
		quat.setAxisAngle(eyeQuatUD, axisToRot, degToRad(-0.75))	// rotate the camera on the pitch axis
        vec3.transformQuat(viewDir,viewDir,eyeQuatUD);				// apply the rotation to the the camera
		vec3.transformQuat(up,up,eyeQuatUD);						// change the up direction for the camera
	}
	if(speedUp){		// if "+" key is pressed
		speed = speed + 0.0002;										// increase the offset for the eyePt
	}
	if(speedDown){		// if "-" key is pressed
		speed = speed - 0.0002;										// decrease the offset for the eyePt
		if(speed < 0.001){
			speed = 0.001;											// cap the decrease amount
		}
	}

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// We'll use perspective 
	mat4.perspective(pMatrix,degToRad(60), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

	vec3.add(eyePt, vec3.fromValues(viewDir[0]*speed, viewDir[1]*speed, viewDir[2]*speed), eyePt);	// add an offset of size speed in the viewing direction to the location of the camera

	vec3.add(viewPt, eyePt, viewDir);
	// Then generate the lookat matrix and initialize the MV matrix to that view
	mat4.lookAt(mvMatrix,eyePt,viewPt,up);

	//Draw Terrain
	mvPushMatrix();
	vec3.set(transformVec,-2.0,-0.25,-5.0);
	mat4.translate(mvMatrix, mvMatrix,transformVec);
	mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
	mat4.rotateZ(mvMatrix, mvMatrix, degToRad(-30));     
	setMatrixUniforms();

	//sends the lights to the shader
	uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[0.3,0.3,0.3],[0.0,0.0,0.0]);

	if(fog){													// of fog is turned on
		gl.uniform1f(shaderProgram.uniformFogDensityLoc, 0.15);	// set fog density to 0.1
	}else{														// if fog is turned off
		gl.uniform1f(shaderProgram.uniformFogDensityLoc, 0.0);	// set fog density to 0.0
	}

	drawTerrain();
	mvPopMatrix();
}

//animates the webpage
//----------------------------------------------------------------------------------
function animate() {

}

//starts everthing off
//----------------------------------------------------------------------------------
function startup() {
	canvas = document.getElementById("myGLCanvas");
	window.addEventListener( 'keydown', onKeyDown, false );		// turn on rotations
	window.addEventListener( 'keyup', onKeyUp, false );			// turn off rotations
	gl = createGLContext(canvas);
	setupShaders();
	setupBuffers();
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	tick();
}

//animates stuff every tick
//----------------------------------------------------------------------------------
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

function onKeyDown(event)
{
    //add quaternion to rotate the camera
    if(event.keyCode =="37"){		// left arrow key
        rollLeft = true;			// turn on rolling left
    }
    if(event.keyCode =="39"){		// right arrow key
        rollRight = true;			// turn on rolling right
    }
    if(event.keyCode =="38"){		// up arrow key
        pitchUp = true;				// turn on pitching up
    }
    if(event.keyCode =="40"){		// down arrow key
        pitchDown = true;			// turn on pitching down
    }
	if(event.keyCode =="187"){		// "+" key
        speedUp = true;				// turn on increasing speed
    }
    if(event.keyCode =="189"){		// "-" arrow key
        speedDown = true;			// turn on decreasing speed
    }
	if(event.keyCode == "70"){		// "F" key
		fog = !fog;					// toggle fog
	}
}

function onKeyUp(event){
	if(event.keyCode =="37"){		// left arrow key
        rollLeft = false;			// turn off rolling left
    }
    if(event.keyCode =="39"){		// right arrow key
        rollRight = false;			// turn off rolling right
    }
    if(event.keyCode =="38"){		// up arrow key
        pitchUp = false;			// turn off pitching up
    }
    if(event.keyCode =="40"){		// down arrow key
        pitchDown = false;			// turn off pitching off
    }
	if(event.keyCode =="187"){		// up arrow key
        speedUp = false;			// turn off increasing speed
    }
    if(event.keyCode =="189"){		// down arrow key
        speedDown = false;			// turn off decreasing speed
    }
}

// old key controls
/*
function onKeyDown(event)
{
    //add quaternion to rotate the camera
    //up
    if(event.keyCode =="65"){
        quat.setAxisAngle(eyeQuatLR, viewDir, degToRad(-2.5))
        vec3.transformQuat(axisToRot,axisToRot,eyeQuatLR);
		vec3.transformQuat(up,up,eyeQuatLR);
    }

    if(event.keyCode =="68"){
        quat.setAxisAngle(eyeQuatLR, viewDir, degToRad(2.5))
        vec3.transformQuat(axisToRot,axisToRot,eyeQuatLR);
        vec3.transformQuat(up,up,eyeQuatLR);
    }

    if(event.keyCode =="87"){
        //use matrix lib to rotate the view direction with quaternions
        
        //create the quat
        quat.setAxisAngle(eyeQuatUD, axisToRot, degToRad(2.5))
        
        //apply the quat
        vec3.transformQuat(viewDir,viewDir,eyeQuatUD);
		vec3.transformQuat(up,up,eyeQuatUD);
    }
    //down
    if(event.keyCode =="83"){
        quat.setAxisAngle(eyeQuatUD, axisToRot, degToRad(-2.5))
        vec3.transformQuat(viewDir,viewDir,eyeQuatUD);
		vec3.transformQuat(up,up,eyeQuatUD);
    }
	if(event.keyCode =="38"){
		speed = speed + 0.001;
	}
	if(event.keyCode =="40"){
		speed = speed - 0.001;
		if(speed < 0.001){
			//speed = 0.001;
		}
	}
}
*/