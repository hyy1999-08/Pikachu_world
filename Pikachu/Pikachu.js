//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
//
// merged and modified to became:
//
// ControlMulti.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes 
//			in just one Vertex Buffer Object(VBO).
//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons 
//				--Webpage edit-box text, and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//				--Keyboard input: alphanumeric + 'special' keys (arrows, etc)
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.
//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
                  
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
var g_angle01 = 0;                  // initial rotation angle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second 

var g_angle02 = 0;                  // initial rotation angle
var g_angle02Rate = 40.0;           // rotation speed, in degrees/second 

var g_angle03 = 0;                  // initial rotation angle
var g_angle03Rate = 40.0;           // rotation speed, in degrees/second 

var g_angle04 = 0;                  // initial rotation angle
var g_angle04Rate = 22.5;           // rotation speed, in degrees/second 

var g_angle05 = 0;                  // initial rotation angle
var g_angle05Rate = 15;           // rotation speed, in degrees/second 

var g_angle06 = 0;                  // initial rotation angle
var g_angle06Rate = 10;           // rotation speed, in degrees/second 
//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
var g_digits=5;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(g_digits)); // print 5 digits	
									
									
//------------For keyboard -------------------------------

var moveFWD=false;
var movepace=0.0;
var movepaceud=0.0;

//------------For movetmp -------------------------------

var myTmp_1=0.0;
var myTmp_3=0.0;
var myTmp_4=0.0;
var myTmp_5=0.0;
var myTmp_6=0.0;



function main() {
//==============================================================================
/*REPLACED THIS: 
// Retrieve <canvas> element:
 var canvas = document.getElementById('webgl'); 
//with global variable 'g_canvas' declared & set above.
*/
  
  // Get gl, the rendering context for WebGL, from our 'g_canvas' object
  gl = getWebGLContext(g_canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  g_maxVerts = initVertexBuffer(gl);  
  if (g_maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------
	
  // Specify the color for clearing <canvas>
  gl.clearColor(0.3, 0.3, 0.3, 1.0);

	// // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// // unless the new Z value is closer to the eye than the old one..
	// gl.depthFunc(gl.LESS);
	// gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
/* REPLACED by global var 'g_ModelMatrix' (declared, constructed at top)
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
*/
/* REPLACED by global g_angle01 variable (declared at top)
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
*/

  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {
    animate();   // Update the rotation angle
    drawAll();   // Draw all parts
//    console.log('g_angle01=',g_angle01.toFixed(g_digits)); // put text in console.

//	Show some always-changing text in the webpage :  
//		--find the HTML element called 'CurAngleDisplay' in our HTML page,
//			 	(a <div> element placed just after our WebGL 'canvas' element)
// 				and replace it's internal HTML commands (if any) with some
//				on-screen text that reports our current angle value:
//		--HINT: don't confuse 'getElementByID() and 'getElementById()
		document.getElementById('CurAngleDisplayForMiniModel').innerHTML= 
			'g_angle01= '+g_angle01.toFixed(g_digits)+'<br>';
		document.getElementById('CurAngleDisplay').innerHTML=
		'leftEar_Rate='+g_angle03Rate.toFixed(g_digits)+'<br>'
		+'rightEar_Rate='+g_angle05Rate.toFixed(g_digits);
		// Also display our current mouse-dragging state:
		// document.getElementById('Mouse').innerHTML=
		// 	'Mouse Drag totals (CVV coords):\t'+
		// 	g_xMdragTot.toFixed(5)+', \t'+g_yMdragTot.toFixed(g_digits);	
		//--------------------------------
    requestAnimationFrame(tick, g_canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer() {
//==============================================================================
// NOTE!  'gl' is now a global variable -- no longer needed as fcn argument!

	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);
	var j=Math.PI/180;						 
  var colorShapes = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
/*	Nodes:
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)

// *///tetrahedron(12)
// 			// Face 0: (left side)  
//      0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
//      c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
//      0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
// 			// Face 1: (right side)
// 		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
//      0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
//     -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
//     	// Face 2: (lower side)
// 		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 
//     -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
//      c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 
//      	// Face 3: (base side)  
//     -c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
//      0.0,  1.0,  0.0, 1.0,  	1.0,  0.0,  0.0,	// Node 2
//      c30, -0.5,  0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
	 //my cube part I(36)
	 //upper side
	 0.0, 0.5, 0.0, 1.0,		250/255,214/255,29/255,
	 0.0, 0.5, 0.5, 1.0,		250/255,214/255,29/255,
	 0.5, 0.5, 0.0, 1.0,		250/255,214/255,29/255,
	 0.5, 0.5, 0.0, 1.0,		250/255,214/255,29/255,
	 0.0, 0.5, 0.5, 1.0,		250/255,214/255,29/255,
	 0.5, 0.5, 0.5, 1.0,		250/255,214/255,29/255,
	 //base
	  0.0,  0.0, 0.0, 1.0,		250/255,214/255,29/255,
	  0.5,  0.0, 0.0, 1.0,		250/255,214/255,29/255,
	  0.0, 0.0, 0.5, 1.0,		250/255,214/255,29/255,
	  0.0, 0.0, 0.5, 1.0,  		250/255,214/255,29/255,
	  0.5,  0.0, 0.0, 1.0,		250/255,214/255,29/255,	
	  0.5,  0.0, 0.5, 1.0,		250/255,214/255,29/255,
	 //left
	 0.0, 0.0, 0.0, 1.0,		250/255,214/255,29/255,
	 0.0, 0.0, 0.5, 1.0,		250/255,214/255,29/255,
	 0.0, 0.5, 0.0, 1.0,		250/255,214/255,29/255,
	 0.0, 0.5, 0.0, 1.0,		250/255,214/255,29/255,
	 0.0, 0.0, 0.5, 1.0,		250/255,214/255,29/255,
	 0.0, 0.5, 0.5, 1.0,		250/255,214/255,29/255,
	 //right
	  0.5,  0.0, 0.0, 1.0,		250/255,214/255,29/255,
	  0.5,  0.5, 0.0, 1.0,		250/255,214/255,29/255,
	  0.5, 0.0, 0.5, 1.0,		250/255,214/255,29/255,
	  0.5, 0.0, 0.5, 1.0,  		250/255,214/255,29/255,
	  0.5,  0.5, 0.0, 1.0,		250/255,214/255,29/255,
	  0.5,  0.5, 0.5, 1.0,		250/255,214/255,29/255,
	 //front
	 0.0, 0.5, 0.5, 1.0,		250/255,214/255,29/255,
	 0.0, 0.0, 0.5, 1.0,		250/255,214/255,29/255,
	 0.5, 0.5, 0.5, 1.0,		250/255,214/255,29/255,
	 0.5, 0.5, 0.5, 1.0,		250/255,214/255,29/255,
	 0.0, 0.0, 0.5, 1.0,		250/255,214/255,29/255,
	 0.5, 0.0, 0.5, 1.0,		250/255,214/255,29/255,
	 //back
	  0.0,  0.5, 0.0, 1.0,		255/255, 222/255, 0,
	  0.5,  0.5, 0.0, 1.0,		255/255, 222/255, 0,
	  0.0, 0.0, 0.0, 1.0,		225/255, 151/255, 32/255,
	  0.0, 0.0, 0.0, 1.0, 		225/255, 151/255, 32/255,
	  0.5,  0.5, 0.0, 1.0,		255/255, 222/255, 0,
	  0.5,  0.0, 0.50, 1.0,		225/255, 151/255, 32/255,
	  //left eyes(38)
	  0.15, 0.3, 0.501, 1.0, 0,0,0,
	  (Math.sin(j)+0.15*15)/15,(Math.cos(j)+0.3*15)/15, 0.501, 1.0,    0, 0, 0,
	  (Math.sin(10*j)+0.15*15)/15,(Math.cos(10*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(20*j)+0.15*15)/15,(Math.cos(20*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(30*j)+0.15*15)/15,(Math.cos(30*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(40*j)+0.15*15)/15,(Math.cos(40*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(50*j)+0.15*15)/15,(Math.cos(50*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(60*j)+0.15*15)/15,(Math.cos(60*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(70*j)+0.15*15)/15,(Math.cos(70*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(80*j)+0.15*15)/15,(Math.cos(80*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(90*j)+0.15*15)/15,(Math.cos(90*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(100*j)+0.15*15)/15,(Math.cos(100*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(110*j)+0.15*15)/15,(Math.cos(110*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(120*j)+0.15*15)/15,(Math.cos(120*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(130*j)+0.15*15)/15,(Math.cos(130*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(140*j)+0.15*15)/15,(Math.cos(140*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(150*j)+0.15*15)/15,(Math.cos(150*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(160*j)+0.15*15)/15,(Math.cos(160*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(170*j)+0.15*15)/15,(Math.cos(170*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(180*j)+0.15*15)/15,(Math.cos(180*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(190*j)+0.15*15)/15,(Math.cos(190*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(200*j)+0.15*15)/15,(Math.cos(200*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(210*j)+0.15*15)/15,(Math.cos(210*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(220*j)+0.15*15)/15,(Math.cos(220*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(230*j)+0.15*15)/15,(Math.cos(230*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(240*j)+0.15*15)/15,(Math.cos(240*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(250*j)+0.15*15)/15,(Math.cos(250*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(260*j)+0.15*15)/15,(Math.cos(260*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(270*j)+0.15*15)/15,(Math.cos(270*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(280*j)+0.15*15)/15,(Math.cos(280*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(290*j)+0.15*15)/15,(Math.cos(290*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(300*j)+0.15*15)/15,(Math.cos(300*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(310*j)+0.15*15)/15,(Math.cos(310*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(320*j)+0.15*15)/15,(Math.cos(320*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(330*j)+0.15*15)/15,(Math.cos(330*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(340*j)+0.15*15)/15,(Math.cos(340*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(350*j)+0.15*15)/15,(Math.cos(350*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	  (Math.sin(361*j)+0.15*15)/15,(Math.cos(361*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,

	  //left_eye_white(38)
	  0.17, 0.32, 0.5011, 1.0, 1,1,1,
	  (Math.sin(j)+0.17*22)/22,(Math.cos(j)+0.32*22)/22, 0.5011, 1.0,    1, 1, 1,
	  (Math.sin(10*j)+0.17*22)/22,(Math.cos(10*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(20*j)+0.17*22)/22,(Math.cos(20*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(30*j)+0.17*22)/22,(Math.cos(30*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(40*j)+0.17*22)/22,(Math.cos(40*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(50*j)+0.17*22)/22,(Math.cos(50*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(60*j)+0.17*22)/22,(Math.cos(60*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(70*j)+0.17*22)/22,(Math.cos(70*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(80*j)+0.17*22)/22,(Math.cos(80*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(90*j)+0.17*22)/22,(Math.cos(90*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(100*j)+0.17*22)/22,(Math.cos(100*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(110*j)+0.17*22)/22,(Math.cos(110*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(120*j)+0.17*22)/22,(Math.cos(120*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(130*j)+0.17*22)/22,(Math.cos(130*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(140*j)+0.17*22)/22,(Math.cos(140*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(150*j)+0.17*22)/22,(Math.cos(150*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(160*j)+0.17*22)/22,(Math.cos(160*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(170*j)+0.17*22)/22,(Math.cos(170*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(180*j)+0.17*22)/22,(Math.cos(180*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(190*j)+0.17*22)/22,(Math.cos(190*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(200*j)+0.17*22)/22,(Math.cos(200*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(210*j)+0.17*22)/22,(Math.cos(210*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(220*j)+0.17*22)/22,(Math.cos(220*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(230*j)+0.17*22)/22,(Math.cos(230*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(240*j)+0.17*22)/22,(Math.cos(240*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(250*j)+0.17*22)/22,(Math.cos(250*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(260*j)+0.17*22)/22,(Math.cos(260*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(270*j)+0.17*22)/22,(Math.cos(270*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(280*j)+0.17*22)/22,(Math.cos(280*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(290*j)+0.17*22)/22,(Math.cos(290*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(300*j)+0.17*22)/22,(Math.cos(300*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(310*j)+0.17*22)/22,(Math.cos(310*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(320*j)+0.17*22)/22,(Math.cos(320*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(330*j)+0.17*22)/22,(Math.cos(330*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(340*j)+0.17*22)/22,(Math.cos(340*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(350*j)+0.17*22)/22,(Math.cos(350*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	  (Math.sin(361*j)+0.17*22)/22,(Math.cos(361*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	//right eyes(38)
	0.35, 0.3, 0.501, 1.0, 0,0,0,
	(Math.sin(j)+0.35*15)/15,(Math.cos(j)+0.3*15)/15, 0.501, 1.0,    0, 0, 0,
	(Math.sin(10*j)+0.35*15)/15,(Math.cos(10*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(20*j)+0.35*15)/15,(Math.cos(20*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(30*j)+0.35*15)/15,(Math.cos(30*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(40*j)+0.35*15)/15,(Math.cos(40*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(50*j)+0.35*15)/15,(Math.cos(50*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(60*j)+0.35*15)/15,(Math.cos(60*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(70*j)+0.35*15)/15,(Math.cos(70*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(80*j)+0.35*15)/15,(Math.cos(80*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(90*j)+0.35*15)/15,(Math.cos(90*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(100*j)+0.35*15)/15,(Math.cos(100*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(110*j)+0.35*15)/15,(Math.cos(110*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(120*j)+0.35*15)/15,(Math.cos(120*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(130*j)+0.35*15)/15,(Math.cos(130*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(140*j)+0.35*15)/15,(Math.cos(140*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(150*j)+0.35*15)/15,(Math.cos(150*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(160*j)+0.35*15)/15,(Math.cos(160*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(170*j)+0.35*15)/15,(Math.cos(170*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(180*j)+0.35*15)/15,(Math.cos(180*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(190*j)+0.35*15)/15,(Math.cos(190*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(200*j)+0.35*15)/15,(Math.cos(200*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(210*j)+0.35*15)/15,(Math.cos(210*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(220*j)+0.35*15)/15,(Math.cos(220*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(230*j)+0.35*15)/15,(Math.cos(230*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(240*j)+0.35*15)/15,(Math.cos(240*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(250*j)+0.35*15)/15,(Math.cos(250*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(260*j)+0.35*15)/15,(Math.cos(260*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(270*j)+0.35*15)/15,(Math.cos(270*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(280*j)+0.35*15)/15,(Math.cos(280*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(290*j)+0.35*15)/15,(Math.cos(290*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(300*j)+0.35*15)/15,(Math.cos(300*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(310*j)+0.35*15)/15,(Math.cos(310*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(320*j)+0.35*15)/15,(Math.cos(320*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(330*j)+0.35*15)/15,(Math.cos(330*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(340*j)+0.35*15)/15,(Math.cos(340*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(350*j)+0.35*15)/15,(Math.cos(350*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	(Math.sin(361*j)+0.35*15)/15,(Math.cos(361*j)+0.3*15)/15,0.501,1.0,    0, 0, 0,
	
	//right_eye_white(38)
	0.37, 0.32, 0.5011, 1.0, 1,1,1,
	(Math.sin(j)+0.37*22)/22,(Math.cos(j)+0.32*22)/22, 0.5011, 1.0,    1, 1, 1,
	(Math.sin(10*j)+0.37*22)/22,(Math.cos(10*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(20*j)+0.37*22)/22,(Math.cos(20*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(30*j)+0.37*22)/22,(Math.cos(30*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(40*j)+0.37*22)/22,(Math.cos(40*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(50*j)+0.37*22)/22,(Math.cos(50*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(60*j)+0.37*22)/22,(Math.cos(60*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(70*j)+0.37*22)/22,(Math.cos(70*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(80*j)+0.37*22)/22,(Math.cos(80*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(90*j)+0.37*22)/22,(Math.cos(90*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(100*j)+0.37*22)/22,(Math.cos(100*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(110*j)+0.37*22)/22,(Math.cos(110*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(120*j)+0.37*22)/22,(Math.cos(120*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(130*j)+0.37*22)/22,(Math.cos(130*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(140*j)+0.37*22)/22,(Math.cos(140*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(150*j)+0.37*22)/22,(Math.cos(150*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(160*j)+0.37*22)/22,(Math.cos(160*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(170*j)+0.37*22)/22,(Math.cos(170*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(180*j)+0.37*22)/22,(Math.cos(180*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(190*j)+0.37*22)/22,(Math.cos(190*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(200*j)+0.37*22)/22,(Math.cos(200*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(210*j)+0.37*22)/22,(Math.cos(210*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(220*j)+0.37*22)/22,(Math.cos(220*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(230*j)+0.37*22)/22,(Math.cos(230*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(240*j)+0.37*22)/22,(Math.cos(240*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(250*j)+0.37*22)/22,(Math.cos(250*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(260*j)+0.37*22)/22,(Math.cos(260*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(270*j)+0.37*22)/22,(Math.cos(270*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(280*j)+0.37*22)/22,(Math.cos(280*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(290*j)+0.37*22)/22,(Math.cos(290*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(300*j)+0.37*22)/22,(Math.cos(300*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(310*j)+0.37*22)/22,(Math.cos(310*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(320*j)+0.37*22)/22,(Math.cos(320*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(330*j)+0.37*22)/22,(Math.cos(330*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(340*j)+0.37*22)/22,(Math.cos(340*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(350*j)+0.37*22)/22,(Math.cos(350*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	(Math.sin(361*j)+0.37*22)/22,(Math.cos(361*j)+0.32*22)/22,0.5011,1.0,    1, 1, 1,
	//noses(38)
	0.254, 0.235, 0.501, 1.0, 0,0,0,
	(Math.sin(j)+0.254*75)/75,(Math.cos(j)+0.235*120)/120, 0.5011, 1.0,    0, 0, 0,
	(Math.sin(10*j)+0.254*75)/75,(Math.cos(10*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(20*j)+0.254*75)/75,(Math.cos(20*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(30*j)+0.254*75)/75,(Math.cos(30*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(40*j)+0.254*75)/75,(Math.cos(40*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(50*j)+0.254*75)/75,(Math.cos(50*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(60*j)+0.254*75)/75,(Math.cos(60*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(70*j)+0.254*75)/75,(Math.cos(70*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(80*j)+0.254*75)/75,(Math.cos(80*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(90*j)+0.254*75)/75,(Math.cos(90*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(100*j)+0.254*75)/75,(Math.cos(100*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(110*j)+0.254*75)/75,(Math.cos(110*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(120*j)+0.254*75)/75,(Math.cos(120*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(130*j)+0.254*75)/75,(Math.cos(130*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(140*j)+0.254*75)/75,(Math.cos(140*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(150*j)+0.254*75)/75,(Math.cos(150*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(160*j)+0.254*75)/75,(Math.cos(160*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(170*j)+0.254*75)/75,(Math.cos(170*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(180*j)+0.254*75)/75,(Math.cos(180*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(190*j)+0.254*75)/75,(Math.cos(190*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(200*j)+0.254*75)/75,(Math.cos(200*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(210*j)+0.254*75)/75,(Math.cos(210*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(220*j)+0.254*75)/75,(Math.cos(220*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(230*j)+0.254*75)/75,(Math.cos(230*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(240*j)+0.254*75)/75,(Math.cos(240*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(250*j)+0.254*75)/75,(Math.cos(250*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(260*j)+0.254*75)/75,(Math.cos(260*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(270*j)+0.254*75)/75,(Math.cos(270*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(280*j)+0.254*75)/75,(Math.cos(280*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(290*j)+0.254*75)/75,(Math.cos(290*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(300*j)+0.254*75)/75,(Math.cos(300*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(310*j)+0.254*75)/75,(Math.cos(310*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(320*j)+0.254*75)/75,(Math.cos(320*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(330*j)+0.254*75)/75,(Math.cos(330*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(340*j)+0.254*75)/75,(Math.cos(340*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(350*j)+0.254*75)/75,(Math.cos(350*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
	(Math.sin(361*j)+0.254*75)/75,(Math.cos(361*j)+0.235*120)/120,0.5011,1.0,    0, 0, 0,
//left_Mouth(13)
(Math.sin(120*j)+0.20*15)/15,(Math.cos(120*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(130*j)+0.20*15)/15,(Math.cos(130*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(140*j)+0.20*15)/15,(Math.cos(140*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(150*j)+0.20*15)/15,(Math.cos(150*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(160*j)+0.20*15)/15,(Math.cos(160*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(170*j)+0.20*15)/15,(Math.cos(170*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(180*j)+0.20*15)/15,(Math.cos(180*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(190*j)+0.20*15)/15,(Math.cos(190*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(200*j)+0.20*15)/15,(Math.cos(200*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(210*j)+0.20*15)/15,(Math.cos(210*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(220*j)+0.20*15)/15,(Math.cos(220*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(230*j)+0.20*15)/15,(Math.cos(230*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(240*j)+0.20*15)/15,(Math.cos(240*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,

//right_Mouth(13)
(Math.sin(120*j)+0.31*15)/15,(Math.cos(120*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(130*j)+0.31*15)/15,(Math.cos(130*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(140*j)+0.31*15)/15,(Math.cos(140*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(150*j)+0.31*15)/15,(Math.cos(150*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(160*j)+0.31*15)/15,(Math.cos(160*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(170*j)+0.31*15)/15,(Math.cos(170*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(180*j)+0.31*15)/15,(Math.cos(180*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(190*j)+0.31*15)/15,(Math.cos(190*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(200*j)+0.31*15)/15,(Math.cos(200*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(210*j)+0.31*15)/15,(Math.cos(210*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(220*j)+0.31*15)/15,(Math.cos(220*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(230*j)+0.31*15)/15,(Math.cos(230*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,
(Math.sin(240*j)+0.31*15)/15,(Math.cos(240*j)+0.17*25)/25,0.501,1.0,    0, 0, 0,

//left_ear_part1
//left side
-0.125, 0.15, -0.125, 1.00,	225/255, 151/255, 32/255, //2
-0.125, -0.10, -0.125, 1.00,  225/255, 151/255, 32/255, 	 //1
-0.125, 0.15, 0.125, 1.00,   255/255, 222/255, 0,	//3
-0.125, 0.15, 0.125, 1.00,   255/255, 222/255, 0,	//3
-0.125, -0.10, -0.125, 1.00, 225/255, 151/255, 32/255, 	 //1
-0.125, -0.10, 0.125, 1.00,   255/255, 222/255, 0,	  //4

//base side
-0.125, -0.10, -0.125, 1.00,  225/255, 151/255, 32/255, 	 //1
-0.125, 0.15, -0.125, 1.00,	225/255, 151/255, 32/255,   //2
0.00, 0.00, 0.00, 1.00,	255/255, 226/255, 111/255,   //0
//front side
0.00, 0.00, 0.00, 1.00,	255/255, 226/255, 111/255,   //0
-0.125, 0.15, 0.125, 1.00,   255/255, 222/255, 0,	//3
-0.125, -0.10, 0.125, 1.00,    255/255, 222/255, 0,	  //4
//upper side
0.00, 0.00, 0.00, 1.00,	255/255, 226/255, 111/255,   //0
-0.125, 0.15, -0.125, 1.00,	225/255, 151/255, 32/255,    //2
-0.125, 0.15, 0.125, 1.00,   255/255, 222/255, 0,	//3
//lower side
-0.125, -0.10, -0.125, 1.00,   225/255, 151/255, 32/255, 	 //1
0.00, 0.00, 0.00, 1.00,	255/255, 226/255, 111/255,  //0
-0.125, -0.10, 0.125, 1.00,   255/255, 222/255, 0,	 //4


//left_ear_part2
//base side
0.125,0.25*Math.sqrt(6)/3,-0.125*Math.sqrt(3)/3,1.00,  245/255,233/255,126/255,//1
0.00, 0.00, 0.00, 1.00,  245/255,233/255,126/255,//3
-0.125, 0.25*Math.sqrt(6)/3, -0.125*Math.sqrt(3)/3, 1.00,  245/255,233/255,126/255,//2

//right side
0.00, 0.00, 0.00, 1.00, 245/255,233/255,126/255,//3
0.125,0.25*Math.sqrt(6)/3,-0.125*Math.sqrt(3)/3,1.00,  245/255,233/255,126/255,//1
0,0.25*Math.sqrt(6)/3,0.25*Math.sqrt(3)/3,1.00,  245/255,233/255,126/255,//4
//left side
0,0.25*Math.sqrt(6)/3,0.25*Math.sqrt(3)/3,1.00,  245/255,233/255,126/255,//4
-0.125, 0.25*Math.sqrt(6)/3, -0.125*Math.sqrt(3)/3, 1.00,  245/255,233/255,126/255,//2
0.00, 0.00, 0.00, 1.00, 245/255,233/255,126/255,//3
//upper side
0.125,0.25*Math.sqrt(6)/3,-0.125*Math.sqrt(3)/3,1.00,  245/255,233/255,126/255,//1
-0.125, 0.25*Math.sqrt(6)/3, -0.125*Math.sqrt(3)/3, 1.00,  245/255,233/255,126/255,//2
0,0.25*Math.sqrt(6)/3,0.25*Math.sqrt(3)/3,1.00, 250/255,214/255,29/255,//4

//left_ear_part3
//base side
0.125*0.25, 0.3, -0.25*0.125*Math.sqrt(3)/3, 1.00,   255/255, 222/255, 0,//7
0.125,0,-0.125*Math.sqrt(3)/3, 1.00,   225/255, 151/255, 32/255,//1
-0.125*0.25, 0.3, -0.25*0.125*Math.sqrt(3)/3, 1.00,  255/255, 222/255, 0,//5
-0.125*0.25, 0.3, -0.25*0.125*Math.sqrt(3)/3, 1.00,  255/255, 222/255, 0,//5
0.125,0,-0.125*Math.sqrt(3)/3, 1.00,   225/255, 151/255, 32/255,//1
-0.125, 0, -0.125*Math.sqrt(3)/3, 1.00,  225/255, 151/255, 32/255,//2
//lower side
0.125,0,-0.125*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//1
0,0,0.25*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//4
-0.125, 0, -0.125*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//2
//right side
-0.125*0.25, 0.3, -0.25*0.125*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//5
-0.125, 0, -0.125*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//2
0,0.3,0.25*0.25*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//6
0,0.3,0.25*0.25*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//6
-0.125, 0, -0.125*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//2
0,0,0.25*Math.sqrt(3)/3,1.00,  250/255,214/255,29/255,//4
//left side
0.125*0.25, 0.3, -0.25*0.125*Math.sqrt(3)/3, 1.00,   250/255,214/255,29/255,//7
0,0.3,0.25*0.25*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//6
0.125,0,-0.125*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//1
0.125,0,-0.125*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//1
0,0.3,0.25*0.25*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//6
0,0,0.25*Math.sqrt(3)/3, 1.00, 250/255,214/255,29/255,//4
//upper sider
0.125*0.25, 0.3, -0.25*0.125*Math.sqrt(3)/3, 1.00,   250/255,214/255,29/255,//7
-0.125*0.25, 0.3, -0.25*0.125*Math.sqrt(3)/3, 1.00,  250/255,214/255,29/255,//5
0,0.3,0.25*0.25*Math.sqrt(3)/3,1.00,  250/255,214/255,29/255,//6



//left_ear_part4
//lower side
0.125*0.25, 0.0, -0.25*0.125*Math.sqrt(3)/3, 1.00,   0,0,0,//7
0,0.0,0.25*0.25*Math.sqrt(3)/3, 1.00,  0,0,0,//6
-0.125*0.25, 0.0, -0.25*0.125*Math.sqrt(3)/3, 1.00,  0,0,0,//5
//base side

0.00, 0.10, 0.00, 1.00,   0,0,0,//3
0.125*0.25, 0.0, -0.25*0.125*Math.sqrt(3)/3, 1.00,   0,0,0,//7
-0.125*0.25, 0.0, -0.25*0.125*Math.sqrt(3)/3, 1.00,  0,0,0,//5
//left side
0.00, 0.10, 0.00, 1.00,   0,0,0,//3
-0.125*0.25, 0.0, -0.25*0.125*Math.sqrt(3)/3, 1.00,  0,0,0,//5
0,0.0,0.25*0.25*Math.sqrt(3)/3, 1.00,  0,0,0,//6
//right side
0.125*0.25, 0.0, -0.25*0.125*Math.sqrt(3)/3, 1.00,   0,0,0,//7
0.00, 0.10, 0.00, 1.00,   0,0,0,//3
0,0.0,0.25*0.25*Math.sqrt(3)/3, 1.00,  0,0,0,//6

//right_ear_part1
//left side
0.125, 0.15, -0.125, 1.00,	225/255, 151/255, 32/255,   //2
0.125, 0.15, 0.125, 1.00,   255/255, 222/255, 0,		//3
0.125, -0.10, -0.125, 1.00, 225/255, 151/255, 32/255, 	 //1
0.125, -0.10, -0.125, 1.00,   225/255, 151/255, 32/255, 	 //1
0.125, 0.15, 0.125, 1.00,    255/255, 222/255, 0,		//3
0.125, -0.10, 0.125, 1.00,   255/255, 222/255, 0,	 //4

//base side
0.125, 0.15, -0.125, 1.00,	225/255, 151/255, 32/255,  //2
0.125, -0.10, -0.125, 1.00,   225/255, 151/255, 32/255, 	 //1
0.00, 0.00, 0.00, 1.00,	255/255, 226/255, 111/255,  //0
//front side
0.125, 0.15, 0.125, 1.00,   255/255, 222/255, 0,		//3
0.00, 0.00, 0.00, 1.00,	255/255, 226/255, 111/255, //0
0.125, -0.10, 0.125, 1.00,    255/255, 222/255, 0,	 //4
//upper side
0.125, 0.15, -0.125, 1.00,	225/255, 151/255, 32/255,   //2
0.00, 0.00, 0.00, 1.00,	255/255, 226/255, 111/255,  //0
0.125, 0.15, 0.125, 1.00,    255/255, 222/255, 0,		//3
//lower side
0.125, -0.10, -0.125, 1.00,   255/255, 226/255, 111/255, //1
0.125, -0.10, 0.125, 1.00,   255/255, 222/255, 0,	 //4
0.00, 0.00, 0.00, 1.00,	255/255, 226/255, 111/255,  //0

//leftBlush
0,0,0,1,  246/255, 45/255, 20/255,
Math.sin(-31*j),Math.cos(-31*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(-30*j),Math.cos(-30*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(-20*j),Math.cos(-20*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(-10*j),Math.cos(-10*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(-1*j),Math.cos(-1*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(j),Math.cos(j), 0,  1.0,     246/255, 45/255, 20/255,
Math.sin(10*j),Math.cos(10*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(20*j),Math.cos(20*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(30*j),Math.cos(30*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(40*j),Math.cos(40*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(50*j),Math.cos(50*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(60*j),Math.cos(60*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(70*j),Math.cos(70*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(80*j),Math.cos(80*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(90*j),Math.cos(90*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(100*j),Math.cos(100*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(110*j),Math.cos(110*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(120*j),Math.cos(120*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(130*j),Math.cos(130*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(140*j),Math.cos(140*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(150*j),Math.cos(150*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(160*j),Math.cos(160*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(170*j),Math.cos(170*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(180*j),Math.cos(180*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(190*j),Math.cos(190*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(200*j),Math.cos(200*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(210*j),Math.cos(210*j),0, 1.0,      246/255, 45/255, 20/255,
Math.sin(211*j),Math.cos(211*j),0, 1.0,      246/255, 45/255, 20/255,

//Triangle for left Blush
0.07*0.5, 0.00, 0.00, 1.00, 246/255, 45/255, 20/255,
0, 0.07*0.5*Math.sqrt(3), 0.00, 1.00, 246/255, 45/255, 20/255,
0, -0.07*0.5*Math.sqrt(3), 0.00, 1.00, 246/255, 45/255, 20/255,


//leftblush_left
0,0,-0.001,1,  246/255, 45/255, 20/255,
Math.sin(-1*j),Math.cos(-1*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(1*j),Math.cos(1*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(10*j),Math.cos(10*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(20*j),Math.cos(20*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(30*j),Math.cos(30*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(40*j),Math.cos(40*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(50*j),Math.cos(50*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(60*j),Math.cos(60*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(70*j),Math.cos(70*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(80*j),Math.cos(80*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(90*j),Math.cos(90*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(100*j),Math.cos(100*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(110*j),Math.cos(110*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(120*j),Math.cos(120*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(130*j),Math.cos(130*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(140*j),Math.cos(140*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(150*j),Math.cos(150*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(160*j),Math.cos(160*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(170*j),Math.cos(170*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(180*j),Math.cos(180*j),-0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(181*j),Math.cos(181*j),-0.001,1.0,     246/255, 45/255, 20/255,
//rightblush_left
0,0,0.001,1,  246/255, 45/255, 20/255,
Math.sin(-1*j),Math.cos(-1*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(1*j),Math.cos(1*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(10*j),Math.cos(10*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(20*j),Math.cos(20*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(30*j),Math.cos(30*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(40*j),Math.cos(40*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(50*j),Math.cos(50*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(60*j),Math.cos(60*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(70*j),Math.cos(70*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(80*j),Math.cos(80*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(90*j),Math.cos(90*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(100*j),Math.cos(100*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(110*j),Math.cos(110*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(120*j),Math.cos(120*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(130*j),Math.cos(130*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(140*j),Math.cos(140*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(150*j),Math.cos(150*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(160*j),Math.cos(160*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(170*j),Math.cos(170*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(180*j),Math.cos(180*j),0.001,1.0,     246/255, 45/255, 20/255,
Math.sin(181*j),Math.cos(181*j),0.001,1.0,     246/255, 45/255, 20/255,

//eyebrown
0,0,0.001,1,  104/255, 73/255, 44/255,
Math.sin(91*j),Math.cos(91*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(90*j),Math.cos(90*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(100*j),Math.cos(100*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(110*j),Math.cos(110*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(120*j),Math.cos(120*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(130*j),Math.cos(130*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(140*j),Math.cos(140*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(150*j),Math.cos(150*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(160*j),Math.cos(160*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(170*j),Math.cos(170*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(180*j),Math.cos(180*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(190*j),Math.cos(190*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(200*j),Math.cos(200*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(210*j),Math.cos(210*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(220*j),Math.cos(220*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(230*j),Math.cos(230*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(240*j),Math.cos(240*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(250*j),Math.cos(250*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(260*j),Math.cos(260*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(270*j),Math.cos(270*j),0.001,1.0,     104/255, 73/255, 44/255,
Math.sin(271*j),Math.cos(271*j),0.001,1.0,     104/255, 73/255, 44/255,

  ]);
  g_vertsMax = 12;		// 12 tetrahedron vertices.
  								// we can also draw any subset of these we wish,
  								// such as the last 3 vertices.(onscreen at upper right)
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

/* REMOVED -- global 'g_vertsMax' means we don't need it anymore
  return nn;
*/
}

function drawAll() {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
// Great question from student:
// "?How can I get the screen-clearing color (or any of the many other state
//		variables of OpenGL)?  'glGet()' doesn't seem to work..."
// ANSWER: from WebGL specification page: 
//							https://www.khronos.org/registry/webgl/specs/1.0/
//	search for 'glGet()' (ctrl-f) yields:
//  OpenGL's 'glGet()' becomes WebGL's 'getParameter()'

	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	// console.log("clear value:", clrColr);

//method 1 to make z reverse
gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.
gl.clearDepth(0.0); // each time we 'clear' our depth buffer, set all
    // pixel depths to 0.0 (1.0 is DEFAULT)
gl.depthFunc(gl.GREATER); // (gl.LESS is DEFAULT; reverse it!)

//set identity
g_modelMatrix.setIdentity();  
g_modelMatrix.setTranslate(-0.05,-0.3,0.0);  
g_modelMatrix.translate(movepace,0,0);
g_modelMatrix.translate(0,movepaceud,0);
// g_modelMatrix.scale(1,1,-1);//method 2 to make z reverse

var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);

//on head part
DrawHead();
Drawlefteyes();
Drawlefteyes_white();
Drawrighteyes();
Drawrighteyes_white();
Drawnose();
Drawleftmouth();
Drawrightmouth();
DrawleftBlush();
DrawleftBlush_left();
DrawrightBlush();
DrawrightBlush_left();
Drawlefteye_brown();
Drawrighteye_brown();
//left_ear
Drawleftearpart1();
Drawleftearpart2();
Drawleftearpart3();
Drawleftearpart4();
//right_ear
Drawrightearpart1();
Drawrightearpart2();
Drawrightearpart3();
Drawrightearpart4();

Drawminimodel();



}





// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
// Update the current rotation angle (adjusted by the elapsed time)
//  limit the angle to move smoothly between +120 and -85 degrees:
//  if(angle >  120.0 && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
//  if(angle <  -85.0 && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;
  //from right to left
  g_angle01 = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
  if(g_angle01 > 180.0) g_angle01 = g_angle01 - 360.0;
  if(g_angle01 <-180.0) g_angle01 = g_angle01 + 360.0;

	g_angle02 = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
  if(g_angle02 > 180.0) g_angle02 = g_angle02 - 360.0;
  if(g_angle02 <-180.0) g_angle02 = g_angle02 + 360.0;
  
  if(g_angle02 > 45.0 && g_angle02Rate > 0) g_angle02Rate *= -1.0;
  if(g_angle02 < 0.0  && g_angle02Rate < 0) g_angle02Rate *= -1.0;



  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +55 and -25 degrees:
  if(g_angle03>   55.0 && g_angle03Rate > 0)g_angle03Rate= -g_angle03Rate;
  if(g_angle03 <  -25.0 && g_angle03Rate < 0) g_angle03Rate= -g_angle03Rate;

  g_angle03= [g_angle03 + (g_angle03Rate * elapsed) / 1000.0]%360;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +25 and -20 degrees:
  if(g_angle04>   25.0 && g_angle04Rate > 0)g_angle04Rate= -g_angle04Rate;
  if(g_angle04 <  -20.0 && g_angle04Rate < 0) g_angle04Rate= -g_angle04Rate;
  g_angle04= [g_angle04 + (g_angle04Rate * elapsed) / 1000.0]%360;

  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +15and -15 degrees:
  if(g_angle05>   15.0&& g_angle05Rate > 0)g_angle05Rate= -g_angle05Rate;
  if(g_angle05 <  -15.0 && g_angle05Rate < 0) g_angle05Rate= -g_angle05Rate;
  g_angle05= [g_angle05 + (g_angle05Rate * elapsed) / 1000.0]%360;


    //  limit the angle to move smoothly between 0 and -20 degrees:
  if(g_angle06>   0.0 && g_angle06Rate > 0)g_angle06Rate= -g_angle06Rate;
    if(g_angle06 <  -20.0 && g_angle06Rate < 0) g_angle06Rate= -g_angle06Rate;
 		g_angle06= [g_angle06 + (g_angle06Rate * elapsed) / 1000.0]%360;

}

//==================HTML Button Callbacks======================

function angleSubmit() {
// Called when user presses 'Submit' button on our webpage
//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
//	the HTML 'input' element with id='usrAngle'.  Within that
//	element you'll find a 'button' element that calls this fcn.

// Read HTML edit-box contents:
	var UsrTxt = document.getElementById('usrAngle').value;	
// Display what we read from the edit-box: use it to fill up
// the HTML 'div' element with id='editBoxOut':
  document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
  console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  g_angle01 = parseFloat(UsrTxt);     // convert string to float number 
};

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
}

function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.


  //for g_angle03Rate
	if(g_angle03Rate<0){
		g_angle03Rate-=20;		
	}else{
		g_angle03Rate+=20;
	};

	//for g_angle04Rate
	 if(g_angle04Rate<0){
		g_angle04Rate-=11.25;
	}else{
		g_angle04Rate+=11.25;
	}
  //for g_angle05Rate
  if(g_angle05Rate<0){
		g_angle05Rate-=7.5;
	}else{
		g_angle05Rate+=7.5;
	}
    //for g_angle06Rate
	if(g_angle06Rate<0){
		g_angle06Rate-=5;
	}else{
		g_angle06Rate+=5;
	}
}
//For minimodel
function spinUpForMiniModel(){
	g_angle01Rate += 25; 
}
function spinDown() {
// Called when user presses the 'Spin <<' button


	//for g_angle03Rate
	if(g_angle03Rate<0){
		g_angle03Rate+=20;		
	}else if(g_angle03Rate>0){
		g_angle03Rate-=20;
	}

	//for g_angle04Rate
	if(g_angle04Rate<0){
		g_angle04Rate+=11.25;
	}else if(g_angle04Rate>0){
		g_angle04Rate-=11.25;
	}
	//for g_angle05Rate
	if(g_angle05Rate<0){
		g_angle05Rate+=7.5;
	}else if(g_angle05Rate>0){
		g_angle05Rate-=7.5;
	}
	//for g_angle06Rate
	if(g_angle06Rate<0){
		g_angle06Rate+=5;
	}else if(g_angle06Rate>0){
		g_angle06Rate-=5;
	}

}
function spinDownForMiniModel(){
	g_angle01Rate -= 25; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button

	//if g_angle03Rate^2>1, so it is not zero
	if(g_angle03Rate*g_angle03Rate>1){
		myTmp_3 = g_angle03Rate;  // store the current rate,
		g_angle03Rate=0;	
	}else{
		//when it is zero
		g_angle03Rate=myTmp_3;
	}
	//if g_angle04Rate^2>1, so it is not zero
	if(g_angle04Rate*g_angle04Rate>1){
		myTmp_4 = g_angle04Rate;  // store the current rate,
		g_angle04Rate=0;
	}else{
		//when it is zero
		g_angle04Rate=myTmp_4;
	}


	//if g_angle05Rate^2>1, so it is not zero
	if(g_angle05Rate*g_angle05Rate>1){
		myTmp_5 = g_angle05Rate;  // store the current rate,
		g_angle05Rate=0;
	}else{
		//when it is zero
		g_angle05Rate=myTmp_5;
	}

	//if g_angle06Rate^2>1, so it is not zero
	if(g_angle06Rate*g_angle06Rate>1){
		myTmp_6 = g_angle06Rate;  // store the current rate,
		g_angle06Rate=0;
	}else{
		//when it is zero
		g_angle06Rate=myTmp_6;
	}

	//if any one of them is decresed to 0 becasue of spin, when use stop, they all get to zero;
	if(g_angle03Rate*g_angle04Rate*g_angle05Rate*g_angle06Rate==0){
		g_angle03Rate = 0;
		g_angle04Rate = 0;
		g_angle05Rate = 0;
		g_angle06Rate = 0;

	}

}
function runStopForMiniModel(){

	if(g_angle01Rate*g_angle01Rate > 1) {  // if nonzero rate,
		myTmp_1 = g_angle01Rate;  // store the current rate,
		g_angle01Rate = 0;      // and set to zero.
	}
	else{    
		// but if rate is zero,
		g_angle01Rate = myTmp_1;  // use the stored rate.

	}


}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = true;											// set our mouse-dragging flag
	g_xMclik = x;													// record where mouse-dragging began
	g_yMclik = y;
	// report on webpage
	document.getElementById('MouseAtResult').innerHTML = 
	  'Pikachu waited until u drag  '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);		// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//									-1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);			// Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:
	document.getElementById('MouseAtResult').innerHTML = 
	  'Pikachu is wandering around. Your location is '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);

	g_xMclik = x;											// Make next drag-measurement from here.
	g_yMclik = y;
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords):\n\t xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):\n\t x, y=\t',x,',\t',y);
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position:
	document.getElementById('MouseAtResult').innerHTML = 
	  'Pika Pika? Your location is '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
	console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',
		g_xMdragTot.toFixed(g_digits),',\t',g_yMdragTot.toFixed(g_digits));
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
// Report EVERYTHING in console:
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);

// and report EVERYTHING on webpage:
	document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
 	 document.getElementById('KeyModResult' ).innerHTML = ''; 
  // key details:
//   document.getElementById('KeyModResult' ).innerHTML = 
//         "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
//     "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
//     "<br>--kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
 
	switch(kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDownResult').innerHTML =  
			'Your press p/P key. Pause/unPause!';   // print on webpage
			if(g_isRun==true) {
			  g_isRun = false;    // STOP animation
			  }
			else {
			  g_isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
			console.log("a/A key: Go LEFT!\n");
			movepace-=0.1;
			document.getElementById('KeyDownResult').innerHTML =  
			'Your press a/A key. Go LEFT!';
			break;
    	case "KeyD":
			console.log("d/D key: GO RIGHT!\n");
			movepace+=0.1;
			document.getElementById('KeyDownResult').innerHTML = 
			'Your press d/D key. Strafe RIGHT!';
			break;
		case "KeyS":
			movepaceud-=0.1;
			console.log("s/S key: Move Down!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'Your press s/Sa key. Move Down.';
			break;
		case "KeyW":
			movepaceud+=0.1;
			console.log("w/W key: Move up!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'Your press w/W key. Move up!';
			break;
		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Left Arrow='+kev.keyCode;
			break;
		case "ArrowRight":
			console.log('right-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
  		break;
		case "ArrowUp":		
			console.log('   up-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
			break;
		case "ArrowDown":
			console.log(' down-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
  		break;	
    default:
      console.log("UNUSED!");
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): UNUSED!';
      break;
	}
}

function myKeyUp(kev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}


function DrawHead(){
//draw pikachu's face
pushMatrix(g_modelMatrix);
	
  //g_modelMatrix.scale(1.0,1.0,1.0);
  g_modelMatrix.scale(1.0,1.0,1.0);
  gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES,0,36);
g_modelMatrix=popMatrix();

}
function Drawlefteyes(){
	//draw pikachu's eyes
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(1.0,1.0,1.0);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_FAN,36,38);
	g_modelMatrix=popMatrix();

	
}
function Drawlefteyes_white(){
	//draw left eyes white
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(1.0,1.0,1.0);
	
	gl.drawArrays(gl.TRIANGLE_FAN,74,38);
	g_modelMatrix=popMatrix();

		
}
function Drawrighteyes(){
	//draw right eyes
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(1.0,1.0,1.0);
		gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLE_FAN,112,38);
	g_modelMatrix=popMatrix();

	
	}
function Drawrighteyes_white(){
	
	  //draw right eyes white
	  pushMatrix(g_modelMatrix);
	  g_modelMatrix.scale(1.0,1.0,1.0);
	  gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLE_FAN,150,38);
	g_modelMatrix=popMatrix();

	
	}
function Drawnose(){
	//draw nose
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(1.0,1.0,1.0);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_FAN,188,38);
	g_modelMatrix=popMatrix();

	
	}
function Drawleftmouth(){
	
	//draw left mouth
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(1.0,1.0,1.0);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.LINE_STRIP,226,13);
	g_modelMatrix=popMatrix();

	
	}
function Drawrightmouth(){
	//draw right mouth
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(1.0,1.0,1.0);

	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.LINE_STRIP,239,13);
	g_modelMatrix=popMatrix();

	
}

function Drawleftearpart1(){
	pushMatrix(g_modelMatrix);	
	g_modelMatrix.translate(0.0,0.5,0.25);// -toward back，+ toward front，only after set identity's scale(1,1,-1)
	g_modelMatrix.rotate(-30,0,0,1);
	g_modelMatrix.rotate(-g_angle03, 0, 0, 1); 
	pushMatrix(g_modelMatrix);


	g_modelMatrix.scale(0.4,0.4,0.4);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


	gl.drawArrays(gl.TRIANGLES, 252, 18);
	g_modelMatrix=popMatrix();
}


function Drawleftearpart2(){
	
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(90,0,0,1);
	g_modelMatrix.translate(0,0.125*0.4,0);
	g_modelMatrix.rotate(-g_angle04, 0, 0, 1);
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(0.25,0.25,0.25);		
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


	gl.drawArrays(gl.TRIANGLES, 270, 12);
	g_modelMatrix=popMatrix();
		
}
function Drawleftearpart3(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0,0.25*0.25*Math.sqrt(6)/3,0);
	pushMatrix(g_modelMatrix);

	g_modelMatrix.scale(1.0,1.0,1.0);			
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


	gl.drawArrays(gl.TRIANGLES, 282,24);
	g_modelMatrix= popMatrix();	
}
function Drawleftearpart4(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0,0.3,0);
	pushMatrix(g_modelMatrix);

	g_modelMatrix.scale(1.0,1.0,1.0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


	gl.drawArrays(gl.TRIANGLES, 306,12);
	popMatrix();
	popMatrix();
	popMatrix();
	popMatrix();
	g_modelMatrix= popMatrix();//get to head	
}


function Drawrightearpart1(){
	pushMatrix(g_modelMatrix);	
	g_modelMatrix.translate(0.5,0.5,0.25); // -toward back，+ toward front，only after set identity's scale(1,1,-1)

	g_modelMatrix.rotate(30,0,0,1);
	g_modelMatrix.rotate(g_angle05, 0, 0, 1); 
	pushMatrix(g_modelMatrix);


	g_modelMatrix.scale(0.4,0.4,0.4);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


	gl.drawArrays(gl.TRIANGLES, 318, 18);
	g_modelMatrix=popMatrix();
}

function DrawleftBlush(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0.07*0.5,0.12,0.5011);
	g_modelMatrix.scale(0.07,0.07,1.0);
		gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLE_FAN,336,29);
	
	g_modelMatrix=popMatrix();

	pushMatrix(g_modelMatrix);

	g_modelMatrix.translate(0.0, 0.12, 0.5011);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES,365,3);
	g_modelMatrix=popMatrix();
}
function DrawrightBlush(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0.5-0.07*0.5,0.12,0.5011);
	g_modelMatrix.scale(0.07,0.07,1.0);
	g_modelMatrix.scale(-1,1,1);
		gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLE_FAN,336,29);
	
	g_modelMatrix=popMatrix();

	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0.5, 0.12, 0.5011);
	g_modelMatrix.scale(-1,1,1);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES,365,3);
	g_modelMatrix=popMatrix();

}
//Blush in the left side
function DrawleftBlush_left(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0, 0.12, 0.50);
	g_modelMatrix.rotate(90,0,1,0);
	g_modelMatrix.translate(-0.002, 0.0, 0);
	g_modelMatrix.scale(0.025,0.061,1);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_FAN,368,22);
	g_modelMatrix=popMatrix();


}

//blush in the right side
function DrawrightBlush_left(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0.5, 0.12, 0.50);
	g_modelMatrix.rotate(90,0,1,0);
	g_modelMatrix.translate(-0.002, 0.0, 0);
	g_modelMatrix.scale(0.025,0.061,1);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_FAN,390,22);
	g_modelMatrix=popMatrix();


}
function Drawlefteye_brown(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0.15, 0.26, 0.5012);
	g_modelMatrix.scale(0.050,0.025,1);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_FAN,412,22);
	g_modelMatrix=popMatrix();



}
function Drawrighteye_brown(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0.35, 0.26, 0.5012);
	g_modelMatrix.scale(0.050,0.025,1);
	gl.uniformMatrix4fv(g_modelMatLoc,false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_FAN,412,22);
	g_modelMatrix=popMatrix();



}



function Drawrightearpart2(){
	
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(-90,0,0,1);
	g_modelMatrix.translate(0,0.125*0.4,0);
	g_modelMatrix.rotate(g_angle06, 0, 0, 1);
	pushMatrix(g_modelMatrix);
	g_modelMatrix.scale(0.25,0.25,0.25);		
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


	gl.drawArrays(gl.TRIANGLES, 270, 12);//re call it is the same
	g_modelMatrix=popMatrix();
		
}
function Drawrightearpart3(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0,0.25*0.25*Math.sqrt(6)/3,0);
	pushMatrix(g_modelMatrix);

	g_modelMatrix.scale(1.0,1.0,1.0);	
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


	gl.drawArrays(gl.TRIANGLES, 282,24);//re call it is the same
	g_modelMatrix= popMatrix();	
}
function Drawrightearpart4(){
	pushMatrix(g_modelMatrix);
	g_modelMatrix.translate(0,0.3,0);
	pushMatrix(g_modelMatrix);

	g_modelMatrix.scale(1.0,1.0,1.0);		
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


	gl.drawArrays(gl.TRIANGLES, 306,12);//re call it is the same
	popMatrix();
	popMatrix();
	popMatrix();
	popMatrix();
	g_modelMatrix= popMatrix();//get to head	
}

function Drawminimodel(){

//set identity
g_modelMatrix.setIdentity();  
g_modelMatrix.setTranslate(-0.7,0.7,0.0);  
g_modelMatrix.scale(0.3,0.3,0.3);//
g_modelMatrix.rotate(g_angle01, 0, 1, 0);  //from right to left
g_modelMatrix.rotate(g_angle02, 1, 0, 0);  // from up to down

//on head part
DrawHead();
Drawlefteyes();
Drawlefteyes_white();
Drawrighteyes();
Drawrighteyes_white();
Drawnose();
Drawleftmouth();
Drawrightmouth();
DrawleftBlush();
DrawleftBlush_left();
DrawrightBlush();
DrawrightBlush_left();
Drawlefteye_brown();
Drawrighteye_brown();
//left_ear
Drawleftearpart1();
Drawleftearpart2();
Drawleftearpart3();
Drawleftearpart4();
//right_ear
Drawrightearpart1();
Drawrightearpart2();
Drawrightearpart3();
Drawrightearpart4();

}