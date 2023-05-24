
VARIABLES GLOBALES

'''javascript'''

let idsTotal; --- array con los ids, de todos lo selementos del IFC

let allIDs; --- array con los ids, de los elementos que no han sido asignados en transporte

let elementosOcultos=[]; ---- array con ids, que ya tienen asignado un transporte, 

let uniqueTypes=[];
let precastElements=[];
let model;

let numCamion=1;// cuenta los camiones totales, todos E A C
let letraTransporte = 'E';
let numT=1;
let numE = 1; 
let numA = 1;
let numC = 1;

let transporteA = [];
let transporteC = [];
let transporteE = [];


let globalIds=[];
let globalId;
let camionesUnicos=[];

let contenidoCelda;
let tablaResaltada = false;

let ultimaCeldaSeleccionada = null;
let ultimoCajonPulsado = null;


  viewer.IFC.selector.pickIfcItemsByID

  viewer.IFC.selector.unpickIfcItems();





function calcularPesoTotal(expressIDs) {
    let pesoTotal = 0;
    for (const id of expressIDs) {
      const precastElem = precastElements.find(elem => elem.expressID === id);
      if (precastElem && precastElem.ART_Volumen) {
        const volumen = parseFloat(precastElem.ART_Volumen);
        const peso = parseFloat((volumen * 2.5).toFixed(2));
        pesoTotal += peso;
      }
    }
    return pesoTotal;
  }


  
    const numCamionElement = document.getElementById("numCamion");
    const numCamion = numCamionElement.textContent.trim();

    const expressIDs = obtenerExpressIDsDelCamion(numCamion);

    const pesoTotal = calcularPesoTotal(expressIDs);
    const pesoCamionElement = document.getElementById("pesoCamion");
    pesoCamionElement.textContent = pesoTotal.toString();


    container.onclick = async () => {
  const found = await viewer.IFC.selector.pickIfcItem(false);
  if (found === null || found === undefined){ 
      const container=document.getElementById('propiedades-container');
      container.style.visibility="hidden";
      viewer.IFC.selector.unpickIfcItems();
      return;
  }
  const expressID = found.id;

  let ART_Pieza = null;
  for (const precast of precastElements) {
      if (precast.expressID === expressID ) {
          ART_Pieza = precast['ART_Pieza'];
          ART_Longitud = precast['ART_Longitud'];
          ART_Volumen = precast['ART_Volumen'];
          break;
      }
  }
  muestraPropiedades(ART_Pieza, ART_Longitud, ART_Volumen);
};

function muestraPropiedades(ART_Pieza, ART_Longitud, ART_Volumen) {
  // Convertir a números de punto flotante
  const longitudNum = parseFloat(ART_Longitud);
  const volumenNum = parseFloat(ART_Volumen);

  // Limitar a dos decimales
  const longitudFormatted = longitudNum.toFixed(2);
  const volumenFormatted = (volumenNum * 2.5).toFixed(2);

  const propiedadesDiv = document.createElement('div');
  propiedadesDiv.classList.add('propiedades');
  
  const piezaLabel = document.createElement('p');
  piezaLabel.innerHTML = `Pieza: <strong>${ART_Pieza}</strong>`;

  
  const longitudLabel = document.createElement('p');
  longitudLabel.innerHTML = `Longitud: <strong>${longitudFormatted}</strong>`;
  
  const volumenLabel = document.createElement('p');
  volumenLabel.innerHTML = `Peso: <strong>${volumenFormatted}</strong>`;
  
  propiedadesDiv.appendChild(piezaLabel);
  propiedadesDiv.appendChild(longitudLabel);
  propiedadesDiv.appendChild(volumenLabel);
  
  const propiedadesContainer = document.getElementById('propiedades-container');
  propiedadesContainer.innerHTML = ''; // Limpia el contenido existente
  propiedadesContainer.style.visibility="visible";
  propiedadesContainer.appendChild(propiedadesDiv);
}

if (!propActive) return;