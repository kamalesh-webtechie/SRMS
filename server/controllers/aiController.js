const SystemSettings = require('../models/SystemSettings');
const { OpenAI } = require('openai');

const getOpenAIClient = async () => {
    // We must explicitly select the apiKey as it is select: false in the model
    const settings = await SystemSettings.findOne().select('+aiSettings.apiKey');
    const apiKey = settings?.aiSettings?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return new OpenAI({ apiKey });
};

// Simple heuristic analysis for 'mock' provider or fallback
const mockAnalysis = (studentName, marks) => {
    let analysis = `**Performance Analysis for ${studentName} (Simulated Insight)**\n\n`;
    let totalMarks = 0;
    let maxMarks = 0;
    let weakSubjects = [];
    let strongSubjects = [];

    marks.forEach(m => {
        totalMarks += m.obtained;
        maxMarks += m.max;
        const percentage = (m.obtained / m.max) * 100;

        if (percentage < 50) weakSubjects.push(m.subject);
        if (percentage > 80) strongSubjects.push(m.subject);
    });

    const overallPercentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    analysis += `**Overall Score:** ${overallPercentage.toFixed(2)}%\n`;

    if (overallPercentage > 75) {
        analysis += `✅ **Summary:** Excellent academic performance. Maintains a strong grasp of core concepts.\n`;
    } else if (overallPercentage > 60) {
        analysis += `⚠️ **Summary:** Good performance but there is room for improvement in specific areas.\n`;
    } else {
        analysis += `❌ **Summary:** Critical attention needed. Student is struggling with fundamental concepts.\n`;
    }

    if (strongSubjects.length > 0) {
        analysis += `\n**💪 Strengths:**\nDemonstrates high proficiency in ${strongSubjects.join(', ')}.\n`;
    }

    if (weakSubjects.length > 0) {
        analysis += `\n**📉 Areas for Improvement:**\nStudent is struggling with ${weakSubjects.join(', ')}. Recommended remedial classes and focused practice on these subjects.\n`;
    }

    analysis += `\n**🤖 AI Recommendation:**\nBased on current trends, we suggest focusing on practical applications for ${weakSubjects.length > 0 ? weakSubjects[0] : 'upcoming electives'} to boost confidence.`;

    return analysis;
};

// @desc    Analyze Student Performance using AI
// @route   POST /api/ai/analyze
// @access  Private
const analyzePerformance = async (req, res) => {
    try {
        const { studentName, marks } = req.body;
        const settings = await SystemSettings.findOne();
        const provider = settings?.aiSettings?.provider || 'simulation';

        if (provider === 'openai') {
            console.log(`AI: Generating OpenAI analysis for ${studentName} (${marks.length} marks)`);
            const openai = await getOpenAIClient();
            if (!openai) {
                console.warn("AI: OpenAI Client initialization failed (Missing Key). Falling back to simulation.");
                return res.status(200).json({ analysis: mockAnalysis(studentName, marks) });
            }

            if (marks.length === 0) {
                return res.status(200).json({ analysis: `**No performance data found for ${studentName}.**\n\nPlease ensure your results have been published by the administration before generating a detailed analysis.` });
            }

            const prompt = `Analyze the academic performance of ${studentName} based on the following marks:
            ${JSON.stringify(marks, null, 2)}
            
            Provide a professional analysis in Markdown format including:
            1. Overall Score & Summary
            2. Strengths
            3. Areas for Improvement
            4. AI Recommendations for future growth.
            Use emojis for visual clarity. Keeping the tone professional yet encouraging.
            Return ONLY the markdown content.`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: "You are an expert academic advisor." }, { role: "user", content: prompt }],
                temperature: 0.7,
            });

            console.log(`AI: OpenAI analysis successful for ${studentName}`);
            return res.status(200).json({ analysis: response.choices[0].message.content });
        }

        // Fallback to simulation
        console.log(`AI: Using simulation/fallback for ${studentName}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.status(200).json({ analysis: mockAnalysis(studentName, marks) });

    } catch (error) {
        console.error("AI Analysis Critical Error:", error.message);
        // ABSOLUTELY fallback to simulation here to prevent UI error
        try {
            const fallback = mockAnalysis(req.body.studentName, req.body.marks || []);
            return res.status(200).json({ 
                analysis: `**Note: OpenAI is currently unavailable. Using heuristic analysis fallback.**\n\n${fallback}`,
                isFallback: true 
            });
        } catch (innerError) {
             res.status(500).json({ message: 'AI Analysis totally failed. Please contact support.' });
        }
    }
};

// AI assists only in column-to-field understanding
const mapImportHeaders = async (req, res) => {
    try {
        const { headers } = req.body;
        const studentFields = [
            { key: 'name', labels: ['name', 'student name', 'full name', 'candidate name'] },
            { key: 'email', labels: ['email', 'email id', 'email address', 'mail'] },
            { key: 'registerNumber', labels: ['register number', 'reg no', 'enrollment', 'reg no.'] },
            { key: 'rollNumber', labels: ['roll number', 'roll no', 'class roll'] },
            { key: 'department', labels: ['department', 'dept', 'branch', 'course'] },
            { key: 'section', labels: ['section', 'sec', 'class section'] },
            { key: 'batch', labels: ['batch', 'year of admission', 'academic year', 'session'] },
            { key: 'contactNumber', labels: ['contact number', 'phone', 'mobile'] },
            { key: 'dob', labels: ['dob', 'date of birth', 'birthday'] },
            { key: 'guardianName', labels: ['guardian name', 'father name', 'parent name'] },
            { key: 'guardianContact', labels: ['guardian contact', 'parent contact', 'guardian phone'] },
            { key: 'address', labels: ['address', 'permanent address'] },
            { key: 'bloodGroup', labels: ['blood group', 'bloodgroup', 'bg'] }
        ];

        const settings = await SystemSettings.findOne();
        const provider = settings?.aiSettings?.provider || 'simulation';

        if (provider === 'openai') {
            const openai = await getOpenAIClient();
            if (openai) {
                const prompt = `Map these CSV headers to the most appropriate database field keys.
                Headers: ${headers.join(', ')}
                Available Field Keys: ${studentFields.map(f => f.key).join(', ')}
                
                Return a JSON object only where keys are original headers and values are the matching database keys.`;

                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                });

                const mapping = JSON.parse(response.choices[0].message.content);
                return res.status(200).json({
                    mapping,
                    confidence: Object.keys(mapping).reduce((acc, k) => ({ ...acc, [k]: 0.95 }), {}),
                    availableFields: studentFields.map(f => ({ key: f.key, label: f.key.charAt(0).toUpperCase() + f.key.slice(1).replace(/([A-Z])/g, ' $1') }))
                });
            }
        }

        // Heuristic fallback
        let mapping = {};
        let confidence = {};
        headers.forEach(header => {
            const lowerHeader = header.toLowerCase().trim();
            studentFields.forEach(field => {
                field.labels.forEach(label => {
                    if (lowerHeader.includes(label) || label.includes(lowerHeader)) {
                        mapping[header] = field.key;
                        confidence[header] = 0.8;
                    }
                });
            });
        });

        res.status(200).json({
            mapping,
            confidence,
            availableFields: studentFields.map(f => ({ key: f.key, label: f.key.charAt(0).toUpperCase() + f.key.slice(1).replace(/([A-Z])/g, ' $1') }))
        });

    } catch (error) {
        console.error("AI Header Mapping Failed", error);
        res.status(500).json({ message: 'AI Header Mapping Failed' });
    }
};

module.exports = {
    analyzePerformance,
    mapImportHeaders
};
