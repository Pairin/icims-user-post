'use strict';
const fetch = require('node-fetch');
const { resolve } = require('./path-resolver.js');
const chalk = require('chalk');
let ERRORS = [];

const EXTERNAL_AUTH = process.env.EXTERNAL_AUTH || 'gX0Vv3tYWXrBDoj7Hmul4w';
const EXTERNAL_URI = process.env.EXTERNAL_URI || 'https://ext.staging.pairin.com/queries'
const ICIMS_USERNAME = process.env.ICIMS_USERNAME || 'PairinAPIuser';
const ICIMS_PASSWORD = process.env.ICIMS_PASSWORD || 'Live!2019*';
const ICIMS_BASE_URI = process.env.ICIMS_BASE_URI || 'https://api.icims.com/';

const logErrors = () => {
  for(const error of ERRORS) {
    console.log(chalk.red(JSON.stringify(error)))
  }
}

const doRequest = async (endPoint, method, headers, logInfo, body={}) => {
  console.log(chalk.yellowBright(`=== Starting ${method} to ${logInfo} ===`))

  const requestInformation =  { method, headers, body };
  if (!Object.keys(body).length) delete requestInformation.body;
  const requestData = await fetch(endPoint, requestInformation).then(res => res.json())
    .catch(e => ERRORS.push({error: [method, endPoint, e] }));

  if (resolve(requestData, 'errors', [''])[0] != ''){
    ERRORS.push({error: [method, endPoint, requestData] })
  }

  if (ERRORS.length) {
    logErrors();
    return null;
  }

  console.log(chalk.green(`=== Completed ${method} to ${logInfo}=== \n \n`), JSON.stringify(requestData), '\n')
  return requestData;
}

const checkForIntegration = async (assessmentId) => {
  const assessmentData = await doRequest(EXTERNAL_URI,
    "POST",
    { 'authorization': EXTERNAL_AUTH, 'Content-Type': 'application/json'},
    "PAIRIN for assessment data",
    JSON.stringify({
      "query" : `{ assessment( id: ${assessmentId} ) { user { id email } openings { id name settings { integration_type integration_id } applications { results { opening_match_score opening_match_report { url } user { id } } } } } }`
    })
  );
  return determineIntegrationType(assessmentData);
}

const determineIntegrationType = (assessmentData) => {
  let integration = 'none';
  const opening = resolve(assessmentData, 'data/assessment/openings', [])[resolve(assessmentData, 'data/assessment/openings', []).length -1];
  if (opening) {
    if (resolve(opening, `settings/integration_type`, null) != null) integration = resolve(opening, 'settings/integration_type', null);
  }

  return {
    integration,
    user: resolve(assessmentData, 'data/assessment/user', {}),
    opening
  }
}

const sentDataToIcims = async (assessmentData) => {
  const auth = { Authorization: `Basic ${Buffer.from(`${ICIMS_USERNAME}:${ICIMS_PASSWORD}`).toString('base64')}`}
  const searchJsonForApplicant = { "filters": [{ "name" : "applicantworkflow.person.email", "value": [`${assessmentData.user.email}`]}]}

  const applicantWorkFlowUrl = await doRequest(
    `${ICIMS_BASE_URI}customers/${resolve(assessmentData, 'opening/settings/integration_id', 0)}/search/applicantworkflows?searchJson=${encodeURIComponent(JSON.stringify(searchJsonForApplicant))}`,
    "GET",
    auth,
    "iCIMS for applicant workflow url"
  );

  if (applicantWorkFlowUrl == null) return;

  const userMatchScoreData = resolve(assessmentData, 'opening/applications/results' , []).find(c => c.user.id == assessmentData.user.id)
  const postAssessmentResults = await doRequest(
    `${resolve(applicantWorkFlowUrl, 'searchResults/0/self')}/fields/assessmentresults`,
    "POST",
    { Authorization: `Basic ${Buffer.from(`${ICIMS_USERNAME}:${ICIMS_PASSWORD}`).toString('base64')}`, "Content-Type" : "application/json" },
    "iCIMS for assessment status and score",
    `{ "assessmentname": { "id": "C31649", "value": "Pairin Assessment" },
       "assessmentstatus": { "id": "D37002019001", "value": "Complete" },
       "assessmentscore": ${resolve(userMatchScoreData, 'opening_match_score', 0)} }`
  )

  if (postAssessmentResults == null) {
    return;
  }
  console.log(chalk.green("=== 🎊 Assessment data sent to Icims, integration complete 🎊 ==="))
}


const ProcessRecord = async (record) => {
  console.log(chalk.yellowBright(`=== Recieved event information: "${JSON.stringify(record)}" ===`))

  const assessmentId = Number(JSON.parse(resolve(record, 'Sns/Message', '{"assessment_id": "0"}')).assessment_id)
  const assessmentData = await checkForIntegration(assessmentId)

  console.log(chalk.yellowBright(`=== Checking for integration for "${assessmentData.integration}" ===`))
  if (assessmentData.integration == 'none') {
    console.log(chalk.yellowBright("=== Integration not found, exiting ==="))
    return;
  }

  console.log(chalk.green("=== Integration found  ===", assessmentData.integration))
  await resolve(INTEGRATIONS, `${assessmentData.integration}`, ()=>{console.log('integration not specified')})(assessmentData);


  ERRORS.length
    ? logErrors()
    : console.log(chalk.green("=== Lambda Terminated  ==="))
}


module.exports.run = async (event) => {
  const records = resolve(event, 'Records', []);
  await Promise.all(records.map(r=>ProcessRecord(r)))
};

const INTEGRATIONS = {
  ['icims']: sentDataToIcims
}
