//-------------------------------------------------------------------------
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray, normalArray, colorArray)
{
    
    //make terrain vertices form iteration
    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
           vertexArray.push(0.0);//avrg(vertexArray, j)+Math.random()*.3);
           
           normalArray.push(0);
           normalArray.push(0);
           normalArray.push(0);

           // initialize the 3 color values for each vertex
           colorArray.push(0);
           colorArray.push(0);
           colorArray.push(0);
       }

    //make terrain faces from iteration
    var numT=0;
    for(var i=0;i<n;i++){
       for(var j=0;j<n;j++){
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           numT+=2;
       }
    }
    // set the z value of each vertex
    setVertex(vertexArray, n);

    // set the color of each vertex
    setColor(vertexArray, colorArray, n);
    //sets the normals of the new terrain
    normalArray = setNorms(faceArray, vertexArray, normalArray);

    return numT;
}

//-------------------------------------------------------------------------
//sets the terrain height to a sign wave
function setVertex(vArray, size)
{
    var queue = [];             // it's a queue to do depth-first search so that there are 4 valid corner points for the square step queue to be filled with future offsets
    var mid_size = size/2;      // mid_size is the distance to the center of the diamond for each step
    var count = 1;              // count keeps track of when to cut mid_size in half
    var count_start = 1;        // count_start stores where count started at
    var offset = 0;
    var rand_weight = [];
    var rand_index = 0;
    rand_weight[0] = 0.4;
    rand_weight[1] = 0.4;
    rand_weight[2] = 0.2;
    rand_weight[3] = 0.2;
    rand_weight[4] = 0.04;
    rand_weight[5] = 0.03;
    rand_weight[6] = 0.02;
    rand_weight[7] = 0.02;

    // intitalizing the corners to random values
    vArray[2] = (Math.random()-0.5)*rand_weight[0];
    vArray[size*3 + 2] = (Math.random()-0.5)*rand_weight[0];
    vArray[size*(size+1)*3 + 2] = (Math.random()-0.5)*rand_weight[0];
    vArray[size*(size+2)*3 + 2] = (Math.random()-0.5)*rand_weight[0];

    // intitalizing the queue with offset of 0;
    queue.push(0);

    while(mid_size >= 1){
        
        offset = queue.shift();     // get the new offset off the queue

        //rand_weight = mid_size * 0.01;  // rand_weight is based of how big the current square being manipulated is

        vArray[offset + (size+2)*mid_size*3 + 2] = 
            (vArray[offset + 2] +
            vArray[offset + mid_size*6 + 2] +
            vArray[offset + (size+1)*mid_size*6 + 2] +
            vArray[offset + (size+2)*mid_size*6 + 2]) / 4 + (Math.random()-0.5)*rand_weight[rand_index];
        
        ///////////////////////////////////// bottom

        if(offset <= size*3){                                       // if the bottom part of the square is on the bottom edge then only average across 3 points
            vArray[offset + mid_size*3 + 2] = 
                (vArray[offset + 2] +
                vArray[offset + mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*3 + 2]) / 3 + (Math.random()-0.5)*rand_weight[rand_index];        
        }else{                                                      // else average across 4 pints
            vArray[offset + mid_size*3 + 2] =
                (vArray[offset + 2] +
                vArray[offset + mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*3 + 2] +
                vArray[offset - (size)*mid_size*3 + 2]) / 4 + (Math.random()-0.5)*rand_weight[rand_index];
        }   

        ////////////////////////////////// left

        if(offset % ((size+1)*3) == 0){                             // if the left part of the square is on the left edge then only average across 3 points
            vArray[offset + (size+1)*mid_size*3 + 2] = 
                (vArray[offset + 2] +
                vArray[offset + (size+1)*mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*3 + 2]) / 3 + (Math.random()-0.5)*rand_weight[rand_index];        
        }else{                                                      // else average across 4 points
            vArray[offset + (size+1)*mid_size*3 + 2] = 
                (vArray[offset + 2] +
                vArray[offset + (size+1)*mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*3 + 2] +
                vArray[offset + (size)*mid_size*3 + 2]) / 4 + (Math.random()-0.5)*rand_weight[rand_index];
        }

        //////////////////////////////// right

        if((offset + mid_size*6) % ((size+1)*3) == size*3){         // if the right part of the square is on the right edge then only average across 3 points
            vArray[offset + (size+3)*mid_size*3 + 2] = 
                (vArray[offset + mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*3 + 2]) / 3 + (Math.random()-0.5)*rand_weight[rand_index];       
        }else{                                                      // else average across 4 points
            vArray[offset + (size+3)*mid_size*3 + 2] = 
                (vArray[offset + mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*3 + 2] +
                vArray[offset + (size+4)*mid_size*3 + 2]) / 4 + (Math.random()-0.5)*rand_weight[rand_index];
        }

        /////////////////////////////// top

        if((offset + (size+1)*mid_size*6) >= (size+1)*(size)*3){    // if the top part of the square is on the top edge then only average across 3 points
            vArray[offset + (size+1)*mid_size*6 + mid_size*3 + 2] = 
                (vArray[offset + (size+1)*mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*3 + 2]) / 3 + (Math.random()-0.5)*rand_weight[rand_index];        
        }else{                                                      // else average across 4 points
            vArray[offset + (size+1)*mid_size*6 + mid_size*3 + 2] = 
                (vArray[offset + (size+1)*mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*6 + 2] +
                vArray[offset + (size+2)*mid_size*3 + 2] +
                vArray[offset + (size+1)*mid_size*9 + mid_size*3 + 2]) / 4 + (Math.random()-0.5)*rand_weight[rand_index];
        }


        // push the 4 mid_size corners of the offset as the new offsets
        queue.push(offset);
        queue.push(offset + mid_size*3);
        queue.push(offset + (size+1)*mid_size*3);
        queue.push(offset + (size+2)*mid_size*3);

        /////////////////////////////////
        
        // keep track of what mid_size should be
        count--;
        if(count == 0){
            count_start = count_start * 4;  // 
            count = count_start;
            mid_size = mid_size / 2;
            rand_index++;
            if(rand_index > 7){
                rand_index = 7;
            }
        }
    }
}

function setColor(vertexArray, colorArray, size){
    // loop through all of the z values of all the vertices
    for(var i=0;i<=size;i++){
        for(var j=0;j<=size*3;j+=3){
            if(vertexArray[i*(size+1)*3+j+2] < -0.2){       // if below -0.2 set to red
                colorArray[i*(size+1)*3 + j + 0] = 0.6;
                colorArray[i*(size+1)*3 + j + 1] = 0;
                colorArray[i*(size+1)*3 + j + 2] = 0;
            }else if(vertexArray[i*(size+1)*3+j+2] < -0.1){ // if in between -0.2 and -0.1 set to yellow
                colorArray[i*(size+1)*3 + j + 0] = 0.3;
                colorArray[i*(size+1)*3 + j + 1] = 0.3;
                colorArray[i*(size+1)*3 + j + 2] = 0;
            }else if(vertexArray[i*(size+1)*3+j+2] < 0){    // if in between -0.1 and 0 set to green
                colorArray[i*(size+1)*3 + j + 0] = 0;
                colorArray[i*(size+1)*3 + j + 1] = 0.6;
                colorArray[i*(size+1)*3 + j + 2] = 0;
            }else if(vertexArray[i*(size+1)*3+j+2] > 0.2){  // if greater than 0.2 set to magenta
                colorArray[i*(size+1)*3 + j + 0] = 0.3;
                colorArray[i*(size+1)*3 + j + 1] = 0;
                colorArray[i*(size+1)*3 + j + 2] = 0.3;
            }else if(vertexArray[i*(size+1)*3+j+2] > 0.1){  // if in between 0.1 and 0.2 set to blue
                colorArray[i*(size+1)*3 + j + 0] = 0;
                colorArray[i*(size+1)*3 + j + 1] = 0;
                colorArray[i*(size+1)*3 + j + 2] = 0.6;
            }else if(vertexArray[i*(size+1)*3+j+2] > 0){    // if in between 0 and 0.1 set to cyan
                colorArray[i*(size+1)*3 + j + 0] = 0;
                colorArray[i*(size+1)*3 + j + 1] = 0.3;
                colorArray[i*(size+1)*3 + j + 2] = 0.3;
            }
        }
    }
}

//-------------------------------------------------------------------------
//sets the normals of the new terrain
function setNorms(faceArray, vertexArray, normalArray)
{
    for(var i=0; i<faceArray.length;i+=3)
    {
        //find the face normal
        var vertex1 = vec3.fromValues(vertexArray[faceArray[i]*3], vertexArray[faceArray[i]*3+1], vertexArray[faceArray[i]*3+2]);
        
        var vertex2 = vec3.fromValues(vertexArray[faceArray[i+1]*3], vertexArray[faceArray[i+1]*3+1], vertexArray[faceArray[i+1]*3+2]);
        
        var vertex3 = vec3.fromValues(vertexArray[faceArray[i+2]*3], vertexArray[faceArray[i+2]*3+1], vertexArray[faceArray[i+2]*3+2]);
        
        var vect31=vec3.create(), vect21=vec3.create();
        vec3.sub(vect21,vertex2,vertex1);
        vec3.sub(vect31,vertex3,vertex1)
        var v=vec3.create();
        vec3.cross(v,vect21,vect31);
        
        //add the face normal to all the faces vertices
        normalArray[faceArray[i]*3  ]+=v[0];
        normalArray[faceArray[i]*3+1]+=v[1];
        normalArray[faceArray[i]*3+2]+=v[2];

        normalArray[faceArray[i+1]*3]+=v[0];
        normalArray[faceArray[i+1]*3+1]+=v[1];
        normalArray[faceArray[i+1]*3+2]+=v[2];

        normalArray[faceArray[i+2]*3]+=v[0];
        normalArray[faceArray[i+2]*3+1]+=v[1];
        normalArray[faceArray[i+2]*3+2]+=v[2];

    }
    
    //normalize each vertex normal
    for(var i=0; i<normalArray.length;i+=3)
    {
        var v = vec3.fromValues(normalArray[i],normalArray[i+1],normalArray[i+2]); 
        vec3.normalize(v,v);
        
        normalArray[i  ]=v[0];
        normalArray[i+1]=v[1];
        normalArray[i+2]=v[2];
    }
    
    //return the vertex normal
    return normalArray;
}

//-------------------------------------------------------------------------
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

//-------------------------------------------------------------------------


