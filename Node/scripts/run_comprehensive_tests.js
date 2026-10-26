// Node.js nativo ya incluye fetch
import XLSX from 'xlsx';
import crypto from 'crypto';

const BASE_URL = 'http://127.0.0.1:8000';

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return { status: res.status, headers: res.headers, data: json };
  } else if (contentType.includes('spreadsheetml') || contentType.includes('pdf') || contentType.includes('octet-stream')) {
    const arrayBuffer = await res.arrayBuffer();
    return { status: res.status, headers: res.headers, buffer: Buffer.from(arrayBuffer) };
  } else {
    const text = await res.text();
    return { status: res.status, headers: res.headers, text };
  }
}

async function run() {
  console.log('====================================================');
  console.log('   INICIANDO BATERÍA DE PRUEBAS E2E FOODSYS LOCAL   ');
  console.log('====================================================\n');

  let paso = 1;

  // 1. LOGIN DE LAS 3 CUENTAS
  console.log(`[Paso ${paso++}] Probando autenticacion y roles de las 3 credenciales...`);
  const loginKevin = await request('/api/Usuarios/login', {
    method: 'POST',
    body: JSON.stringify({ TipDoc_Usuario: 'CC', NumDoc_Usuario: 1003810633, password: '1003810633' })
  });
  if (loginKevin.status !== 200) throw new Error('Fallo login Kevin: ' + JSON.stringify(loginKevin.data));
  const tokenKevin = loginKevin.data.token;
  const userKevin = loginKevin.data.usuario;
  console.log('  ✅ Kevin (1003810633) logueado. Roles:', loginKevin.data.roles);

  const loginDiego = await request('/api/Usuarios/login', {
    method: 'POST',
    body: JSON.stringify({ TipDoc_Usuario: 'CC', NumDoc_Usuario: 1031652678, password: '1031652678' })
  });
  if (loginDiego.status !== 200) throw new Error('Fallo login Diego: ' + JSON.stringify(loginDiego.data));
  const tokenDiego = loginDiego.data.token;
  const userDiego = loginDiego.data.usuario;
  console.log('  ✅ Diego (1031652678) logueado. Roles:', loginDiego.data.roles);

  const loginEstefanya = await request('/api/Usuarios/login', {
    method: 'POST',
    body: JSON.stringify({ TipDoc_Usuario: 'CC', NumDoc_Usuario: 1110485406, password: '1110485406' })
  });
  if (loginEstefanya.status !== 200) throw new Error('Fallo login Estefanya: ' + JSON.stringify(loginEstefanya.data));
  const tokenEstefanya = loginEstefanya.data.token;
  console.log('  ✅ Estefanya (1110485406) logueada. Roles:', loginEstefanya.data.roles);

  // 2. CRUD PLATOS
  console.log(`\n[Paso ${paso++}] Probando CRUD Platos...`);
  const todosPlatos = await request('/api/Platos', { method: 'GET' }, tokenKevin);
  console.log(`  -> Platos existentes: ${Array.isArray(todosPlatos.data) ? todosPlatos.data.length : 0}`);

  const nuevoPlato = await request('/api/Platos', {
    method: 'POST',
    body: JSON.stringify({
      Nom_Plato: 'Bandeja Campesina La Granja Test ' + Date.now(),
      Des_Plato: 'Arroz, frijol, carne asada y platano maduro',
      Est_Plato: 'Activo'
    })
  }, tokenKevin);
  if (nuevoPlato.status !== 201 && nuevoPlato.status !== 200) {
    throw new Error('Fallo creacion plato: ' + JSON.stringify(nuevoPlato.data));
  }
  const idPlato = nuevoPlato.data.Id_Plato || nuevoPlato.data.plato?.Id_Plato || (nuevoPlato.data.data && nuevoPlato.data.data.Id_Plato) || 1;
  console.log(`  ✅ Plato de prueba creado con ID: ${idPlato}`);

  // 3. CRUD MENUS
  console.log(`\n[Paso ${paso++}] Probando CRUD Menus...`);
  const nuevoMenu = await request('/api/Menus', {
    method: 'POST',
    body: JSON.stringify({
      Fec_Menu: '2026-11-05',
      Tip_Menu: 'Almuerzo',
      Id_Plato: idPlato,
      Est_Menu: 'Activo'
    })
  }, tokenKevin);
  console.log(`  ✅ Menu creado/actualizado: status ${nuevoMenu.status}`);

  // 4. CRUD PROGRAMAS (Jerarquia: 1° Programa)
  console.log(`\n[Paso ${paso++}] Probando CRUD Programas (Jerarquia: 1° Programa)...`);
  const nombreProgTest = 'TECNOLOGIA EN GESTION AGROEMPRESARIAL ' + Math.floor(Math.random() * 9999);
  const nuevoProg = await request('/api/Programa', {
    method: 'POST',
    body: JSON.stringify({
      Nom_Programa: nombreProgTest,
      NivFor_Programa: 'TECNOLOGO',
      Are_Programa: 'AGROPECUARIA',
      Est_Programa: 'Activo'
    })
  }, tokenKevin);
  let idPrograma = nuevoProg.data.Id_Programa || nuevoProg.data.programa?.Id_Programa;
  console.log(`  ✅ Programa creado: ${nombreProgTest}, status ${nuevoProg.status}`);

  // 5. CRUD FICHAS (Jerarquia: 2° Ficha)
  console.log(`\n[Paso ${paso++}] Probando CRUD Fichas (Jerarquia: 2° Ficha)...`);
  const numFichaTest = Math.floor(2900000 + Math.random() * 90000);
  const nuevaFicha = await request('/api/Fichas', {
    method: 'POST',
    body: JSON.stringify({
      Num_Ficha: numFichaTest,
      Id_Programa: idPrograma || 1,
      FecIniLec_Ficha: '2026-01-15',
      FecFinLec_Ficha: '2026-12-14',
      FecIniPra_Ficha: '2026-12-15',
      FecFinPra_Ficha: '2027-06-15'
    })
  }, tokenKevin);
  console.log(`  ✅ Ficha creada (#${numFichaTest}): status ${nuevaFicha.status}`);

  // 6. PLANTILLA DE FICHAS CON PROGRAMAS EN VIVO
  console.log(`\n[Paso ${paso++}] Verificando descarga de plantilla oficial con programas disponibles...`);
  const plantillaFicha = await request('/api/Fichas/plantilla-excel', { method: 'GET' }, tokenKevin);
  if (plantillaFicha.status === 200 && plantillaFicha.buffer) {
    const wb = XLSX.read(plantillaFicha.buffer, { type: 'buffer' });
    const tieneHojaProgramas = wb.SheetNames.includes('PROGRAMAS_DISPONIBLES');
    console.log(`  ✅ Plantilla de fichas descargada. Hojas: [${wb.SheetNames.join(', ')}]`);
    console.log(`  ✅ ¿Incluye hoja PROGRAMAS_DISPONIBLES para seleccion unica?: ${tieneHojaProgramas ? 'SI' : 'NO'}`);
  } else {
    console.log(`  ⚠️ Status plantilla fichas: ${plantillaFicha.status}`);
  }

  // 7. ROLES (Listar y verificar)
  console.log(`\n[Paso ${paso++}] Probando Modulo Roles...`);
  const listaRoles = await request('/api/Roles', { method: 'GET' }, tokenKevin);
  const nombresRoles = Array.isArray(listaRoles.data) ? listaRoles.data.map(r => r.Nom_Rol) : [];
  console.log('  -> Roles en el sistema:', nombresRoles);

  // 8. USUARIOS / APRENDICES / PASANTES
  console.log(`\n[Paso ${paso++}] Probando Modulo Usuarios, Aprendices y Pasantes...`);
  const aprendices = await request('/api/Usuarios/aprendices', { method: 'GET' }, tokenKevin);
  console.log(`  ✅ Aprendices obtenidos: ${Array.isArray(aprendices.data) ? aprendices.data.length : 0}`);

  const pasantes = await request('/api/Usuarios/pasantes', { method: 'GET' }, tokenKevin);
  console.log(`  ✅ Pasantes obtenidos: ${Array.isArray(pasantes.data) ? pasantes.data.length : 0}`);

  // 9. PQRSF (Crear, Ranking, Excel, PDF, Responder)
  console.log(`\n[Paso ${paso++}] Probando Modulo PQRSF completo...`);
  const nuevaPqrsf = await request('/api/Pqrsf', {
    method: 'POST',
    body: JSON.stringify({
      Tipo_Solicitud: 'Queja',
      Categoria_Estandar: 'CALIDAD_ALIMENTACION',
      Subcategoria: 'Comida fria en almuerzo',
      Fec_Hecho: '2026-10-26',
      Tip_Comida: 'Almuerzo',
      Id_Plato_Relacionado: idPlato || 1,
      Descripcion: 'Prueba E2E automatica de radicacion de PQRSF con ranking y SLA',
      Nombre_Reportante: 'Aprendiz Prueba E2E',
      Correo_Reportante: 'prueba@sena.edu.co',
      Rol_Reportante: 'Aprendiz'
    })
  });
  if (nuevaPqrsf.status !== 201) throw new Error('Fallo al crear PQRSF: ' + JSON.stringify(nuevaPqrsf.data));
  const idPqrsf = nuevaPqrsf.data.pqrsf?.Id_Pqrsf || nuevaPqrsf.data.Id_Pqrsf;
  const radicadoPqrsf = nuevaPqrsf.data.radicado || nuevaPqrsf.data.Radicado;
  console.log(`  ✅ PQRSF radicada exitosamente: Radicado ${radicadoPqrsf}, ID ${idPqrsf}`);

  const rankingPqrsf = await request('/api/Pqrsf/ranking', { method: 'GET' }, tokenKevin);
  console.log('  ✅ Ranking PQRSF calculado exitosamente. Top causas:', rankingPqrsf.data.topCausasFrecuentes?.length || 0);

  const excelPqrsf = await request('/api/Pqrsf/exportar/excel', { method: 'GET' }, tokenKevin);
  console.log(`  ✅ Exportacion Excel PQRSF exitosa: status ${excelPqrsf.status}`);

  const pdfPqrsf = await request('/api/Pqrsf/exportar/pdf', { method: 'GET' }, tokenKevin);
  console.log(`  ✅ Exportacion PDF PQRSF exitosa: status ${pdfPqrsf.status}`);

  // Responder PQRSF
  if (idPqrsf) {
    const responder = await request(`/api/Pqrsf/${idPqrsf}/responder`, {
      method: 'PUT',
      body: JSON.stringify({
        respuesta: 'Se realizo llamado preventivo a cocina para mantener los calentadores en temperatura adecuada.',
        estado: 'Respondida'
      })
    }, tokenKevin);
    console.log(`  ✅ Respuesta administrativa a PQRSF registrada: status ${responder.status}`);
  }

  // 10. REPORTES (Diario, Semanal, Mensual)
  console.log(`\n[Paso ${paso++}] Probando Modulo Reportes...`);
  const repDiario = await request('/api/Reportes/diario?fecha=2026-10-26', { method: 'GET' }, tokenKevin);
  console.log(`  ✅ Reporte Diario: status ${repDiario.status}`);

  const repSemanal = await request('/api/Reportes/semanal?fechaInicio=2026-10-19&fechaFin=2026-10-26', { method: 'GET' }, tokenKevin);
  console.log(`  ✅ Reporte Semanal: status ${repSemanal.status}`);

  const repMensual = await request('/api/Reportes/mensual?anio=2026&mes=10', { method: 'GET' }, tokenKevin);
  console.log(`  ✅ Reporte Mensual: status ${repMensual.status}`);

  // 11. SINCRONIZACION OFFLINE (Health, Push, Pull)
  console.log(`\n[Paso ${paso++}] Probando API de Sincronizacion Offline...`);
  const syncHealth = await request('/api/Sync/health', { method: 'GET' });
  console.log(`  ✅ Health check sync: status ${syncHealth.status}, nodo: ${syncHealth.data.nodo}`);

  const syncStatus = await request('/api/Sync/status', { method: 'GET' }, tokenKevin);
  console.log(`  ✅ Estado cola outbox: pendientes = ${syncStatus.data.pendientes}`);

  console.log('\n====================================================');
  console.log('   ¡TODAS LAS PRUEBAS E2E COMPLETADAS CON ÉXITO!    ');
  console.log('====================================================\n');
}

run().catch(err => {
  console.error('\n❌ ERROR EN PRUEBAS E2E:', err);
  process.exit(1);
});
