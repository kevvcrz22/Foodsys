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

/*
  descargarPlantilla  (Paso A)
  Genera un libro Excel vacio con los encabezados definidos en
  COLUMNAS_PLANTILLA y lo envia como archivo descargable.
  El administrador llena esta plantilla y la sube en el Paso B.
*/
export const descargarPlantilla = (_req, res) => {
  try {
    const Libro = XLSX.utils.book_new();
    const Hoja = XLSX.utils.aoa_to_sheet([COLUMNAS_PLANTILLA]);
    // Ancho uniforme de 22 caracteres por columna para mejor lectura
    Hoja["!cols"] = COLUMNAS_PLANTILLA.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(Libro, Hoja, "Aprendices");

    const Buffer = XLSX.write(Libro, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="plantilla_aprendices.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(Buffer);
  } catch (error) {
    res.status(500).json({ message: "Error al generar la plantilla." });
  }
};

/*
  previewImport  (Paso B)
  Paso 1: multer (memoryStorage) entrega el archivo en req.file.buffer;
          nunca se escribe en disco, mejora seguridad y rendimiento.
  Paso 2: XLSX.read parsea el buffer directamente en memoria.
  Paso 3: sheet_to_json convierte cada fila en un objeto JS
          usando los encabezados como claves.
  Paso 4: Se limpian espacios en los nombres de columna para evitar
          errores silenciosos por espacios invisibles.
  Paso 5: Se devuelve el total de filas y el array de datos para
          que el frontend muestre la tabla de previsualizacion.
  No se escribe nada en la base de datos en este paso.
*/
export const previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Archivo requerido" });
    }

    const Workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const Hoja = Workbook.Sheets[Workbook.SheetNames[0]];
    const Filas = XLSX.utils.sheet_to_json(Hoja, { defval: "" });

    if (!Filas.length) {
      return res.status(400).json({ message: "El archivo esta vacio o no tiene datos." });
    }

    // Precargar todas las fichas en memoria con sus programas asociados
    const todasLasFichas = await FichasModel.findAll({
      include: [{ model: ProgramaModel, as: "programas", attributes: ["Nom_Programa"] }]
    });

    const mapaFichas = new Map();
    for (const f of todasLasFichas) {
      mapaFichas.set(String(f.Num_Ficha).trim(), f);
      mapaFichas.set(String(f.Id_Ficha).trim(), f);
    }

    const hoyBogota = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

    // Normalizar claves y enriquecer datos con Ficha y Programa
    const Datos = Filas.map((Fila) => {
      const normalizado = Object.fromEntries(
        Object.entries(Fila).map(([K, V]) => [K.trim(), V])
      );

      const numFichaRaw = String(normalizado.Num_Ficha || normalizado.Id_Ficha || normalizado.IDENTIFICADOR_FICHA || "").trim();
      const fichaEncontrada = mapaFichas.get(numFichaRaw);

      normalizado.Num_Ficha = fichaEncontrada ? fichaEncontrada.Num_Ficha : numFichaRaw;
      normalizado.Id_Ficha = fichaEncontrada ? fichaEncontrada.Id_Ficha : null;
      normalizado.Nom_Programa = fichaEncontrada?.programas?.Nom_Programa || "Por asociar";

      // Validar si la ficha ya vencio su etapa lectiva
      if (fichaEncontrada?.FecFinLec_Ficha && fichaEncontrada.FecFinLec_Ficha < hoyBogota) {
        normalizado.Est_Usuario = "Inactivo";
        normalizado.Estado_Etapa_Lectiva = "Vencida";
      } else {
        const estRaw = String(normalizado.Est_Usuario || "").toLowerCase().trim();
        normalizado.Est_Usuario = ["no", "inactivo"].includes(estRaw) ? "Inactivo" : "En Formacion";
        normalizado.Estado_Etapa_Lectiva = "Vigente";
      }

      // Evaluar rol segun Centro de Convivencia (CenCon_Usuario)
      const cenCon = String(normalizado.CenCon_Usuario || "").toLowerCase().trim();
      const esInterno = ["si", "sí", "1", "true"].includes(cenCon);
      const rolRaw = String(normalizado.Rol || normalizado.Tip_Usuario || normalizado.Rol_Usuario || "").toLowerCase();
      const esPasante = rolRaw.includes("pasante");

      if (esPasante) {
        normalizado.Rol_Asignado = esInterno ? "Pasante Interno" : "Pasante Externo";
      } else {
        normalizado.Rol_Asignado = esInterno ? "Aprendiz Interno" : "Aprendiz Externo";
      }

      return normalizado;
    });

    return res.status(200).json({ total: Datos.length, data: Datos });
  } catch (error) {
    console.error("Error en previewImport:", error);
    return res.status(500).json({ message: "Error al leer el archivo. Verifica que uses la plantilla oficial." });
  }
};

/*
  importarSeleccionados  (Paso C)
  Recibe el array de usuarios aprobados, resuelve fichas,
  asigna roles en usuarios_rol y desactiva aprendices con fichas vencidas.
*/
export const importarSeleccionados = async (req, res) => {
  try {
    const { usuarios } = req.body;

    if (!usuarios?.length) {
      return res.status(400).json({ message: "No hay datos seleccionados" });
    }

    // Precargar todos los roles en un mapa en memoria
    const rolesDisponibles = await RolesModel.findAll();
    const mapaRoles = new Map();
    for (const r of rolesDisponibles) {
      mapaRoles.set(r.Nom_Rol.trim().toLowerCase(), r.Id_Rol);
    }

    // Precargar todas las fichas en un mapa en memoria
    const todasLasFichas = await FichasModel.findAll();
    const mapaFichas = new Map();
    for (const f of todasLasFichas) {
      mapaFichas.set(String(f.Num_Ficha).trim(), f);
      mapaFichas.set(String(f.Id_Ficha).trim(), f);
    }

    const hoyBogota = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

    let Creados = 0;
    let Omitidos = 0;
    const Errores = [];

    for (const Fila of usuarios) {
      if (!Fila.NumDoc_Usuario || !Fila.Nom_Usuario) {
        Omitidos++;
        Errores.push(`Fila omitida: falta NumDoc_Usuario o Nom_Usuario (doc: "${Fila.NumDoc_Usuario || "?"}")`);
        continue;
      }

      const numDocStr = String(Fila.NumDoc_Usuario).trim();

      // Duplicado por documento
      const ExisteDoc = await UsuariosModel.findOne({ where: { NumDoc_Usuario: numDocStr } });
      if (ExisteDoc) {
        Omitidos++;
        Errores.push(`Documento ${numDocStr} ya existe en el sistema.`);
        continue;
      }

      // Duplicado por correo (si viene informado)
      if (Fila.Cor_Usuario && String(Fila.Cor_Usuario).trim()) {
        const corStr = String(Fila.Cor_Usuario).trim();
        const ExisteCorreo = await UsuariosModel.findOne({ where: { Cor_Usuario: corStr } });
        if (ExisteCorreo) {
          Omitidos++;
          Errores.push(`Correo ${corStr} ya esta registrado (doc: ${numDocStr}).`);
          continue;
        }
      }

      // Resolver Ficha
      let idFichaFinal = null;
      let fichaAsociada = null;
      const numFichaBuscada = String(Fila.Num_Ficha || Fila.Id_Ficha || Fila.IDENTIFICADOR_FICHA || "").trim();

      if (numFichaBuscada) {
        fichaAsociada = mapaFichas.get(numFichaBuscada);
        if (!fichaAsociada && /^\d+$/.test(numFichaBuscada)) {
          // Si no existe pero es un numero valido, crear la ficha automaticamente para no rechazar al aprendiz
          fichaAsociada = await FichasModel.create({
            Num_Ficha: numFichaBuscada,
            Est_Ficha: "Activo"
          });
          mapaFichas.set(numFichaBuscada, fichaAsociada);
        }
        if (fichaAsociada) {
          idFichaFinal = fichaAsociada.Id_Ficha;
        }
      }

      // Verificar vencimiento de etapa lectiva
      let estUsuarioFinal = Fila.Est_Usuario || "En Formacion";
      if (fichaAsociada?.FecFinLec_Ficha && fichaAsociada.FecFinLec_Ficha < hoyBogota) {
        estUsuarioFinal = "Inactivo";
      }

      // Determinar rol segun CenCon_Usuario
      const cenConStr = String(Fila.CenCon_Usuario || "").toLowerCase().trim();
      const esInterno = ["si", "sí", "1", "true"].includes(cenConStr);
      const rolRaw = String(Fila.Rol_Asignado || Fila.Rol || Fila.Tip_Usuario || "").toLowerCase();
      const esPasante = rolRaw.includes("pasante");

      let nombreRolAsignar = "Aprendiz Externo";
      if (esPasante) {
        nombreRolAsignar = esInterno ? "Pasante Interno" : "Pasante Externo";
      } else {
        nombreRolAsignar = esInterno ? "Aprendiz Interno" : "Aprendiz Externo";
      }

      const idRolFinal = mapaRoles.get(nombreRolAsignar.toLowerCase());

      const HashPwd = await bcrypt.hash(numDocStr, 10);

      const nuevoUsuario = await UsuariosModel.create({
        TipDoc_Usuario: Fila.TipDoc_Usuario || "CC",
        NumDoc_Usuario: numDocStr,
        Nom_Usuario: String(Fila.Nom_Usuario).trim(),
        Ape_Usuario: Fila.Ape_Usuario ? String(Fila.Ape_Usuario).trim() : null,
        Gen_Usuario: Fila.Gen_Usuario || null,
        Cor_Usuario: Fila.Cor_Usuario ? String(Fila.Cor_Usuario).trim() : null,
        Tel_Usuario: Fila.Tel_Usuario ? String(Fila.Tel_Usuario).trim() : null,
        CenCon_Usuario: esInterno ? "Si" : "No",
        Id_Ficha: idFichaFinal,
        Est_Usuario: estUsuarioFinal,
        San_Usuario: Fila.San_Usuario || "No",
        Pol_Usuario: "No",
        password: HashPwd,
        uuid: uuidv4(),
        createdat: new Date(),
        updatedat: new Date(),
      });

      // Asignar rol en usuarios_rol
      if (idRolFinal) {
        await UsuariosRolModel.create({
          Id_Usuario: nuevoUsuario.Id_Usuario,
          Id_Rol: idRolFinal
        });
      }

      // Si la ficha ya vencio, sincronizar para cancelar cualquier reserva previa
      if (idFichaFinal && estUsuarioFinal === "Inactivo") {
        await sincronizarEstadoAprendices(idFichaFinal);
      }

      Creados++;
    }

    res.json({ creados: Creados, omitidos: Omitidos, errores: Errores });
  } catch (error) {
    console.error("Error en importarSeleccionados:", error);
    res.status(500).json({ message: error.message });
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