// app/api/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync"; // Usando versão sync para simplificar api
import { stringify } from "csv-stringify/sync";

// ===== LÓGICA DO SEU SCRIPT ORIGINAL (Funções Auxiliares) =====
const NORMALIZAR_NUMERO = true;
const TRIM_TEXTO = true;
const reTipo = /^tipo\s*dim\s*(\d+)$/i;
const reDim = /^dim\s*(\d+)$/i;

const MEASURE_MAP = new Map(
  Object.entries({
    torace: "chest",
    vita: "waist",
    bacino: "hip",
    lunghezza: "insoleLength",
    larghezza: "width",
    circonferenza: "circumference",
    seno: "chest",
    fianchi: "hip",
    altezza: "height",
    petto: "chest",
    gamba: "thigh",
    spalle: "shoulderWidth",
    numero: "bar",
    "int. gamba": "insideLeg",
    sottoseno: "underBust",
    waist: "waist",
    hip: "hip",
  })
);

function normKey(s: any) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function mapMeasureName(raw: any) {
  const key = normKey(raw);
  return MEASURE_MAP.get(key) || sanitizeHeaderName(raw);
}

const genderMap = new Map(
  Object.entries({
    B: "male",
    G: "female",
    J: "unisex",
    M: "male",
    U: "unisex",
    W: "female",
  })
);

function getGenderFromGeCode(v: any) {
  if (v == null) return "";
  const key = String(v).trim().toUpperCase();
  return genderMap.get(key) || "";
}

function getAgeGroupFromGenderCode(v: any) {
  if (v == null) return "";
  const s = String(v).trim();
  if (/(^|[^0-9])(93|96|99)([^0-9]|$)/.test(s)) return "kids";
  if (/(^|[^0-9])(60|30|90)([^0-9]|$)/.test(s)) return "adult";
  return "";
}

function getStrongCategoryType(sizegridLvl2: any) {
  const s = String(sizegridLvl2 ?? "").toUpperCase();
  return s.includes("SHOES") ? "shoe" : "clothes";
}

function sanitizeHeaderName(name: any) {
  const raw = (name || "").toString().trim();
  return raw.replace(/\s+/g, "");
}

function normalizeNumberLike(value: any) {
  if (value == null) return value;
  let s = String(value)
    .trim()
    .replace(/\bcm\b/gi, "")
    .replace(/"/g, "")
    .trim();
  const commaAsDecimal = /^-?\d{1,3}(?:\.\d{3})*,\d+$/;
  const simpleComma = /^-?\d+,\d+$/;
  const simpleDot = /^-?\d+(\.\d+)?$/;
  const intOnly = /^-?\d+$/;
  if (simpleDot.test(s) || intOnly.test(s)) return s;
  if (commaAsDecimal.test(s) || simpleComma.test(s)) {
    return s.replace(/\./g, "").replace(",", ".");
  }
  const m = s.match(/-?\d+(?:[.,]\d+)?/);
  return m ? normalizeNumberLike(m[0]) : s;
}

function parseRangeToPair(raw: any) {
  if (raw == null || String(raw).trim() === "") return { ini: "", fin: "" };
  const s = String(raw).trim();
  const parts = s.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    const ini = NORMALIZAR_NUMERO
      ? normalizeNumberLike(parts[0])
      : parts[0].trim();
    const fin = NORMALIZAR_NUMERO
      ? normalizeNumberLike(parts[1])
      : parts[1].trim();
    return { ini, fin };
  }
  const v = NORMALIZAR_NUMERO ? normalizeNumberLike(s) : s;
  return { ini: v, fin: v };
}

function trimAll(v: any) {
  if (v == null) return v;
  return String(v).replace(/\s+/g, " ").trim();
}

function shouldSkipRow(row: any) {
  const code = String(row["TGL_FILTER_CODE"] ?? "").toUpperCase();
  return code.includes("ACC");
}

// ===== ROTA API DO NEXT.JS =====
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // 1. Ler o arquivo como texto
    const csvContent = await file.text();

    // 2. Parsear o CSV (Input)
    const rowsRaw = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
      trim: false,
    });

    const rows = rowsRaw.filter((r: any) => !shouldSkipRow(r));

    // 3. Processamento (Lógica original)
    const allMeasures = new Set<string>();
    for (const row of rows) {
      for (const [key, val] of Object.entries(row)) {
        const mTipo = key.match(reTipo);
        if (mTipo) {
          const tipoRaw = TRIM_TEXTO ? String(val || "").trim() : val;
          if (tipoRaw) allMeasures.add(mapMeasureName(tipoRaw));
        }
      }
    }

    const fixedHeaders = [
      "name",
      "gender",
      "ageGroup",
      "strongCategoryType",
      "brandName",
      "type",
      "accessories",
      "sizeSystem",
      "sizeName",
      "ss-EU",
      "ss-FR",
      "ss-IT",
      "ss-JP",
      "ss-UK",
      "ss-US",
      "categoryNames",
    ];

    const measureHeaders = [];
    for (const m of allMeasures) {
      measureHeaders.push(`${m}InitialValue`, `${m}FinalValue`);
    }
    const finalHeaders = [...fixedHeaders, ...measureHeaders];

    const out = [];
    for (const row of rows) {
      const base: any = {};
      base["name"] = trimAll(row["SizeGrid_Code_Category"]) || "";
      base["gender"] = getGenderFromGeCode(row["Ge Code"]);
      base["ageGroup"] = getAgeGroupFromGenderCode(row["Gender"]);
      base["strongCategoryType"] = getStrongCategoryType(
        row["SizeGrid_lvl2_cat"]
      );
      base["brandName"] = trimAll(row["SizeGrid_Code"]) || "";
      base["type"] = "product";
      base["accessories"] = "FALSE";
      base["sizeSystem"] = "EU";
      base["sizeName"] = trimAll(row["TGL_COD"]) || "";
      base["ss-EU"] = trimAll(row["EU_ALS"]) || "";
      base["ss-FR"] = trimAll(row["FRA_ALS"]) || "";
      base["ss-IT"] = trimAll(row["IT_ALS"]) || "";
      base["ss-JP"] = trimAll(row["JP_ALS"]) || "";
      base["ss-UK"] = trimAll(row["UK_ALS"]) || "";
      base["ss-US"] = trimAll(row["US_ALS"]) || "";
      base["categoryNames"] = trimAll(row["SizeGrid_lvl2_cat"]) || "";

      const temp: any = {};
      for (const [key, val] of Object.entries(row)) {
        const mTipo = key.match(reTipo);
        if (mTipo) {
          temp[mTipo[1]] = temp[mTipo[1]] || {};
          temp[mTipo[1]].tipo = TRIM_TEXTO ? String(val || "").trim() : val;
        }
        const mDim = key.match(reDim);
        if (mDim) {
          temp[mDim[1]] = temp[mDim[1]] || {};
          temp[mDim[1]].valor = TRIM_TEXTO ? String(val || "").trim() : val;
        }
      }

      for (const idx of Object.keys(temp)) {
        const tipoRaw = temp[idx].tipo || "";
        const tipo = mapMeasureName(tipoRaw);
        const valor = temp[idx].valor;
        if (!tipo || valor == null || valor === "") continue;

        const { ini, fin } = parseRangeToPair(valor);
        const iniKey = `${tipo}InitialValue`;
        const finKey = `${tipo}FinalValue`;

        if ((base[iniKey] ?? "") === "") base[iniKey] = ini ?? "";
        if ((base[finKey] ?? "") === "") base[finKey] = fin ?? "";
      }
      out.push(base);
    }

    // 4. Transformar em CSV string (Output)
    const outputString = stringify(out, {
      header: true,
      columns: finalHeaders,
    });

    // 5. Retornar como arquivo para download
    return new NextResponse(outputString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="output.csv"',
      },
    });
  } catch (error) {
    console.error("Erro no processamento:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento" },
      { status: 500 }
    );
  }
}
