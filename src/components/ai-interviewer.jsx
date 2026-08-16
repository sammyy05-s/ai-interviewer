import React, { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const INTERVIEW_QUESTIONS = [
  {
    id: 1,
    type: 'behavioral',
    question: 'Tell me about a time when you had to work on a challenging project. What was the situation, and how did you approach it?',
    category: 'Problem Solving',
    followUpBased: false
  },
  {
    id: 2,
    type: 'technical',
    question: 'Describe your experience with technical systems or tools you\'ve worked with. What was your role?',
    category: 'Technical Knowledge',
    followUpBased: false
  },
  {
    id: 3,
    type: 'behavioral',
    question: 'Tell me about a time you had to collaborate with someone you found difficult. How did you handle it?',
    category: 'Teamwork',
    followUpBased: false
  },
  {
    id: 4,
    type: 'situational',
    question: 'If you encountered a problem at work that you couldn\'t solve immediately, what would you do?',
    category: 'Problem Solving',
    followUpBased: false
  },
  {
    id: 5,
    type: 'behavioral',
    question: 'Describe a time when you received critical feedback. How did you respond?',
    category: 'Adaptability',
    followUpBased: false
  }
];

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'so', 'well', 'right', 'okay', 'really', 'literally', 'honestly'];

const COMMUNICATION_CATEGORIES = {
  'Technical Knowledge': 0,
  'Communication': 1,
  'Problem Solving': 2,
  'Behavioral Responses': 3,
  'Answer Relevance': 4,
  'Structured Thinking': 5
};

// ============================================================================
// SPEECH RECOGNITION MODULE
// ============================================================================

class SpeechRecognitionProvider {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.isListening = false;
    this.interimTranscript = '';
    this.finalTranscript = '';
    this.onTranscriptUpdate = null;
    this.onEnd = null;
    this.onError = null;

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        this.interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            this.finalTranscript += transcript + ' ';
          } else {
            this.interimTranscript += transcript;
          }
        }
        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate({
            interim: this.interimTranscript,
            final: this.finalTranscript,
            isFinal: this.interimTranscript === '' && this.finalTranscript !== ''
          });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEnd) this.onEnd();
      };

      this.recognition.onerror = (event) => {
        if (this.onError) this.onError(event.error);
      };
    }
  }

  start() {
    if (this.recognition) {
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.recognition.start();
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  abort() {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  isSupported() {
    return this.recognition !== null;
  }
}

// ============================================================================
// TRANSCRIPT PROCESSOR
// ============================================================================

class TranscriptProcessor {
  static cleanTranscript(rawTranscript) {
    if (!rawTranscript) return '';
    let clean = rawTranscript.trim();
    clean = clean.replace(/\s+/g, ' ');
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (!clean.match(/[.!?]$/)) {
      clean += '.';
    }
    return clean;
  }

  static calculateMetrics(transcript, duration) {
    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const wordsPerMinute = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;
    
    const fillerCount = FILLER_WORDS.reduce((count, filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      return count + (transcript.match(regex) || []).length;
    }, 0);

    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0;

    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const vocabularyDiversity = Math.round((uniqueWords / wordCount) * 100);

    return {
      wordCount,
      wordsPerMinute,
      fillerWordCount: fillerCount,
      fillerWordFrequency: wordCount > 0 ? (fillerCount / wordCount * 100).toFixed(1) : 0,
      sentenceCount: sentences.length,
      averageSentenceLength: avgSentenceLength,
      uniqueWords,
      vocabularyDiversity
    };
  }

  static findRepeatedWords(transcript) {
    const words = transcript.toLowerCase().split(/\s+/);
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    return Object.entries(wordFreq)
      .filter(([_, count]) => count > 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }

  static detectSTAR(transcript) {
    const text = transcript.toLowerCase();
    return {
      situation: /situation|context|background|started|began|was assigned|was given/.test(text),
      task: /task|goal|objective|needed to|had to|responsible|assigned/.test(text),
      action: /did|implemented|created|built|developed|solved|handled|managed|took/.test(text),
      result: /result|outcome|achieved|improved|increased|decreased|learned|concluded|reduced|enhanced/.test(text)
    };
  }
}

// ============================================================================
// ANSWER ANALYZER
// ============================================================================

class AnswerAnalyzer {
  static analyzeAnswer(transcript, question) {
    const metrics = TranscriptProcessor.calculateMetrics(transcript, transcript.split(/\s+/).length / 150);
    const star = TranscriptProcessor.detectSTAR(transcript);
    const repeatedWords = TranscriptProcessor.findRepeatedWords(transcript);

    const relevanceScore = this.calculateRelevance(transcript, question);
    const completenessScore = this.calculateCompleteness(transcript, question, star);
    const structureScore = this.calculateStructure(transcript, question);
    const communicationScore = this.calculateCommunication(metrics);

    const contentScore = Math.round((relevanceScore + completenessScore) / 2);
    const overallScore = Math.round((contentScore + structureScore + communicationScore) / 3);

    return {
      metrics,
      star,
      repeatedWords,
      contentScore,
      structureScore,
      communicationScore,
      overallScore,
      relevanceScore,
      completenessScore,
      feedback: this.generateFeedback(metrics, star, relevanceScore, structureScore)
    };
  }

  static calculateRelevance(transcript, question) {
    const questionWords = question.toLowerCase().split(/\s+/);
    const transcriptWords = transcript.toLowerCase().split(/\s+/);
    const matchCount = questionWords.filter(q => 
      transcriptWords.some(t => t.includes(q) || q.includes(t))
    ).length;
    return Math.min(100, 40 + (matchCount / questionWords.length) * 60);
  }

  static calculateCompleteness(transcript, question, star) {
    const length = transcript.split(/\s+/).length;
    const lengthScore = Math.min(100, (length / 200) * 100);
    
    let structureScore = 50;
    if (question.toLowerCase().includes('tell') && question.toLowerCase().includes('time')) {
      const starCount = Object.values(star).filter(v => v).length;
      structureScore = 30 + (starCount / 4) * 70;
    }

    return Math.round((lengthScore + structureScore) / 2);
  }

  static calculateStructure(transcript, question) {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const hasOpening = sentences.length > 0 && sentences[0].length > 20;
    const hasBody = sentences.length > 1;
    const hasClosing = sentences.length > 0 && sentences[sentences.length - 1].match(/result|concluded|learned|improved/i);

    const structureScore = (hasOpening ? 30 : 0) + (hasBody ? 40 : 0) + (hasClosing ? 30 : 0);
    return structureScore;
  }

  static calculateCommunication(metrics) {
    let score = 100;
    if (metrics.wordsPerMinute > 180) score -= 15;
    if (metrics.wordsPerMinute < 80) score -= 15;
    if (metrics.fillerWordFrequency > 10) score -= 20;
    if (metrics.vocabularyDiversity < 40) score -= 10;
    return Math.max(20, Math.min(100, score));
  }

  static generateFeedback(metrics, star, relevanceScore, structureScore) {
    const feedback = {
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    if (metrics.vocabularyDiversity > 60) {
      feedback.strengths.push('Good vocabulary variety in your response.');
    }
    if (relevanceScore > 75) {
      feedback.strengths.push('Your answer was clearly relevant to the question.');
    }
    if (Object.values(star).filter(v => v).length >= 3) {
      feedback.strengths.push('Your response included solid context and outcomes.');
    }

    if (metrics.fillerWordFrequency > 10) {
      feedback.weaknesses.push(`Frequent use of filler words (${metrics.fillerWordCount} instances). Try to pause instead.`);
    }
    if (!star.result) {
      feedback.weaknesses.push('Consider explicitly stating the result or outcome of your actions.');
    }
    if (metrics.wordsPerMinute > 180) {
      feedback.weaknesses.push('Your speaking pace was quite fast. Slowing down slightly can improve clarity.');
    }

    if (metrics.fillerWordFrequency > 10) {
      feedback.recommendations.push('Practice replacing filler words with deliberate pauses.');
    }
    if (!star.result) {
      feedback.recommendations.push('Use a "Result:" or "Outcome:" statement to conclude behavioral stories.');
    }
    if (metrics.wordCount < 100) {
      feedback.recommendations.push('Provide more detail and examples to strengthen your responses.');
    }

    return feedback;
  }
}

// ============================================================================
// INTERVIEW ENGINE
// ============================================================================

class InterviewEngine {
  constructor() {
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.scores = {
      'Technical Knowledge': 0,
      'Communication': 0,
      'Problem Solving': 0,
      'Behavioral Responses': 0,
      'Answer Relevance': 0,
      'Structured Thinking': 0
    };
  }

  getCurrentQuestion() {
    return INTERVIEW_QUESTIONS[this.currentQuestionIndex];
  }

  submitAnswer(transcript, analysis) {
    this.answers.push({
      questionId: this.getCurrentQuestion().id,
      question: this.getCurrentQuestion().question,
      transcript,
      analysis,
      timestamp: new Date()
    });

    const category = this.getCurrentQuestion().category;
    const categoryIndex = COMMUNICATION_CATEGORIES[category];
    const categoryScores = [
      analysis.contentScore,
      analysis.communicationScore,
      analysis.structureScore,
      analysis.contentScore,
      analysis.relevanceScore,
      analysis.structureScore
    ];
    this.scores[category] = categoryScores[categoryIndex];

    this.currentQuestionIndex++;
  }

  hasMoreQuestions() {
    return this.currentQuestionIndex < INTERVIEW_QUESTIONS.length;
  }

  getOverallScore() {
    const scores = Object.values(this.scores);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  getResults() {
    return {
      overallScore: this.getOverallScore(),
      categoryScores: this.scores,
      answers: this.answers,
      completionPercentage: Math.round((this.currentQuestionIndex / INTERVIEW_QUESTIONS.length) * 100)
    };
  }
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function ConsentScreen({ onConsent }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        background: '#1e293b',
        border: '1px solid #475569',
        borderRadius: '12px',
        padding: '40px',
        color: '#f1f5f9'
      }}>
        <h1 style={{ fontSize: '28px', marginTop: 0, marginBottom: '24px' }}>
          AI Interview Platform
        </h1>
        <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px' }}>
          Privacy & Consent
        </h2>
        
        <div style={{ marginBottom: '20px', lineHeight: 1.6, fontSize: '14px' }}>
          <p><strong>Microphone Recording:</strong> We'll record your voice and convert speech to text in real-time for transcription and analysis.</p>
          
          <p><strong>Optional Camera:</strong> You can optionally enable your camera. We'll analyze only observable behaviors (e.g., camera presence, head movement)—never psychological inferences.</p>
          
          <p><strong>Data Processing:</strong> Your answers will be analyzed for communication metrics, content quality, and structured thinking patterns.</p>
          
          <p><strong>Data Storage:</strong> Interview data is stored for this session. You can request deletion anytime.</p>
          
          <p><strong>Analysis:</strong> We use automated analysis for speech metrics, answer evaluation, and structured psychometric assessment.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <button onClick={() => onConsent({ microphone: true, camera: false })} style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}>
            Allow Microphone Only
          </button>
          <button onClick={() => onConsent({ microphone: true, camera: true })} style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}>
            Allow Microphone & Camera
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewInterface({ question, onAnswerSubmit, isProcessing }) {
  const [status, setStatus] = useState('Ready');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFinishPrompt, setShowFinishPrompt] = useState(false);
  const [silenceDuration, setSilenceDuration] = useState(0);
  const speechProviderRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioVisualizerRef = useRef(null);

  useEffect(() => {
    speechProviderRef.current = new SpeechRecognitionProvider();
    
    if (!speechProviderRef.current.isSupported()) {
      setStatus('Speech recognition not supported in your browser');
      return;
    }

    speechProviderRef.current.onTranscriptUpdate = ({ interim, final }) => {
      setTranscript(final);
      setInterimText(interim);
      setSilenceDuration(0);
      setShowFinishPrompt(false);
    };

    speechProviderRef.current.onEnd = () => {
      setIsRecording(false);
    };

    return () => {
      if (speechProviderRef.current) {
        speechProviderRef.current.abort();
      }
    };
  }, []);

  const handleStartListening = () => {
    if (!speechProviderRef.current?.isSupported()) return;
    setTranscript('');
    setInterimText('');
    setSilenceDuration(0);
    setShowFinishPrompt(false);
    setStatus('Listening...');
    setIsRecording(true);
    speechProviderRef.current.start();

    let silenceCount = 0;
    silenceTimerRef.current = setInterval(() => {
      silenceCount++;
      setSilenceDuration(silenceCount);
      if (silenceCount > 4 && (transcript || interimText)) {
        setShowFinishPrompt(true);
        clearInterval(silenceTimerRef.current);
      }
    }, 1000);
  };

  const handleStopAnswer = () => {
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    speechProviderRef.current.stop();
    setIsRecording(false);
    setStatus('Processing...');
    
    const fullTranscript = transcript + interimText;
    const cleanedTranscript = TranscriptProcessor.cleanTranscript(fullTranscript);
    const analysis = AnswerAnalyzer.analyzeAnswer(cleanedTranscript, question.question);
    
    setTimeout(() => {
      onAnswerSubmit(cleanedTranscript, analysis);
      setTranscript('');
      setInterimText('');
      setStatus('Ready');
      setShowFinishPrompt(false);
    }, 500);
  };

  const handleContinueSpeaking = () => {
    setShowFinishPrompt(false);
    setSilenceDuration(0);
    setStatus('Listening...');
  };

  const displayText = transcript + interimText;

  return (
    <div style={{
      background: '#0f172a',
      minHeight: '100vh',
      padding: '20px',
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '24px', marginTop: 0, marginBottom: '8px' }}>
            Interview Session
          </h1>
          <p style={{ color: '#94a3b8', marginTop: 0 }}>
            Question {question ? INTERVIEW_QUESTIONS.indexOf(question) + 1 : 0} of {INTERVIEW_QUESTIONS.length}
          </p>
        </div>

        {/* Question Card */}
        {question && (
          <div style={{
            background: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '0 0 12px 0' }}>
              {question.category}
            </p>
            <h2 style={{ fontSize: '18px', margin: 0, lineHeight: 1.6 }}>
              {question.question}
            </h2>
          </div>
        )}

        {/* Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
          padding: '12px 16px',
          background: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #475569'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: status === 'Listening...' ? '#ef4444' : status === 'Processing...' ? '#f59e0b' : '#10b981',
            animation: (status === 'Listening...' || status === 'Processing...') ? 'pulse 2s infinite' : 'none'
          }}></div>
          <span style={{ fontSize: '14px' }}>{status}</span>
        </div>

        {/* Microphone Button */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button
            onClick={isRecording ? handleStopAnswer : handleStartListening}
            disabled={isProcessing}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: 'none',
              background: isRecording ? '#ef4444' : '#3b82f6',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              opacity: isProcessing ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isRecording ? '⏹' : '🎤'}
          </button>
          <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '13px' }}>
            {isRecording ? 'Tap to stop recording' : 'Tap to start speaking'}
          </p>
        </div>

        {/* Transcript Display */}
        {(displayText || isRecording) && (
          <div style={{
            background: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            minHeight: '100px'
          }}>
            <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '0 0 12px 0' }}>
              Real-time transcript
            </p>
            <p style={{
              margin: 0,
              fontSize: '16px',
              lineHeight: 1.6,
              color: transcript ? '#f1f5f9' : '#94a3b8'
            }}>
              {transcript}
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>{interimText}</span>
            </p>
          </div>
        )}

        {/* Finish Prompt */}
        {showFinishPrompt && (
          <div style={{
            background: '#1e293b',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <p style={{ marginTop: 0, marginBottom: '20px' }}>
              It looks like you've finished. Ready to submit your answer?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleContinueSpeaking} style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #475569',
                background: 'transparent',
                color: '#f1f5f9',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                Continue Speaking
              </button>
              <button onClick={handleStopAnswer} style={{
                flex: 1,
                padding: '12px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}>
                Submit Answer
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function ResultsDashboard({ results, onReset }) {
  return (
    <div style={{
      background: '#0f172a',
      minHeight: '100vh',
      padding: '20px',
      color: '#f1f5f9'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Overall Score */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', marginTop: 0, marginBottom: '8px' }}>
            Interview Complete
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', marginTop: 0 }}>
            Here's your comprehensive feedback
          </p>
        </div>

        {/* Overall Score Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          border: '1px solid #475569',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 16px 0' }}>
            Overall Score
          </p>
          <div style({ fontSize: '64px', fontWeight: 600, margin: '0 0 8px 0' }}>
            {results.overallScore}
            <span style={{ fontSize: '32px', color: '#cbd5e1' }}>/100</span>
          </div>
          <p style={{ color: '#cbd5e1', margin: 0 }}>
            {results.completionPercentage}% of interview completed
          </p>
        </div>

        {/* Category Scores */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px' }}>
            Category Scores
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {Object.entries(results.categoryScores).map(([category, score]) => (
              <div key={category} style={{
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '0 0 12px 0' }}>
                  {category}
                </p>
                <div style={{ fontSize: '28px', fontWeight: 600 }}>
                  {score}
                </div>
                <div style={{
                  background: '#334155',
                  height: '4px',
                  borderRadius: '2px',
                  marginTop: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: score > 75 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444',
                    height: '100%',
                    width: `${score}%`,
                    transition: 'width 0.3s'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Answer Analysis */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px' }}>
            Answer Analysis
          </h2>
          {results.answers.map((answer, idx) => (
            <div key={idx} style={{
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>
                  Question {idx + 1}
                </h3>
                <span style={{
                  background: answer.analysis.overallScore > 75 ? '#10b981' : answer.analysis.overallScore > 50 ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {answer.analysis.overallScore}/100
                </span>
              </div>
              
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 12px 0', fontStyle: 'italic' }}>
                {answer.question}
              </p>

              <div style={{
                background: '#0f172a',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#cbd5e1'
              }}>
                {answer.transcript}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' }}>Communication</p>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{answer.analysis.communicationScore}</div>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' }}>Structure</p>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{answer.analysis.structureScore}</div>
                </div>
              </div>

              {/* Speech Metrics */}
              <div style={{
                background: '#0f172a',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Speech Metrics</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#cbd5e1' }}>
                  <div>Word count: {answer.analysis.metrics.wordCount}</div>
                  <div>WPM: {answer.analysis.metrics.wordsPerMinute}</div>
                  <div>Filler words: {answer.analysis.metrics.fillerWordCount}</div>
                  <div>Vocabulary diversity: {answer.analysis.metrics.vocabularyDiversity}%</div>
                </div>
              </div>

              {/* STAR Analysis */}
              {answer.question.toLowerCase().includes('time') && (
                <div style={{
                  background: '#0f172a',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>STAR Structure</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', color: '#cbd5e1' }}>
                    <div>
                      Situation: {answer.analysis.star.situation ? '✓' : '✗'}
                    </div>
                    <div>
                      Task: {answer.analysis.star.task ? '✓' : '✗'}
                    </div>
                    <div>
                      Action: {answer.analysis.star.action ? '✓' : '✗'}
                    </div>
                    <div>
                      Result: {answer.analysis.star.result ? '✓' : '✗'}
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {answer.analysis.feedback.strengths.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#10b981', fontSize: '12px', fontWeight: 500, margin: '0 0 8px 0' }}>
                    Strengths
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '12px' }}>
                    {answer.analysis.feedback.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {answer.analysis.feedback.weaknesses.length > 0 && (
                <div>
                  <p style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 500, margin: '0 0 8px 0' }}>
                    Areas for improvement
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '12px' }}>
                    {answer.analysis.feedback.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reset Button */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button onClick={onReset} style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}>
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function AIInterviewerApp() {
  const [stage, setStage] = useState('consent'); // consent, interview, results
  const [interviewEngine] = useState(() => new InterviewEngine());
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleConsent = (permissions) => {
    setStage('interview');
  };

  const handleAnswerSubmit = (transcript, analysis) => {
    setIsProcessing(true);
    setTimeout(() => {
      interviewEngine.submitAnswer(transcript, analysis);
      
      if (interviewEngine.hasMoreQuestions()) {
        setIsProcessing(false);
      } else {
        setResults(interviewEngine.getResults());
        setStage('results');
        setIsProcessing(false);
      }
    }, 1000);
  };

  const handleReset = () => {
    setStage('consent');
    window.location.reload();
  };

  if (stage === 'consent') {
    return <ConsentScreen onConsent={handleConsent} />;
  }

  if (stage === 'results') {
    return <ResultsDashboard results={results} onReset={handleReset} />;
  }

  return (
    <InterviewInterface
      question={interviewEngine.getCurrentQuestion()}
      onAnswerSubmit={handleAnswerSubmit}
      isProcessing={isProcessing}
    />
  );
}
