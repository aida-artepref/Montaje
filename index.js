import { Color, Loader, MeshBasicMaterial, LineBasicMaterial, MeshStandardMaterial, Scene } from 'three';
import{ IfcViewerAPI } from 'web-ifc-viewer';
import { IfcElementQuantity } from 'web-ifc';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';




const container = document.getElementById('app');
const viewer = new IfcViewerAPI({container, backgroundColor: new Color("#EDE8BA")});

const scene = viewer.context.scene.scene;

viewer.clipper.active = true;
viewer.grid.setGrid(100,100);
viewer.axes.setAxes();



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
    document.getElementById("file-name").style.display = "block"; /* Hace visible la etiqueta */
});

GUI.loader.onclick = () => GUI.input.click();  //al hacer clic al boton abre cuadro de dialogo para cargar archivo
GUI.importloader.onclick = () => GUI.importer.click();

//cada vez elemento imput cambia, genera uURL y lo pasa a la lib IFC
GUI.input.onchange = async (event) => {
    const file=event.target.files[0];
    const url=URL.createObjectURL(file);
    loadModel(url); 
}

let tree;
let allPlans;
let model;
let allIDs;
let idsTotal;
let camionesUnicos=[];
let uniqueTypes=[];

async function loadModel(url) {
    model = await viewer.IFC.loadIfcUrl(url);

    getPlantas();

    createPrecastElementsArray(model.modelID).then((precastElements) => {
      cargaGlobalIdenPrecast(precastElements);
    });
    
    allIDs = getAllIds(model); 
    idsTotal=getAllIds(model);
    viewer.shadows = true;
    
    let subset = getWholeSubset(viewer, model, allIDs);
    replaceOriginalModelBySubset(viewer, model, subset); //reemplaza el modelo original por el subconjunto.
}




async function getPlantas(){
  await viewer.plans.computeAllPlanViews(model.modelID);

    const lineMaterial = new LineBasicMaterial({ color: 'black' });
	  const baseMaterial = new MeshBasicMaterial({
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1,
      });

	viewer.edges.create('example', model.modelID, lineMaterial, baseMaterial);

  const containerForPlans = document.getElementById('button-container');
  allPlans = viewer.plans.getAll(model.modelID);
  
  for (const plan of allPlans) {
    const currentPlan = viewer.plans.planLists[model.modelID][plan];
  
    const button = document.createElement('button');
    containerForPlans.appendChild(button);
    button.textContent = currentPlan.name;
  
    button.onclick = () => {
      viewer.plans.goTo(model.modelID, plan);
      viewer.edges.toggle('example', true);
      
      // Busca cualquier botón con la clase "activo" y quítala
      const activeButton = containerForPlans.querySelector('button.activo');
      if (activeButton) {
        activeButton.classList.remove('activo');
      }
  
      // Agrega la clase "activo" al botón actualmente seleccionado
      button.classList.add('activo');
    };

    const btnImport = document.getElementById("botonImportar");
    btnImport.style.visibility = 'visible';

  }
  
    const button = document.createElement('button');
    containerForPlans.appendChild(button);
    button.textContent = 'Exit floorplans';
    button.onclick = () => {
      viewer.plans.exitPlanView();
      viewer.edges.toggle('example', false);
      const activeButton = containerForPlans.querySelector('button.activo');
      if (activeButton) {
        activeButton.classList.remove('activo');
      }
    };


}
async function createPrecastElementsArray(modelID){
  const ifcProject = await viewer.IFC.getSpatialStructure (modelID);

  const constructPrecastElements = (node) => {
      const children = node.children;

      const exists = uniqueTypes.includes(node.type);

      // TODO: elementos de IFC excluidos BUILDING y SITE
      if (!exists && node.type !== "IFCBUILDING" && node.type !== "IFCSITE" && node.type !== "IFCBUILDINGSTOREY") {
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
  if (found === null || found === undefined) return;
  const expressID = found.id;

  // recorrer el array precastElements para buscar la posición del objeto con el mismo expressID
  const index = precastElements.findIndex((obj) => obj.expressID === expressID);
  if (index === -1) return;
  // obtener el valor de expressID del objeto en la posición anterior
  const prevObj = precastElements[index - 1];
  const prevExpressID = prevObj ? prevObj.expressID : null;//Si prevObj tiene un valor, entonces prevExpressID es igual a prevObj.expressID, sino prevExpressID es null

  const props = await viewer.IFC.getProperties(found.modelID, prevExpressID, true, true);

  const mats = props.mats;
  const psets = props.psets;
  const type = props.type;
  delete props.mats;
  delete props.psets;
  delete props.type;

  for (let pset in psets) {
    let properties = psets[pset].HasProperties;
    if (psets[pset] !== IfcElementQuantity) {
        let ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ;
        for (let property in properties) {
            if (properties[property].Name.value === 'ART_Pieza') {
                ART_Pieza =  properties[property].NominalValue.value;
                console.log(ART_Pieza+ " Nombre");
            }
            if (properties[property].Name.value === 'ART_CoordX') {
                ART_CoordX =  properties[property].NominalValue.value;
                console.log(ART_CoordX+ " X");
            }
            if (properties[property].Name.value === 'ART_CoordY') {
                ART_CoordY =  properties[property].NominalValue.value;
                console.log(ART_CoordY+ " Y");
            }
            if (properties[property].Name.value === 'ART_CoordZ') {
                ART_CoordZ = properties[property].NominalValue.value;
                console.log(ART_CoordZ+ " Z");
            }
        }
        muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ);
    }
}
};


function muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ) {
  console.log(ART_Pieza,ART_CoordX, ART_CoordY, ART_CoordZ);
  if(ART_Pieza===undefined ||ART_CoordX===undefined ||ART_CoordY===undefined||ART_CoordZ===undefined){
      return;
  }else{
  const label = document.createElement('label');
  label.textContent = ART_Pieza;
  label.classList.add('pieza-label'); // Agregar una clase para identificar estas etiquetas

  
  const css2dLabel = new CSS2DObject(label);
  css2dLabel.position.set(parseFloat(ART_CoordX)/1000, parseFloat( ART_CoordZ)/1000, - parseFloat(ART_CoordY)/1000);
  css2dLabel.userData.label=true;
  viewer.context.scene.scene.add(css2dLabel);
  }
 
}
// function muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ) {
//   console.log(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ);
//   if (ART_Pieza === undefined || ART_CoordX === undefined || ART_CoordY === undefined || ART_CoordZ === undefined) {
//     return;
//   } else {
//     const label = new THREE.Sprite();
//     label.userData.text = ART_Pieza;
//     label.scale.set(2, 2, 2); // Ajustamos la escala de la etiqueta
//     label.position.set(parseFloat(ART_CoordX) / 1000, parseFloat(ART_CoordZ) / 1000, -parseFloat(ART_CoordY) / 1000);
//     label.userData.label = true;

//     const div = document.createElement('div');
//     console.log(ART_Pieza);
//     div.textContent = ART_Pieza;
//     div.style.color = '#000000';
//     div.style.fontSize = '12px';
//     div.style.textAlign = 'center';

//     const objectCSS = new CSS2DObject(div);
//     objectCSS.position.set(1, 0, 0);
//     label.add(objectCSS);

//     viewer.context.scene.scene.add(label);
//   }
// }




// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


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
    viewer.plans.exitPlanView();
    viewer.edges.toggle('example-edges', false);
    floorplansButtonContainer.style.visibility = 'hidden';
    viewer.plans.exitPlanView();
    viewer.edges.toggle('example', false);
    //desactiva los botones de plantas cuando se apaga el boton que genera los planos
    const containerForButtons = document.getElementById('button-container');
    const buttons = containerForButtons.querySelectorAll('button');
    for (const button of buttons) {
      if (button.classList.contains('activo')) {
        button.classList.remove('activo');
      }
    }
    
  } else {
    floorplansActive = !floorplansActive;
    floorplanButton.classList.add('active');
    floorplansButtonContainer = document.getElementById('button-container');
    floorplansButtonContainer.style.visibility = 'visible';
    
  };
};

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



window.onclick = async () => {
    if(cutActive) {
        viewer.clipper.createPlane();
    }else if (measuresActive){
        viewer.dimensions.create();
    }
};

let precastElements=[];

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

      
    camionesUnicos = obtenerValorCamion(precastElements);
    generaBotonesNumCamion(camionesUnicos);
    const btnCargaCsv= document.getElementById("botonImportar");
    btnCargaCsv.style.visibility="hidden";
    const checkboxContainer = document.getElementById('checkbox-container');
    checkboxContainer.innerHTML = generateCheckboxes(precastElements);
    checkboxContainer.style.visibility = "visible"; 
    addCheckboxListeners(precastElements, viewer);
  })
  .catch(error => console.error(error));
});

function generateCheckboxes(precastElements) {
  //agrupa los elementos por la primera letra de la propiedad ART_Pieza
  const groupedElements = precastElements.reduce((acc, el) => {
    if (el.ART_Pieza===0 ||el.ART_Pieza==="0" ) {
      return acc;
    }
    const firstLetter = el.ART_Pieza.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(el);
    return acc;
  }, {});

  //genera el HTML para los checkboxes
  let html = '';
  Object.entries(groupedElements).forEach(([artPieza, elements]) => {
    html += `<div class="checkbox-container">`;
    html += `<input type="checkbox" checked data-art-pieza="${artPieza}" style="margin-right: 8px">${artPieza} (${elements.length})`;
    html += `</div>`;
  });
  return html;
}

function addCheckboxListeners(precastElements, viewer) {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener('change', function() {
      viewer.IFC.selector.unpickIfcItems();
      const isChecked = this.checked;
      const artPieza = this.getAttribute('data-art-pieza');
      const visibleIds = [];
      const parentText = this.parentNode.textContent.trim();
      const letter = parentText.charAt(0).toUpperCase();
      let prevEl = null;
      precastElements.forEach(function(el, index) {
        if (el.ART_Pieza.charAt(0).toUpperCase() === artPieza) {
          const nextEl = precastElements[index + 1];
          if (prevEl) {
            visibleIds.push(prevEl.expressID);
          }
          if (nextEl) {
            visibleIds.push(nextEl.expressID);
          }
          prevEl = el;
        }
      });
      if (isChecked) {
        console.log(visibleIds);
        showAllItems(viewer, visibleIds);
        filtrarVisibleIds(visibleIds);
      } else {
        // console.log(visibleIds);
        // hideAllItems(viewer, visibleIds).then(() => {
        //   removeLabels(letter);
        // });
       // removeLabels(letter);
       hideAllItems(viewer, visibleIds)
        
      }
    });
  }
}


// function removeLabels(letter) {

//   const labels = document.querySelectorAll('.pieza-label'); // Buscar todas las etiquetas creadas por muestraNombrePieza
//   //console.log(viewer.context.getScene())
//  // viewer.context.getScene().children.filter(child=>child.userData.label).forEach(child=>child.removeFromParent())

//   for (let i = 0; i < labels.length; i++) {
//     const label = labels[i];
//     const texto = labels[i].textContent.charAt(0);
//     if (texto === letter || texto===""||texto===undefined) {
//       // elimina el objeto de etiqueta de la escena
//       const css2dObject = scene.getObjectByName(label.id);
//       scene.remove(css2dObject);

//       // Elimina el elemento HTML del DOM
//       const parent = label.parentNode;
//       parent.removeChild(label);
//       label.style.display =  'none';


      
//     }
//   }
// }


function removeLabels(letter) {
  const labels = document.querySelectorAll('.pieza-label'); // Buscar todos los elementos con la clase "pieza-label-item"
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const texto = labels[i].textContent.charAt(0);
    if (texto === letter || texto===""||texto===undefined) {
      // elimina el objeto de etiqueta de la escena
      scene.remove(label.parent);
      const css2dObject = scene.getObjectByName(label.id);
      scene.remove(css2dObject);

      // Elimina el elemento HTML del DOM
      const parent = label.parentNode;
      parent.removeChild(label);
      label.style.display =  'none';
    }
  }
}


let elementosValidos=[];
function filtrarVisibleIds( visibleIds) {
  for (let i = 0; i < visibleIds.length; i++) {
    // Obtenemos el expressID del elemento actual
    const expressIDActual = visibleIds[i];

    // Buscamos en el array precastElements un elemento que tenga el mismo expressID
    const elemento = precastElements.find(e => e.expressID === expressIDActual);

    // Verificamos si el elemento existe y si su propiedad ifcType es diferente de 'IFCELEMENTASSEMBLY'
    if (!elemento || elemento.ifcType !== 'IFCELEMENTASSEMBLY') {
      // Si cumple estas condiciones, añadimos el expressID al nuevo array elementosValidos
      elementosValidos.push(expressIDActual);
    }
  }
  console.log (elementosValidos);
  generateLabels(elementosValidos);
  elementosValidos=[];
}

async function generateLabels(expressIDs) {
  for (const expressID of expressIDs) {
    const index = precastElements.findIndex((obj) => obj.expressID === expressID);
    if (index === -1) continue;

    const prevObj = precastElements[index - 1];
    const prevExpressID = prevObj ? prevObj.expressID : null;

    const props = await viewer.IFC.getProperties(model.modelID, prevExpressID, true, true);
    const psets = props.psets;

    for (const pset in psets) {
      let properties = psets[pset].HasProperties;
      if (psets[pset] !== IfcElementQuantity) {
        let ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ;
        for (const property in properties) {
          if (properties[property].Name.value === 'ART_Pieza') {
            ART_Pieza =  properties[property].NominalValue.value;
          }
          if (properties[property].Name.value === 'ART_CoordX') {
            ART_CoordX =  properties[property].NominalValue.value;
          }
          if (properties[property].Name.value === 'ART_CoordY') {
            ART_CoordY =  properties[property].NominalValue.value;
          }
          if (properties[property].Name.value === 'ART_CoordZ') {
            ART_CoordZ = properties[property].NominalValue.value;
          }
        }
        muestraNombrePieza(ART_Pieza, ART_CoordX, ART_CoordY, ART_CoordZ);
      }
    }
  }
}


function generaBotonesNumCamion(camionesUnicos) {
  viewer.IFC.selector.unpickIfcItems();
  
  const btnNumCamiones = document.getElementById("divNumCamiones");
  let botonesActivos = 0; // contador de botones activos

  btnNumCamiones.innerHTML = ""; //limpia el div antes de generar los botones
  agregarBotonCero();
  camionesUnicos.sort((a, b) => a - b); // ordena los nº de camion de menor a mayor
  
  camionesUnicos.forEach(function(camion) {
      const btn = document.createElement("button");
      btn.setAttribute("class","btnNumCamion")
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
              }
          }
      });
      
      btnNumCamiones.appendChild(btn);
      
      btn.addEventListener("click", function() {
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

              hideAllItems(viewer, expressIDs);
              btn.classList.remove("active");
              btn.style.justifyContent = "center";
              btn.style.color = "";
              botonesActivos--;
          } else {
            activeExpressIDs = activeExpressIDs.concat(expressIDs);

              viewer.IFC.selector.unpickIfcItems();
              hideAllItems(viewer, allIDs);
              showAllItems(viewer, activeExpressIDs);
              btn.classList.add("active");
              btn.style.color = "red";
              botonesActivos++;
          }
          if (botonesActivos === 0) { // si las cargas están desactivados muestra elementos que faltan por transportar
              showAllItems(viewer, allIDs);
          }
      });
  });
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
    }
    div.style.visibility="hidden"

  }, delay);
}
//*********************************************************************************************************** */