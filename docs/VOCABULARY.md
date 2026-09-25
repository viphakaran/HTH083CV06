# LowKeySigns — Service Desk Vocabulary Specification
**Problem ID**: HTH-CV-09 (Accessibility-First Sign Language Communication Bridge)  
**Hackathon**: HTH — Hack the Horizon  

---

## 1. Vocabulary Design Strategy

The underlying 1D-CNN + Transformer model outputs 250 classes from the Google Isolated Sign Language Recognition (GISLR) benchmark. For a public service counter MVP (hospital triage, bank help desk, civic municipal center), exposing 250 unweighted classes introduces recognition ambiguity and cognitive overload.

LowKeySigns implements an **active vocabulary filter** of **23 high-priority service signs**, mapped to conversational multi-lingual phrases in English, Tamil, and Hindi.

---

## 2. Active Vocabulary Directory (23 Signs)

| Token | Category | English Natural Phrase | Tamil Translation | Hindi Translation |
| :--- | :--- | :--- | :--- | :--- |
| `wait` | Service Navigation | "Please wait a moment." | "தயவுசெய்து சிறிது நேரம் காத்திருங்கள்." | "कृपया एक क्षण प्रतीक्षा करें।" |
| `time` | Service Navigation | "What time is it? / How long will this take?" | "மணி என்ன? / எவ்வளவு நேரம் ஆகும்?" | "क्या समय हुआ है? / इसमें कितना समय लगेगा?" |
| `sick` | Medical / Triage | "I am feeling sick / unwell." | "எனக்கு உடல்நலக்குறைவாக உள்ளது." | "मेरी तबियत ठीक नहीं है।" |
| `owie` | Medical / Triage | "I am in physical pain / injured." | "எனக்கு வலி அதிகமாக உள்ளது." | "मुझे दर्द हो रहा है।" |
| `police` | Emergency / Security | "I need police assistance immediately." | "எனக்கு உடனடியாக காவல் உதவி தேவை." | "मुझे तुरंत पुलिस सहायता चाहिए।" |
| `fireman` | Emergency / Security | "Report a fire / call fire emergency." | "தீயணைப்பு வீரரை அழைக்கவும்." | "दमकल को बुलाएं।" |
| `callonphone`| Service Navigation | "Please make a phone call for me." | "தயவுசெய்து ஒரு தொலைபேசி அழைப்பு செய்யுங்கள்." | "कृपया मेरे लिए एक फ़ोन कॉल करें।" |
| `water` | Essential Needs | "May I please have drinking water?" | "தயவுசெய்து குடிக்க தண்ணீர் கிடைக்குமா?" | "क्या मुझे पीने का पानी मिल सकता है?" |
| `pen` | Administrative | "Do you have a pen I can use?" | "எழுத பேனா கிடைக்குமா?" | "क्या आपके पास पेन है?" |
| `pencil` | Administrative | "I need a pencil to fill out this form." | "படிவத்தை நிரப்ப பென்சில் வேண்டும்." | "मुझे फ़ॉर्म भरने के लिए पेंसिल चाहिए।" |
| `where` | Inquiry | "Where should I go next?" | "நான் அடுத்து எங்கு செல்ல வேண்டும்?" | "मुझे आगे कहाँ जाना चाहिए?" |
| `who` | Inquiry | "Who should I speak with?" | "நான் யாரிடம் பேச வேண்டும்?" | "मुझे किससे बात करनी चाहिए?" |
| `why` | Inquiry | "Why is there an issue with my request?" | "ஏன் இந்த பிரச்சனை?" | "यह समस्या क्यों है?" |
| `person` | Administrative | "I need to speak with an official." | "நான் ஒரு அதிகாரியிடம் பேச வேண்டும்." | "मुझे किसी अधिकारी से बात करनी चाहिए।" |
| `hello` | Courtesies | "Hello, good day!" | "வணக்கம்!" | "नमस्ते!" |
| `bye` | Courtesies | "Goodbye, thank you!" | "சென்று வருகிறேன், நன்றி!" | "अलविदा, धन्यवाद!" |
| `please` | Courtesies | "Please help me." | "தயவுசெய்து எனக்கு உதவுங்கள்." | "कृपया मेरी सहायता करें।" |
| `thankyou` | Courtesies | "Thank you very much." | "மிக்க நன்றி." | "बहुत बहुत धन्यवाद।" |
| `yes` | Affirmation | "Yes, that is correct." | "ஆம், அது சரி." | "हाँ, यह सही है।" |
| `no` | Negation | "No, that is not correct." | "இல்லை, அது தவறு." | "नहीं, यह सही नहीं है।" |
| `finish` | Status | "I have completed this step / form." | "நான் இதை முடித்துவிட்டேன்." | "मैंने यह पूरा कर लिया है।" |
| `now` | Temporal | "I need this processed right now." | "எனக்கு இது உடனே தேவை." | "मुझे यह अभी चाहिए।" |
| `tomorrow` | Temporal | "Will this be ready by tomorrow?" | "இது நாளைக்குள் தயாராகிவிடுமா?" | "क्या यह कल तक तैयार हो जाएगा?" |

---

## 3. Dynamic Configuration

The active vocabulary is fully decoupled from model code via `config/vocabulary.json`. To introduce new classes from the 250-class model pool, administrators simply append new tokens and localized phrase templates to the JSON configuration without retraining or recompiling.
