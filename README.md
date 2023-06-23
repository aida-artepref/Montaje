
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



