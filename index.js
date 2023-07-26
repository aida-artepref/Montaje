import { Color,
  Loader, Vector3, Vector2, BufferAttribute, SphereGeometry , BufferGeometry,
  MultiMaterial, MeshLambertMaterial, BoxGeometry, MeshBasicMaterial, LineBasicMaterial, MeshStandardMaterial,
  PerspectiveCamera, Raycaster,
  Scene, LineSegments , EdgesGeometry, Mesh, Group, MeshPhongMaterial, WebGLRenderer, OrthographicCamera, BoxHelper}  from 'three';
import{ IfcViewerAPI } from 'web-ifc-viewer';
import { IfcElementQuantity } from 'web-ifc';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { PlanManager } from 'web-ifc-viewer/dist/components/display/plans/plan-manager';
import { IfcAPI } from "web-ifc/web-ifc-api";

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs,  addDoc, doc, setDoc, query, updateDoc   } from "firebase/firestore";



const firebaseConfig = {
    apiKey: "AIzaSyDTlGsBq7VwlM3SXw2woBBqHsasVjXQgrc",
    authDomain: "cargas-917bc.firebaseapp.com",
    projectId: "cargas-917bc",
    storageBucket: "cargas-917bc.appspot.com",
    messagingSenderId: "996650908621",
    appId: "1:996650908621:web:b550fd82697fc26933a284"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const botonConexion = document.getElementById('conexion')

botonConexion.addEventListener("click", () => {
  
  console.log("¡Clic en el botón!");
  insertaModeloFire()
  // botonConexion.style.visibility='hidden'
  botonConexion.style.display='none'
});


async function insertaModeloFire() {
  try {
      collectionRef = collection(db, projectName);
      const q = query(collectionRef);

      const querySnapshot = await getDocs(q);
      const existingDocsCount = querySnapshot.docs.length;

      if (existingDocsCount > 0) {
          console.log('La colección ya existe: ' + projectName);
          console.log('Número de piezas existentes en: ' + projectName, existingDocsCount);

          if (existingDocsCount === precastElements.length) {
              let documentosIguales = true;

              for (const doc of querySnapshot.docs) {
                  const existingDocData = doc.data();
                  const matchingObject = precastElements.find((objeto) => objeto.GlobalId === doc.id);

                  if (!matchingObject) {
                      console.log('Documento faltante:', doc.id);
                      documentosIguales = false;
                  } else {
                      const fields = Object.keys(existingDocData);

                      for (const field of fields) {
                          if (field === 'expressID') {
                              if (existingDocData[field] !== matchingObject[field]) {
                                  // console.log(`Diferencia en el campo ${field} del documento ${doc.id}:`, existingDocData[field], '!==', matchingObject[field]);
                                  documentosIguales = false;
                                  await updateDoc(doc.ref, { ExpressID: matchingObject[field] });
                                  matchingObject[field] = existingDocData[field]; // Actualizar el campo en el objeto del array
                              }
                          } else if (existingDocData[field] !== matchingObject[field]) {
                              // console.log(`DiferenciaAAAA en el campo ${field} del documento ${doc.id}:`, existingDocData[field], '!==', matchingObject[field]);
                              documentosIguales = false;
                              matchingObject[field] = existingDocData[field]; // Actualizar el campo en el objeto del array
                          }
                      }
                  }
              }

              if (documentosIguales) {
                  console.log('La colección tiene los mismos documentos y campos.');
                  
              } else {
                  console.log('La colección tiene diferencias en documentos o campos.');
                  const checkboxContainer = document.getElementById('checkbox-container');
    checkboxContainer.innerHTML = generateCheckboxes(precastElements);
    checkboxContainer.style.visibility = "visible"; 
    addCheckboxListeners(precastElements, viewer);
  
    camionesUnicos = obtenerValorCamion(precastElements);
    generaBotonesNumCamion(camionesUnicos);
              }
          } else {
            console.log('La cantidad de documentos no coincide con precastElements.length.');
            for (const doc of querySnapshot.docs) {
              const existingDocData = doc.data();
              const matchingObjectIndex = precastElements.findIndex((objeto) => objeto.GlobalId === doc.id);
      
              if (matchingObjectIndex !== -1) {
                  const matchingObject = precastElements[matchingObjectIndex];
                  const fields = Object.keys(existingDocData);
      
                  for (const field of fields) {
                      if (field === 'expressID') {
                          if (existingDocData[field] !== matchingObject[field]) {
                              matchingObject[field] = existingDocData[field]; // Actualizar el campo en el objeto del array
                          }
                      } else if (existingDocData[field] !== matchingObject[field]) {
                          matchingObject[field] = existingDocData[field]; // Actualizar el campo en el objeto del array
                      }
                  }
              }
            }
            const checkboxContainer = document.getElementById('checkbox-container');
            checkboxContainer.innerHTML = generateCheckboxes(precastElements);
            checkboxContainer.style.visibility = "visible"; 
            addCheckboxListeners(precastElements, viewer);
          
            camionesUnicos = obtenerValorCamion(precastElements);
            generaBotonesNumCamion(camionesUnicos);
          }
          
      } else {
          for (const objeto of precastElements) {
              const docRef = doc(db, projectName, objeto.GlobalId);
              await setDoc(docRef, objeto);
              console.log('Documento agregado:', objeto);
          }
          
      }
  } catch (error) {
      console.error('Error al agregar los documentos:', error);
  }
}


let projectName = null;
async function obtieneNameProject(url){
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.includes('IFCPROJECT')) {
        const fields = line.split(',');
        projectName = fields[2].replace(/'/g, '');
        break;
        }
    }

    if (projectName) {
        console.log('Nombre del proyecto:', projectName);
        precastCollectionRef = collection(db, projectName);
    } else {
        
        console.log('No se encontró el nombre del proyecto');
    }
}

const container = document.getElementById('app');
const viewer = new IfcViewerAPI({container, backgroundColor: new Color("#EDE8BA")});
const scene = viewer.context.scene.scene;
viewer.clipper.active = true;
viewer.grid.setGrid(100,100);


const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

window.addEventListener("resize", () => {
  labelRenderer.setSize(viewer.clientWidth, viewer.clientHeight);
});

document.addEventListener("keydown", function(event) {
    if (event.keyCode === 116) { // keyCode 116 es la tecla F5
      event.preventDefault(); // evita que se procese 
    }
});

viewer.context.renderer.usePostproduction = true;
viewer.IFC.selector.defSelectMat.color = new Color(68, 137, 0);

const GUI={
    input: document.getElementById("file-input"),
    loader: document.getElementById("loader-button"),
    importer: document.getElementById("importCSV"),
    importloader: document.getElementById("importButton"),
}

//Muestra el nombre del archivo abierto
document.getElementById("file-input").addEventListener("change", function() {
    const file = this.files[0];
    document.getElementById("file-name").innerHTML = file.name;
    document.getElementById("file-name").style.display = "block"; 
});

GUI.loader.onclick = () => GUI.input.click();  //al hacer clic al boton abre cuadro de dialogo para cargar archivo
GUI.importloader.onclick = () => GUI.importer.click();

//cada vez elemento imput cambia, genera uURL y lo pasa a la lib IFC
GUI.input.onchange = async (event) => {
    const file=event.target.files[0];
    const url=URL.createObjectURL(file);
    loadModel(url); 
}

let allPlans;
let model;
let allIDs;
let idsTotal;
let camionesUnicos=[];
let uniqueTypes=[];
let precastElements=[];

async function loadModel(url) {
  model = await viewer.IFC.loadIfcUrl(url);
  console.log(model);
  getPlantas(model);
  //TODO: REVISAR rendimiento al cargar modelo
  //createPrecastElementsArray(model.modelID);

  createPrecastElementsArray(model.modelID).then((precastElements) => {
    cargaGlobalIdenPrecast(precastElements);
  });

  allIDs = getAllIds(model);
  idsTotal = getAllIds(model);
  viewer.shadows = true;

  let subset = getWholeSubset(viewer, model, allIDs);
  replaceOriginalModelBySubset(viewer, model, subset);
  // const btnImport = document.getElementById("botonImportar");
  // btnImport.style.visibility = 'visible';

  // ARISTAS
  // const mat = new LineBasicMaterial({ color: 0x525252 });
  // viewer.edges.createFromSubset(model.modelID, subset, mat);
  // viewer.edges.toggle(model.modelID, true);
  viewer.context.fitToFrame();
  creaBoxHelper();
  obtieneNameProject(url)

  const btnBD = document.getElementById("conexion");
  btnBD.style.visibility='visible';
  // const result = await viewer.IFC.properties.serializeAllProperties(model);
  // const file = new File(result, 'properties');

  // const link = document.createElement('a');
  // document.body.appendChild(link);
  // link.href = URL.createObjectURL(file);
  // link.download = 'properties.json';
  // link.click();
  // link.remove();
  

}




function creaBoxHelper(){
//   const coordinates = [];
// const alreadySaved = new Set();
// const position = subset.geometry.attributes.position;
// for(let index of geometry.index.array) {
//   if(!alreadySaved.has(index)){
//     coordinates.add(position.getX(index));
//     coordinates.add(position.getY(index));
//     coordinates.add(position.getZ(index));
//     alreadySaved.add(index);
//   }
// }
// const vertices = Float32Array.from(coordinates);
  const boxHelper = new BoxHelper(model, 0xff000);
  scene.add(boxHelper);

   const geometry = boxHelper.geometry;  // Obtén la geometría del BoxHelper
  

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


//  Colorear los elementos sólidos, excepto los IfcBuildingElementProxy
  // model.traverse((element) => {
  //   if (element instanceof Mesh && !(element.userData.IfcEntity === "IfcBuildingElementProxy")) {
  //     element.material = solidMaterial;
  //   }
  // });

//   let modelID=-1
//   let selectID=-1
//   let multiSelectID=[]
 
//   let materialSelect= new MeshLambertMaterial({
//     transparent: true,
//     opacity: 0.9,
//     color: 0x54a2c4,
//   });
  

//   let keyCtrl = false;
//   function onKeyDown(event) {
//     if (event.key === "Control") {
//       keyCtrl = true;
      
//     }
//   }

//   function onKeyUp(event) {
//     if (event.key === "Control") {
//       keyCtrl = false;
//     }
//   }

//   document.addEventListener("keydown", onKeyDown);
//   document.addEventListener("keyup", onKeyUp);

// container.addEventListener("click",(e)=>{onClick()})

// function onClickSeleccion() {
//   const found = viewer.context.castRayIfc();
//   if (found && keyCtrl) {
//     modelID = found.object.modelID;
//     selectID = found.id;
//     multiSelectID.push(selectID);
//     let subset = viewer.IFC.loader.ifcManager.createSubset({
//       modelID: modelID,
//       ids: multiSelectID,
//       material: materialSelect,
//       scene: scene,
//       removePrevious: false,
//       customID: -1,
//       applyBVH: true,
//     });
//   } else {
//     viewer.IFC.loader.ifcManager.removeSubset(materialSelect, -1);
//     modelID = -1;
//     selectID = -1;
//     multiSelectID = [];
//   }
// }


function findNodeWithExpressID(node, expressID) {
  if (node.expressID === expressID) {
    return node;
  }

  for (const childNode of node.children) {
    const foundNode = findNodeWithExpressID(childNode, expressID);
    if (foundNode) {
      return foundNode;
    }
  }

  return null;
}

async function getPlantas(model) {
  await viewer.plans.computeAllPlanViews(model.modelID);

  const lineMaterial = new LineBasicMaterial({ color: 'black' });
  const baseMaterial = new MeshBasicMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1, 
    polygonOffsetUnits: 1,
  });

  viewer.edges.create('example', model.modelID, lineMaterial, baseMaterial);

  const containerForPlans = document.getElementById('button-container');
  const buttonGroup = document.createElement('div'); // nuevo div para agrupar botones
  containerForPlans.appendChild(buttonGroup);
  buttonGroup.style.display = 'flex'; 
  buttonGroup.style.flexWrap = 'wrap'; 

  const allPlans = viewer.plans.getAll(model.modelID);

  for (const plan of allPlans) {
  
    const currentPlan = viewer.plans.planLists[model.modelID][plan]; //Información  de cada planta

    const divBotonesPlantas = document.createElement('div'); //contenedor para cada fila de botones
    buttonGroup.appendChild(divBotonesPlantas);
    divBotonesPlantas.style.display = 'flex'; 
    divBotonesPlantas.style.alignItems = 'center';

    const button = document.createElement('button');
    divBotonesPlantas.appendChild(button); 
    button.textContent = currentPlan.name; 
    button.setAttribute('data-express-id', currentPlan.expressID);

    const btnLabelPlantas = document.createElement('button');
    divBotonesPlantas.appendChild(btnLabelPlantas); 
    btnLabelPlantas.textContent = 'N';
    btnLabelPlantas.style.width = '30px'; 
    btnLabelPlantas.style.marginLeft = '5px'; 
    btnLabelPlantas.style.visibility = 'hidden';
    btnLabelPlantas.classList.add('btnLabelPlanta');


    const btn2DPlantas = document.createElement('button');
    divBotonesPlantas.appendChild(btn2DPlantas); 
    btn2DPlantas.textContent = '2D';
    btn2DPlantas.style.width = '30px'; 
    btn2DPlantas.style.marginLeft = '5px'; 
    btn2DPlantas.style.visibility = 'hidden';
    btn2DPlantas.classList.add('btn2DPlanta');
    const elementsArray = [];

    button.onclick = async () => {
      ocultarLabels()
      const expressIDplanta = parseInt(button.dataset.expressId);
      console.log("ExpressId: "+expressIDplanta+" de la planta: "+button.textContent);
      
      try {
        const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
    
        // recursiva para buscar los elementos hijos en la estructura 
        function findElementsInChildren(node) {
          for (const childNode of node.children) {
            elementsArray.push(childNode.expressID);
            findElementsInChildren(childNode);
          }
        }
        // busca el nodo de la planta deseada en la estructura 
        const plantaNode = findNodeWithExpressID(ifcProject, expressIDplanta);
    
        
        if (plantaNode) {
          
          findElementsInChildren(plantaNode);
          hideAllItems(viewer, idsTotal );
          showAllItems(viewer, elementsArray);
          console.log(elementsArray);

          const btnLabelPlantasList = document.querySelectorAll('.btnLabelPlanta');
              btnLabelPlantasList.forEach((btnLabel) => {
              btnLabel.style.visibility = 'hidden';
          });

          btnLabelPlantas.style.visibility = 'visible';

          const btn2DPlantasList = document.querySelectorAll('.btn2DPlanta');
              btn2DPlantasList.forEach((btn2D) => {
                  btn2D.style.visibility = 'hidden';
                  btn2D.classList.remove('activoBtn2DPlanta');
              });

          btn2DPlantas.style.visibility = 'visible';
          
        } else {
          console.log('No se encontró el nodo de la planta');
        }
      } catch (error) {
        console.log('Error al obtener la estructura espacial:', error);
      }

  

      const activeButton = containerForPlans.querySelector('button.activo');
      if (activeButton) {
        activeButton.classList.remove('activo');
        const correspondingBtnLabel = activeButton.nextElementSibling;
        if (correspondingBtnLabel.classList.contains('btnLabelPlanta')) {
          // correspondingBtnLabel.style.visibility = 'hidden';
          correspondingBtnLabel.classList.remove('activoBtnLabelPlanta'); // Remover la clase 'activoBtnLabelPlanta' cuando se oculta
          
        }
      }
      button.classList.add('activo');
    };

    btnLabelPlantas.onclick = async () => {
      const activeBtnLabelPlanta = document.querySelector('.btnLabelPlanta.activoBtnLabelPlanta');
    
      // Si hay un botón activo y es el mismo que se hizo clic, quitar la clase
      if (activeBtnLabelPlanta === btnLabelPlantas) {
        btnLabelPlantas.classList.remove('activoBtnLabelPlanta');
        removeLabels(elementsArray);
      } else {
        // Si hay un botón activo y no es el mismo que se hizo clic, eliminar la clase
        if (activeBtnLabelPlanta) {
          activeBtnLabelPlanta.classList.remove('activoBtnLabelPlanta');
        }
        btnLabelPlantas.classList.add('activoBtnLabelPlanta');
        generateLabels(elementsArray);
      }
    }
    
   
    let plantaActivo = false;
    
    btn2DPlantas.onclick = () => {
      if (btn2DPlantas.classList.contains('activoBtn2DPlanta')) {
        btn2DPlantas.classList.remove('activoBtn2DPlanta');
        plantaActivo = false;
        generatePlanta2D(plantaActivo);
      } else {
        btn2DPlantas.classList.add('activoBtn2DPlanta');
        plantaActivo = true;
        if (!posicionInicial) {
          // Almacenar la posición actual de la cámara antes de cambiarla
          const camera = viewer.context.getCamera();
          posicionInicial = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
          };
        }
        generatePlanta2D(plantaActivo);
      }
    };
    
  }
  
    const button = document.createElement('button');
    containerForPlans.appendChild(button);
    button.textContent = 'Exit floorplans';
    button.onclick = () => {
      hideAllItems(viewer, idsTotal );
      showAllItems(viewer, idsTotal);
      ocultarLabels();
      const activeButton = containerForPlans.querySelector('button.activo');
      if (activeButton) {
        activeButton.classList.remove('activo');
      }
      ocultaBtnRemoveClass();
    };
}
function ocultaBtnRemoveClass(){
  const btnLabelPlantasList = document.querySelectorAll('.btnLabelPlanta');
  btnLabelPlantasList.forEach((btnLabel) => {
      btnLabel.style.visibility = 'hidden';
      btnLabel.classList.remove('activoBtnLabelPlanta');  
      
});
const btn2DPlantasList = document.querySelectorAll('.btn2DPlanta');
  btn2DPlantasList.forEach((btn2D) => {
    btn2D.style.visibility = 'hidden';
    btn2D.classList.remove('activoBtn2DPlanta');  
});
viewer.context.ifcCamera.cameraControls.setLookAt(posicionInicial.x, posicionInicial.y, posicionInicial.z, 0, 0, 0);

}

function ocultarLabels() {
const piezaLabels = document.querySelectorAll('.pieza-label');
      const expressIDsOcultar = [];

      piezaLabels.forEach((element) => {
        if (element.style.visibility !== 'hidden') {
          const id = parseInt(element.id);
          if (!isNaN(id)) {
            expressIDsOcultar.push(id);
          }
        }
      });
      removeLabels(expressIDsOcultar);
}

let posicionInicial = null;
function generatePlanta2D(plantaActivo) {
  
  //const screenShot = viewer.context.renderer.newScreenshot(camera);
  // CREA UN IMAGEN DE LA CAMARA EN ESA POSICION

  if (plantaActivo) {
    viewer.context.ifcCamera.cameraControls.setLookAt(0, 50, 0, 0, 0, 0);
    viewer.context.ifcCamera.toggleProjection();
    
  } else {
    if (posicionInicial) {
      viewer.context.ifcCamera.cameraControls.setLookAt(posicionInicial.x, posicionInicial.y, posicionInicial.z, 0, 0, 0);
      viewer.context.ifcCamera.toggleProjection();
      posicionInicial=null;
    }
  }
}


async function createPrecastElementsArray(modelID){
  const ifcProject = await viewer.IFC.getSpatialStructure (modelID);
  

  const constructPrecastElements = (node) => {
      const children = node.children;
      const exists = uniqueTypes.includes(node.type);
      // TODO: elementos de IFC excluidos BUILDING y SITE
      if (!exists && node.type !== "IFCBUILDING" && node.type !== "IFCSITE" && node.type !== "IFCBUILDINGSTOREY" && node.type !== "IFCELEMENTASSEMBLY" && node.type !== "IFCBUILDINGELEMENTPROXY") {
          precastElements.push({expressID: node.expressID, ifcType: node.type});
      }
      if(children.length === 0){
          return;    
      }
      children.forEach(child => {
          constructPrecastElements(child);
      }); 
  }
  ifcProject.children.forEach(child => {
      constructPrecastElements(child)
  })
  return precastElements;
}

function getAllIds(ifcModel) {
  return Array.from(
      new Set(ifcModel.geometry.attributes.expressID.array),
  );
}

function cargaGlobalIdenPrecast(){
  //Carga la propiedade GlobalId al array precastElements
      precastElements.forEach(precast => {
          if (precast.ifcType !='IFCBUILDING'){
              precastPropertiesGlobalId(precast, 0, precast.expressID);
          }
      }); 
      
}

async function precastPropertiesGlobalId(precast,modelID, precastID){
  const props = await viewer.IFC.getProperties(modelID, precastID, true, false);
  precast['GlobalId'] = props['GlobalId'].value; //establece propiedad GlobalId en obj precast y le asigna un valor
}

function getWholeSubset(viewer, model, allIDs) {
	return viewer.IFC.loader.ifcManager.createSubset({
		modelID: model.modelID,
		ids: allIDs,
		applyBVH: true,
		scene: model.parent,
		removePrevious: true,
		customID: 'full-model-subset',
	});
}

function replaceOriginalModelBySubset(viewer, model, subset) {
	const items = viewer.context.items;  //obtiene el objeto "items" del contexto del visor y lo almacena en una variable local.
	items.pickableIfcModels = items.pickableIfcModels.filter(model => model !== model);  //Filtra las matrices y elimina cualquier referencia al modelo original
	items.ifcModels = items.ifcModels.filter(model => model !== model);
	model.removeFromParent();  //Elimina el modelo original de su contenedor principal
	items.ifcModels.push(subset);
	items.pickableIfcModels.push(subset); 
}

container.onclick = async () => {
  const found = await viewer.IFC.selector.pickIfcItem(false);
  console.log("found", JSON.stringify(found));

  // const boxElement= viewer.IFC.loader.ifcManager.createSubset({
  //   scene:scene,
  //   modelID:0,
  //   ids: [found.id],
  //   removePrevious:true,
  //   applyBVH:true
  // });

  // const boxHelper=new BoxHelper (boxElement, 0xff0000);
  // scene.add(boxHelper);



  if (found === null || found === undefined) {
    const container = document.getElementById('propiedades-container');
    container.style.visibility = "hidden";
    viewer.IFC.selector.unpickIfcItems();
    return;
  }
  const expressID = found.id;

  let ART_Pieza = null;
  let ART_Longitud = null;
  let ART_Volumen = null;
  let ART_Ancho = null;

  for (const precast of precastElements) {
    if (precast.expressID === expressID) {
      ART_Pieza = precast['ART_Pieza'];
      ART_Longitud = precast['ART_Longitud'];
      ART_Peso=precast['ART_Peso'];
      // ART_Volumen = precast['ART_Volumen'];
      // ART_Ancho = parseFloat(precast['ART_Ancho']).toFixed(2);
      // ART_Ancho = parseFloat(ART_Ancho);
      break;
    }
  }

  muestraPropiedades(ART_Pieza, ART_Longitud, ART_Peso);
};

function muestraPropiedades(ART_Pieza, ART_Longitud, ART_Peso) {
  const container = document.getElementById('propiedades-container');
  container.style.visibility = "visible";
  const longitudNum = parseFloat(ART_Longitud);
  const pesoNum = parseFloat(ART_Peso).toFixed(2);
  const longitudFormatted = longitudNum.toFixed(2); 

  const propiedadesDiv = document.createElement('div');
  propiedadesDiv.classList.add('propiedades');
  
  const piezaLabel = document.createElement('p');
  piezaLabel.innerHTML = `Pieza: <strong>${ART_Pieza}</strong>`;
  
  const longitudLabel = document.createElement('p');
  longitudLabel.innerHTML = `Longitud: <strong>${longitudFormatted}</strong>`;
  
  const pesoLabel = document.createElement('p');
  pesoLabel.innerHTML = `Peso: <strong>${pesoNum}</strong>`;
  
  propiedadesDiv.appendChild(piezaLabel);
  propiedadesDiv.appendChild(longitudLabel);
  propiedadesDiv.appendChild(pesoLabel);
  
  const propiedadesContainer = document.getElementById('propiedades-container');
  propiedadesContainer.innerHTML = ''; // Limpia el contenido existente
  propiedadesContainer.appendChild(propiedadesDiv);
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const propButton = document.getElementById('btn-lateral-propiedades');
let propActive= false;
const divInputText= document.getElementById("inputARTP");
const inputText = document.querySelector("#inputARTP input[type='text']");
const checkBox = document.getElementById('checkLabels'); 
const infoBusquedas = document.getElementById("infoBusquedas");
propButton.onclick= () => {
  // viewer.plans.goTo(model.modelID, plan);
  if(propActive){
    propActive=!propActive;
    propButton.classList.remove('active');
    const propiedadesContainer = document.getElementById('propiedades-container');
    propiedadesContainer.innerHTML = '';
    viewer.IFC.selector.unpickIfcItems();
    divInputText.style.display = "none";
    inputText.value="";
    hideAllItems(viewer, idsTotal);
    showAllItems(viewer, allIDs);
    // removeLabels(expressIDsInput);
    ocultarLabels();
    expressIDsInput=[];
        numBusquedas=0;
        infoBusquedas.querySelector("p").textContent = "";
        if (listaElementosEncontrados) {
            infoBusquedas.removeChild(listaElementosEncontrados);
            listaElementosEncontrados = null;
        }
        if (modelCopy) {
            scene.remove(modelCopy); 
            modelCopy = null;
        }
        return;
  }else {
    propActive=!propActive;
    propButton.classList.add('active');
    divInputText.style.display = "block";
    inputText.focus();
  }

}

let numBusquedas = 0;
let expressIDsInput;
let modelCopy = null; 
let listaElementosEncontrados = null;

inputText.addEventListener('change', function() {
  infoBusquedas.querySelector("p").textContent = "";
  // removeLabels(expressIDsInput);
  if (propActive) {
      const elementoBuscado = inputText.value.trim().toUpperCase();
      numBusquedas++;
      if (elementoBuscado) {
          const elementosEncontrados = [];
          for (let i = 0; i < precastElements.length; i++) {
              if (precastElements[i].ART_Pieza === elementoBuscado) {
                  elementosEncontrados.push(precastElements[i]);
              }
          }
          expressIDsInput = elementosEncontrados.map(elemento => elemento.expressID);
          if (elementosEncontrados.length > 0) {
              const nuevaListaElementosEncontrados = document.createElement("ul");
              nuevaListaElementosEncontrados.classList.add("elementos-encontrados");
              elementosEncontrados.sort((a, b) => a.Camion - b.Camion);

              elementosEncontrados.forEach((elemento) => {
                  const listItem = document.createElement("li");
                  const nombreElemento = elemento.ART_Pieza;
                  const camionPertenece = elemento.Camion ? elemento.Camion : "-----";
  
                  listItem.textContent = `Elemento: ${nombreElemento}, Camión: ${camionPertenece}`;
                  nuevaListaElementosEncontrados.appendChild(listItem);
                  
              });
              modelCopyCompletoFunction();
              if (listaElementosEncontrados) {
                  infoBusquedas.replaceChild(nuevaListaElementosEncontrados, listaElementosEncontrados);
              } else {
                  infoBusquedas.appendChild(nuevaListaElementosEncontrados);
              }

              listaElementosEncontrados = nuevaListaElementosEncontrados;

              hideAllItems(viewer, idsTotal);
              // if (modelCopy) {
              //     scene.remove(modelCopy); 
              // }
              
              
              showAllItems(viewer, expressIDsInput);
          } else {
              infoBusquedas.querySelector("p").textContent = "No existe el elemento: " + elementoBuscado;
          }
          if (checkBox.checked) {
              generateLabels(expressIDsInput);
          } else {
              removeLabels(expressIDsInput);
          }
      } else {
          // propButton.style.background= '#fff0c2';
          // propButton.addClass.remove('active');
          hideAllItems(viewer, idsTotal);
          showAllItems(viewer, allIDs);
          removeLabels(expressIDsInput);
          divInputText.style.display = "none";
      }
  }
});

function modelCopyCompletoFunction(){
  // const materialSolid = new MeshLambertMaterial({
            
  //     transparent: true,
  //     opacity: 0.3,
  //     color: 0x54a2c4,
  // });

  //   const materialLine = new LineBasicMaterial({ color: 0x000000 });

  //   const multiMaterial = new MultiMaterial([materialSolid, materialLine]);

  //   modelCopy = new Mesh(model.geometry, multiMaterial);
  //   scene.add(modelCopy);
  const materialSolid = new MeshLambertMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0x54a2c4,
  });
modelCopyCompleto = new Mesh(model.geometry, materialSolid);
        scene.add(modelCopyCompleto);
}
// Seccion button - corte
const cutButton = document.getElementById('btn-lateral-seccion');
let cutActive = false;
cutButton.onclick = () => {
  
    if(cutActive) {
        cutActive = !cutActive;
        cutButton.classList.remove('active');
        viewer.clipper.deleteAllPlanes();
    } else {
        cutActive = !cutActive;
        cutButton.classList.add('active');
        viewer.clipper.active = cutActive;
    };
};

//Measure button
// Dimensions button
const measureButton = document.getElementById('btn-lateral-medir');
let measuresActive = false;
measureButton.onclick = () => {
    if(measuresActive) {
        measuresActive = !measuresActive;
        measureButton.classList.remove('active');
        viewer.dimensions.deleteAll();
        viewer.dimensions.previewActive = measuresActive;
    } else {
        measuresActive = !measuresActive;
        measureButton.classList.add('active');
        viewer.dimensions.active = measuresActive;
        viewer.dimensions.previewActive = measuresActive;
    };
};

// Floorplans button
let floorplansActive = false;
const floorplanButton = document.getElementById('btn-lateral-plantas');
let floorplansButtonContainer = document.getElementById('button-container');
floorplanButton.onclick = () => {
  
  if(floorplansActive) {
    floorplansActive = !floorplansActive;
    floorplanButton.classList.remove('active');
    floorplansButtonContainer.classList.remove('visible');
    
    hideAllItems(viewer, idsTotal );
      showAllItems(viewer, idsTotal);
    floorplansButtonContainer.style.visibility = 'hidden';
 
    hideAllItems(viewer, idsTotal );
      showAllItems(viewer, idsTotal);
    //desactiva los botones de plantas cuando se apaga el boton que genera los planos
    const containerForButtons = document.getElementById('button-container');
    const buttons = containerForButtons.querySelectorAll('button');
    for (const button of buttons) {
      if (button.classList.contains('activo')) {
        button.classList.remove('activo');
      }
    }
    ocultaBtnRemoveClass();
    ocultarLabels();
    
  } else {
    floorplansActive = !floorplansActive;
    floorplanButton.classList.add('active');
    floorplansButtonContainer = document.getElementById('button-container');
    floorplansButtonContainer.style.visibility = 'visible';
    
  };
};

// Ifc en modo fantasma
// Muestra el ifc COmpleto
const ifcCompletoButton = document.getElementById('btn-ifc-completo');
let ifcCompletoActive = false;
ifcCompletoButton.onclick=()=>{
  ifcCompletoActive = !ifcCompletoActive;
    if(ifcCompletoActive){
      ifcCompletoButton.classList.remove('active');
      scene.remove(modelCopyCompleto);
    }else{
      ifcCompletoButton.classList.add('active');
      modelCopyCompletoFunction()
    }
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

window.onclick = async () => {
    if(cutActive) {
        viewer.clipper.createPlane();
    }else if (measuresActive){
        viewer.dimensions.create();
    }
};

//*********************************************************************************************************** */
//cuando importa un archivo CSV rellena el array con las propiedades necesarias y genera los botones con numCamion *****************************
GUI.importer.addEventListener("change", function(e) {
  e.preventDefault();
  const input = e.target.files[0];
  const reader = new FileReader();
  let headers = [];

  const readCsvFile = new Promise((resolve, reject) => {
      reader.onload = function (e) {
          const text = e.target.result;
          let lines = text.split(/[\r\n]+/g);
          let numObjectosPre = precastElements.length;
          let numLinesCsv = lines.length - 2;

          if (numObjectosPre > numLinesCsv) {
              const nuevos = precastElements.filter(dato => !lines.some(line => line.includes(dato.expressID)));
              const expressID = nuevos.map(nuevo => nuevo.expressID);
              if (expressID.length>0){
                  alert("Aparecen: "+expressID.length+" nuevos elementos. IFC MODIFICADO")
              }
          } else if (numObjectosPre < numLinesCsv) {
              const eliminado = precastElements.find(dato => !lines.some(line => line.includes(dato.expressID)));
              alert("Se ha eliminado un elemento al MODIFICAR el archivo IFC: " + JSON.stringify(eliminado));
          }

          lines.forEach(line => {
              if (headers.length===0){
                  headers = line.split(',');
              } else {
                  let mline = line.split(',');
                  if(!mline[0]==''){
                      let dato = precastElements.find(dato => dato[headers[2]] === mline[2]);
                      for(let i=3; i<headers.length; i++){
                          if(dato && mline[i]!==undefined){ 
                              dato[headers[i]] = mline[i]; 
                          }
                      }
                  }
              }
          });
          resolve();
      };
      reader.readAsText(input); 
  });

  readCsvFile.then(() => {

    const btnCargaCsv= document.getElementById("botonImportar");
    btnCargaCsv.style.visibility="hidden";
    const checkboxContainer = document.getElementById('checkbox-container');
    checkboxContainer.innerHTML = generateCheckboxes(precastElements);
    checkboxContainer.style.visibility = "visible"; 
    addCheckboxListeners(precastElements, viewer);
  
    camionesUnicos = obtenerValorCamion(precastElements);
    generaBotonesNumCamion(camionesUnicos);
  })
  .catch(error => console.error(error));
});

function muestraNombrePiezaOnClick(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ){;
  if(ART_Pieza===undefined ||ART_CoordX===undefined ||ART_CoordY===undefined||ART_CoordZ===undefined){
      return;
  }else{
  const label = document.createElement('p');
  label.textContent = ART_Pieza;
  label.classList.add('pieza-label'); // Agregar una clase para identificar estas etiquetas
  const labelObject=new CSS2DObject (label);
  labelObject.position.set(parseFloat(ART_CoordX)/1000, parseFloat( ART_CoordZ)/1000, - parseFloat(ART_CoordY)/1000)
  scene.add(labelObject)
  }
} 

// function muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ, expressID) {
//   if (ART_Pieza === undefined || ART_CoordX === undefined || ART_CoordY === undefined || ART_CoordZ === undefined) {
//     return;
//   } else {
//     const elements = document.getElementsByTagName('p');
//     let count = 0;

//     for (let i = 0; i < elements.length; i++) {
//       const element = elements[i];

//       if (element.textContent.startsWith(ART_Pieza)) {
//         if (element.style.visibility === 'hidden') {
//           element.style.visibility = 'visible';
//         }
//         count++;
//       }
//     }

//     if (count === 0) {
//       const label = document.createElement('p');
//       label.textContent = ART_Pieza;
//       label.classList.add('pieza-label'); // Agregar una clase para identificar estas etiquetas
//       label.id = expressID;
//       const labelObject = new CSS2DObject(label);
//       labelObject.position.set(parseFloat(ART_CoordX) / 1000, parseFloat(ART_CoordZ) / 1000, -parseFloat(ART_CoordY) / 1000)
//       scene.add(labelObject)
//     }
//   }
// }
function muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ, expressID) {
  if (ART_Pieza === undefined || ART_CoordX === undefined || ART_CoordY === undefined || ART_CoordZ === undefined) {
      return;
  } else {
      const elements = document.getElementsByTagName('p');
      let count = 0;
      for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.textContent.startsWith(ART_Pieza) && element.expressID ===expressID) {
              if (element.style.visibility === 'hidden') {
                  element.style.visibility = 'visible';
              }
          count++;
          }
      }
      if (count === 0) {
          const label = document.createElement('p');
          label.textContent = ART_Pieza;
          label.classList.add('pieza-label');
          label.id = expressID;
          const labelObject = new CSS2DObject(label);
          labelObject.position.set(parseFloat(ART_CoordX) / 1000, parseFloat(ART_CoordZ) / 1000, (-parseFloat(ART_CoordY) / 1000));
          scene.add(labelObject);
      }
  }
}

function generateCheckboxes(precastElements) {
  //agrupa los elementos por la primera letra de la propiedad ART_Pieza
  const groupedElements = precastElements.reduce((acc, el) => {
    if (el.ART_Pieza===0 ||el.ART_Pieza==="0" ||el.ART_Pieza==="" || el.ART_Pieza===undefined) {
      return acc;
    }
    const firstLetter = el.ART_Pieza.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(el);
    return acc;
  }, {});
  //genera el HTML para los checkboxes y los botones
  let html = '';
  Object.entries(groupedElements).forEach(([artPieza, elements]) => {
    html += `<div class="checkbox-button-container">`;
    html += `<button class="btnCheck" data-art-pieza="${artPieza}"> ${artPieza}</button>`;
    html += `<div class="checkbox-group">`;
    html += `<input type="checkbox" checked data-art-pieza="${artPieza}" style="margin-left: 8px">${artPieza} (${elements.length})`;
    html += `</div>`;
    html += `</div>`;
  });

  setTimeout(() => {
    addBotonCheckboxListeners();
  }, 0);
  return html;
}

function addBotonCheckboxListeners() {
  const buttons = document.querySelectorAll('.btnCheck');
  for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function() {
          const letter = this.dataset.artPieza;
          const isChecked = this.checked;
          const artPieza = this.getAttribute('data-art-pieza');
          const visibleIds = [];
          const parentText = this.parentNode.textContent.trim();
          let prevEl = null;
          precastElements.forEach(function(el, index) {
              if (allIDs.includes(el.expressID)) {
                  if (el.ART_Pieza === 0 || el.ART_Pieza === "0" || el.ART_Pieza === "" ||el.ART_Pieza=== undefined) {
                      return ;
                  }
                  if (el.ART_Pieza.charAt(0).toUpperCase() === artPieza) {
                      visibleIds.push(el.expressID);
                      }
              }
          });
          if (this.classList.contains('pulsado')) {
              this.classList.remove('pulsado');
              removeLabels(visibleIds);
          } else {
              this.classList.add('pulsado');
              generateLabels(visibleIds);
          }
      });
  }
}

function removeLabels(expressIDs) {
  const labels = document.querySelectorAll('.pieza-label'); // Buscar todos los elementos con la clase "pieza-label"
  for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const labelID = parseInt(label.id);
      if (expressIDs.includes(labelID)) {
          label.style.visibility = 'hidden';
      }
  }
}

function addCheckboxListeners(precastElements, viewer) {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener('change', function() {
      viewer.IFC.selector.unpickIfcItems();
      const isNotChecked = this.checked;
      const artPieza = this.getAttribute('data-art-pieza');
      const visibleIds = [];
      const parentText = this.parentNode.textContent.trim();
      const letter = parentText.charAt(0).toUpperCase();
      
      precastElements.forEach(function(el) {
        if (el.ART_Pieza && el.ART_Pieza.charAt(0).toUpperCase() === artPieza) {
          visibleIds.push(el.expressID);
        }
      });
      console.log(visibleIds);
      if (isNotChecked) {
        showAllItems(viewer, visibleIds);
        
      } else {
          hideAllItems(viewer, visibleIds);
        removeLabels(visibleIds);
        const button = document.querySelector(`.btnCheck[data-art-pieza="${artPieza}"]`);
        if (button && button.classList.contains('pulsado')) {
          button.classList.remove('pulsado');
          removeLabels(visibleIds);
        }
      }
    });
  }
}

async function generateLabels(expressIDs) {
  for (const expressID of expressIDs) {
    let ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ;
    
    for (const precast of precastElements) {
      if (precast.expressID === expressID) {
        ART_Pieza = precast['ART_Pieza'];
        ART_CoordX = precast['ART_cdgX'];
        ART_CoordY = precast['ART_cdgY'];
        ART_CoordZ = precast['ART_cdgZ'];
        break;
      }
    }
    muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ, expressID);
  }
  
}

let botonesActivos; 
function generaBotonesNumCamion(camionesUnicos) {
  viewer.IFC.selector.unpickIfcItems();

  const btnNumCamiones = document.getElementById("divNumCamiones");
  botonesActivos = 0; // contador de botones activos

  btnNumCamiones.innerHTML = ""; // limpia el div antes de generar los botones
  agregarBotonCero();
  camionesUnicos.sort((a, b) => a - b); // ordena los nº de camion de menor a mayor

  const checkboxGroup = document.getElementsByClassName("checkbox-group");

  camionesUnicos.forEach(function(camion) {
    const btn = document.createElement("button");
    btn.setAttribute("class", "btnNumCamion");
    btn.textContent = camion;

    precastElements.forEach(function(precastElement) {
      if (parseInt(precastElement.Camion) === camion) {
        const tipoTransporte = precastElement.tipoTransporte;
        if (tipoTransporte.includes("E")) {
          btn.style.backgroundColor = "#6d4c90";
        } else if (tipoTransporte.includes("A")) {
          btn.style.backgroundColor = "#4c7a90";
        } else if (tipoTransporte.includes("C")) {
          btn.style.backgroundColor = "#90834c";
        }else if (tipoTransporte.includes("Tu")) {
          btn.style.backgroundColor = "#9e9e9e";
      }
      }
    });

    btnNumCamiones.appendChild(btn);

    btn.addEventListener("click", function() {
      let checkboxStates = {};
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(function (checkbox) {
                checkboxStates[checkbox.id] = checkbox.checked;
            });
      const expressIDs = [];
      precastElements.forEach(function(precastElement) {
        if (parseInt(precastElement.Camion) === camion) {
          expressIDs.push(precastElement.expressID);
        }
      });

      const isActive = btn.classList.contains("active");
      if (isActive) {
          viewer.IFC.selector.unpickIfcItems();

          activeExpressIDs = activeExpressIDs.filter(id => !expressIDs.includes(id));

          
          btn.classList.remove("active");
          btn.style.justifyContent = "center";
          btn.style.color = "";
          botonesActivos--;
          removeLabels(expressIDs);
          hideAllItems(viewer, expressIDs);
      } else {
          const btnCheckPulsado = document.querySelectorAll('.btnCheck.pulsado');
                btnCheckPulsado.forEach(function(btn) {
                btn.classList.remove('pulsado');
          });
          const piezaLabels = document.querySelectorAll('.pieza-label');
                piezaLabels.forEach(function(label) {
                    label.style.visibility = 'hidden';
                });
          
          activeExpressIDs = activeExpressIDs.concat(expressIDs);

          viewer.IFC.selector.unpickIfcItems();
          
          btn.classList.add("active");
          btn.style.color = "red";
          botonesActivos++;
          generateLabels(activeExpressIDs);
          hideAllItems(viewer, allIDs);
          showAllItems(viewer, activeExpressIDs);
      }

      

      if (botonesActivos === 0) {
        // showAllItems(viewer, allIDs);
        ocultarLabels();
        const containerFiltros= document.getElementById("checkbox-container");
        containerFiltros.style.visibility="visible";
        const checkedArtPiezas = []; 
                checkboxes.forEach(function (checkbox) {
                    if (checkbox.checked) {
                        checkedArtPiezas.push(checkbox.getAttribute('data-art-pieza'));
                    }
                });
                const matchingIds = []; // Almacenar los IDs de los elementos que coinciden con los checkboxes seleccionados
                
                precastElements.forEach(function (element) {
                    if (element.ART_Pieza === 0 || element.ART_Pieza === "0" || element.ART_Pieza === "" || element.ART_Pieza === undefined) {
                        return;
                    }
                    if (checkedArtPiezas.includes(element.ART_Pieza.charAt(0).toUpperCase())) {
                        // if (!element.hasOwnProperty('Camion') || element.Camion === "") {
                            matchingIds.push(element.expressID);
                        // }
                    }
                });
                hideAllItems(viewer, idsTotal );
                showAllItems(viewer, matchingIds);
        // enableCheckboxes();
        // enableBtnCheckboxes();
      } else {
        const containerFiltros= document.getElementById("checkbox-container");
        containerFiltros.style.visibility="hidden";
        // disableCheckboxes();
        // disableBtnCheckboxes();
      }
    });
  });

  function disableCheckboxes() {
    for (let i = 0; i < checkboxGroup.length; i++) {
      const checkboxes = checkboxGroup[i].querySelectorAll('input[type="checkbox"]');
      
      for (let j = 0; j < checkboxes.length; j++) {
        checkboxes[j].disabled = true;
      }
    }
  }
  function disableBtnCheckboxes() {
      const checkboxContainer = document.getElementById('checkbox-container');
      const buttons = checkboxContainer.querySelectorAll('.checkbox-button-container button');

      buttons.forEach((button) => {
          button.disabled = true;
      });
  }
  function enableCheckboxes() {
    for (let i = 0; i < checkboxGroup.length; i++) {
      const checkboxes = checkboxGroup[i].querySelectorAll('input[type="checkbox"]');
      
      for (let j = 0; j < checkboxes.length; j++) {
        checkboxes[j].disabled = false;
      }
    }
    
  }
  function enableBtnCheckboxes() {
    const checkboxContainer = document.getElementById('checkbox-container');
    const buttons = checkboxContainer.querySelectorAll('.checkbox-button-container button');

    buttons.forEach((button) => {
        button.disabled = false;
    });
    
  }
}



let activeExpressIDs = [];
function obtenerValorCamion(precastElements) {
  const valoresCamion = new Set();
  
  precastElements.forEach(function(elemento) {
      const camion = parseInt(elemento.Camion);
      if (!isNaN(camion)) { // Agregar solo valores numéricos al Set
          valoresCamion.add(camion);
      }
  });
  return Array.from(valoresCamion);
}

function hideAllItems(viewer, ids) {
	ids.forEach(function(id) {
        viewer.IFC.loader.ifcManager.removeFromSubset(
            0,
            [id],
            'full-model-subset',
        );
    }); 
    
}

function showAllItems(viewer, ids) {
	viewer.IFC.loader.ifcManager.createSubset({
		modelID: 0,
		ids,
		removePrevious: false,
		applyBVH: true,
		customID: 'full-model-subset',
	});
}
let btnCero
function agregarBotonCero() {
  viewer.IFC.selector.unpickIfcItems();
  
  btnCero = document.createElement("button");
  btnCero.setAttribute("class","btnNumCamion")
  
  divNumCamiones.appendChild(btnCero);

  const iconoPlay = document.createElement("i");
  iconoPlay.setAttribute("class", "fas fa-play");

  btnCero.appendChild(iconoPlay);

  btnCero.addEventListener("click", function() {

      const isActive = btnCero.classList.contains("active");
      if (isActive) {
          hideAllItems(viewer, idsTotal);
          showAllItems(viewer, allIDs);
          btnCero.classList.remove("active");
          btnCero.style.justifyContent = "center";
          btnCero.style.color = "";
      } else {
          ocultarLabels();
          hideAllItems(viewer, idsTotal);
          const botones = document.querySelectorAll('#divNumCamiones button');

          botones.forEach(function(boton) {
              boton.classList.remove('active');
              boton.style.border = '1px solid white';
              boton.style.color="white";
          });
          //document.getElementById("datosCamiones").innerHTML = "";
          //document.getElementById("posicionCamion").innerHTML = "";
          btnCero.classList.add("active");
          btnCero.style.justifyContent = "center";
          
          showElementsByCamion(viewer, precastElements);

      }
  });
}

function showElementsByCamion(viewer, precastElements) {
  // Crear el div y el label
  activeExpressIDs = [];
  botonesActivos=0;
  const label = document.createElement("label");
  const div = document.createElement("div");
  div.setAttribute("id", "divNumCamion");
  div.appendChild(label);
  document.body.appendChild(div);

  // Filtra los elementos cuyo valor en su propiedad sea distinto a 0 o a undefined
  //O los que no tengan propiedad asiganada en el objeto
  const filteredElements = precastElements.filter((element) => {
      const { Camion } = element;
      return Camion && Camion !== "" && Camion !== "undefined" && Camion !== "0" && "Camion" in element;
  });
  
  // Agrupa los elementos por valor de su propiedad
  const groupedElements = filteredElements.reduce((acc, element) => {
      const { Camion } = element;
      if (!acc[Camion]) {
          acc[Camion] = [];
      }
      acc[Camion].push(element);
      return acc;
  }, {});
  
  // muestra los elementos agrupados en el visor y su etiqueta de num Camion
  let delay = 0;
  Object.keys(groupedElements).forEach((key) => {
      const elements = groupedElements[key];
      setTimeout(() => {
          // Mostrar el valor de Camion en el label
          label.textContent = `Camion: ${key}`;
          showAllItems(viewer, elements.map((element) => element.expressID));
      }, delay);
    delay += 350; // Esperar un segundo antes de mostrar el siguiente grupo
  });

   //ocultar la etiqueta después de mostrar todos los elementos
  setTimeout(() => {
    if (btnCero.classList.contains("active")) {
      btnCero.classList.remove("active");
      

      let checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
      checkboxes.forEach(function(checkbox) {
          checkbox.checked = true;
      });

      let elementos = document.querySelectorAll('.btnCheck.pulsado');

      elementos.forEach(function(elemento) {
        elemento.classList.remove('pulsado');
      });
    }
    div.style.visibility="hidden"

  }, delay);
}
//*********************************************************************************************************** */