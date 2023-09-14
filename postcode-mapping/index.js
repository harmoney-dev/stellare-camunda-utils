import fs from "fs";
import XLSX from "xlsx";
import { nanoid } from "nanoid";

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
};

const outputFilePath = 'output.xml';

const workbook = XLSX.readFile("postcode-mapping/input_au_postcode.xlsx");
const sheetNameList = workbook.SheetNames;
const postcodes = XLSX.utils.sheet_to_json(
  workbook.Sheets[sheetNameList[0]]
);

let rules = postcodes.map((row) => {
    return (`
      <rule id="DecisionRule_${nanoid(7)}">
        <inputEntry id="UnaryTests_${nanoid(7)}">
          <text>"${row.POSTCODE_2011}"</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_${nanoid(7)}">
          <text>"${AREA_MAPPING[row.GCCSA_NAME_2011]}"</text>
        </outputEntry>
      </rule>`)
  })
  console.log('XML generated 🚀, total rules:', rules.length);

  // Insert rules into decision table
  const decisionTable = `
    <decisionTable id="DecisionTable_11zy1qw">
    <input id="InputClause_1bk8nbq" label="Postcode">
      <inputExpression id="LiteralExpression_02fyz15" typeRef="string">
        <text>postcode</text>
      </inputExpression>
    </input>
    <output id="OutputClause_1mao4zs" label="Area" name="area" typeRef="string">
      <outputValues id="UnaryTests_1dpmk2w">
        <text>"Sydney","Rest of NSW","Melbourne","Rest of VIC","Brisbane","Rest of QLD","Perth","Rest of WA","Adelaide","Rest of SA","Hobart","Rest of TAS","Darwin","Rest of NT","Canberra","Other Territories"</text>
      </outputValues>
    </output>
      ${rules.join('')}
    </decisionTable>
  `

  // Write XML to file
  try {
    fs.writeFileSync(outputFilePath, decisionTable);
    console.log('XML file saved successfully.');
  } catch (err) {
    console.error('Error saving XML file:', err);
  }