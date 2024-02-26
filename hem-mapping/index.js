/**
 * This script is used to generate the decision table XML for HEM mapping.
 */

import fs from "fs";
import XLSX from "xlsx";
import { nanoid } from "nanoid";

/**
 * Before executing the script, please update the following values:
 */

// Find the upper band from the new HEM table and update the UPPER_BAND value before running the script
const UPPER_BAND = 630000;
const SECOND_UPPER_BAND = 378000;
const THIRD_UPPER_BAND = 315000;
const UPPER_BAND_RANGE = `[${SECOND_UPPER_BAND}..${UPPER_BAND}[`;
const SECOND_UPPER_BAND_RANGE = `[${THIRD_UPPER_BAND}..${SECOND_UPPER_BAND}[`;

// Calculate the MID_POINT_OF_UPPER_BAND using this formula
const MID_POINT_OF_UPPER_BAND = (UPPER_BAND + SECOND_UPPER_BAND) / 2;

const AREA_MAPPING = {
  Australia: "Other Territories",
  Sydney: "Sydney",
  "Balance of NSW": "Rest of NSW",
  Melbourne: "Melbourne",
  "Balance of VIC": "Rest of VIC",
  Brisbane: "Brisbane",
  "Balance of QLD": "Rest of QLD",
  Perth: "Perth",
  "Balance of WA": "Rest of WA",
  Adelaide: "Adelaide",
  "Balance of SA": "Rest of SA",
  Hobart: "Hobart",
  "Balance of TAS": "Rest of TAS",
  NT: "Darwin",
  ACT: "Canberra",
  "Balance of NT": "Rest of NT",
};

const COMPARISON_OPERATOR_MAPPING = {
  ">": "&gt;",
  "<": "&lt;",
  ">=": "&gt;=",
  "<=": "&lt;=",
  "=": "=",
};

// To avoid duplicate IDs
let generatedIds = new Set();
function uniqueNanoId() {
  let id;
  do {
    id = nanoid(7);
  } while (generatedIds.has(id));
  generatedIds.add(id);
  return id;
}

const workbook = XLSX.readFile("hem-mapping/input_hem.xlsx");
const sheetNameList = workbook.SheetNames;
const originalHEM = XLSX.utils.sheet_to_json(
  workbook.Sheets[sheetNameList[1]]
);

//console.log('originalHEM', originalHEM);

const newHEM = originalHEM
  .map((item) => {
    const situation = item.situation;
    const obj = {};

    if (situation.includes("Couple")) {
      obj.relationshipStatus = ["married", "de_facto"];
    } else if (situation.includes("Single")) {
      obj.relationshipStatus = ["single", "divorced", "separated","widowed"];
    }

    if (situation.includes("more than 3")) {
      obj.numberOfDependants = ">3";
    } else {
      const dependants = situation.match(/\d+/);
      obj.numberOfDependants = dependants ? Number(dependants[0]) : 0;
    }

    for (const key in item) {
      if (key !== "situation") {
        obj[key] = item[key];
      }
    }

    return obj;
  })
  .filter((item) => item);

// createXLSXForNewHEM();

function createXLSXForNewHEM() {
  const newWorkbook = XLSX.utils.book_new();
  const newWorksheet = XLSX.utils.json_to_sheet(newHEM);
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");
  XLSX.writeFile(newWorkbook, "updated_hem.xlsx");
}

const outputFilePath = "hem-mapping/output.xml";

const finalResult = getBenchmarkValueForMoreThan3Dependants(newHEM);
const benchmark = getBenchmarkValueForBeyondTopIncomeBand(finalResult);

getDecisionTable(finalResult);

function mapComparisonOperator(input) {
  return input.replace(/(<|>|<=|>=|=)/g, function (matched) {
    return COMPARISON_OPERATOR_MAPPING[matched];
  });
}

function formatNumber(number) {
  if (typeof number === "string") {
    return number.replace(/,/g, "");
  }
  return number.toFixed(2);
}

/**
 * Business rules:
 * 1. If user has specified more than 3 dependants, HEM guidance is to marginally adjust the benchmark value using the difference between 2 and 3 dependants to accommodate this.
 * The calculation should be: newBenchmarkValue = (((benchmark3dependants - benchmark2dependants) * (numberOfDependants - 3)) + benchmark3dependants
 *
 * 2. For extrapolation of income beyond the top income band (currently $363,000-$606,000):
 *    2.1 Calculate the mid-point of the upper most band - so for our table it's: mid-point of $363,000 to $606,000 = $484,500
 *    2.2 Find the HEM values for the upper most band and the SECOND upper most band. So using the top row we'd have $1,276 and $1,224
 *    2.3 Plug them into this formula: (borrower's income/mid-point of upper band)*(upper most HEM - second upper most HEM) + Second upper most HEM).
 *    So if our borrower has an income of 800K, we'd go: (800000/484500)*(1276-1224)+1224=$1310 is their HEM value
 */
function getBenchmarkValueForMoreThan3Dependants(result) {
  const groupedBenchmark = groupBenchmarkValueByStatus(result);

  // Calculate benchmark value for >3 dependants
  result.forEach((row) => {
    if (row.numberOfDependants === ">3") {
      const benchmark2dependants = groupedBenchmark[
        row.relationshipStatus
      ].find(
        (item) => item.numberOfDependants === 2 && item.area === row.area
      );
      const benchmark3dependants = groupedBenchmark[
        row.relationshipStatus
      ].find(
        (item) => item.numberOfDependants === 3 && item.area === row.area
      );
      Object.keys(row).forEach((key) => {
        if (
          key === "area" ||
          key === "relationshipStatus" ||
          key === "numberOfDependants"
        ) {
          return;
        }
        row[key] = `${
          Math.round(formatNumber(benchmark3dependants[key])) -
          Math.round(formatNumber(benchmark2dependants[key]))
        }*(user.numberOfDependants-3) + ${Math.round(
          formatNumber(benchmark3dependants[key])
        )}`;
      });
    }
  });

  return result;
}

function getBenchmarkValueForBeyondTopIncomeBand(result) {
  result.forEach((row) => {
    console.log(row)
    const upperMostHEM = row[UPPER_BAND_RANGE];
    const secondUpperMostHEM = row[SECOND_UPPER_BAND_RANGE];
    console.log(upperMostHEM, secondUpperMostHEM, MID_POINT_OF_UPPER_BAND)

    // Calculate benchmark value for beyond Top income band
    // (borrower's income/mid-point of upper band)*(upper most HEM - second upper most HEM) + Second upper most HEM).
    Object.keys(row).forEach((key) => {
      if (
        key === "area" ||
        key === "relationshipStatus" ||
        key === "numberOfDependants"
      ) {
        return;
      }
      row[`>=${UPPER_BAND}`] = `(finalVerifiedIncome*12/${formatNumber(
        MID_POINT_OF_UPPER_BAND
      )})*((${formatNumber(upperMostHEM)})-(${formatNumber(
        secondUpperMostHEM
      )}))+(${formatNumber(secondUpperMostHEM)})`;
    });
  });

  //console.log(result);
  return result;
}

function groupBenchmarkValueByStatus(result) {
  let benchmark = {};
  result.forEach((row) => {
    if (row.numberOfDependants === 2 || row.numberOfDependants === 3) {
      if (!benchmark[row.relationshipStatus]) {
        benchmark[row.relationshipStatus] = [];
      }
      benchmark[row.relationshipStatus].push(row);
    }
  });

  return benchmark;
}

function getDecisionTable(result) {
  //Generate XML for rules
  let rules = [];
  result.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (
        key === "area" ||
        key === "relationshipStatus" ||
        key === "numberOfDependants" ||
        !key
      ) {
        return;
      }
      return rules.push(`
       <rule id="DecisionRule_${uniqueNanoId()}">
         <inputEntry id="UnaryTests_${uniqueNanoId()}">
           <text>${mapComparisonOperator(key)}</text>
         </inputEntry>
         <inputEntry id="UnaryTests_${uniqueNanoId()}">
           <text>"${AREA_MAPPING[row.area]}"</text>
         </inputEntry>
         <inputEntry id="UnaryTests_${uniqueNanoId()}">
           <text>"${row.relationshipStatus.map(status => `"${status}"`).join(', ').slice(1, -1)}"</text>
         </inputEntry>
         <inputEntry id="UnaryTests_${uniqueNanoId()}">
           <text>${
             row.numberOfDependants === ">3"
               ? row.numberOfDependants.replace(">", "&gt;")
               : row.numberOfDependants
           }</text>
         </inputEntry>
         <outputEntry id="LiteralExpression_${uniqueNanoId()}">
           <text>${
             row.numberOfDependants === ">3" ? row[key] : formatNumber(row[key])
           }</text>
         </outputEntry>
       </rule>`);
    });
  });
  console.log("XML generated 🚀, total rules:", rules.length);

  // Insert rules into decision table
  const decisionTable = `
  <decisionTable id="DecisionTable_06kpvxy">
    <input id="InputClause_0egegar" label="Final annual income">
      <inputExpression id="LiteralExpression_0pugzmw" typeRef="number">
        <text>finalVerifiedIncome*12</text>
      </inputExpression>
    </input>
    <input id="InputClause_0hnzzvq" label="Area">
      <inputExpression id="LiteralExpression_1h9ydsz" typeRef="string">
        <text>area</text>
      </inputExpression>
      <inputValues id="UnaryTests_1brduns">
        <text>"Sydney","Rest of NSW","Melbourne","Rest of VIC","Brisbane","Rest of QLD","Perth","Rest of WA","Adelaide","Rest of SA","Hobart","Rest of TAS","Darwin","Rest of NT","Canberra","Other Territories"</text>
      </inputValues>
    </input>
    <input id="InputClause_0aobuo4" label="Relationship Status">
      <inputExpression id="LiteralExpression_136rm4m" typeRef="string">
        <text>lower case(user.relationshipStatus)</text>
      </inputExpression>
      <inputValues id="UnaryTests_0edpfbt">
        <text>"single","married","de_facto","divorced","separated","widowed"</text>
      </inputValues>
    </input>
    <input id="InputClause_03n0vvq" label="Number of dependants">
      <inputExpression id="LiteralExpression_1u2hd8x" typeRef="number">
        <text>user.numberOfDependants</text>
      </inputExpression>
    </input>
    <output id="OutputClause_0zwsw2e" label="Benchmark Value" name="benchmarkValue" typeRef="string" />
     ${rules.join("")}
    </decisionTable>`;

  // Write XML to file
  try {
    fs.writeFileSync(outputFilePath, decisionTable);
    console.log("XML file saved successfully.");
  } catch (err) {
    console.error("Error saving XML file:", err);
  }
}

console.log("File written successfully");

