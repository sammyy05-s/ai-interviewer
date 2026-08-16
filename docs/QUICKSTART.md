# AI Interviewer — Quick Start Guide

Get the AI Interviewer running in under 5 minutes.

## 🚀 Fastest Way: Open HTML File

1. Download `index.html` from the project
2. Double-click to open in your browser
3. Grant microphone permission
4. Start interviewing!

**That's it.** No installation, no backend, no configuration needed.

## 📋 Typical User Flows

### For Candidates
1. Click **"Allow Microphone Only"** on the consent screen
2. Click the **microphone button** to start answering
3. Speak naturally — transcript updates in real time
4. When you pause, a prompt asks "Ready to submit?"
5. Click **"Submit Answer"** or **"Continue Speaking"**
6. Answer the next 4 questions
7. Review your **detailed feedback** and scores

**Total time:** 10-15 minutes

### For Recruiters (Single-User Demo)
1. Open `index.html`
2. Complete the interview as a candidate
3. View the **Results Dashboard** showing:
   - Overall score (0-100)
   - Category breakdowns
   - Answer-by-answer analysis
   - Strengths and weaknesses
   - Specific recommendations

## 🔧 Installation by Use Case

### Use Case 1: Standalone Web App (No Backend)
**Best for:** Quick demos, internal use, small teams

```bash
# Copy the file
cp index.html ~/Desktop/

# Open in browser
open ~/Desktop/index.html

# Or use Python to serve locally
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Use Case 2: Embedded in Your Website
**Best for:** Integrating into an existing career portal

```html
<!-- In your HTML -->
<div id="interview-container" style="height: 100vh;"></div>

<!-- Include the React app -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>

<!-- Copy the script section from index.html here -->
```

### Use Case 3: React Development Environment
**Best for:** Custom features, backend integration

```bash
# Create React app
npx create-react-app ai-interviewer
cd ai-interviewer

# Copy the component
cp ai-interviewer.jsx src/

# Update src/App.jsx
cat > src/App.jsx << 'EOF'
import AIInterviewerApp from './ai-interviewer';
export default AIInterviewerApp;
EOF

# Start development
npm start
```

### Use Case 4: Docker Deployment
**Best for:** Production hosting

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy HTML file
COPY index.html .

# Install simple HTTP server
RUN npm install -g http-server

EXPOSE 8080

CMD ["http-server", "-p", "8080", "--gzip"]
```

```bash
# Build image
docker build -t ai-interviewer .

# Run container
docker run -p 8080:8080 ai-interviewer

# Visit http://localhost:8080
```

## ☁️ Cloud Deployment

### Deploy to Vercel (Recommended - Instant)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Your URL: https://your-project.vercel.app
```

### Deploy to Netlify
```bash
# Drop index.html into Netlify's drag-and-drop interface
# OR use CLI
npm install -g netlify-cli
netlify deploy --prod --dir=.
```

### Deploy to GitHub Pages
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Add files
git add index.html
git commit -m "Deploy AI Interviewer"

# Push to GitHub
git push origin gh-pages

# Your URL: https://username.github.io/ai-interviewer
```

### Deploy to AWS S3
```bash
# Upload to S3
aws s3 cp index.html s3://your-bucket/

# Enable static website hosting in S3 console
# Your URL: https://your-bucket.s3.amazonaws.com/index.html
```

### Deploy to Azure Static Web Apps
```bash
# Using Azure CLI
az staticwebapp create \
  --name ai-interviewer \
  --resource-group mygroup \
  --source . \
  --location "eastus" \
  --branch main

# Your URL: https://ai-interviewer.azurestaticapps.net
```

## 🎯 Basic Customization (5 minutes)

### Change Interview Questions
Edit `index.html`, find `INTERVIEW_QUESTIONS`:

```javascript
const INTERVIEW_QUESTIONS = [
  {
    id: 1,
    type: 'behavioral',
    question: 'Your custom question here?',
    category: 'Your Category',
    followUpBased: false
  },
  // ... add more questions
];
```

### Change Colors
Search for hex values in the styles:
- `#0f172a` → Dark background
- `#1e293b` → Card background
- `#3b82f6` → Primary button (blue)
- `#10b981` → Success color (green)
- `#ef4444` → Recording color (red)

Replace with your brand colors.

### Change Question Duration
Edit pause detection threshold (currently 4 seconds):

```javascript
if (silenceCount > 4 && (transcript || interimText)) {
  // Change '4' to desired seconds
  setShowFinishPrompt(true);
}
```

### Add Your Logo
In the HTML head or component, add:

```html
<img src="your-logo.png" style="width: 200px; margin-bottom: 20px;" />
```

## 📊 How to Review Results

After interview completion, you'll see:

### 1. **Overall Score Card**
- Single 0-100 number
- Quick pass/fail indicator
- Completion percentage

### 2. **Category Breakdown**
- 6 categories with individual scores
- Visual progress bars
- Color-coded performance (green/amber/red)

### 3. **Per-Question Analysis**
For each of the 5 questions:
- **Full transcript** — exactly what was said
- **Score** — 0-100 for that answer
- **Communication Metrics:**
  - Words per minute
  - Word count
  - Filler word frequency
  - Vocabulary diversity
- **STAR Analysis** (behavioral questions)
  - ✓ or ✗ for Situation, Task, Action, Result
- **Strengths** — what went well
- **Weaknesses** — areas to improve
- **Recommendations** — specific guidance

### Interpreting Scores

| Score | Interpretation | Action |
|-------|---|---|
| 85-100 | Exceptional | Strong hire |
| 75-84 | Strong | Good match |
| 60-74 | Adequate | Consider with caution |
| 45-59 | Needs Improvement | Weak match |
| 0-44 | Poor | Not recommended |

## 🧪 Testing the Application

### Test Case 1: Happy Path
1. Open app
2. Grant microphone permission
3. Answer all questions with complete, relevant responses
4. Observe scores in 75-100 range

### Test Case 2: Speed/Clarity
1. Answer the same question at different speeds:
   - Very fast (150+ WPM) → should lower communication score
   - Very slow (60 WPM) → should lower communication score
   - Normal (120-140 WPM) → should be good
2. Use different vocabularies:
   - Simple words → lower vocabulary diversity
   - Varied vocabulary → higher diversity

### Test Case 3: Filler Words
1. Answer a question with many "um," "uh," "like"
2. Should show high filler word count
3. Feedback should mention reducing filler words

### Test Case 4: STAR Structure
1. Answer a behavioral question without a clear result
2. STAR analysis should show "Result: ✗"
3. Feedback should recommend including results

### Test Case 5: Very Short Answer
1. Answer a question with just a few words
2. Should see low completeness and content scores
3. Feedback should recommend providing more detail

## 🔍 Troubleshooting Checklist

### Microphone Not Working
- [ ] Is microphone connected and recognized by OS?
- [ ] Check browser Settings → Privacy → Microphone
- [ ] Is this browser supported? (Chrome, Edge, Safari 14.1+)
- [ ] Try different browser
- [ ] Restart the application

### Speech Not Being Recognized
- [ ] Is internet connection active?
- [ ] Try speaking louder or closer to microphone
- [ ] Reduce background noise
- [ ] Check microphone sensitivity in OS settings
- [ ] Verify microphone volume is not muted

### Scores Seem Wrong
- [ ] Review the detailed feedback (not just the number)
- [ ] Check word count — very short answers score lower
- [ ] Note filler word frequency
- [ ] For behavioral questions, check STAR structure
- [ ] Scores are based on observable metrics, not speaking style

### Transcript Has Errors
- [ ] This is normal for speech recognition
- [ ] The system cleans up basic errors
- [ ] Speak more clearly for better recognition
- [ ] Pause between sentences
- [ ] This doesn't affect the score—content quality does

## 💡 Pro Tips for Better Scores

### For Candidates
1. **Speak clearly** — Articulate your words
2. **Use examples** — Specific examples score better than generalizations
3. **Include STAR** — For behavioral questions: Situation, Task, Action, Result
4. **Maintain pace** — 120-140 words per minute is ideal
5. **Reduce filler words** — Replace "um" with deliberate pauses
6. **Provide detail** — Longer, more complete answers score better
7. **End with conclusion** — Always state your final thought or result

### For Recruiters
1. **Set clear expectations** — Tell candidates what you're evaluating
2. **Use same questions** — Consistency allows fair comparison
3. **Review transcripts** — Numbers don't tell the whole story
4. **Consider context** — Some candidates are naturally slower speakers
5. **Manual override** — You can adjust scores after review
6. **Track patterns** — Are certain question types being answered poorly?

## 📈 Analytics Insights

### Questions That Differentiate
- Behavioral questions with STAR structure
- Technical questions specific to role
- Situational questions showing problem-solving

### Common Scoring Patterns
- **Technical roles:** Usually score higher on Communication & Problem Solving
- **People roles:** Usually score higher on Behavioral Responses & Teamwork
- **Mixed roles:** More balanced across categories

### Red Flags
- Consistent low scores (< 40) across all categories
- Very short answers (< 50 words)
- High filler word frequency (> 20%)
- Off-topic responses
- Incomplete STAR structure on behavioral questions

## 🔐 Privacy Reminders

This application:
- ✅ Processes all data in your browser
- ✅ Does NOT store audio files by default
- ✅ Does NOT send data to external servers
- ✅ Can be used offline (after initial load)
- ✅ Does NOT track or identify users
- ✅ Does NOT require login

For backend integration, you'll add:
- User authentication
- Data persistence
- Email notifications
- Recruiter dashboard
- etc.

But the core application remains privacy-focused.

## 🚀 Next Steps

### To Enhance Locally
1. **Add more questions** — Edit `INTERVIEW_QUESTIONS`
2. **Adjust scoring** — Modify `AnswerAnalyzer` methods
3. **Change colors** — Update hex values in styles
4. **Add your branding** — Insert logo and company info

### To Deploy
1. **Choose platform** — Vercel, Netlify, AWS, or your own server
2. **Upload files** — Copy HTML file or git repo
3. **Enable HTTPS** — Most platforms do this automatically
4. **Test thoroughly** — Run through interview as candidate
5. **Share link** — Send to candidates

### To Add Backend
1. **Set up Node.js API** — Express, Fastify, or your framework
2. **Create database** — PostgreSQL, MongoDB, etc.
3. **Implement endpoints** — See `DATA_SCHEMA.md`
4. **Add authentication** — JWT, OAuth, etc.
5. **Modify frontend** — Call API instead of local storage
6. **Build recruiter dashboard** — View all candidate results

## 📞 Support

For issues or questions:

1. **Check README.md** — Comprehensive documentation
2. **Review DATA_SCHEMA.md** — Technical specifications
3. **Test in different browser** — Isolate compatibility issues
4. **Check console** — Browser DevTools → Console for errors
5. **Verify microphone** — Test with other apps first

## 📄 Files Reference

```
index.html          ← Open this to start
ai-interviewer.jsx  ← React component for integration
README.md          ← Full documentation
DATA_SCHEMA.md     ← Database & API specs
QUICKSTART.md      ← This file
```

---

**Ready to go?** Open `index.html` in your browser and start your first interview!

Questions? See the full README.md for comprehensive documentation.
