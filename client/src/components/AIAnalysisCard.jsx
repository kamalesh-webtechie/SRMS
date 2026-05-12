import { useState } from 'react';
import { Sparkles, Loader2, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

const AIAnalysisCard = ({ studentName, academicHistory }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        setExpanded(true);
        try {
            // Prepare data for AI
            // Flatten subjects from all semesters to find trends
            const allMarks = [];
            const history = academicHistory || [];
            history.forEach(sem => {
                sem.subjects.forEach(sub => {
                    // Convert grade to pseudo-marks if we don't have raw marks handy
                    // Or if we fixed the backend to return marks, better.
                    // For now assuming we just send grades/stats
                    // Actually, let's send what we have.
                    allMarks.push({
                        semester: sem.semester,
                        subject: sub.subjectName,
                        grade: sub.grade,
                        credits: sub.credits,
                        // Pseudo obtained for the heurstic
                        obtained: gradeToMarks(sub.grade),
                        max: 100
                    });
                });
            });

            const { data } = await api.post('/ai/analyze', {
                studentName,
                marks: allMarks
            });

            setAnalysis(data.analysis);
            setHasFetched(true);
        } catch (error) {
            console.error(error);
            setAnalysis("Failed to generate analysis. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const gradeToMarks = (grade) => {
        const map = { 'O': 95, 'A+': 85, 'A': 75, 'B+': 65, 'B': 55, 'C': 45, 'P': 40, 'F': 20 };
        return map[grade] || 50;
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg shadow-xl text-white overflow-hidden border border-indigo-700/50">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Bot className="h-6 w-6 text-cyan-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Performance Insight</h3>
                            <p className="text-indigo-200 text-sm">Powered by Advanced Analytics</p>
                        </div>
                    </div>

                    {!hasFetched ? (
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 font-medium"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                            <span>Generate Analysis</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-indigo-200 hover:text-white transition-colors"
                        >
                            {expanded ? <ChevronUp /> : <ChevronDown />}
                        </button>
                    )}
                </div>

                {/* Analysis Content */}
                {expanded && (
                    <div className={`mt-6 pt-6 border-t border-white/10 ${loading ? 'opacity-50' : 'animate-fade-in'}`}>
                        {loading ? (
                            <div className="space-y-3">
                                <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
                                <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse"></div>
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none text-indigo-50">
                                {analysis ? analysis.split('\n').map((line, i) => (
                                    <p key={i} className="mb-2 leading-relaxed">
                                        {line.split('**').map((part, j) =>
                                            j % 2 === 1 ? <strong key={j} className="text-cyan-300">{part}</strong> : part
                                        )}
                                    </p>
                                )) : (
                                    <p className="text-indigo-300 italic">No analysis data available.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnalysisCard;
