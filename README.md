# stellare-camunda-utils

## Overview
This project contains two separate folders for different mapping purposes:  `hem-mapping` and `postcode-mapping`. Both folders contain JavaScript code to map data from an original XLSX file to a desired XML format and then use it in Camunda.

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Prerequisites

* Node.js: Make sure you have Node.js installed on your machine.

* Camunda: Make sure you have Camunda installed and running.

### Installation
1. Clone the repository


```
git clone https://github.com/your-username/your-repository.git
```

2.Install the dependencies

```
cd stellare-camunda-utils
npm install
```

3. Run the script

```
npm run start:hem-mapping 
```

or 

```
npm run start:postcode-mapping
```

### Usage

For hem-mapping, update the rules from hem-mapping/output.xml to [homney-v1-hem-benmark.dmn](https://github.com/harmoney-dev/stellare/blob/main/camunda/bpmn/affordability-models/HMoney/V1/dmn/hmoney-v1-hem-benchmark.dmn)


For postcode-mapping, update the rules from postcode-mapping/output.xml to [au-postcode-area-mapping.dmn](https://github.com/harmoney-dev/stellare/blob/main/camunda/bpmn/affordability-models/HMoney/V1/dmn/au-postcode-area-mapping.dmn)


## Notes

### hem-mapping

If the original [HEM_3.19_2022Q4_smoothed.xlsx](/hem-mapping/HEM_3.19_2022Q4_smoothed.xlsx) updated, please do update the [input_hem.xlsx] and re-run `npm run start:hem-mapping` under `hem-mapping` folder to obtain new rules. You can also checkout to [updated_hem.xlsx](/hem-mapping/input_hem.xlsx) to verify the update.

### postcode-mapping

If the original [CG_POSTCODE_2011_GCCSA_2011](/postcode-mapping/CG_POSTCODE_2011_GCCSA_2011.xls) updated, please do update the [input_au_postcode.xlsx](/postcode-mapping/input_au_postcode.xlsx) and re-run `npm run start:postcode-mapping` under `postcode-mapping` folder to obtain new rules. 