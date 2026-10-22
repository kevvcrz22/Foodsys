# ==============================================================================
# PROCESADOR DE ARCHIVOS SENA PARA FOODSYS (ANACONDA / PYTHON 3)
# ==============================================================================
# Procesa:
#   1. PE-04_1.xlsx (Fichas institucionales SENA)
#   2. Base_NO MODIFICAR_2026_SEPTIEMBRE.xlsm (Base Aprendices La Granja)
#
# Genera:
#   1. Fichas_Activas_Foodsys.xlsx    (Listo para importar en modulo Fichas)
#   2. Aprendices_Activos_Foodsys.xlsx (Listo para importar en modulo Aprendices)
#
# Reglas aplicadas al 100%:
#   * Busca e identifica todas las fichas activas (En ejecucion).
#   * Sincroniza aprendices internos de Hoja1 (Centro de Convivencia = 'Si', 'Aprendiz Interno').
#   * Filtra cancelados, retirados y certificados de IQR.
#   * Todo aprendiz activo tiene OBLIGATORIAMENTE: Estado = 'En Formacion'.
#   * Formateo limpio de telefonos y documentos (sin decimales .0).
#   * Calculo automatico de fechas de etapa lectiva y practica (6 meses).
# ==============================================================================

import os
import re
import sys
import unicodedata
from datetime import datetime, timedelta
import pandas as pd

# Rutas de archivos fuente
RUTA_BASE = os.path.dirname(os.path.abspath(__file__))
FILE_PE04 = os.path.join(RUTA_BASE, "PE-04_1.xlsx")
FILE_BASE = os.path.join(RUTA_BASE, "Base_NO MODIFICAR_2026_SEPTIEMBRE.xlsm")

FILE_OUT_FICHAS = os.path.join(RUTA_BASE, "Fichas_Activas_Foodsys.xlsx")
FILE_OUT_APRENDICES = os.path.join(RUTA_BASE, "Aprendices_Activos_Foodsys.xlsx")

def normalizar_columna(s):
    if not isinstance(s, str):
        s = str(s)
    nfkd = unicodedata.normalize('NFKD', s)
    no_accent = ''.join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r'[^A-Z0-9]', '_', no_accent.upper()).strip('_')

def limpiar_documento(val):
    if pd.isna(val) or val is None:
        return ""
    s = str(val).split('.')[0].strip()
    return re.sub(r'\D', '', s)

def limpiar_telefono(val):
    if pd.isna(val) or val is None:
        return ""
    s = str(val).split('.')[0].strip()
    digits = re.sub(r'\D', '', s)
    if len(digits) >= 7:
        return digits
    return ""

def limpiar_texto(val):
    if pd.isna(val) or val is None:
        return ""
    nfkd = unicodedata.normalize('NFKD', str(val).strip())
    res = ''.join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', res).upper()

def limpiar_correo(val, doc_backup=""):
    if pd.isna(val) or val is None:
        return f"{doc_backup}@soy.sena.edu.co" if doc_backup else ""
    s = str(val).strip().lower()
    if "@" in s and "." in s:
        return s
    return f"{doc_backup}@soy.sena.edu.co" if doc_backup else ""

def formatear_fecha(val):
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None
    try:
        dt = pd.to_datetime(val, dayfirst=True)
        return dt.strftime('%Y-%m-%d')
    except:
        return None

# Configurar stdout para evitar errores de codificacion en Windows cp1252
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    print("=" * 75)
    print(">> INICIANDO PROCESAMIENTO INTELIGENTE DE ARCHIVOS SENA PARA FOODSYS")
    print("=" * 75)

    if not os.path.exists(FILE_PE04):
        print(f"[ERROR] No se encuentra {FILE_PE04}")
        return
    if not os.path.exists(FILE_BASE):
        print(f"[ERROR] No se encuentra {FILE_BASE}")
        return

    # =========================================================================
    # PASO 1: PROCESAR FICHAS OFICIALES EN EJECUCION DE PE-04_1.xlsx
    # =========================================================================
    print(f"\n[1/4] Leyendo {os.path.basename(FILE_PE04)}...")
    df_pe = pd.read_excel(FILE_PE04, skiprows=4)
    print(f"   Total filas en reporte PE-04: {len(df_pe):,}")

    col_id_ficha = "IDENTIFICADOR_FICHA"
    col_estado = "ESTADO_CURSO"
    col_programa = "NOMBRE_PROGRAMA_FORMACION"
    col_nivel = "NIVEL_FORMACION"
    col_ini_ficha = "FECHA_INICIO_FICHA"
    col_fin_ficha = "FECHA_TERMINACION_FICHA"

    # Filtrar activas en ejecucion
    pe_activas = df_pe[df_pe[col_estado].astype(str).str.strip().str.lower() == "en ejecucion"].copy()
    print(f"   [OK] Fichas con estado 'En ejecucion' en PE-04: {len(pe_activas):,}")

    fichas_dict = {}

    for _, row in pe_activas.iterrows():
        try:
            num_ficha = int(row[col_id_ficha])
        except:
            continue

        nom_programa = limpiar_texto(row[col_programa])
        nivel_for = limpiar_texto(row[col_nivel])
        fec_ini = formatear_fecha(row[col_ini_ficha])
        fec_fin = formatear_fecha(row[col_fin_ficha])

        # Calculo automatico de fechas de lectiva y practica
        # Practica dura 6 meses (180 dias aprox) al final de la ficha
        fec_ini_pra = None
        fec_fin_lec = None
        if fec_fin:
            dt_fin = datetime.strptime(fec_fin, '%Y-%m-%d')
            dt_ini_pra = dt_fin - timedelta(days=180)
            dt_fin_lec = dt_ini_pra - timedelta(days=1)
            fec_ini_pra = dt_ini_pra.strftime('%Y-%m-%d')
            fec_fin_lec = dt_fin_lec.strftime('%Y-%m-%d')

        fichas_dict[num_ficha] = {
            "Num_Ficha": num_ficha,
            "Nombre del Programa": nom_programa,
            "Nivel de Formacion": nivel_for,
            "FecIniLec_Ficha": fec_ini,
            "FecFinLec_Ficha": fec_fin_lec,
            "FecIniPra_Ficha": fec_ini_pra,
            "FecFinPra_Ficha": fec_fin,
            "Estado": "Activo",
            "Fuente": "PE-04 En ejecucion"
        }

    # =========================================================================
    # PASO 2: PROCESAR APRENDICES Y FICHAS DE Base_NO MODIFICAR_2026_SEPTIEMBRE.xlsm
    # =========================================================================
    print(f"\n[2/4] Leyendo {os.path.basename(FILE_BASE)}...")

    # 2.1 Hoja1: INTERNOS CON CABAÑA / ALOJAMIENTO
    print("   -> Analizando 'Hoja1' (Aprendices Internos con Cabana)...")
    df_h1 = pd.read_excel(FILE_BASE, sheet_name="Hoja1")
    cols_h1_norm = {c: normalizar_columna(c) for c in df_h1.columns}
    df_h1.rename(columns=cols_h1_norm, inplace=True)

    col_doc_h1 = [c for c in df_h1.columns if "IDENTIFICACI" in c and "NUMERO" in c][0]
    col_nom_h1 = [c for c in df_h1.columns if "NOMBRE" in c and "APRENDIZ" in c][0]
    col_tip_h1 = [c for c in df_h1.columns if "IDENTIFICACI" in c and "TIPO" in c][0]
    col_fic_h1 = [c for c in df_h1.columns if "GRUPO" in c or "FICHA" in c][0]
    col_cab_h1 = [c for c in df_h1.columns if "ALOJAMIENTO" in c or "CABANA" in c][0]
    col_cor_h1 = [c for c in df_h1.columns if "CORREO" in c][0]
    col_tel_h1 = [c for c in df_h1.columns if "TELEFONO" in c or "CONTACTO" in c][0]
    col_sex_h1 = [c for c in df_h1.columns if "SEXO" in c or "GENERO" in c][0]
    col_nov_h1 = [c for c in df_h1.columns if "NOVEDAD" in c and "TIPO" in c]

    internos_dict = {}
    for _, row in df_h1.iterrows():
        # Verificar novedades de retiro
        if col_nov_h1:
            nov = str(row[col_nov_h1[0]]).strip().upper()
            if "RETIRO" in nov or "CANCELAD" in nov:
                continue

        doc = limpiar_documento(row[col_doc_h1])
        if not doc:
            continue

        nombre_completo = limpiar_texto(row[col_nom_h1])
        partes_nombre = nombre_completo.split()
        if len(partes_nombre) >= 4:
            nombres = " ".join(partes_nombre[:2])
            apellidos = " ".join(partes_nombre[2:])
        elif len(partes_nombre) == 3:
            nombres = partes_nombre[0]
            apellidos = " ".join(partes_nombre[1:])
        elif len(partes_nombre) == 2:
            nombres = partes_nombre[0]
            apellidos = partes_nombre[1]
        else:
            nombres = nombre_completo
            apellidos = ""

        tip_doc = limpiar_texto(row[col_tip_h1]) or "CC"
        if tip_doc not in ["CC", "TI", "CE", "PEP", "PPT"]:
            tip_doc = "CC"

        ficha_raw = limpiar_documento(row[col_fic_h1])
        num_ficha = int(ficha_raw) if ficha_raw.isdigit() else None

        cabana = limpiar_texto(row[col_cab_h1])
        correo = limpiar_correo(row[col_cor_h1], doc)
        telefono = limpiar_telefono(row[col_tel_h1])
        sexo_raw = limpiar_texto(row[col_sex_h1])
        genero = "M" if sexo_raw.startswith("M") or sexo_raw == "HOMBRE" else "F"

        internos_dict[doc] = {
            "Tipo de Documento": tip_doc,
            "Documento": int(doc),
            "Nombres": nombres,
            "Apellidos": apellidos,
            "Ficha": num_ficha,
            "Centro de Convivencia": "Si",
            "Correo Electrónico": correo,
            "Teléfono": telefono,
            "Género": genero,
            "Rol": "Aprendiz Interno",
            "Estado": "En Formacion",
            "Cabana": cabana
        }

    print(f"   [OK] Total aprendices internos activos validados en Hoja1: {len(internos_dict):,}")

    # 2.2 Base_Datos_IQR: BASE GENERAL DE APRENDICES
    print("   -> Analizando 'Base_Datos_IQR' (Base General de Aprendices)...")
    df_iqr = pd.read_excel(FILE_BASE, sheet_name="Base_Datos_IQR", skiprows=3)
    cols_iqr_norm = {c: normalizar_columna(c) for c in df_iqr.columns}
    df_iqr.rename(columns=cols_iqr_norm, inplace=True)

    col_doc_iqr = [c for c in df_iqr.columns if c == "DOCUMENTO"][0]
    col_nom_iqr = [c for c in df_iqr.columns if "SIMBRES" in c or "NOMBRES" in c][0]
    col_ape_iqr = [c for c in df_iqr.columns if "APELLIDOS" in c][0]
    col_cmp_iqr = [c for c in df_iqr.columns if "COMPLETO" in c][0] if any("COMPLETO" in c for c in df_iqr.columns) else None
    col_tip_iqr = [c for c in df_iqr.columns if "TIPO" in c and "DOCUMENTO" in c][0]
    col_fic_iqr = [c for c in df_iqr.columns if "FICHA" in c][0]
    col_est_iqr = [c for c in df_iqr.columns if c == "ESTADO"][0]
    col_prg_iqr = [c for c in df_iqr.columns if "PROGRAMA" in c][0]
    col_niv_iqr = [c for c in df_iqr.columns if "NIVEL" in c][0]
    col_cor_iqr = [c for c in df_iqr.columns if "CORREO" in c][0]
    col_tel_iqr = [c for c in df_iqr.columns if "TELEF" in c][0]
    col_gen_iqr = [c for c in df_iqr.columns if "GENERO" in c or "SEXO" in c][0]
    col_rol_iqr = [c for c in df_iqr.columns if c == "ROL"][0]

    aprendices_consolidados = {}
    fichas_de_aprendices_info = {}

    for _, row in df_iqr.iterrows():
        estado_raw = limpiar_texto(row[col_est_iqr])

        # Excluir explicitamente estados inactivos / retirados
        if any(inactivo in estado_raw for inactivo in ["CANCELADO", "RETIRO", "CERTIFICADO", "POR CERTIFICAR", "TRASLADADO", "APLAZADO"]):
            continue

        # Validar estados activos
        es_activo = any(act in estado_raw for act in ["FORMACION", "INDUCCION", "PASANT", "CONDICIONADO", "CONTRATO", "SOSTENIMIENTO", "ACTIVO"])
        if not es_activo:
            continue

        doc = limpiar_documento(row[col_doc_iqr])
        if not doc:
            continue

        # Datos de Ficha y Programa
        ficha_raw = limpiar_documento(row[col_fic_iqr])
        num_ficha = int(ficha_raw) if ficha_raw.isdigit() else None
        nom_programa = limpiar_texto(row[col_prg_iqr])
        nivel_formacion = limpiar_texto(row[col_niv_iqr])

        if num_ficha:
            if num_ficha not in fichas_de_aprendices_info:
                fichas_de_aprendices_info[num_ficha] = {
                    "programa": nom_programa,
                    "nivel": nivel_formacion
                }

        # Nombres y Apellidos (con recuperacion inteligente desde SImbre Completo si vienen vacios)
        nombres = limpiar_texto(row[col_nom_iqr])
        apellidos = limpiar_texto(row[col_ape_iqr])

        if not nombres and col_cmp_iqr:
            completo_raw = limpiar_texto(row[col_cmp_iqr])
            if completo_raw:
                partes = completo_raw.split()
                if len(partes) >= 4:
                    nombres = " ".join(partes[:2])
                    apellidos = " ".join(partes[2:])
                elif len(partes) == 3:
                    nombres = partes[0]
                    apellidos = " ".join(partes[1:])
                elif len(partes) == 2:
                    nombres = partes[0]
                    apellidos = partes[1]
                else:
                    nombres = completo_raw
                    apellidos = ""

        if not nombres:
            nombres = "APRENDIZ SENA"
            apellidos = f"DOC {doc}"

        # Si el usuario ya esta registrado como interno desde Hoja1, mantenemos su estatus interno
        if doc in internos_dict:
            aprendiz = internos_dict[doc].copy()
            if nombres and nombres != "APRENDIZ SENA":
                aprendiz["Nombres"] = nombres
                aprendiz["Apellidos"] = apellidos
            if not aprendiz["Ficha"] and num_ficha:
                aprendiz["Ficha"] = num_ficha
            aprendices_consolidados[doc] = aprendiz
            continue

        # Aprendiz Externo o Pasante
        tip_doc = limpiar_texto(row[col_tip_iqr]) or "CC"
        if tip_doc not in ["CC", "TI", "CE", "PEP", "PPT"]:
            tip_doc = "CC"

        correo = limpiar_correo(row[col_cor_iqr], doc)
        telefono = limpiar_telefono(row[col_tel_iqr])
        gen_raw = limpiar_texto(row[col_gen_iqr])
        genero = "M" if gen_raw.startswith("M") or gen_raw == "HOMBRE" else ("F" if gen_raw.startswith("F") or gen_raw == "MUJER" else None)

        rol_raw = limpiar_texto(row[col_rol_iqr])
        if "PASANT" in rol_raw or "PASANT" in estado_raw:
            rol_final = "Pasante Externo"
        else:
            rol_final = "Aprendiz Externo"

        aprendices_consolidados[doc] = {
            "Tipo de Documento": tip_doc,
            "Documento": int(doc),
            "Nombres": nombres,
            "Apellidos": apellidos,
            "Ficha": num_ficha,
            "Centro de Convivencia": "No",
            "Correo Electrónico": correo,
            "Teléfono": telefono,
            "Género": genero,
            "Rol": rol_final,
            "Estado": "En Formacion"  # REGLA OBLIGATORIA
        }

    # Asegurar que todos los de Hoja1 que no estuvieran en IQR queden incluidos
    for doc, datos_int in internos_dict.items():
        if doc not in aprendices_consolidados:
            aprendices_consolidados[doc] = datos_int

    # DEDUPLICAR CORREOS Y TELEFONOS PARA CUMPLIR RESTRICCIONES UNIQUE DE BD
    correos_vistos = set()
    telefonos_vistos = set()

    for doc, a in aprendices_consolidados.items():
        cor = str(a.get("Correo Electrónico") or "").strip().lower()
        if not cor or cor in correos_vistos or "prueba" in cor or "123.com" in cor:
            a["Correo Electrónico"] = f"{doc}@soy.sena.edu.co"
        correos_vistos.add(a["Correo Electrónico"])

        tel = str(a.get("Teléfono") or "").strip()
        if tel and (tel in telefonos_vistos or len(tel) < 7 or tel in ["3000000000", "3001234567"]):
            a["Teléfono"] = ""
        elif tel:
            telefonos_vistos.add(tel)

    print(f"   [OK] Total aprendices activos consolidados: {len(aprendices_consolidados):,}")
    internos_tot = sum(1 for a in aprendices_consolidados.values() if a["Centro de Convivencia"] == "Si")
    externos_tot = len(aprendices_consolidados) - internos_tot
    print(f"      - Aprendices Internos (Cabanas/Alojamiento): {internos_tot:,}")
    print(f"      - Aprendices Externos: {externos_tot:,}")
    print(f"      - Estado 'En Formacion': 100% ({len(aprendices_consolidados):,})")

    # =========================================================================
    # PASO 3: SINCRONIZAR FICHAS ACTIVAS CON FICHAS DE APRENDICES
    # =========================================================================
    print("\n[3/4] Sincronizando fichas activas con las fichas de los aprendices...")
    fichas_aprendices_unicas = set(a["Ficha"] for a in aprendices_consolidados.values() if a["Ficha"])
    fichas_agregadas_de_aprendices = 0

    for nf in fichas_aprendices_unicas:
        if nf not in fichas_dict:
            info = fichas_de_aprendices_info.get(nf, {})
            nom_prog = info.get("programa") or "PROGRAMA EN FORMACION SENA"
            niv_for = info.get("nivel") or "TECNOLOGO"

            # Fechas por defecto coherentes para fichas activas vigentes
            fichas_dict[nf] = {
                "Num_Ficha": nf,
                "Nombre del Programa": nom_prog,
                "Nivel de Formacion": niv_for,
                "FecIniLec_Ficha": "2024-01-15",
                "FecFinLec_Ficha": "2026-07-14",
                "FecIniPra_Ficha": "2026-07-15",
                "FecFinPra_Ficha": "2027-01-14",
                "Estado": "Activo",
                "Fuente": "Base Aprendices La Granja"
            }
            fichas_agregadas_de_aprendices += 1

    print(f"   [OK] Total fichas activas finales: {len(fichas_dict):,}")
    print(f"      - Provenientes de PE-04 En ejecucion: {len(pe_activas):,}")
    print(f"      - Complementadas desde Base de Aprendices: {fichas_agregadas_de_aprendices:,}")

    # =========================================================================
    # PASO 4: EXPORTAR ARCHIVOS EXCEL LIMPIOS Y COMPATIBLES
    # =========================================================================
    print("\n[4/4] Guardando archivos Excel oficiales...")

    # 4.1 Fichas_Activas_Foodsys.xlsx
    df_fichas_out = pd.DataFrame(list(fichas_dict.values()))
    # Ordenar por Num_Ficha
    df_fichas_out.sort_values(by="Num_Ficha", inplace=True)
    
    # Columnas compatibles exactas con Foodsys
    columnas_fichas = [
        "Num_Ficha", "Nombre del Programa", "Nivel de Formacion",
        "FecIniLec_Ficha", "FecFinLec_Ficha", "FecIniPra_Ficha", "FecFinPra_Ficha",
        "Estado"
    ]
    df_fichas_out[columnas_fichas].to_excel(FILE_OUT_FICHAS, index=False)
    print(f"   [ARCHIVO CREADO]: {FILE_OUT_FICHAS} ({len(df_fichas_out):,} fichas)")

    # 4.2 Aprendices_Activos_Foodsys.xlsx
    df_aprendices_out = pd.DataFrame(list(aprendices_consolidados.values()))
    df_aprendices_out.sort_values(by="Documento", inplace=True)

    columnas_aprendices = [
        "Tipo de Documento", "Documento", "Nombres", "Apellidos", "Ficha",
        "Centro de Convivencia", "Correo Electrónico", "Teléfono", "Género",
        "Rol", "Estado"
    ]
    df_aprendices_out[columnas_aprendices].to_excel(FILE_OUT_APRENDICES, index=False)
    print(f"   [ARCHIVO CREADO]: {FILE_OUT_APRENDICES} ({len(df_aprendices_out):,} aprendices)")

    print("\n" + "=" * 75)
    print("PROCESAMIENTO COMPLETADO EXITOSAMENTE!")
    print(f"1. Fichas listas para subir:      {len(df_fichas_out):,} registros")
    print(f"2. Aprendices listos para subir:  {len(df_aprendices_out):,} registros")
    print(f"3. Aprendices Internos (Cabanas): {internos_tot:,}")
    print(f"4. Regla Est_Usuario:             100% 'En Formacion'")
    print("=" * 75)

if __name__ == "__main__":
    main()
