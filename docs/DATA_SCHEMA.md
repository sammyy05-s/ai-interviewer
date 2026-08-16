# AI Interviewer — Data Schema & Configuration

Complete data model specifications for backend integration, database design, and API contracts.

## Data Models

### User
Represents a candidate or interviewer using the platform.

```javascript
{
  id: String (UUID),
  type: 'candidate' | 'recruiter' | 'admin',
  email: String (unique),
  firstName: String,
  lastName: String,
  phone: String (optional),
  profileImageUrl: String (optional),
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: DateTime (soft delete),
  consentGiven: Boolean,
  consentTimestamp: DateTime,
  dataRetentionDays: Number (default: 90),
  preferences: {
    language: String (default: 'en-US'),
    timezone: String,
    emailNotifications: Boolean
  }
}
```

### InterviewSession
Represents a single interview instance.

```javascript
{
  id: String (UUID),
  interviewTemplateId: String (foreign key),
  candidateId: String (foreign key),
  recruiterId: String (foreign key, optional),
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled',
  
  // Timing
  startedAt: DateTime,
  pausedAt: DateTime (optional),
  completedAt: DateTime (optional),
  totalDuration: Number (seconds),
  
  // Results
  overallScore: Number (0-100),
  categoryScores: {
    [categoryName: String]: Number (0-100)
  },
  
  // Metadata
  browserInfo: {
    userAgent: String,
    language: String,
    timezone: String
  },
  
  // Consent & Privacy
  consentDetails: {
    microphoneAllowed: Boolean,
    cameraAllowed: Boolean,
    audioRecordingAllowed: Boolean,
    timestamp: DateTime
  },
  
  // Audio/Recording References
  audioStorageUrl: String (optional, if audio is stored),
  recordingReference: String (optional),
  
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: DateTime (soft delete)
}
```

### InterviewTemplate
Defines the structure and questions for an interview.

```javascript
{
  id: String (UUID),
  name: String,
  description: String,
  type: 'general' | 'technical' | 'behavioral' | 'competency' | 'custom',
  
  // Question Configuration
  questionIds: String[] (array of InterviewQuestion IDs),
  questionCount: Number,
  estimatedDuration: Number (minutes),
  
  // Settings
  allowPauseDetection: Boolean (default: true),
  pauseThresholdSeconds: Number (default: 4),
  followUpEnabled: Boolean (default: false),
  randomizeQuestions: Boolean (default: false),
  
  // Scoring Configuration
  scoringTemplate: {
    categories: String[] (array of category names),
    weights: { [categoryName: String]: Number },
    passingScore: Number (default: 70)
  },
  
  // Access Control
  organizationId: String (foreign key),
  createdBy: String (foreign key, User ID),
  isPublic: Boolean,
  isArchived: Boolean,
  
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### InterviewQuestion
A single question in an interview.

```javascript
{
  id: String (UUID),
  templateId: String (foreign key),
  
  // Content
  questionText: String,
  description: String (optional context/instructions),
  
  // Classification
  type: 'behavioral' | 'technical' | 'situational' | 'hr' | 'competency' | 'project_based',
  category: String (e.g., 'Communication', 'Problem Solving', 'Technical Knowledge'),
  difficulty: 'entry' | 'mid' | 'senior',
  
  // Evaluation Guidance
  expectedElements: String[] (array of elements to look for),
  evaluationCriteria: {
    minLength: Number (words),
    requiredKeywords: String[],
    preferredStructure: 'STAR' | 'structured' | 'narrative' | 'technical'
  },
  
  // STAR Specific (for behavioral questions)
  enableSTARAnalysis: Boolean,
  
  // Metadata
  createdBy: String (User ID),
  usageCount: Number,
  averageScore: Number,
  sequenceNumber: Number (order in interview),
  
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### CandidateAnswer
A candidate's response to a question.

```javascript
{
  id: String (UUID),
  sessionId: String (foreign key),
  questionId: String (foreign key),
  candidateId: String (foreign key),
  
  // Transcripts
  rawTranscript: String,
  cleanTranscript: String,
  
  // Media References
  audioReference: String (storage path or S3 URL, optional),
  audioLength: Number (seconds),
  audioMimeType: String (e.g., 'audio/webm'),
  
  // Timing
  recordedAt: DateTime,
  duration: Number (seconds),
  
  // Submission Status
  isSubmitted: Boolean,
  submittedAt: DateTime,
  
  // Analysis Status
  analysisStatus: 'pending' | 'in_progress' | 'completed' | 'failed',
  analysisError: String (optional),
  
  // Raw Analysis Data
  analysis: {
    // See AnswerAnalysis below
  },
  
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### AnswerAnalysis
Comprehensive analysis of a single answer.

```javascript
{
  // Identification
  answerId: String (foreign key),
  sessionId: String (foreign key),
  analysisTimestamp: DateTime,
  
  // Scores
  scores: {
    overall: Number (0-100),
    content: Number (0-100),
    relevance: Number (0-100),
    completeness: Number (0-100),
    structure: Number (0-100),
    communication: Number (0-100)
  },
  
  // Speech Metrics
  metrics: {
    wordCount: Number,
    wordsPerMinute: Number,
    fillerWordCount: Number,
    fillerWordFrequency: Number (0-100),
    sentenceCount: Number,
    averageSentenceLength: Number,
    uniqueWords: Number,
    vocabularyDiversity: Number (0-100),
    pauseFrequency: Number,
    averagePauseDuration: Number (seconds),
    longestPause: Number (seconds),
    hesitationFrequency: Number,
    speechFluency: 'excellent' | 'good' | 'fair' | 'poor'
  },
  
  // STAR Analysis (behavioral questions)
  star: {
    hasSituation: Boolean,
    hasTask: Boolean,
    hasAction: Boolean,
    hasResult: Boolean,
    completeness: Number (0-4)
  },
  
  // Repeated Words
  repeatedWords: Array<{
    word: String,
    frequency: Number
  }>,
  
  // Key Themes
  themes: String[],
  keywordsDetected: String[],
  
  // Feedback
  feedback: {
    strengths: String[],
    weaknesses: String[],
    recommendations: String[],
    summary: String
  },
  
  // Flags
  flags: {
    veryShortAnswer: Boolean,
    offTopic: Boolean,
    unintelligibleAudio: Boolean,
    excessiveNoise: Boolean,
    potentialLowConfidence: Boolean
  },
  
  // Model Information
  analysisModel: String (e.g., 'claude-sonnet-4-6'),
  modelVersion: String,
  confidenceScores: {
    relevanceConfidence: Number (0-1),
    contentConfidence: Number (0-1),
    qualityConfidence: Number (0-1)
  }
}
```

### PsychometricAssessment
Structured psychometric evaluation data.

```javascript
{
  id: String (UUID),
  sessionId: String (foreign key),
  candidateId: String (foreign key),
  
  // Assessment Type
  type: 'communication' | 'cognitive' | 'personality' | 'competency' | 'behavioral',
  
  // Dimensions/Scores
  dimensions: {
    [dimensionName: String]: {
      score: Number (0-100),
      percentile: Number (0-100),
      interpretation: String,
      confidence: Number (0-1),
      baselineComparison: Number (-100 to +100) // difference from baseline
    }
  },
  
  // Assessment Methods (observable only)
  methods: String[] (e.g., 'speech_analysis', 'response_content', 'behavioral_indicators'),
  
  // Important: Clear Disclaimers
  disclaimers: {
    notPsychologicalDiagnosis: Boolean (true),
    notPersonalityTest: Boolean (true),
    observableMetricsOnly: Boolean (true),
    noMedicalClaims: Boolean (true),
    requiresHumanInterpretation: Boolean (true)
  },
  
  // Interpretation Guidance
  summary: String,
  strengths: String[],
  developmentAreas: String[],
  recommendations: String[],
  
  // Validity
  validFor: {
    position: String,
    department: String,
    role: String,
    level: 'entry' | 'mid' | 'senior' | 'executive'
  },
  
  assessmentTimestamp: DateTime,
  assessedBy: String (User ID, if manual review),
  reviewedAt: DateTime (optional)
}
```

### InterviewScore
Aggregated scoring across the entire interview.

```javascript
{
  id: String (UUID),
  sessionId: String (foreign key),
  candidateId: String (foreign key),
  
  // Aggregate Scores
  overallScore: Number (0-100),
  categoryScores: {
    [categoryName: String]: Number (0-100)
  },
  
  // Score Calculation
  scoreCalculation: {
    method: 'weighted_average' | 'custom',
    weights: { [categoryName: String]: Number },
    timestamp: DateTime
  },
  
  // Comparison
  compareToBaseline: {
    baselineScore: Number,
    difference: Number,
    percentile: Number
  },
  
  // Recommendation
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'not_recommended' | 'reconsider',
  recommendationReasoning: String,
  
  // Interviewer Notes
  recruiterNotes: String,
  recruiterScore: Number (0-100, optional manual override),
  
  // Sign-off
  signedOffBy: String (User ID, optional),
  signedOffAt: DateTime (optional),
  
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### ConsentRecord
GDPR/privacy compliance — tracks consent given by candidates.

```javascript
{
  id: String (UUID),
  userId: String (foreign key),
  sessionId: String (foreign key),
  
  // Permissions Granted
  permissions: {
    microphone: {
      granted: Boolean,
      grantedAt: DateTime
    },
    camera: {
      granted: Boolean,
      grantedAt: DateTime
    },
    audioRecording: {
      granted: Boolean,
      grantedAt: DateTime
    },
    dataProcessing: {
      granted: Boolean,
      grantedAt: DateTime
    },
    dataRetention: {
      granted: Boolean,
      retentionDays: Number,
      grantedAt: DateTime
    }
  },
  
  // Explicit Consents
  understandsAnalysis: Boolean,
  understandsDataUse: Boolean,
  agreesToPrivacyPolicy: Boolean,
  agreesToTermsOfService: Boolean,
  
  // IP & Device Info (for audit trail)
  ipAddress: String,
  userAgent: String,
  
  createdAt: DateTime,
  revokedAt: DateTime (optional)
}
```

## Scoring Configuration

### Category Weights
```javascript
const SCORING_WEIGHTS = {
  'Technical Knowledge': 0.20,
  'Communication': 0.20,
  'Problem Solving': 0.25,
  'Behavioral Responses': 0.15,
  'Answer Relevance': 0.10,
  'Structured Thinking': 0.10
};
```

### Score Interpretation
```javascript
const SCORE_BANDS = {
  exceptional: { min: 85, max: 100, label: 'Exceptional', color: '#10b981' },
  strong: { min: 75, max: 84, label: 'Strong', color: '#3b82f6' },
  adequate: { min: 60, max: 74, label: 'Adequate', color: '#f59e0b' },
  needs_improvement: { min: 45, max: 59, label: 'Needs Improvement', color: '#ef4444' },
  poor: { min: 0, max: 44, label: 'Poor', color: '#7f1d1d' }
};
```

## API Endpoints (for Backend Integration)

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET /api/auth/me
```

### Interviews
```
GET    /api/interviews                    # List candidate's interviews
GET    /api/interviews/{sessionId}        # Get interview details
POST   /api/interviews                    # Create new interview session
PATCH  /api/interviews/{sessionId}        # Update interview status
DELETE /api/interviews/{sessionId}        # Delete interview (soft delete)

GET    /api/interviews/{sessionId}/answers      # List answers for session
POST   /api/interviews/{sessionId}/answers      # Submit answer
GET    /api/interviews/{sessionId}/answers/{answerId}
PUT    /api/interviews/{sessionId}/answers/{answerId}
DELETE /api/interviews/{sessionId}/answers/{answerId}
```

### Questions
```
GET  /api/questions                 # List all questions
GET  /api/questions/{questionId}    # Get question details
POST /api/questions                 # Create question (admin)
PUT  /api/questions/{questionId}    # Update question (admin)
GET  /api/templates                 # List interview templates
```

### Analysis & Results
```
GET  /api/interviews/{sessionId}/analysis        # Get analysis results
GET  /api/interviews/{sessionId}/psychometric    # Get psychometric assessment
GET  /api/interviews/{sessionId}/score           # Get scoring details
POST /api/interviews/{sessionId}/score/manual    # Submit manual score (admin)
```

### Recruiter Dashboard
```
GET  /api/candidates                                # List candidates
GET  /api/candidates/{candidateId}                  # Get candidate profile
GET  /api/candidates/{candidateId}/interviews      # Get candidate's interviews
GET  /api/candidates/{candidateId}/scores          # Get candidate scores
GET  /api/candidates/{candidateId}/feedback        # Get feedback summary
```

### Admin
```
GET    /api/admin/statistics                   # Platform statistics
GET    /api/admin/users                        # Manage users
POST   /api/admin/users                        # Create user
PUT    /api/admin/users/{userId}               # Update user
DELETE /api/admin/users/{userId}               # Delete user
```

## Request/Response Examples

### Submit Answer
```http
POST /api/interviews/session-123/answers
Content-Type: application/json

{
  "questionId": "q-456",
  "rawTranscript": "I worked on a project...",
  "cleanTranscript": "I worked on a project...",
  "audioReference": "s3://bucket/path/to/audio.webm",
  "duration": 120
}

Response:
{
  "id": "answer-789",
  "sessionId": "session-123",
  "status": "submitted",
  "analysisStatus": "pending",
  "createdAt": "2026-08-16T12:00:00Z"
}
```

### Get Analysis Results
```http
GET /api/interviews/session-123/analysis

Response:
{
  "sessionId": "session-123",
  "overallScore": 78,
  "categoryScores": {
    "Technical Knowledge": 82,
    "Communication": 76,
    "Problem Solving": 84,
    "Behavioral Responses": 71,
    "Answer Relevance": 88,
    "Structured Thinking": 79
  },
  "answers": [
    {
      "answerId": "answer-789",
      "scores": {
        "overall": 78,
        "content": 75,
        "structure": 82,
        "communication": 76
      },
      "metrics": {
        "wordCount": 245,
        "wordsPerMinute": 140,
        "fillerWordCount": 3,
        "vocabularyDiversity": 68
      },
      "feedback": {
        "strengths": ["Good vocabulary variety..."],
        "weaknesses": ["Could provide more examples..."],
        "recommendations": ["Practice the STAR method..."]
      }
    }
  ]
}
```

## Database Indexes

```sql
-- Performance Critical Indexes
CREATE INDEX idx_interviews_session_candidate ON interviews(candidate_id, status);
CREATE INDEX idx_interviews_session_created ON interviews(created_at DESC);
CREATE INDEX idx_answers_session ON candidate_answers(session_id);
CREATE INDEX idx_analysis_session ON answer_analysis(session_id);
CREATE INDEX idx_questions_template ON interview_questions(template_id);

-- Query Optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_recruiter ON interview_sessions(recruiter_id);
CREATE INDEX idx_templates_org ON interview_templates(organization_id);
```

## Data Retention Policy

```javascript
const RETENTION_POLICY = {
  interviewSession: {
    default: 90, // days
    withAudio: 30,
    withAnalytics: 90
  },
  candidateAnswer: {
    default: 90,
    transcript: 90,
    audio: 30  // audio deleted sooner than transcript
  },
  consentRecord: {
    default: 3 * 365  // 3 years for compliance
  },
  deletionMethod: 'secure_shred'  // cryptographic deletion
};
```

## Compliance & Privacy

### GDPR Compliance
- ✅ Right to be forgotten (data deletion)
- ✅ Data portability (export interview data)
- ✅ Consent management
- ✅ Audit trail of all data access
- ✅ Encryption at rest and in transit

### Fair Hiring Practices
- ✅ Score explanation for every candidate
- ✅ Bias detection in questions
- ✅ Consistent scoring methodology
- ✅ Audit trail of score modifications
- ✅ Clear separation: observed vs. inferred

### Data Security
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3+)
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for all operations
- ✅ Regular security audits

## Migration Path

### From Standalone to Backend-Integrated

1. **Phase 1: Instrument Data**
   - Add API client to React app
   - Store session ID when interview begins
   - POST answers to backend immediately

2. **Phase 2: Hybrid Analysis**
   - Keep client-side analysis for real-time feedback
   - POST raw data to backend for secondary analysis
   - Merge results

3. **Phase 3: Full Backend Integration**
   - Move analysis to backend
   - Backend computes scores
   - Frontend displays backend results
   - Enable recruiter dashboard

---

**Version:** 1.0.0  
**Last Updated:** 2026-08-16  
**Status:** Production Ready
