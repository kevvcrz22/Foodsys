// Node/Controllers/UsuariosControllers.js
// Controladores del modulo de usuarios para el sistema Foodsys
// Cada funcion recibe la peticion HTTP, delega al servicio y responde con JSON
// Nomenclatura: PascalCase en espanol sin tildes

import UsuariosService from "../Services/UsuariosService.js";
import CsvService from "../Services/CsvService.js";
import UsuariosModel from "../Models/UsuariosModel.js";
import FichasModel from "../Models/FichasModel.js";
import ProgramaModel from "../Models/ProgramaModel.js";
import RolesModel from "../Models/RolesModel.js";
import UsuariosRolModel from "../Models/UsuariosRolModel.js";
import { sincronizarEstadoAprendices } from "../Services/FichasServices.js";
import { normalizarNombrePrograma } from "../Services/ProgramaService.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import XLSX from "xlsx"; // npm install xlsx

/* ============================================================
   COLUMNAS_PLANTILLA
   Define el orden exacto de las columnas del archivo Excel
   que el administrador debe usar para importar aprendices o pasantes.
============================================================ */
const COLUMNAS_PLANTILLA = [
  "TipDoc_Usuario",
  "NumDoc_Usuario",
  "Nom_Usuario",
  "Ape_Usuario",
  "Gen_Usuario",
  "Cor_Usuario",
  "Tel_Usuario",
  "CenCon_Usuario",
  "Num_Ficha",
  "Est_Usuario",
  "Pol_Usuario",
  "San_Usuario"
];
//Solicitar restablecer contraseña
export const getResetPassword = async (req, res) => {
  const { email } = req.body

  try {
    await UsuariosService.resetPassword(email)
    res.status(200).json({ message: 'El mensaje para restablecer contraseña fue enviado correctamente.' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
//Recibir la nueva contraseña
export const setNewPassword = async (req, res) => {
  try {
    await UsuariosService.setNewPassword(req.body)
    res.status(200).json({ message: "Contraseña actualizada correctamente" })
  } catch (error) {
    res.status(400).json({ message: "Informacion invalida o el tiempo ha expirado." })
  }
}
// ─────────────────────────────────────────────────────────────
// AUTENTICACION Y CRUD BASICO
// ─────────────────────────────────────────────────────────────

/*
  RegisterUsuarios
  Paso 1: Express recibe el body con los datos del nuevo usuario.
  Paso 2: Se delega toda la logica de validacion y creacion al servicio.
  Paso 3: Si todo va bien se responde 201 (Created). Si el documento
          ya existe u otro error de negocio, el servicio lanza una
          excepcion que se captura aqui y se devuelve 400.
*/
export const RegisterUsuarios = async (req, res) => {
  try {
    await UsuariosService.register(req.body);
    res.status(201).json({ message: "Usuario registrado con exito" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  Login
  Paso 1: Se reciben las credenciales del usuario (documento + password).
  Paso 2: El servicio verifica la existencia del usuario, compara la
          contraseña con bcrypt y genera el token JWT.
  Paso 3: Se responde con el objeto usuario, sus roles y el token.
          El frontend guarda el token para enviarlo en cabeceras futuras.
*/
export const Login = async (req, res) => {
  try {
    const { usuario, roles, token } = await UsuariosService.Login(req.body);
    res.status(200).json({ message: "Usuario logueado exitosamente", usuario, roles, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  getAllUsuarios
  Consulta sin filtros a la base de datos.
  Util para listas desplegables y tablas de administracion.
  Error 500 porque un fallo aqui es problema del servidor, no del cliente.
*/
export const getAllUsuarios = async (req, res) => {
  try {
    const Usuarios = await UsuariosService.getAll();
    res.status(200).json(Usuarios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
  getUsuarios
  Busca un unico usuario por su clave primaria (Id_Usuario).
  Si no existe en la base de datos el servicio lanza error y
  se responde con 404 (Not Found).
*/
export const getUsuarios = async (req, res) => {
  try {
    const Usuario = await UsuariosService.getById(req.params.Id);
    res.status(200).json(Usuario);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/*
  updateUsuarios
  Paso 1: El body trae solo los campos que cambian (PATCH semantico
          pero usando PUT para compatibilidad con el frontend actual).
  Paso 2: El servicio aplica la actualizacion parcial en la BD.
  Paso 3: 400 si el Id no existe o los datos son invalidos.
*/
export const updateUsuarios = async (req, res) => {
  try {
    await UsuariosService.update(req.params.Id, req.body);
    res.status(200).json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  deleteUsuarios
  Elimina el registro de la base de datos de forma permanente.
  Esta accion NO es reversible desde la API. Si se necesita
  soft-delete (borrado logico) se debe agregar en el servicio.
*/
export const deleteUsuarios = async (req, res) => {
  try {
    await UsuariosService.delete(req.params.Id);
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  aceptarPolitica
  Registra en la base de datos la fecha o bandera de aceptacion
  de la politica de privacidad. Se llama una sola vez por usuario
  despues de que confirma en la pantalla de politicas.
*/
export const aceptarPolitica = async (req, res) => {
  try {
    await UsuariosService.aceptarPolitica(req.params.Id);
    res.status(200).json({ message: "Politica aceptada correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*
  getAprendices
  Filtra y devuelve unicamente los usuarios cuyo rol es
  "Aprendiz Interno" o "Aprendiz Externo".
  Esta ruta esta protegida con authMiddleware en el router.
*/
export const getAprendices = async (req, res) => {
  try {
    const Aprendices = await UsuariosService.getAprendices();
    res.status(200).json(Aprendices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
  getPasantes
  Filtra y devuelve unicamente los usuarios cuyo rol es
  "Pasante Interno" o "Pasante Externo".
  Esta ruta esta protegida con authMiddleware en el router.
*/
export const getPasantes = async (req, res) => {
  try {
    const Pasantes = await UsuariosService.getPasantes();
    res.status(200).json(Pasantes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// CAMBIO DE contraseña EN DOS PASOS
// El flujo se divide en dos endpoints para mejorar la UX:
// el usuario confirma su contraseña actual antes de escribir
// la nueva, evitando errores de tipeo y accesos no autorizados.
// ─────────────────────────────────────────────────────────────

/*
  validarPasswordActual  (Paso 1)
  Paso 1: Se recibe currentPassword desde el body.
  Paso 2: Se busca el usuario por PK para obtener el hash guardado.
  Paso 3: bcrypt.compare compara el texto plano con el hash;
          retorna true/false sin exponer el hash al cliente.
  Paso 4: Si es valida se responde { valid: true } y el frontend
          habilita el formulario para ingresar la nueva contraseña.
  Nota: No se modifica nada en la BD en este paso.
*/
export const validarPasswordActual = async (req, res) => {
  try {
    const { Id } = req.params;
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "La contraseña actual es requerida" });
    }

    const Usuario = await UsuariosModel.findByPk(Id);
    if (!Usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const EsValida = await bcrypt.compare(currentPassword, Usuario.password);
    if (!EsValida) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
  cambiarPassword  (Paso 2)
  Paso 1: Se validan que ambos campos existan y que newPassword
          cumpla el minimo de 8 caracteres (regla de seguridad basica).
  Paso 2: Se vuelve a verificar currentPassword como segunda barrera
          de seguridad; evita que un token robado cambie la clave
          sin conocer la actual.
  Paso 3: bcrypt.hash genera un nuevo hash con salt de 10 rondas.
          Nunca se guarda la contraseña en texto plano.
  Paso 4: UsuariosModel.update aplica solo el campo password.
          Si Resultado[0] === 0 significa que no se actualizo ninguna
          fila (Id inexistente), se lanza error controlado.
*/
export const cambiarPassword = async (req, res) => {
  try {
    const { Id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "La contraseña actual y la nueva son requeridas" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    const Usuario = await UsuariosModel.findByPk(Id);
    if (!Usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const EsValida = await bcrypt.compare(currentPassword, Usuario.password);
    if (!EsValida) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    const NuevoHash = await bcrypt.hash(newPassword, 10);
    const Resultado = await UsuariosModel.update(
      { password: NuevoHash },
      { where: { Id_Usuario: Id } }
    );

    if (Resultado[0] === 0) {
      throw new Error("No se pudo actualizar la contraseña en la base de datos");
    }

    res.status(200).json({ message: "contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// IMPORTACION MASIVA LEGACY — CSV
// Se mantiene por compatibilidad con integraciones anteriores.
// Para nuevas importaciones usar el flujo Excel de tres pasos.
// ─────────────────────────────────────────────────────────────

/*
  importarCSV
  Paso 1: multer (configurado en el router) guarda el archivo en disco.
  Paso 2: CsvService lee el archivo y crea los usuarios en la BD.
  Paso 3: Se responde con el conteo de creados y omitidos (duplicados).
*/
export const importarCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se recibio ningun archivo CSV" });
    }
    const Resultado = await CsvService.importarDesdeCSV(req.file.path);
    res.status(200).json({
      message: `Importacion completada. Creados: ${Resultado.creados}, Omitidos: ${Resultado.omitidos}`,
      ...Resultado,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// IMPORTACION MASIVA EXCEL — flujo de tres pasos
//
// Paso A — descargarPlantilla : el admin descarga el .xlsx vacio
// Paso B — previewImport      : sube el archivo y ve los datos
//                               antes de confirmar la importacion
// Paso C — importarSeleccionados: persiste solo las filas aprobadas
//
// Ventaja frente al flujo CSV:
//   * El admin puede revisar y desmarcar filas antes de guardar.
//   * El archivo nunca se escribe en disco (memoria RAM).
//   * Las validaciones ocurren en el backend, no en el frontend.
// ─────────────────────────────────────────────────────────────

/**
 * Extrae un valor de una fila buscando primero coincidencias exactas y luego parciales.
 */
function extractExcelField(row, exactKeys = [], partialKeys = []) {
  if (!row) return "";
  const keys = Object.keys(row);
  for (const ek of exactKeys) {
    const found = keys.find(k => k.trim().toUpperCase() === ek.toUpperCase());
    if (found && row[found] !== undefined && String(row[found]).trim() !== "") {
      return String(row[found]).trim();
    }
  }
  for (const pk of partialKeys) {
    const found = keys.find(k => k.trim().toUpperCase().includes(pk.toUpperCase()));
    if (found && row[found] !== undefined && String(row[found]).trim() !== "") {
      return String(row[found]).trim();
    }
  }
  return "";
}

/**
 * Busca inteligentemente la hoja del libro que contiene aprendices reales
 * y detecta la fila exacta de encabezados. Soporta Base_NO MODIFICAR_2026_SEPTIEMBRE, Hoja1, etc.
 */
function detectarHojaAprendices(Workbook) {
  // Priorizar hojas institucionales del SENA (Centro de Convivencia, Juicios, Base IQR, Foodsys, etc.)
  const prioridades = [
    "CENTRO DE CONVIVENCIA",
    "J_TGOs_Comp_2026_09",
    "J_TCOs_Comp_2026_09",
    "Base_Datos_IQR",
    "Aprendices_Activos",
    "Plantilla_Aprendices",
    "Hoja1",
    "Aprendices",
    "Usuarios",
    "Base_Datos",
    "Registro",
    "Registro Asistencia",
    "TGOs-Jucios_Tot",
    "TCOs-Jucios_Tot",
    "JUNIO"
  ];

  const dinamicas = Workbook.SheetNames.filter(n => /J_.*Comp/i.test(n) && !prioridades.includes(n));
  const todosNombres = [
    ...prioridades.filter(n => Workbook.Sheets[n]),
    ...dinamicas,
    ...Workbook.SheetNames.filter(n => !prioridades.includes(n) && !dinamicas.includes(n))
  ];

  for (const nombreHoja of todosNombres) {
    const ws = Workbook.Sheets[nombreHoja];
    if (!ws) continue;
    const rawMatrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    for (let r = 0; r < Math.min(15, rawMatrix.length); r++) {
      const fila = (rawMatrix[r] || []).map(c => String(c).trim().toUpperCase());
      const hasDoc = fila.some(c =>
        c.includes("DOCUMENTO") ||
        c.includes("IDENTIFICACI") ||
        c.includes("NUMDOC") ||
        c.includes("DCTO") ||
        c.includes("CEDULA") ||
        c.includes("CÉDULA")
      );
      const hasNombre = fila.some(c =>
        c.includes("NOMBRE") ||
        c.includes("SIMBRES") ||
        c.includes("APRENDIZ") ||
        c.includes("APELLIDO")
      );

      if (hasDoc && hasNombre) {
        const Filas = XLSX.utils.sheet_to_json(ws, { range: r, defval: "" });
        if (Filas.length > 0) {
          return { hoja: ws, nombreHoja, filaEncabezados: r, Filas };
        }
      }
    }
  }

  const primerNombre = Workbook.SheetNames[0];
  const ws = Workbook.Sheets[primerNombre];
  const Filas = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return { hoja: ws, nombreHoja: primerNombre, filaEncabezados: 0, Filas };
}

/*
  descargarPlantilla  (Paso A)
  Genera un libro Excel con la plantilla oficial de Foodsys y la plantilla SENA compatible.
*/
export const descargarPlantilla = (_req, res) => {
  try {
    const Libro = XLSX.utils.book_new();

    // Hoja 1: Plantilla Institucional Foodsys (Limpia y con ejemplos)
    const filasFoodsys = [
      [
        "Tipo de Documento", "Documento", "Nombres", "Apellidos", "Ficha",
        "Centro de Convivencia", "Correo Electrónico", "Teléfono", "Género", "Rol", "Estado"
      ],
      [
        "CC", "1006129136", "ABNER GIULIANI", "DURAN SAENZ", "3404817",
        "No", "abner.duran@soy.sena.edu.co", "3107979024", "M", "Aprendiz Externo", "En Formacion"
      ],
      [
        "TI", "1111337529", "FAIDER FABIAN", "ESCARPETA NIETO", "3404814",
        "Si", "faiderescarpeta77@gmail.com", "3132026563", "M", "Aprendiz Interno", "En Formacion"
      ]
    ];
    const Hoja1 = XLSX.utils.aoa_to_sheet(filasFoodsys);
    Hoja1["!cols"] = [
      { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 14 },
      { wch: 22 }, { wch: 32 }, { wch: 16 }, { wch: 10 }, { wch: 20 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(Libro, Hoja1, "Plantilla_Aprendices");

    // Hoja 2: Ejemplo estructura Base_Datos_IQR SENA
    const filasBaseSENA = [
      [
        "Rol", "Tipo de Documento", "Documento", "SImbres", "Apellidos", "Ficha",
        "Programa de Formación", "CORREO ELECTRÓNICO ", "TELÉFOSI DE CONTACTO",
        "CENTRO DE CONVIVENCIA", "ESTADO"
      ],
      [
        "Aprendiz", "CC", "1006129136", "ABNER GIULIANI", "DURAN SAENZ", "3404817",
        "GESTION DE EMPRESAS AGROPECUARIAS", "yuranyt320@gmail.com", "3107979024",
        "NO", "EN FORMACIÓN"
      ]
    ];
    const Hoja2 = XLSX.utils.aoa_to_sheet(filasBaseSENA);
    Hoja2["!cols"] = filasBaseSENA[0].map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(Libro, Hoja2, "Ejemplo_Base_SENA");

    const Buffer = XLSX.write(Libro, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Plantilla_Aprendices_Foodsys_SENA.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(Buffer);
  } catch (error) {
    res.status(500).json({ message: "Error al generar la plantilla de aprendices." });
  }
};

/*
  previewImport  (Paso B)
  Detecta la hoja y las columnas automáticamente, soportando Base_NO MODIFICAR, Hoja1, etc.
  Garantiza por regla de negocio que todo aprendiz importado tenga Est_Usuario = "En Formacion".
*/
export const previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Archivo requerido" });
    }

    const { soloActivos = "true" } = req.query;
    const filtrarSoloActivos = soloActivos === "true" || soloActivos === true;

    const Workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const { Filas, nombreHoja } = detectarHojaAprendices(Workbook);

    if (!Filas || !Filas.length) {
      return res.status(400).json({ message: "El archivo esta vacio o no se detectaron filas de aprendices." });
    }

    // Precargar fichas y programas en memoria de forma independiente y segura
    const todasLasFichas = await FichasModel.findAll({ attributes: ["Id_Ficha", "Num_Ficha", "Id_Programa", "FecFinLec_Ficha"] });
    const todosProgramas = await ProgramaModel.findAll({ attributes: ["Id_Programa", "Nom_Programa"] });
    const mapaProgramas = new Map(todosProgramas.map(p => [p.Id_Programa, p.Nom_Programa]));

    const mapaFichas = new Map();
    for (const f of todasLasFichas) {
      const nomProg = mapaProgramas.get(f.Id_Programa) || "Por asociar";
      const fichaObj = {
        Id_Ficha: f.Id_Ficha,
        Num_Ficha: f.Num_Ficha,
        Id_Programa: f.Id_Programa,
        Nom_Programa: nomProg,
        FecFinLec_Ficha: f.FecFinLec_Ficha
      };
      mapaFichas.set(String(f.Num_Ficha).trim(), fichaObj);
      mapaFichas.set(String(f.Id_Ficha).trim(), fichaObj);
    }

    // Procesar y normalizar cada fila
    const Datos = [];
    let omitidosInactivos = 0;

    for (const Fila of Filas) {
      // Extraccion limpia de documento previniendo notacion cientifica
      const numDocRaw = extractExcelField(
        Fila,
        [
          "NUM. DCTO.", "NUM. DCTO", "NUMERO DCTO", "NÚMERO DCTO", "NÚMERO DCTO.",
          "DOCUMENTO", "NUMDOC_USUARIO", "NUM_DOC", "NÚMERO DE DOCUMENTO", "NUMERO DE DOCUMENTO",
          "NÚMERO DE IDENTIFICACIÓN APRENDIZ", "NUMERO DE IDENTIFICACION APRENDIZ",
          "NÚMERO DE IDENTIFICACIÓN", "CEDULA", "CÉDULA", "CÉDULA DEL APRENDIZ", "IDENTIFICACION"
        ],
        ["NUM. DCTO", "NUM DCTO", "DOCUMENTO", "IDENTIFICACI", "CEDULA"]
      );

      let numDoc = "";
      if (typeof numDocRaw === "number") {
        numDoc = Math.round(numDocRaw).toString();
      } else {
        let s = String(numDocRaw || "").trim();
        if (/[eE]/.test(s) && !isNaN(Number(s))) {
          s = Math.round(Number(s)).toString();
        }
        numDoc = s.split(".")[0].replace(/\D/g, "");
      }
      if (!numDoc) continue;

      // Estado del aprendiz en la base original
      const estadoRaw = extractExcelField(
        Fila,
        ["ESTADO", "ESTADO APRENDIZ", "ESTADO DEL APRENDIZ", "EST_USUARIO"]
      ).toUpperCase().trim();

      if (filtrarSoloActivos && estadoRaw) {
        const esInactivo = /CANCELADO|RETIRO|CERTIFICADO|APLAZADO|TRASLADADO/i.test(estadoRaw);
        if (esInactivo) {
          omitidosInactivos++;
          continue;
        }
      }

      const tipDoc = extractExcelField(
        Fila,
        [
          "T. DCTO.", "T_ DCTO.", "T. DCTO", "T_ DCTO", "TIPO DE DOCUMENTO",
          "TIPDOC_USUARIO", "TIPO DOCUMENTO", "TIPO DE IDENTIFICACIÓN APRENDIZ",
          "TIPO DE IDENTIFICACIÓN", "TIPO", "T. DOC"
        ]
      ) || "CC";

      let nombres = extractExcelField(Fila, ["NOM_USUARIO", "SIMBRES", "NOMBRES", "NOMBRE"]);
      let apellidos = extractExcelField(Fila, ["APE_USUARIO", "APELLIDOS", "APELLIDO", "PRIMER APELLIDO"]);
      if (!nombres) {
        const nombreCompleto = extractExcelField(
          Fila,
          ["NOMBRE Y APELLIDOS DEL APRENDIZ", "NOMBRE Y APELLIDOS", "NOMBRE COMPLETO", "SIMBRE COMPLETO", "APRENDIZ"]
        );
        if (nombreCompleto) {
          const partes = nombreCompleto.trim().split(/\s+/);
          nombres = partes.slice(0, Math.ceil(partes.length / 2)).join(" ");
          apellidos = partes.slice(Math.ceil(partes.length / 2)).join(" ");
        }
      }

      const numFichaRaw = extractExcelField(
        Fila,
        [
          "NUM_FICHA", "FICHA", "NO. DE FICHA", "NUMERO DE FICHA", "NÚMERO DE FICHA",
          "NÚMERO DE GRUPO", "NUMERO DE GRUPO", "ID_FICHA", "IDENTIFICADOR_FICHA",
          "FICHA DE CARACTERIZACIÓN", "FICHA DE CARACTERIZACION"
        ]
      );
      const fichaEncontrada = mapaFichas.get(String(numFichaRaw).trim());

      const nomProgExtraido = extractExcelField(
        Fila,
        [
          "PROGRAMA FORMACIÓN", "PROGRAMA FORMACION", "PROGRAMA DE FORMACIÓN",
          "PROGRAMA DE FORMACION", "PROGRAMA", "NOMBRE_PROGRAMA_FORMACION", "NOMBRE DEL PROGRAMA"
        ]
      );

      const corRaw = extractExcelField(
        Fila,
        ["COR_USUARIO", "CORREO ELECTRÓNICO ", "CORREO ELECTRÓNICO", "CORREO ELECTRONICO", "CORREO ELECTRÓNICO DEL APRENDIZ ", "CORREO ELECTRÓNICO DEL APRENDIZ", "EMAIL", "CORREO"]
      );

      const telRawVal = extractExcelField(
        Fila,
        ["TEL_USUARIO", "TELÉFOSI DE CONTACTO", "TELEFOSI DE CONTACTO", "TELEFONO DE CONTACTO", "TELÉFONO DE CONTACTO DEL APRENDIZ ", "TELÉFONO DE CONTACTO DEL APRENDIZ", "TELEFONO", "CELULAR", "MÓVIL", "MOVIL"]
      );
      let telFinal = "";
      if (typeof telRawVal === "number") {
        telFinal = Math.round(telRawVal).toString();
      } else if (telRawVal) {
        let st = String(telRawVal).trim();
        if (/[eE]/.test(st) && !isNaN(Number(st))) {
          st = Math.round(Number(st)).toString();
        }
        telFinal = st.split(".")[0].replace(/\D/g, "");
      }

      const genRaw = extractExcelField(Fila, ["GEN_USUARIO", "GENERO", "GÉNERO", "SEXO"]);

      // Centro de convivencia (Alojamientos, cabanas, Internos)
      const cenConRaw = extractExcelField(
        Fila,
        ["CENTRO DE CONVIVENCIA", "CENCON_USUARIO", "ALOJAMIENTO Y/O CABAÑA", "CABAÑA", "ALOJAMIENTO"]
      );
      const esInterno = /si|sí|cabaña|alojamiento|interno|1|true/i.test(cenConRaw) && !/no|ninguno/i.test(cenConRaw);

      const rolRaw = extractExcelField(Fila, ["ROL", "TIP_USUARIO", "ROL_USUARIO", "ROL_ASIGNADO"]).toLowerCase();
      const esPasante = rolRaw.includes("pasante");
      const rolAsignado = esPasante
        ? (esInterno ? "Pasante Interno" : "Pasante Externo")
        : (esInterno ? "Aprendiz Interno" : "Aprendiz Externo");

      // REGLA OBLIGATORIA: Nombres y apellidos siempre en MAYUSCULAS
      const nombresMayus = (nombres || "SIN NOMBRE").trim().toUpperCase();
      const apellidosMayus = (apellidos || "").trim().toUpperCase();

      // REGLA OBLIGATORIA: Validar si la ficha existe previamente en la base de datos
      const numFichaLimpio = String(numFichaRaw || "").trim().replace(/\D/g, "");
      const fichaEncontrada = numFichaLimpio ? (mapaFichas.get(numFichaLimpio) || mapaFichas.get(String(parseInt(numFichaLimpio, 10)))) : null;
      const tieneFichaValida = Boolean(fichaEncontrada && fichaEncontrada.Id_Ficha);

      // REGLA OBLIGATORIA: Todo aprendiz importado por Excel tiene estado "En Formacion"
      const estUsuario = "En Formacion";

      Datos.push({
        TipDoc_Usuario: tipDoc,
        NumDoc_Usuario: numDoc,
        Nom_Usuario: nombresMayus,
        Ape_Usuario: apellidosMayus,
        Cor_Usuario: corRaw || null,
        Tel_Usuario: telFinal || null,
        Gen_Usuario: genRaw ? (genRaw.toUpperCase().startsWith("M") ? "Masculino" : "Femenino") : "No especificado",
        CenCon_Usuario: esInterno ? "Si" : "No",
        Num_Ficha: tieneFichaValida ? fichaEncontrada.Num_Ficha : (numFichaLimpio || "Sin ficha"),
        Id_Ficha: tieneFichaValida ? fichaEncontrada.Id_Ficha : null,
        Nom_Programa: tieneFichaValida
          ? String(fichaEncontrada.Nom_Programa || "").toUpperCase()
          : (nomProgExtraido ? String(nomProgExtraido).trim().toUpperCase() : "SIN PROGRAMA ASIGNADO"),
        fichaValida: tieneFichaValida,
        errorFicha: tieneFichaValida
          ? null
          : (numFichaLimpio
              ? `La ficha #${numFichaLimpio} no está registrada en el sistema. Primero debe registrar o importar la ficha en el módulo de Fichas.`
              : "El aprendiz no tiene número de ficha asignado. No se puede subir sin ficha."),
        Rol_Asignado: rolAsignado,
        Est_Usuario: estUsuario,
        Estado_Etapa_Lectiva: "Vigente"
      });
    }

    const aprendicesValidos = Datos.filter(d => d.fichaValida);
    const aprendicesSinFicha = Datos.filter(d => !d.fichaValida);

    return res.status(200).json({
      total: Datos.length,
      hojaDetectada: nombreHoja,
      validosConFicha: aprendicesValidos.length,
      invalidosSinFicha: aprendicesSinFicha.length,
      omitidosInactivos,
      data: Datos
    });
  } catch (error) {
    console.error("Error en previewImport:", error);
    return res.status(500).json({ message: "Error al leer el archivo. Verifica el formato de aprendices." });
  }
};

/*
  importarSeleccionados  (Paso C)
  Recibe el array de usuarios aprobados, resuelve fichas,
  asigna roles en usuarios_rol y desactiva aprendices con fichas vencidas.
  Optimizado para procesar lotes masivos en segundos mediante Sets en memoria y chunks paralelos.
*/
export const importarSeleccionados = async (req, res) => {
  try {
    const { usuarios } = req.body;

    if (!usuarios?.length) {
      return res.status(400).json({ message: "No hay datos seleccionados" });
    }

    // 1. Precargar roles en memoria
    const rolesDisponibles = await RolesModel.findAll();
    const mapaRoles = new Map();
    for (const r of rolesDisponibles) {
      mapaRoles.set(r.Nom_Rol.trim().toLowerCase(), r.Id_Rol);
    }

    // 2. Precargar todos los programas en memoria
    const todosProgramas = await ProgramaModel.findAll();
    const mapaProgramasPorId = new Map();
    const mapaProgramasPorNombre = new Map();
    todosProgramas.forEach(p => {
      mapaProgramasPorId.set(p.Id_Programa, p);
      mapaProgramasPorNombre.set(normalizarNombrePrograma(p.Nom_Programa), p);
    });

    // 3. Precargar fichas en memoria
    const todasLasFichas = await FichasModel.findAll();
    const mapaFichas = new Map();
    for (const f of todasLasFichas) {
      mapaFichas.set(String(f.Num_Ficha).trim(), f);
      mapaFichas.set(String(f.Id_Ficha).trim(), f);
    }

    // 4. Precargar usuarios existentes en Map (para O(1) deduplicacion y auto-actualizacion)
    const usuariosExistentes = await UsuariosModel.findAll({
      attributes: ["Id_Usuario", "NumDoc_Usuario", "Cor_Usuario", "Id_Ficha", "Gen_Usuario"]
    });
    const mapaUsuariosDoc = new Map(usuariosExistentes.map(u => [String(u.NumDoc_Usuario).trim(), u]));
    const setDocsEnLote = new Set();
    const setCors = new Set(
      usuariosExistentes
        .filter(u => u.Cor_Usuario)
        .map(u => String(u.Cor_Usuario).toLowerCase().trim())
    );

    let Creados = 0;
    let Actualizados = 0;
    let Omitidos = 0;
    // Procesar en chunks concurrentes de 25 para maximo rendimiento y evitar timeouts HTTP
    const CHUNK_SIZE = 25;
    for (let i = 0; i < usuarios.length; i += CHUNK_SIZE) {
      const lote = usuarios.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        lote.map(async (Fila) => {
          try {
            if (!Fila.NumDoc_Usuario || !Fila.Nom_Usuario) {
              Omitidos++;
              Errores.push(`Fila omitida: falta Documento o Nombre (doc: "${Fila.NumDoc_Usuario || '?'}")`);
              return;
            }

            const numDocStr = String(Fila.NumDoc_Usuario).trim();
            const nomUsuarioFinal = String(Fila.Nom_Usuario).trim().toUpperCase();
            const apeUsuarioFinal = Fila.Ape_Usuario ? String(Fila.Ape_Usuario).trim().toUpperCase() : "";

            // REGLA OBLIGATORIA: La ficha DEBE existir previamente en el sistema. Si no existe, NO SE PERMITE SUBIR.
            const numFichaBuscada = String(Fila.Num_Ficha || Fila.Id_Ficha || "").trim().replace(/\D/g, "");
            const fichaAsociada = numFichaBuscada
              ? (mapaFichas.get(numFichaBuscada) || mapaFichas.get(String(parseInt(numFichaBuscada, 10))))
              : null;

            if (!fichaAsociada || !fichaAsociada.Id_Ficha) {
              Omitidos++;
              Errores.push(`Aprendiz ${numDocStr} (${nomUsuarioFinal} ${apeUsuarioFinal}) rechazado: La ficha #${numFichaBuscada || 'No especificada'} no existe en el sistema. Primero debe registrar o importar la ficha.`);
              return;
            }

            const idFichaFinal = fichaAsociada.Id_Ficha;

            // Determinar rol segun CenCon_Usuario
            const cenConStr = String(Fila.CenCon_Usuario || "").toLowerCase().trim();
            const esInterno = ["si", "sí", "1", "true"].includes(cenConStr);
            const rolRaw = String(Fila.Rol_Asignado || Fila.Rol || "").toLowerCase();
            const esPasante = rolRaw.includes("pasante");

            let nombreRolAsignar = "Aprendiz Externo";
            if (esPasante) {
              nombreRolAsignar = esInterno ? "Pasante Interno" : "Pasante Externo";
            } else {
              nombreRolAsignar = esInterno ? "Aprendiz Interno" : "Aprendiz Externo";
            }

            const idRolFinal = mapaRoles.get(nombreRolAsignar.toLowerCase());

            // 2. Comprobar si el usuario ya existe en BD
            if (mapaUsuariosDoc.has(numDocStr)) {
              const usuarioEx = mapaUsuariosDoc.get(numDocStr);
              // Si existia pero no tenia ficha asignada o era diferente, actualizarlo con su ficha legitima
              if (!usuarioEx.Id_Ficha || usuarioEx.Id_Ficha !== idFichaFinal) {
                await UsuariosModel.update({
                  Id_Ficha: idFichaFinal,
                  Nom_Usuario: nomUsuarioFinal,
                  Ape_Usuario: apeUsuarioFinal,
                  Gen_Usuario: (usuarioEx.Gen_Usuario && usuarioEx.Gen_Usuario !== "No especificado")
                    ? usuarioEx.Gen_Usuario
                    : (Fila.Gen_Usuario || "No especificado"),
                  CenCon_Usuario: esInterno ? "Si" : "No",
                  Est_Usuario: "En Formacion"
                }, { where: { Id_Usuario: usuarioEx.Id_Usuario } });
                usuarioEx.Id_Ficha = idFichaFinal;
                Actualizados++;
              } else {
                Omitidos++;
                Errores.push(`Documento ${numDocStr} ya existe en el sistema.`);
              }
              return;
            }

            // Deduplicacion dentro del mismo archivo
            if (setDocsEnLote.has(numDocStr)) {
              Omitidos++;
              return;
            }
            setDocsEnLote.add(numDocStr);

            // Correo electronico con manejo seguro de duplicados
            let corStr = Fila.Cor_Usuario ? String(Fila.Cor_Usuario).trim().toLowerCase() : null;
            if (corStr && setCors.has(corStr)) {
              corStr = null; // No bloquear el registro si el correo se repite
            }
            if (corStr) setCors.add(corStr);

            // Hash seguro y rapido con 8 rondas
            const HashPwd = await bcrypt.hash(numDocStr, 8);

            const nuevoUsuario = await UsuariosModel.create({
              TipDoc_Usuario: Fila.TipDoc_Usuario || "CC",
              NumDoc_Usuario: numDocStr,
              Nom_Usuario: nomUsuarioFinal,
              Ape_Usuario: apeUsuarioFinal,
              Gen_Usuario: Fila.Gen_Usuario && String(Fila.Gen_Usuario).trim() !== "" ? String(Fila.Gen_Usuario).trim() : "No especificado",
              Cor_Usuario: corStr,
              Tel_Usuario: Fila.Tel_Usuario ? String(Fila.Tel_Usuario).trim() : null,
              CenCon_Usuario: esInterno ? "Si" : "No",
              Id_Ficha: idFichaFinal,
              Est_Usuario: "En Formacion",
              San_Usuario: Fila.San_Usuario || "No",
              Pol_Usuario: "No",
              password: HashPwd,
              uuid: uuidv4(),
              createdat: new Date(),
              updatedat: new Date(),
            });

            if (idRolFinal) {
              await UsuariosRolModel.create({
                Id_Usuario: nuevoUsuario.Id_Usuario,
                Id_Rol: idRolFinal
              });
            }

            mapaUsuariosDoc.set(numDocStr, nuevoUsuario);
            Creados++;
          } catch (errUser) {
            Omitidos++;
            Errores.push(`Error al registrar documento ${Fila.NumDoc_Usuario || '?'}: ${errUser.message}`);
          }
        })
      );
    }

    return res.status(200).json({
      creados: Creados,
      actualizados: Actualizados,
      omitidos: Omitidos,
      errores: Errores,
      mensaje: `Proceso completado: ${Creados} aprendices registrados, ${Actualizados} actualizados con ficha/programa, ${Omitidos} omitidos.`
    });
  } catch (error) {
    console.error("Error en importarSeleccionados:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GESTION DE SANCIONES
// El Coordinador y Bienestar pueden activar o desactivar
// la sancion de un aprendiz cambiando San_Usuario ('Si'/'No').
// Un usuario sancionado no puede realizar reservas.
// ─────────────────────────────────────────────────────────────

/*
  ActualizarSancion
  Cambia el campo San_Usuario del usuario indicado.
  Body esperado: { San_Usuario: "Si" | "No" }
  Solo los roles Coordinador, Bienestar y Administrador pueden acceder
  (validado por el middleware en la ruta).
*/
export const ActualizarSancion = async (req, res) => {
  try {
    const { Id } = req.params;
    const { San_Usuario } = req.body;

    if (!['Si', 'No'].includes(San_Usuario)) {
      return res.status(400).json({
        message: 'Valor invalido para San_Usuario. Use "Si" o "No".'
      });
    }

    const usuario = await UsuariosModel.findByPk(Id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const camposActualizar = { San_Usuario };
    if (San_Usuario === 'No') {
      camposActualizar.Fec_Desancion = new Date();
    }

    await usuario.update(camposActualizar);

    return res.status(200).json({
      message: `Sancion ${San_Usuario === 'Si' ? 'activada' : 'eliminada'} correctamente`,
      Id_Usuario: usuario.Id_Usuario,
      Nom_Usuario: usuario.Nom_Usuario,
      Ape_Usuario: usuario.Ape_Usuario,
      San_Usuario: usuario.San_Usuario
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
  GetSancionados
  Retorna la lista de todos los usuarios con San_Usuario = 'Si'.
  Util para que el Coordinador y Bienestar vean rapidamente
  quienes estan sancionados sin tener que buscar en la tabla completa.
*/
export const GetSancionados = async (req, res) => {
  try {
    const sancionados = await UsuariosModel.findAll({
      where: { San_Usuario: 'Si' },
      attributes: [
        'Id_Usuario', 'Nom_Usuario', 'Ape_Usuario',
        'NumDoc_Usuario', 'Tel_Usuario', 'Est_Usuario', 'San_Usuario'
      ],
      order: [['Ape_Usuario', 'ASC']]
    });
    return res.status(200).json(sancionados);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};