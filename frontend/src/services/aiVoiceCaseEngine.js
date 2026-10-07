/**
 * GramSaathi AI Voice Clinical Case-Taking & Solution Engine
 * Analyzes voice or text input across 8 Indian languages, conducts structured clinical case-taking,
 * and produces plain-language audio solutions + structured SOAP clinical notes.
 */

export const HEALTH_SOLUTIONS_DB = {
  FEVER_RESPIRATORY: {
    keywords: ["fever", "cough", "breath", "cold", "chest", "बुखार", "खांसी", "सांस", "ताप", "खोकला", "காய்ச்சல்", "இருமல்", "జ్వరం", "దగ్గు", "জ্বর", "কাশি", "તાવ", "ખાંસી", "ಜ್ವರ", "ಕೆಮ್ಮು"],
    redFlags: ["chest indrawing", "low oxygen", "breathlessness", "unable to talk", "stiff neck", "convulsions"],
    getSolution: (lang, isEmergency) => {
      const texts = {
        en: {
          spoken: isEmergency 
            ? "Emergency detected: Fast breathing or low oxygen indicates severe respiratory distress. Please visit Rampur 24x7 PHC immediately. Token generated. Keep the patient sitting upright."
            : "For mild fever and cough: Drink warm water, take adequate rest, and monitor temperature twice daily. If fever persists over 3 days or breathlessness develops, visit the clinic.",
          homeCare: [
            "Keep patient hydrated with warm fluids & safe boiled water.",
            "Elevate head with pillows if coughing worsens at night.",
            "Do NOT give aspirin to young children; use paracetamol syrup only as per doctor weight dosage.",
            "Watch for danger signs: Blue lips, chest indrawing, or fast breathing."
          ]
        },
        hi: {
          spoken: isEmergency
            ? "अति आवश्यक: तेज सांस चलना या ऑक्सीजन कम होना फेफड़ों के गंभीर संक्रमण का संकेत है। कृपया तुरंत स्वास्थ्य केंद्र जाएं। आपका टोकन तैयार है।"
            : "हल्के बुखार और खांसी के लिए: गुनगुना पानी पिएं, पूरा आराम करें और दिन में दो बार तापमान नापें। यदि 3 दिन से अधिक बुखार रहे तो डॉक्टर को दिखाएं।",
          homeCare: [
            "गुनगुना पानी और तुलसी-अदरक का काढ़ा पिएं।",
            "बच्चे के सिर को थोड़ा ऊंचा रखकर सुलाएं।",
            "खतरे के संकेत: पसलियां चलना, होंठ नीले पड़ना या अत्यधिक सुस्ती होने पर तुरंत अस्पताल जाएं।"
          ]
        },
        mr: {
          spoken: isEmergency
            ? "तातडीची सूचना: जलद श्वास किंवा ऑक्सिजन कमी असणे न्यूमोनियाचे लक्षण असू शकते. कृपया त्वरित प्राथमिक आरोग्य केंद्रात जा."
            : "ताप आणि खोकल्यासाठी: कोमट पाणी प्या, पुरेशी विश्रांती घ्या आणि दिवसातून दोनदा ताप तपासा. लक्षणे वाढल्यास डॉक्टरांचा सल्ला घ्या.",
          homeCare: [
            "कोमट पाणी आणि द्रवपदार्थ भरपूर प्या.",
            "खोकला जास्त असल्यास वाफ घ्या आणि विश्रांती घ्या.",
            "धोक्याची लक्षणे आढळल्यास लगेच आरोग्य केंद्रात जा."
          ]
        },
        ta: {
          spoken: isEmergency
            ? "அவசர எச்சரிக்கை: வேகமான சுவாசம் கடுமையான நுரையீரல் தொற்றுக்கான அறிகுறியாகும். உடனடியாக அரசு மருத்துவமனைக்குச் செல்லவும். உங்கள் டோக்கன் தயார்."
            : "மிதமான காய்ச்சல் மற்றும் இருமலுக்கு: வெதுவெதுப்பான நீர் அருந்தவும், ஓய்வெடுக்கவும். 3 நாட்களுக்கு மேல் காய்ச்சல் நீடித்தால் மருத்துவரை அணுகவும்.",
          homeCare: [
            "வெதுவெதுப்பான நீர் மற்றும் கஞ்சி உணவுகளை உட்கொள்ளுங்கள்.",
            "குழந்தைகளுக்கு ஆஸ்பிரின் கொடுக்க வேண்டாம்.",
            "சுவாச பிரச்சனை ஏற்பட்டால் உடனடியாக மருத்துவமனைக்கு செல்லவும்."
          ]
        },
        te: {
          spoken: isEmergency
            ? "అత్యవసర హెచ్చరిక: వేగంగా శ్వాస తీసుకోవడం ఊపిరితిత్తుల సంక్రమణను సూచిస్తుంది. దయచేసి వెంటనే ఆరోగ్య కేంద్రానికి వెళ్లండి. మీ టోకెన్ సిద్ధంగా ఉంది."
            : "తేలికపాటి జ్వరం మరియు దగ్గు కోసం: గోరువెచ్చని నీరు త్రాగండి, విశ్రాంతి తీసుకోండి. 3 రోజుల కంటే ఎక్కువ జ్వరం ఉంటే వైద్యుడిని సంప్రదించండి.",
          homeCare: [
            "గోరువెచ్చని నీరు మరియు పోషకాహారం తీసుకోండి.",
            "పిల్లలకు వైద్యుల సలహా మేరకే మందులు వాడండి.",
            "శ్వాస ఆడకపోతే వెంటనే ఆసుపత్రికి వెళ్ళండి."
          ]
        },
        bn: {
          spoken: isEmergency
            ? "জরুরি সতর্কতা: দ্রুত শ্বাস নেওয়া ফুসফুসের মারাত্মক সংক্রমণের লক্ষণ। অনুগ্রহ করে অবিলম্বে স্বাস্থ্যকেন্দ্রে যান। আপনার টোকেন প্রস্তুত।"
            : "হালকা জ্বর ও কাশির জন্য: হালকা গরম জল খান, বিশ্রাম নিন। ৩ দিনের বেশি জ্বর থাকলে ডাক্তারের পরামর্শ নিন।",
          homeCare: [
            "হালকা গরম জল ও তরল খাবার খান।",
            "শ্বাসকষ্ট বা ঠোঁট নীল হলে অবিলম্বে হাসপাতালে যান।"
          ]
        },
        gu: {
          spoken: isEmergency
            ? "તાત્કાલિક ચેતવણી: ઝડપી શ્વાસ અથવા ઓક્સિજન ઓછો હોવો ન્યુમોનિયા હોઈ શકે છે. કૃપા કરીને તાત્કાલિક PHC હોસ્પિટલ જાઓ."
            : "સામાન્ય તાવ અને ખાંસી માટે: નવશેકું પાણી પીવો, આરામ કરો અને દિવસમાં બે વાર તાપમાન માપો.",
          homeCare: [
            "ગરમ પાણી અને પ્રવાહી ખોરાક લો.",
            "જો શ્વાસ લેવામાં તકલીફ થાય તો તરત જ ડૉક્ટર પાસે જાઓ."
          ]
        },
        kn: {
          spoken: isEmergency
            ? "ತುರ್ತು ಎಚ್ಚರಿಕೆ: ವೇಗವಾದ ಉಸಿರಾಟವು ತೀವ್ರ ಶ್ವಾಸಕೋಶದ ಸೋಂಕಿನ ಲಕ್ಷಣವಾಗಿದೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ."
            : "ಸೌಮ್ಯ ಜ್ವರ ಮತ್ತು ಕೆಮ್ಮಿಗೆ: ಬೆಚ್ಚಗಿನ ನೀರನ್ನು ಕುಡಿಯಿರಿ, ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ. 3 ದಿನಗಳಿಗಿಂತ ಹೆಚ್ಚು ಜ್ವರವಿದ್ದರೆ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.",
          homeCare: [
            "ಬೆಚ್ಚಗಿನ ನೀರು ಮತ್ತು ಪೌಷ್ಟಿಕ ಆಹಾರ ಸೇವಿಸಿ.",
            "ಉಸಿರಾಟದ ತೊಂದರೆ ಕಂಡುಬಂದರೆ ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ."
          ]
        }
      };
      return texts[lang] || texts.en;
    }
  },

  DIARRHOEA_WATERBORNE: {
    keywords: ["diarrhoea", "vomit", "stomach", "loose motions", "watery", "दस्त", "उल्टी", "पेट दर्द", "जुलाब", "வாந்தி", "வயிற்றுப்போக்கு", "విరేచనాలు", "వాంతులు", "ডায়রিয়া", "বমি", "ઝાડા", "ઉલટી", "ಭೇದಿ", "ವಾಂತಿ"],
    redFlags: ["sunken eyes", "unable to drink", "blood in stool", "lethargic", "skin pinch slow"],
    getSolution: (lang, isEmergency) => {
      const texts = {
        en: {
          spoken: isEmergency
            ? "Urgent warning: Severe dehydration detected with vomiting and sunken eyes. Start ORS immediately and visit the PHC for IV fluid stabilization."
            : "For mild diarrhoea: Mix 1 packet of ORS in 1 litre of clean drinking water. Drink after every loose motion. Continue zinc tablets for 14 days.",
          homeCare: [
            "Oral Rehydration Salts (ORS): 1 packet in 1 litre clean boiled water.",
            "Zinc supplements (20mg daily for children > 6 months for 14 days).",
            "Continue breastfeeding and light khichdi / banana diet.",
            "Do NOT give anti-diarrhoeal pills to children without doctor prescription."
          ]
        },
        hi: {
          spoken: isEmergency
            ? "गंभीर चेतावनी: अत्यधिक दस्त और उल्टी से शरीर में पानी की भारी कमी हो गई है। तुरंत ओआरएस घोल पिलाएं और स्वास्थ्य केंद्र ले जाएं।"
            : "दस्त के उपचार के लिए: 1 लीटर साफ पानी में 1 पैकेट ओआरएस घोलें। हर बार दस्त के बाद 1 कप पिलाएं और 14 दिनों तक जिंक की गोली दें।",
          homeCare: [
            "ओआरएस (ORS) घोल: 1 पैकेट 1 लीटर उबले और ठंडे पानी में।",
            "14 दिनों तक रोजाना जिंक की गोली जरूर दें।",
            "दाल का पानी, पतली खिचड़ी और छाछ दें। स्तनपान जारी रखें।"
          ]
        },
        mr: {
          spoken: isEmergency
            ? "गंभीर इशारा: शरीरातील पाणी कमी झाले आहे. तातडीने ओआरएस द्या आणि रुग्णाला जवळच्या प्राथमिक आरोग्य केंद्रात घेऊन जा."
            : "जुलाब आणि उलटीसाठी: १ लिटर स्वच्छ पाण्यात १ पाकीट ओआरएस मिसळा. प्रत्येक जुलाबानंतर पाणी द्या आणि १४ दिवस झिंकची गोळी द्या.",
          homeCare: [
            "ओआरएस (ORS) पाणी सतत देत राहा.",
            "मुलांना १४ दिवस नियमित झिंकच्या गोळ्या द्या.",
            "मऊ भात, ताक आणि मुगाचे वरण द्या."
          ]
        },
        ta: {
          spoken: isEmergency
            ? "அவசர எச்சரிக்கை: உடலில் நீர்ச்சத்து மிகக் குறைந்துள்ளது. உடனடியாக ORS கரைசல் கொடுத்து மருத்துவமனைக்கு அழைத்துச் செல்லவும்."
            : "வயிற்றுப்போக்கிற்கு: 1 லிட்டர் சுத்தமான நீரில் 1 பாக்கெட் ORS கலந்து குடிக்கவும். 14 நாட்களுக்கு ஜிங்க் மாத்திரைகள் கொடுக்கவும்.",
          homeCare: [
            "ORS கரைசல் தொடர்ந்து கொடுக்கவும்.",
            "14 நாட்களுக்கு ஜிங்க் மாத்திரை வழங்கவும்.",
            "தாய்ப்பால் மற்றும் கஞ்சி உணவுகளைத் தொடரவும்."
          ]
        },
        te: {
          spoken: isEmergency
            ? "అత్యవసర హెచ్చరిక: శరీరంలో నీటిశాతం తగ్గింది. వెంటనే ORS ద్రావణం ఇచ్చి ఆసుపత్రికి తీసుకెళ్లండి."
            : "విరేచనాల నివారణకు: 1 లీటరు స్వచ్ఛమైన నీటిలో 1 ప్యాకెట్ ORS కలపండి. 14 రోజుల పాటు జింక్ మాత్రలు వేయండి.",
          homeCare: [
            "ORS ద్రావణాన్ని క్రమం తప్పకుండా తాగించండి.",
            "14 రోజుల పాటు జింక్ మాత్రలు ఇవ్వండి.",
            "తేలికపాటి ఆహారం మరియు పాలు ఇవ్వడం కొనసాగించండి."
          ]
        },
        bn: {
          spoken: isEmergency
            ? "জরুরি সতর্কতা: শরীরে মারাত্মক জলশূন্যতা দেখা দিয়েছে। অবিলম্বে ওআরএস খাওয়ান এবং হাসপাতালে নিয়ে যান।"
            : "ডায়রিয়ার জন্য: ১ লিটার পরিষ্কার জলে ১ প্যাকেট ওআরএস গুলিয়ে খাওয়ান এবং ১৪ দিন জিঙ্ক ট্যাবলেট দিন।",
          homeCare: [
            "ওআরএস জল নিয়মিত খাওয়ান।",
            "১৪ দিন জিঙ্ক ট্যাবলেট দিন।",
            "পাতলা খিচুড়ি ও ডাবের জল দিন।"
          ]
        },
        gu: {
          spoken: isEmergency
            ? "તાત્કાલિક ચેતવણી: શરીરમાં પાણી ઘટી ગયું છે. તાત્કાલિક ORS આપો અને PHC હોસ્પિટલ પહોંચો."
            : "ઝાડા-ઉલટી માટે: ૧ લિટર ચોખ્ખા પાણીમાં ૧ પેકેટ ORS ઓગાળીને આપો અને ૧૪ દિવસ ઝિંકની ગોળી આપો.",
          homeCare: [
            "ORS નું પાણી સતત પીવડાવો.",
            "૧૪ દિવસ સુધી ઝિંક ટેબ્લેટ આપો.",
            "હળવો ખોરાક અને છાશ આપો."
          ]
        },
        kn: {
          spoken: isEmergency
            ? "ತುರ್ತು ಎಚ್ಚರಿಕೆ: ನಿರ್ಜಲೀಕರಣ ಉಂಟಾಗಿದೆ. ತಕ್ಷಣ ORS ದ್ರಾವಣ ನೀಡಿ ಆಸ್ಪತ್ರೆಗೆ ಕರೆದೊಯ್ಯಿರಿ."
            : "ಭೇದಿ ಮತ್ತು ವಾಂತಿಗೆ: 1 ಲೀಟರ್ ನೀರಿಗೆ 1 ಪ್ಯಾಕೆಟ್ ORS ಬೆರೆಸಿ ಕುಡಿಸಿ ಮತ್ತು 14 ದಿನಗಳವರೆಗೆ ಜಿಂಕ್ ಮಾತ್ರೆ ನೀಡಿ.",
          homeCare: [
            "ORS ದ್ರಾವಣವನ್ನು ನಿಯಮಿತವಾಗಿ ನೀಡಿ.",
            "14 ದಿನಗಳವರೆಗೆ ಜಿಂಕ್ ಮಾತ್ರೆಗಳನ್ನು ನೀಡಿ.",
            "ಹಗುರವಾದ ಆಹಾರ ಮತ್ತು ಮಜ್ಜಿಗೆ ನೀಡಿ."
          ]
        }
      };
      return texts[lang] || texts.en;
    }
  }
};

/**
 * Parses user clinical voice input and extracts structured SOAP summary
 */
export function analyzeCaseInput(transcriptText, selectedLang = 'en', patientData = null) {
  const text = transcriptText.toLowerCase();

  // 1. Detect Syndrome Category
  let categoryKey = "FEVER_RESPIRATORY";
  if (text.includes("diarrhoea") || text.includes("vomit") || text.includes("stomach") || text.includes("दस्त") || text.includes("उल्टी") || text.includes("जुलाब") || text.includes("વાંતી") || text.includes("విరేచనాలు") || text.includes("বমি")) {
    categoryKey = "DIARRHOEA_WATERBORNE";
  }

  const categoryConfig = HEALTH_SOLUTIONS_DB[categoryKey];

  // 2. Check Red Flags
  const detectedRedFlags = [];
  categoryConfig.redFlags.forEach(rf => {
    if (text.includes(rf) || text.includes("fast") || text.includes("तेज") || text.includes("सांस") || text.includes("blood") || text.includes("खून") || text.includes("कमजोरी") || text.includes("অক্সিজেন")) {
      detectedRedFlags.push(rf);
    }
  });

  const isEmergency = detectedRedFlags.length > 0 || text.includes("emergency") || text.includes("danger") || text.includes("गंभीर");
  const severity = isEmergency ? "RED" : text.includes("days") || text.includes("दिन") || text.includes("moderate") ? "YELLOW" : "GREEN";

  const solutionObj = categoryConfig.getSolution(selectedLang, isEmergency);

  // 3. Extract Duration
  let duration = "2-3 Days";
  if (text.includes("1 day") || text.includes("आज") || text.includes("today")) duration = "1 Day (Acute)";
  else if (text.includes("week") || text.includes("हफ्ता") || text.includes("সপ্তাহ")) duration = "> 7 Days (Persistent)";
  else if (text.includes("days") || text.includes("दिन")) duration = "3-4 Days";

  // 4. Build Structured Clinical SOAP Note
  const pName = patientData?.name || "Aarav Kumar";
  const pAge = patientData?.ageYears ? `${patientData.ageYears} Years` : "3 Years";

  const soapNote = {
    patientName: pName,
    age: pAge,
    chiefComplaint: transcriptText || "Acute febrile illness with respiratory distress",
    duration,
    detectedRedFlags: detectedRedFlags.length > 0 ? detectedRedFlags : ["No active critical red flags detected"],
    triageSeverity: severity,
    differentialDiagnosis: categoryKey === "FEVER_RESPIRATORY" 
      ? (isEmergency ? "Severe Acute Respiratory Infection (SARI) / Suspected Paediatric Pneumonia" : "Upper Respiratory Tract Viral Infection")
      : (isEmergency ? "Acute Gastroenteritis with Moderate-to-Severe Dehydration (Cholera / Rotavirus suspect)" : "Acute Watery Diarrhoea without Dehydration"),
    spokenSolution: solutionObj.spoken,
    homeCarePlan: solutionObj.homeCare,
    recommendedOpdRoom: severity === "RED" ? "Room 1 (Emergency Triage)" : "Room 2 (General OPD)",
    tokenEstimatedWaitMins: severity === "RED" ? 2 : 12,
    generatedAt: new Date().toISOString()
  };

  return soapNote;
}
