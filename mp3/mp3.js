var gl;
var canvas;
var shaderProgram;

var teapotQuat = quat.create();		// quarterion for teapot rotations
var eyeQuat = quat.create();		// quarterion for eye rotations

var cubeVertexPositionBuffer;		// buffer for cube vertex positions
var cubeVertexNormalBuffer;			// buffer for cube vertex normals
var cubeTexture;

var teapotVertexPositionBuffer;		// buffer for teapot vertex positions
var teapotVertexNormalBuffer;		// buffer for teapot vertex normals
var teapotVertexColorBuffer;		// buffer for teapot vertex color
var teapotIndexTriBuffer;			// buffer for teapot vertex faces

var teapotPositions = [];			// teapot position vector values, it is global so that the teapot can rotate	
var teapotNormals = [];				// teapot normal vector values, it is global so that the teapot can rotate

var eyeLeft = false;				// rotates the eye left when left arrow is pressed
var eyeRight = false;				// rotates the eye right when right arrow is pressed
var teapotLeft = false;				// rotates the teapot left when up arrow is pressed
var teapotRight = false;			// rotates the teapot right when down arrow is pressed

var teapotReady = false;

// View parameters
var eyePt = vec3.fromValues(0,0,10);		// the initial eye position, controls the radius of spinning
var up = vec3.fromValues(0,1,0);
var viewPt = vec3.fromValues(0,0,0);		// keep view pointed to origin

var nMatrix = mat3.create();		// Create the normal matrix
var mvMatrix = mat4.create();		// Create ModelView matrix
var pMatrix = mat4.create();		// Create Projection matrix

var mvMatrixStack = [];


function setupCubeBuffers() {
	// create a cube
	var cubePositions=[
		1,1,1,
		1,-1,1,
		-1,-1,1,

		1,1,1,
		-1,-1,1,
		-1,1,1,

		1,1,-1,
		1,-1,-1,
		-1,-1,-1,

		1,1,-1,
		-1,-1,-1,
		-1,1,-1,

		///////

		1,1,-1,
		1,-1,-1,
		1,-1,1,

		1,1,-1,
		1,-1,1,
		1,1,1,

		-1,1,-1,
		-1,-1,-1,
		-1,-1,1,

		-1,1,-1,
		-1,-1,1,
		-1,1,1,

		///////

		1,1,1,
		1,1,-1,
		-1,1,-1,

		1,1,1,
		-1,1,-1,
		-1,1,1,

		1,-1,1,
		1,-1,-1,
		-1,-1,-1,

		1,-1,1,
		-1,-1,-1,
		-1,-1,1
	];
	for(var i=0; i<108; i++){
		cubePositions[i] *= 60;	// increase the size of the cube to encompass teapot and eye
	}

	// fill in vertex position buffer
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer); 
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubePositions), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 12*3;

	// fill in vertex normal buffer
	cubeVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubePositions), gl.STATIC_DRAW);	// the normals are the same as the positions for the cube
	cubeVertexNormalBuffer.itemSize = 3;
	cubeVertexNormalBuffer.numItems = 12*3;

}

function setupTeapotBuffers(){
	var teapotColors = [];
	var teapotFaces = [];
	
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", "teapot_0.obj", true);
    
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)	// file is ready to be read from
            {
				var teapotTxt = [];
            	teapotTxt = rawFile.responseText;				// contains the characters that vertex anf face values
				var i=0;
				var numStart = 0;
				var positionIndex = 0;
				var facesIndex = 0;
				
				while(i<teapotTxt.length){
					if(teapotTxt[i] == "v"){		// handles vertices
						i += 2;
						numStart = i;
						while(teapotTxt[i] != " "){
							i++;
						}
						teapotPositions[positionIndex] = parseFloat(teapotTxt.slice(numStart, i));	// get the x value of the vertex
						positionIndex++;
						i++;
						numStart = i;
						while(teapotTxt[i] != " "){
							i++;
						}
						teapotPositions[positionIndex] = parseFloat(teapotTxt.slice(numStart, i));	// get the y value of the vertex
						positionIndex++;
						i++;
						numStart = i;
						while(teapotTxt[i] != "\r"){
							i++;
						}
						teapotPositions[positionIndex] = parseFloat(teapotTxt.slice(numStart, i));	// get the y value of the vertex
						positionIndex++;
						i+=2;
					}else if(teapotTxt[i] == "f"){		// handles faces
						i += 3;
						numStart = i;
						while(teapotTxt[i] != " "){
							i++;
						}
						teapotFaces[facesIndex] = parseInt(teapotTxt.slice(numStart, i)) - 1;		// get the x value of the face
						facesIndex++;
						i++;
						numStart = i;
						while(teapotTxt[i] != " "){
							i++;
						}
						teapotFaces[facesIndex] = parseInt(teapotTxt.slice(numStart, i)) - 1;		// get the y value of the face
						facesIndex++;
						i++;
						numStart = i;
						while(teapotTxt[i] != "\r"){
							i++;
						}
						teapotFaces[facesIndex] = parseInt(teapotTxt.slice(numStart, i)) - 1;		// get the z value of the face
						facesIndex++;
						i+=2;
					}else{
						while(teapotTxt[i] != "\r"){
							i++;
						}
						i+=2;
					}					
				}				
				
				for(i=0; i<teapotPositions.length; i++){
					teapotNormals[i] = 0;
				}
				var a1,a2,a3, b1,b2,b3, c1,c2,c3, u1,u2,u3, v1,v2,v3, n1, n2, n3, size;
				for(i=0; i<teapotFaces.length; i+=3){

					//get the position vectors of the 3 vertices for each face
					a1 = teapotPositions[(teapotFaces[i] * 3)];
					a2 = teapotPositions[(teapotFaces[i] * 3) + 1];
					a3 = teapotPositions[(teapotFaces[i] * 3) + 2];

					b1 = teapotPositions[(teapotFaces[i+1] * 3)];
					b2 = teapotPositions[(teapotFaces[i+1] * 3) + 1];
					b3 = teapotPositions[(teapotFaces[i+1] * 3) + 2];

					c1 = teapotPositions[(teapotFaces[i+2] * 3)];
					c2 = teapotPositions[(teapotFaces[i+2] * 3) + 1];
					c3 = teapotPositions[(teapotFaces[i+2] * 3) + 2];

					// create the defining lines of the face
					u1 = b1 - a1;
					u2 = b2 - a2;
					u3 = b3 - a3;

					v1 = c1 - a1;
					v2 = c2 - a2;
					v3 = c3 - a3;

					// find cross product to get the normal of the face
					n1 = (u2*v3) - (u3*v2);
					n2 = (u3*v1) - (u1*v3);
					n3 = (u1*v2) - (u2*v1);

					// normalize the face normal
					size = Math.sqrt((n1*n1) + (n2*n2) + (n3*n3));
					n1 = n1 / size;
					n2 = n2 / size;
					n3 = n3 / size;

					// add the face normal to all 3 of the faces vertices
					teapotNormals[(teapotFaces[i] * 3)] += n1;
					teapotNormals[(teapotFaces[i] * 3) + 1] += n2;
					teapotNormals[(teapotFaces[i] * 3) + 2] += n3;

					teapotNormals[(teapotFaces[i+1] * 3)] += n1;
					teapotNormals[(teapotFaces[i+1] * 3) + 1] += n2;
					teapotNormals[(teapotFaces[i+1] * 3) + 2] += n3;

					teapotNormals[(teapotFaces[i+2] * 3)] += n1;
					teapotNormals[(teapotFaces[i+2] * 3) + 1] += n2;
					teapotNormals[(teapotFaces[i+2] * 3) + 2] += n3;
				}

				// normalize the vertices normals
				for(i=0; i<teapotNormals.length; i+=3){
					size = Math.sqrt((teapotNormals[i]*teapotNormals[i]) + (teapotNormals[i+1]*teapotNormals[i+1]) + (teapotNormals[i+2]*teapotNormals[i+2]));
					teapotNormals[i] = teapotNormals[i] / size;
					teapotNormals[i+1] = teapotNormals[i+1] / size;
					teapotNormals[i+2] = teapotNormals[i+2] / size;
				}

				// set the color for each vertex of the teapot
				var red = 0.0;
				var green = 1.0;
				var blue = 0.0;

				var divisor = Math.pow(Math.pow(red,2) + Math.pow(green,2) + Math.pow(blue,2), 0.5);
				red = red / divisor;
				green = green / divisor;
				blue = blue / divisor;
				for(i=0; i<teapotPositions.length; i+=3){
					
					teapotColors[i] = red;
					teapotColors[i+1] = green;
					teapotColors[i+2] = blue;
				}
				
				// fill the teapot position buffer
				teapotVertexPositionBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer); 
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotPositions), gl.STATIC_DRAW);
				teapotVertexPositionBuffer.itemSize = 3;
				teapotVertexPositionBuffer.numItems = teapotPositions.length/3;

				// fill the teapot normal buffer
				teapotVertexNormalBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotNormals), gl.STATIC_DRAW);
				teapotVertexNormalBuffer.itemSize = 3;
				teapotVertexNormalBuffer.numItems = teapotPositions.length/3;

				// fill the teapot color buffer
				teapotVertexColorBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexColorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotColors), gl.STATIC_DRAW);
				teapotVertexColorBuffer.itemSize = 3;
				teapotVertexColorBuffer.numItems = teapotPositions.length/3;

				// fill the teapot face buffer
				teapotIndexTriBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexTriBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapotFaces), gl.STATIC_DRAW);
				teapotIndexTriBuffer.itemSize = 1;
				teapotIndexTriBuffer.numItems = teapotFaces.length;

				teapotReady = true;		// mark as ready so that the teapot can be drawn
            }
        }
    }
	rawFile.send(null);
}

function drawCube(){
	// Bind positions buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// Bind normal buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, cubeVertexPositionBuffer.numItems); 
}

function drawTeapot(){
	if(teapotReady){
		// Bind positions buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, teapotVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// Bind normal buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, teapotVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// Bind color buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, teapotVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// Bind face buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotIndexTriBuffer);
		gl.drawElements(gl.TRIANGLES, teapotIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);
	}
}

//-------------------------------------------------------------------------
/**
* Sends Modelview matrix to shader
*/
function uploadModelViewMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
* Sends projection matrix to shader
*/
function uploadProjectionMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

//-------------------------------------------------------------------------
/**
* Generates and sends the normal matrix to the shader
*/
function uploadNormalMatrixToShader() {
	
	mat3.fromMat4(nMatrix,mvMatrix);

	//the normal matrix is the inverse transpose of the mvMatrix.
	mat3.transpose(nMatrix,nMatrix);
	mat3.invert(nMatrix,nMatrix);

	//this line send the nMatrix to the shader
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
* Pushes matrix onto modelview matrix stack
*/
function mvPushMatrix() {
	var copy = mat4.clone(mvMatrix);
	mvMatrixStack.push(copy);
}

//----------------------------------------------------------------------------------
/**
* Pops matrix off of modelview matrix stack
*/
function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
* Sends projection/modelview matrices to shader
*/
function setMatrixUniforms() {
	uploadModelViewMatrixToShader();
	uploadNormalMatrixToShader();
	uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
* Translates degrees to radians
* @param {Number} degrees Degree input to function
* @return {Number} The radians that correspond to the degree input
*/
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
* Creates a context for WebGL
* @param {element} canvas WebGL canvas
* @return {Object} WebGL context
*/
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

//----------------------------------------------------------------------------------
/**
* Loads Shaders
* @param {string} id ID string for shader to load. Either vertex shader/fragment shader
*/
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

	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); 
	shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor"); 
	shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
	shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
	shaderProgram.uniformObjectLoc = gl.getUniformLocation(shaderProgram, "uObject");
	shaderProgram.uniformReflectLoc = gl.getUniformLocation(shaderProgram, "uReflect");
}

function uploadLightsToShader(loc,a,d,s) {
	gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
	gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
	gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
	gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

function setupBuffers() {
	setupCubeBuffers();		// initialize cube
	setupTeapotBuffers();	// intialize teapot
}

function setupCubeMap() {
	cubeTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeTexture, "imgxpos.png");  
	loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeTexture, "imgxneg.png"); 
	loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeTexture, "imgypos.png");  
	loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeTexture, "imgyneg.png");  
	loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeTexture, "imgzpos.png");  
	loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeTexture, "imgzneg.png");
}

function loadCubeMapFace(gl, target, texture, url){
	var image = new Image();
	image.onload = function()
	{
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
		gl.texImage2D(target,0,gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	}
	image.src = url;

}

// for rotating the eye
function editEye(angle) {
	quat.setAxisAngle(eyeQuat, up, angle);		// change the angle of the quarterion
	vec3.transformQuat(eyePt,eyePt,eyeQuat);	// rotate the eye
}

// for rotating the teapot
function editTeapot(angle){
	if(teapotReady){
		quat.setAxisAngle(teapotQuat, up, angle);	// change the angle of the quarterion
		var dir = vec3.create();
		for(i=0; i<teapotPositions.length; i+=3){
			dir = vec3.fromValues(teapotPositions[i], teapotPositions[i+1], teapotPositions[i+2]);	// create a vector out of the positions array
			vec3.transformQuat(dir,dir,teapotQuat);													// rotate the vector with the quarterions
			teapotPositions[i] = dir[0];
			teapotPositions[i+1] = dir[1];
			teapotPositions[i+2] = dir[2];

			dir = vec3.fromValues(teapotNormals[i], teapotNormals[i+1], teapotNormals[i+2]);		// create a vector out of the positions array
			vec3.transformQuat(dir,dir,teapotQuat);													// rotate the vector with the quarterions
			teapotNormals[i] = dir[0];
			teapotNormals[i+1] = dir[1];
			teapotNormals[i+2] = dir[2];
		}
		
		// apply the changes
		teapotVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotPositions), gl.STATIC_DRAW);
		teapotVertexPositionBuffer.itemSize = 3;
		teapotVertexPositionBuffer.numItems = teapotPositions.length/3;

		// Specify normals to be able to do lighting calculations
		teapotVertexNormalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotNormals), gl.STATIC_DRAW);
		teapotVertexNormalBuffer.itemSize = 3;
		teapotVertexNormalBuffer.numItems = teapotPositions.length/3;
	}
}

function draw() {

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// We'll use perspective
	mat4.perspective(pMatrix,degToRad(90), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

	if(eyeLeft){		// use quartions to rotate eye
		editEye(-0.02);	
	}
	if(eyeRight){		// use quartions to rotate eye
		editEye(0.02);
	}
	if(teapotLeft){		// use quartions to rotate teapot
		editTeapot(-0.02);
	}
	if(teapotRight){	// use quartions to rotate teapot
		editTeapot(0.02);
	}

	// Then generate the lookat matrix and initialize the MV matrix to that view
	mat4.lookAt(mvMatrix,eyePt,viewPt,up);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
	gl.uniform1i(shaderProgram.uCubeSampler, 1);

	mvPushMatrix();
	gl.enableVertexAttribArray(shaderProgram.aVertexTextureCoords);

	mvPushMatrix();
	setMatrixUniforms();

	uploadLightsToShader([5,10,5],[0.2,0.2,0.2],[0.58,0.58,0.58],[0.58,0.58,0.58]);	// set the light to be above and to the corner of the teapot

	gl.uniform1f(shaderProgram.uniformObjectLoc, 0.0);		// set the fragment shader to handle the cubemap
	drawCube();
	gl.uniform1f(shaderProgram.uniformObjectLoc, 1.0);		// set the fragment shader to handle the teapot
	drawTeapot();

	mvPopMatrix();
}

function startup() {
	canvas = document.getElementById("myGLCanvas");
	window.addEventListener( 'keydown', onKeyDown, false );		// turn on rotations
	window.addEventListener( 'keyup', onKeyUp, false );			// turn off rotations
	gl = createGLContext(canvas);
	setupShaders();
	setupCubeMap();		// initalize the cubemap
	setupBuffers();		// initalize the cube and teapot
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	tick();
}

function tick() {
	requestAnimFrame(tick);
	draw();
}

function onKeyDown(event){
    if(event.keyCode =="37"){		// left arrow key
        eyeLeft = true;				// rotate the eye left
    }
    if(event.keyCode =="39"){		// right arrow key
        eyeRight = true;			// rotate the eye right
    }
    if(event.keyCode =="38"){		// up arrow key
        teapotLeft = true;			// rotate the teapot left
    }
    if(event.keyCode =="40"){		// down arrow key
        teapotRight = true;			// rotate the teapot right
    }
}

function onKeyUp(event){
	if(event.keyCode =="37"){		// left arrow key
        eyeLeft = false;			// stop rotating eye left
    }
    if(event.keyCode =="39"){		// right arrow key
        eyeRight = false;			// stop rotating eye right
    }
    if(event.keyCode =="38"){		// up arrow key
        teapotLeft = false;			// stop rotating teapot left
    }
    if(event.keyCode =="40"){		// down arrow key
        teapotRight = false;		// stop rotating teapot right
    }
}

function reflectOn() {
	gl.uniform1f(shaderProgram.uniformReflectLoc, 1.0);
}

function reflectOff() {
	gl.uniform1f(shaderProgram.uniformReflectLoc, 0.0);
}