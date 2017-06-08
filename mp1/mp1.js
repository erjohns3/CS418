
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;


// Create a place to store vertex colors
var vertexColorBuffer;
var pMatrix = mat4.create();
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var length = 0;           // this variable is for keeping track of the percentage of the full length change that has occurred so far
var time = 0;             // this keeps track of the current time frame

function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}


function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


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

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  
}

function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
    -0.5,0.5,0.0,
    -0.5,0.32,0.0,
    0.5,0.5,0.0,
      
    0.5,0.5,0.0,
    0.5,0.32,0.0,
    -0.5,0.32,0.0,

    -0.41,0.32,0.0,
    -0.18,0.32,0.0,
    -0.41,-0.21,0.0,
      
    -0.18,0.32,0.0,
    -0.18,-0.21,0.0,
    -0.41,-0.21,0.0,

    0.41,0.32,0.0,
    0.18,0.32,0.0,
    0.41,-0.21,0.0,
      
    0.18,0.32,0.0,
    0.18,-0.21,0.0,
    0.41,-0.21,0.0,

    -0.18,0.18,0.0,
    -0.18,-0.07,0.0,
    -0.1,0.18,0.0,

    -0.1,0.18,0.0,
    -0.18,-0.07,0.0,
    -0.1,-0.07,0.0,

    0.18,0.18,0.0,
    0.18,-0.07,0.0,
    0.1,0.18,0.0,

    0.1,0.18,0.0,
    0.18,-0.07,0.0,
    0.1,-0.07,0.0,

///////////////////////////////

    -0.41,-0.24,0.0,
    -0.41,-0.32,0.0,
    -0.33,-0.24,0.0,

    -0.41,-0.32,0.0,
    -0.33,-0.24,0.0,
    -0.33,-0.32,0.0,

    -0.41,-0.32,0.0,
    -0.33,-0.32,0.0,
    -0.33,-0.37,0.0,

    -0.26,-0.24,0.0,
    -0.26,-0.41,0.0,
    -0.18,-0.24,0.0,

    -0.18,-0.41,0.0,
    -0.26,-0.41,0.0,
    -0.18,-0.24,0.0,

    -0.18,-0.41,0.0,
    -0.26,-0.41,0.0,
    -0.18,-0.46,0.0,

    -0.11,-0.24,0.0,
    -0.11,-0.50,0.0,
    -0.04,-0.24,0.0,

    -0.04,-0.50,0.0,
    -0.11,-0.50,0.0,
    -0.04,-0.24,0.0,

    -0.11,-0.50,0.0,
    -0.04,-0.50,0.0,
    -0.04,-0.55,0.0,

    /////////////////////////////

    0.41,-0.24,0.0,
    0.41,-0.32,0.0,
    0.33,-0.24,0.0,

    0.41,-0.32,0.0,
    0.33,-0.24,0.0,
    0.33,-0.32,0.0,

    0.41,-0.32,0.0,
    0.33,-0.32,0.0,
    0.33,-0.37,0.0,

    0.26,-0.24,0.0,
    0.26,-0.41,0.0,
    0.18,-0.24,0.0,

    0.18,-0.41,0.0,
    0.26,-0.41,0.0,
    0.18,-0.24,0.0,

    0.18,-0.41,0.0,
    0.26,-0.41,0.0,
    0.18,-0.46,0.0,

    0.11,-0.24,0.0,
    0.11,-0.50,0.0,
    0.04,-0.24,0.0,

    0.04,-0.50,0.0,
    0.11,-0.50,0.0,
    0.04,-0.24,0.0,

    0.11,-0.50,0.0,
    0.04,-0.50,0.0,
    0.04,-0.55,0.0,
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 84;
   
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,

    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,

    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,

    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,

    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,
    0.075,0.157,0.294,1,

    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,

    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,

    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,

    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,

    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,

    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
    0.914,0.294,0.216,1,
 

  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 84;
}

function draw() { 
  var transformVec = vec3.create();
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  

  mat4.identity(mvMatrix);

  //vec3.set(transformVec, 0.75,0.75,0.0)
  //mat4.translate(mvMatrix, mvMatrix,transformVec);

  if(time >= 90 && time <= 150){                                // the affine rotation only goes during the time frames 90-150
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(3*(time-90)));    // the mesh is flipped around the y axis 180 degrees at the end of each animation cycle
  } 
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

function animate() {                          // the animate function is where most of my added code is
  time = (time + 1) % 150;                    // the time variable keeps track of whick frame the animation is in, it loops back at frame 150
  
  if(time >= 0 && time <= 90){                // the non-affine animation only takes place from time frames 0-90
    length = Math.sin(degToRad((time)*2));    // the length variable determines the percenetage of change each of the modified vertices has gone through

  }

  var triangleVertices = [

    // below is the code for the blue section surrounding the I
    -0.5,0.5,0.0,
    -0.5,0.32,0.0,
    0.5,0.5,0.0,
      
    0.5,0.5,0.0,
    0.5,0.32,0.0,
    -0.5,0.32,0.0,

    -0.41,0.32,0.0,
    -0.18,0.32,0.0,
    -0.41,-0.21,0.0,
      
    -0.18,0.32,0.0,
    -0.18,-0.21,0.0,
    -0.41,-0.21,0.0,

    0.41,0.32,0.0,
    0.18,0.32,0.0,
    0.41,-0.21,0.0,
      
    0.18,0.32,0.0,
    0.18,-0.21,0.0,
    0.41,-0.21,0.0,

    -0.18,0.18,0.0,
    -0.18,-0.07,0.0,
    -0.1,0.18,0.0,

    -0.1,0.18,0.0,
    -0.18,-0.07,0.0,
    -0.1,-0.07,0.0,

    0.18,0.18,0.0,
    0.18,-0.07,0.0,
    0.1,0.18,0.0,

    0.1,0.18,0.0,
    0.18,-0.07,0.0,
    0.1,-0.07,0.0,

// below is the code the left side of the orange shapes below the I

    -0.41,-0.24,0.0,
    -0.41,-0.32-length*0.115,0.0,
    -0.33,-0.24,0.0,

    -0.41,-0.32-length*0.115,0.0,
    -0.33,-0.24,0.0,
    -0.33,-0.32-length*0.115,0.0,

    -0.41,-0.32-length*0.115,0.0,
    -0.33,-0.32-length*0.115,0.0,
    -0.33,-0.37-length*0.065,0.0,

    -0.26,-0.24,0.0,
    -0.26,-0.41-length*0.025,0.0,
    -0.18,-0.24,0.0,

    -0.18,-0.41-length*0.025,0.0,
    -0.26,-0.41-length*0.025,0.0,
    -0.18,-0.24,0.0,

    -0.18,-0.41-length*0.025,0.0,
    -0.26,-0.41-length*0.025,0.0,
    -0.18,-0.46+length*0.025,0.0,

    -0.11,-0.24,0.0,
    -0.11,-0.50+length*0.065,0.0,
    -0.04,-0.24,0.0,

    -0.04,-0.50+length*0.065,0.0,
    -0.11,-0.50+length*0.065,0.0,
    -0.04,-0.24,0.0,

    -0.11,-0.50+length*0.065,0.0,
    -0.04,-0.50+length*0.065,0.0,
    -0.04,-0.55+length*0.115,0.0,

    // below is the code the right side of the orange shapes below the I

    0.41,-0.24,0.0,
    0.41,-0.32-length*0.115,0.0,
    0.33,-0.24,0.0,

    0.41,-0.32-length*0.115,0.0,
    0.33,-0.24,0.0,
    0.33,-0.32-length*0.115,0.0,

    0.41,-0.32-length*0.115,0.0,
    0.33,-0.32-length*0.115,0.0,
    0.33,-0.37-length*0.065,0.0,

    0.26,-0.24,0.0,
    0.26,-0.41-length*0.025,0.0,
    0.18,-0.24,0.0,

    0.18,-0.41-length*0.025,0.0,
    0.26,-0.41-length*0.025,0.0,
    0.18,-0.24,0.0,

    0.18,-0.41-length*0.025,0.0,
    0.26,-0.41-length*0.025,0.0,
    0.18,-0.46+length*0.025,0.0,

    0.11,-0.24,0.0,
    0.11,-0.50+length*0.065,0.0,
    0.04,-0.24,0.0,

    0.04,-0.50+length*0.065,0.0,
    0.11,-0.50+length*0.065,0.0,
    0.04,-0.24,0.0,

    0.11,-0.50+length*0.065,0.0,
    0.04,-0.50+length*0.065,0.0,
    0.04,-0.55+length*0.115,0.0,
  ];

  //each of the vertices making up the bottom sections of the orange shapes move to the same y value to form a flat line across the bottom
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 84;
  
}

function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}
