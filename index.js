const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');

function main(params) {

  let wa_apikey = "{your-watson-assisatant-api-key}";
  let wa_url = "{watson-assistant-url}";
  let wa_version = "{watson-assistant-version}";
  let assistantId = "{assistant-id-to-translate}";

  let lt_apikey = "{your-language-translator-api-key}";
  let lt_url = "{language-translator-url}";
  let lt_version = "{language-translator-version}";

  // variables for debugging
  let originalInput = "";
  let translatedInput = "";
  let originalOutput = "";
  let translatedOutput = "";

  const authenticatorWA = new IamAuthenticator({apikey: wa_apikey});
  const authenticatorLT = new IamAuthenticator({apikey: lt_apikey});

  const assistant = new AssistantV2({
    version: wa_version,
    authenticator: authenticatorWA,
    url: wa_url,
  });

  const languageTranslator = new LanguageTranslatorV3({
    version: lt_version,
    authenticator: authenticatorLT,
    url: lt_url,
  });

  let sessionId = "";

  // assign variables from input parameters, passed from Watson Assistant
  sessionId = params.session_id ? params.session_id : '';
  userUtter = params.user_utterance;
  originalInput = userUtter;
  language = params.language;

  const translateParams = {
    text: userUtter,
    modelId: language + "-en",
  };

  return new Promise((resolve, reject) => {
    assistant.createSession({
      assistantId: assistantId
    }).then(res => {
        sessionId = res.result.session_id;

        language = params.language;

        console.log("Input: ", userUtter);

        return languageTranslator.translate(translateParams)
    }).then(function (translationResult) {

      let englishTransl = translationResult.result.translations[0].translation;
      console.log("English input: ", englishTransl);
      translatedInput = englishTransl;

       return assistant.message({
         assistantId: assistantId,
         sessionId: sessionId,
         input: {
           'message_type': 'text',
           'text': englishTransl
           }
       });
    }).then(function(res) {
      console.log("English output: ", res.result.output.generic[0].text);
      originalOutput = res.result.output.generic[0].text;

      const translateParams = {
        text: res.result.output.generic[0].text,
        modelId: 'en-' + language,
      };

       return languageTranslator.translate(translateParams);

     }).then(function(translationResult) {
       console.log("Output translation: ", translationResult.result.translations[0].translation);
       translatedOutput = translationResult;
       // return only the translated message
       // return{"message":translationResult.result.translations[0].translation};

       // return translations every step of the way
       resolve({"message":translationResult.result.translations[0].translation, "originalInput": originalInput, "translatedInput": translatedInput, "originalOutput": originalOutput, "translatedOutput": translatedOutput});
     }).catch(function (err) {
       reject({"error": err});
       console.log("****error: ", err);
     });
   });
}

exports.main=main;

// This is for local testing
// main({sessionId: "", user_utterance: "¿Que puedes hacer?", language: "es"});