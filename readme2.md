
```js
function creaBoxHelper(){
  const boxHelper = new BoxHelper(model, 0xff000);
  scene.add(boxHelper);
  
   const vertices = [];

   const geometry = boxHelper.geometry;  // Obtén la geometría del BoxHelper
  
console.log("Atributos de la geometría:");

const attributeNames = Object.keys(geometry);
const attributeValues = Object.values(geometry);
attributeNames.forEach(attributeName => {
  console.log(attributeName);
  console.log(attributeValues);
});

  const positionAttribute = geometry.getAttribute('position');//  atributos de posición de la geometría

  Recorre los atributos de posición y almacena los vértices en el arreglo 'vertices'
  for (let i = 0; i < positionAttribute.count; i++) {
    const vertex = new Vector3();
    vertex.fromBufferAttribute(positionAttribute, i);
    vertices.push(vertex);
  }

  console.log('Vértices del BoxHelper:', vertices);

  let centerX = 0;
  let centerY = 0;
  let centerZ = 0;

  for (let i = 0; i < vertices.length; i++) {
    centerX += vertices[i].x;
    centerY += vertices[i].y;
    centerZ += vertices[i].z;
  }

  centerX /= vertices.length;
  centerY /= vertices.length;
  centerZ /= vertices.length;

  const centerVector = new Vector3(centerX, centerY, centerZ);

  console.log('Punto central de la caja contenedora:', centerVector);

  let centro = geometry.boundingSphere.center;
  
console.log("Propiedades del objeto 'centro':");
console.log("x:", centro.x);
console.log("y:", centro.y);
console.log("z:", centro.z);

  if (!centro) {
    geometry.computeBoundingSphere();
    centro=geometry.boundingSphere.center;
    console.log("CENTRO: "+centro);

  }
  const radius = 0.1; 
  const segments = 32; 
  const color = 0xff0000; 
  
  const geometry2 = new SphereGeometry(radius, segments, segments);
  const material = new MeshBasicMaterial({ color: color });
  const sphere = new Mesh(geometry2, material);
  

  sphere.position.set(centro.x, centro.y, centro.z);
  
  scene.add(sphere);
  

}
```

