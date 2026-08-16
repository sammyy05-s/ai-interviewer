# AI Interviewer — Production Interview Platform

A comprehensive, production-quality web application for conducting, analyzing, and scoring AI-powered interviews with real-time speech recognition, intelligent answer analysis, and detailed psychometric assessment.

## Features

### Core Interview Experience
- **Real-time speech-to-text transcription** using the Web Speech Recognition API
- **Live transcript display** with interim and final transcripts
- **Automatic pause detection** — identifies when the candidate has finished speaking
- **Professional UI** with status indicators, microphone controls, and progress tracking
- **5 contextual interview questions** covering behavioral, technical, and situational domains

### Answer Analysis
- **Transcript Processing**
  - Raw transcript capture from speech recognition
  - Automatic cleaning and punctuation
  - Sentence boundary detection
  - Capitalization and grammar correction

- **Communication Metrics**
  - Words per minute (speaking pace)
  - Filler word detection and frequency analysis
  - Vocabulary diversity measurement
  - Sentence length analysis
  - Repeated word identification

- **STAR Structure Analysis** (for behavioral questions)
  - Situation detection
  - Task/goal identification
  - Action/implementation analysis
  - Result/outcome assessment

- **Content Evaluation**
  - Relevance scoring to question
  - Completeness assessment
  - Technical depth analysis
  - Specificity and example usage evaluation

### Interview Engine
- **Dynamic question progression** through 5 curated questions
- **Interview state management** tracking questions, answers, and topics
- **Scoring system** across six categories:
  - Technical Knowledge
  - Communication
  - Problem Solving
  - Behavioral Responses
  - Answer Relevance
  - Structured Thinking

### Results & Feedback
- **Overall Interview Score** (0-100)
- **Category Breakdown** with individual scores and progress bars
- **Detailed Answer Analysis** for each question including:
  - Full transcript
  - Speech metrics
  - STAR structure breakdown
  - Strengths and weaknesses
  - Personalized recommendations

- **Candidate Feedback**
  - Observable communication indicators
  - Specific, actionable recommendations
  - Strength-based feedback
  - Areas for improvement with explanations

### Privacy & Consent
- **Clear consent screen** explaining data collection
- **Microphone permission** requested explicitly
- **Optional camera access** (prepared for future enhancement)
- **Data transparency** about processing and storage

## Getting Started

### Prerequisites
- Modern web browser with Web Speech Recognition support (Chrome, Edge, Opera, Safari 14.1+)
- No backend server required — runs entirely in the browser

### Installation

#### Option 1: Direct HTML File
1. Download or copy `index.html` to your computer
2. Open it in a modern web browser
3. Grant microphone permission when prompted
4. Begin the interview

#### Option 2: Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js http-server
npx http-server -p 8000

# Using Ruby
ruby -run -ehttpd . -p8000
```

Then navigate to `http://localhost:8000/index.html`

#### Option 3: React Development Environment
1. Copy the `ai-interviewer.jsx` file into a React project
2. Install dependencies: `npm install react react-dom`
3. Import and use as a component:
```jsx
import AIInterviewerApp from './ai-interviewer';

export default function App() {
  return <AIInterviewerApp />;
}
```

## Usage

### Interview Flow

1. **Consent Screen** → Review privacy policy and grant permissions
2. **Interview** → Answer 5 questions verbally
   - Click the microphone button to start recording
   - Speak naturally; transcript updates in real-time
   - When you pause for more than ~4 seconds, a prompt appears
   - Click "Submit Answer" to move to the next question
3. **Results** → Review comprehensive feedback and scoring

### Tips for Candidates
- Speak clearly and naturally
- Pause deliberately between thoughts instead of using filler words
- Provide specific examples in behavioral questions
- Include the Situation, Task, Action, and Result when answering behavioral questions
- Take your time — longer, more complete answers score better
- Try to maintain a consistent speaking pace

## Technical Architecture

### Module Structure

```
ai-interviewer/
├── Speech Recognition Provider
│   └── Wrapper around browser Web Speech API
├── Transcript Processor
│   └── Cleaning, metrics calculation, and analysis
├── Answer Analyzer
│   ├── Relevance scoring
│   ├── Completeness evaluation
│   ├── Structure detection (STAR)
│   └── Communication analysis
├── Interview Engine
│   ├── Question management
│   ├── Answer tracking
│   ├── Score aggregation
│   └── Results generation
└── UI Components
    ├── Consent screen
    ├── Interview interface
    └── Results dashboard
```

### Key Classes

#### `SpeechRecognitionProvider`
Wraps the Web Speech Recognition API and provides:
- `start()` — Begin listening for speech
- `stop()` — Stop listening and finalize transcript
- `abort()` — Cancel current session
- `isSupported()` — Check browser compatibility
- Event callbacks for transcript updates

#### `TranscriptProcessor`
Handles text processing:
- `cleanTranscript(raw)` — Remove noise, add punctuation, capitalize
- `calculateMetrics(transcript, duration)` — Compute WPM, filler words, vocabulary
- `detectSTAR(transcript)` — Identify STAR structure elements
- `findRepeatedWords(transcript)` — Find frequently repeated words

#### `AnswerAnalyzer`
Evaluates responses:
- `analyzeAnswer(transcript, question)` — Comprehensive analysis
- `calculateRelevance(transcript, question)` — Relevance score
- `calculateCompleteness(transcript, question, star)` — Completeness score
- `calculateStructure(transcript, question)` — Structure evaluation
- `calculateCommunication(metrics)` — Communication quality
- `generateFeedback(...)` — Personalized feedback

#### `InterviewEngine`
Manages interview state:
- `getCurrentQuestion()` — Get active question
- `submitAnswer(transcript, analysis)` — Record answer and advance
- `hasMoreQuestions()` — Check if interview is complete
- `getResults()` — Generate final results object

### Data Flow

```
Candidate speaks
    ↓
Web Speech Recognition API captures audio
    ↓
SpeechRecognitionProvider emits interim + final transcripts
    ↓
UI displays real-time transcript
    ↓
Candidate pauses → Finish prompt appears
    ↓
Candidate clicks "Submit Answer"
    ↓
TranscriptProcessor cleans and analyzes transcript
    ↓
AnswerAnalyzer evaluates content and communication
    ↓
InterviewEngine stores answer and scores it
    ↓
Advance to next question or show results
```

## Speech Recognition API Details

### Browser Support
| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✓ | Full support, most reliable |
| Edge | ✓ | Full support |
| Safari | ✓ | iOS 14.5+, macOS 10.15+ |
| Firefox | ✗ | Not supported (use Sonnet model) |
| Opera | ✓ | Full support |

### Fallback Strategy
- Detects if speech recognition is available
- Graceful error message if unsupported
- All transcript processing works without external dependencies

## Scoring System

### Overall Score Calculation
```
Overall Score = (Content Score + Structure Score + Communication Score) / 3
```

### Content Score
- **Relevance** (40%) — How well the answer addresses the question
- **Completeness** (60%) — Amount of detail and coverage

### Structure Score
- **Opening** (30 pts) — Clear introduction
- **Body** (40 pts) — Multiple supporting sentences
- **Closing** (30 pts) — Conclusion or result statement
- **STAR bonus** (for behavioral) — Additional points for complete STAR structure

### Communication Score
```javascript
base = 100
- 15 pts if WPM > 180 (too fast)
- 15 pts if WPM < 80 (too slow)
- 20 pts if filler word frequency > 10%
- 10 pts if vocabulary diversity < 40%
final score = max(20, min(100, base))
```

### Metrics

**Speech Metrics:**
- Word count
- Words per minute (WPM)
- Filler word count and frequency
- Sentence count and average length
- Unique words (vocabulary size)
- Vocabulary diversity percentage

**Analysis Metrics:**
- Relevance score (0-100)
- Completeness score (0-100)
- Structure score (0-100)
- Communication score (0-100)
- STAR component detection (yes/no for each)

## Customization

### Adding Interview Questions

Edit the `INTERVIEW_QUESTIONS` array:

```javascript
const INTERVIEW_QUESTIONS = [
  {
    id: 1,
    type: 'behavioral',  // behavioral, technical, situational, hr, competency
    question: 'Your question here...',
    category: 'Category Name',
    followUpBased: false
  },
  // ... more questions
];
```

### Adjusting Scoring Weights

Modify `AnswerAnalyzer` methods:

```javascript
// Example: Change communication score weight
const contentScore = Math.round((relevanceScore * 0.5 + completenessScore * 0.5));
const overallScore = Math.round(
  (contentScore * 0.4 + structureScore * 0.3 + communicationScore * 0.3) / 3
);
```

### Customizing UI Colors

Change color values in component styles:
- `#0f172a` — Dark background
- `#1e293b` — Card background
- `#3b82f6` — Primary blue (buttons)
- `#10b981` — Success green
- `#ef4444` — Recording red
- `#f59e0b` — Warning amber

### Modifying Filler Words

Edit the `FILLER_WORDS` array:

```javascript
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', ...];
```

## Performance Considerations

- **Real-time processing** — All analysis happens in the browser
- **No server calls** — Reduces latency and bandwidth
- **Streaming output** — UI updates as speech is recognized
- **Efficient algorithms** — O(n) text processing, constant-time scoring
- **Memory efficient** — No storing of audio data

## Limitations & Future Enhancements

### Current Limitations
- Speech recognition requires internet connection (for most browsers)
- English-only by default (can be customized via `recognition.lang`)
- No backend integration (scores not persisted)
- Single-candidate, single-session per instance

### Planned Enhancements

**Phase 1: Data Persistence**
- Backend API for storing interview results
- Recruiter dashboard for viewing candidate results
- Interview history and analytics

**Phase 2: Advanced Analysis**
- Sentiment analysis of responses
- Technical question evaluation with domain expertise
- Follow-up question generation based on answers
- Skill matching and competency mapping

**Phase 3: Video & Behavioral Analysis**
- Optional camera integration
- Observable behavioral metrics (not psychological)
- Attention and engagement tracking
- Facial expression analysis (observable only)

**Phase 4: Psychometric Assessment**
- Structured personality questionnaire
- Cognitive assessment integration
- Style and preference assessment
- Bias-aware evaluation framework

**Phase 5: Multi-language Support**
- Language detection
- Multilingual interview support
- Translation of questions and feedback

## Privacy & Ethical Considerations

### Data Handling
- **Microphone access** — Requested explicitly; can be denied
- **No audio recording** — Only text transcripts are processed
- **Client-side processing** — Data doesn't leave your browser
- **Session-based** — Data cleared on page refresh
- **No tracking** — No analytics or identifiers

### Assessment Fairness
- **Observable metrics only** — No psychological diagnosis
- **Communication-focused** — Measures what was actually said
- **No bias in voice metrics** — Penalizes speaking pace, not accent
- **Clear explanations** — Candidates understand how they're scored
- **Transparent scoring** — All metrics are explainable

### Ethical Framework
This system avoids:
- ❌ Pseudoscientific voice analysis for personality/honesty
- ❌ Racial or cultural bias in communication standards
- ❌ Ability discrimination (works with screen readers, voice control)
- ❌ Diagnosis of mental health or psychological states
- ❌ Inference of competence from speech characteristics

## Troubleshooting

### Microphone Not Working
- Check browser permissions (Settings → Privacy → Microphone)
- Ensure microphone is connected and recognized by OS
- Try a different browser
- Refresh the page and grant permissions again

### Speech Not Being Recognized
- Speak more clearly and deliberately
- Reduce background noise
- Check internet connection (some APIs require it)
- Use a microphone closer to your mouth
- Try restarting the interview

### Transcript Seems Incomplete
- The Web Speech API requires internet connection
- Network latency can delay recognition
- Very soft speech may not be detected
- Microphone sensitivity may need adjustment

### Scoring Seems Unfair
- Scores are based on observable metrics only
- Review the feedback section for specific areas
- Consider re-recording with clearer speech
- Provide more specific examples in responses

## Technical Dependencies

### External Libraries
- **React 18.2+** — UI framework
- **Web Speech Recognition API** — Browser-native speech-to-text
- **Babel** — JavaScript transpilation (for development)

### Browser APIs Used
- `window.SpeechRecognition` or `window.webkitSpeechRecognition`
- `ReactDOM.createRoot`
- `JSON` for data serialization

### No External API Calls
- All processing happens in the browser
- No backend server required
- No third-party services needed

## File Structure

```
.
├── index.html              # Complete standalone HTML application
├── ai-interviewer.jsx      # React component (for integration)
└── README.md              # This file
```

## Development Setup

### Using React Development Environment
```bash
# Create a new React app
npx create-react-app ai-interviewer

# Copy ai-interviewer.jsx to src/
cp ai-interviewer.jsx src/

# Update src/App.jsx
import AIInterviewerApp from './ai-interviewer';
export default AIInterviewerApp;

# Start development server
npm start
```

### Environment Variables (Future)
```
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_API_KEY=your_key_here
REACT_APP_INTERVIEW_MODE=production|demo
```

## API Reference (for Backend Integration)

### Interview Engine Interface
```javascript
// Get current question
const question = interviewEngine.getCurrentQuestion();

// Submit an answer
interviewEngine.submitAnswer(cleanedTranscript, analysisObject);

// Check if more questions exist
const hasMore = interviewEngine.hasMoreQuestions();

// Get interview results
const results = interviewEngine.getResults();
```

### Results Object Structure
```javascript
{
  overallScore: 78,
  categoryScores: {
    'Technical Knowledge': 82,
    'Communication': 76,
    'Problem Solving': 84,
    'Behavioral Responses': 71,
    'Answer Relevance': 88,
    'Structured Thinking': 79
  },
  answers: [
    {
      questionId: 1,
      question: "...",
      transcript: "...",
      analysis: {
        overallScore: 78,
        contentScore: 75,
        structureScore: 82,
        communicationScore: 76,
        metrics: { ... },
        star: { ... },
        feedback: { ... }
      },
      timestamp: Date
    },
    // ... more answers
  ],
  completionPercentage: 100
}
```

## License

This project is provided as-is for educational and commercial use.

## Support & Contribution

For issues, feature requests, or contributions:
1. Test the application in your browser
2. Document any bugs with browser/OS information
3. Suggest improvements based on real interview experience
4. Consider ethical implications of any enhancements

## Disclaimer

This application is designed to **assist** in the interview process, not replace human judgment. Interview decisions should always be made by qualified hiring professionals after reviewing all candidate materials and ensuring compliance with employment laws.

The system measures **observable communication patterns**, not psychological states or personality. All scores are indicators of communication quality based on what was actually said, not inferences about character or competence.

---

**Built with attention to privacy, fairness, and transparency.**

Last Updated: 2026
Version: 1.0.0
