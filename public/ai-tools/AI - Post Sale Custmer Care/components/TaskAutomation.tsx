import React, { useState } from 'react';
import { Sale, Task, AutomationRule } from '../types';
import { generateTaskMessage } from '../services/geminiService';
import { Gift, Calendar, CheckCircle, Mail, Sparkles, Loader2, Plus, Settings, ListTodo, Trash2, Smartphone } from 'lucide-react';

interface TaskAutomationProps {
  sales: Sale[];
}

const DEFAULT_RULES: AutomationRule[] = [
  { id: 'r1', name: 'Birthday Greeting', triggerDelay: 0, promptIdea: 'Wish them a happy birthday and offer a free car wash.', isActive: true },
  { id: 'r2', name: '7-Day Follow Up', triggerDelay: 7, promptIdea: 'Check if they have any questions about features or buttons.', isActive: true },
  { id: 'r3', name: '1-Year Anniversary', triggerDelay: 365, promptIdea: 'Celebrate their 1 year with the car, ask about mileage for trade-in.', isActive: true },
];

const TaskAutomation: React.FC<TaskAutomationProps> = ({ sales }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'rules'>('queue');
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES);
  
  // Rule Form State
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDelay, setNewRuleDelay] = useState(30);
  const [newRulePrompt, setNewRulePrompt] = useState('');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<'email' | 'sms'>('email');

  // Generate tasks based on Active Rules
  // In a real app, this would check dates. Here we mock it by mapping rules to random sales.
  const tasks: Task[] = React.useMemo(() => {
    const t: Task[] = [];
    sales.slice(0, 15).forEach((sale, i) => {
        // Assign a random active rule to this sale for demo purposes
        const activeRules = rules.filter(r => r.isActive);
        if (activeRules.length === 0) return;
        
        const rule = activeRules[i % activeRules.length];
        
        t.push({
            id: `task-${sale.id}-${rule.id}`,
            ruleId: rule.id,
            ruleName: rule.name,
            customerName: `${sale.customer.firstName} ${sale.customer.lastName}`,
            vehicleName: `${sale.vehicle.year} ${sale.vehicle.make} ${sale.vehicle.model}`,
            dueDate: new Date(new Date().setDate(new Date().getDate() + (i % 5))).toLocaleDateString(), // Mock due date
            status: 'PENDING',
            contextData: sale,
            customPrompt: rule.promptIdea
        });
    });
    return t;
  }, [sales, rules]);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName || !newRulePrompt) return;
    const newRule: AutomationRule = {
        id: `r${Date.now()}`,
        name: newRuleName,
        triggerDelay: newRuleDelay,
        promptIdea: newRulePrompt,
        isActive: true
    };
    setRules([...rules, newRule]);
    setNewRuleName('');
    setNewRuleDelay(30);
    setNewRulePrompt('');
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleGenerate = async (task: Task, selectedChannel: 'email' | 'sms') => {
    setSelectedTask(task);
    setChannel(selectedChannel);
    setLoading(true);
    setGeneratedContent('');
    
    const msg = await generateTaskMessage(
      task.ruleName,
      task.customerName,
      task.vehicleName,
      task.contextData.notes || 'No specific notes.',
      task.customPrompt,
      selectedChannel
    );
    
    setGeneratedContent(msg);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* Header Tabs */}
      <div className="flex items-center space-x-1 bg-slate-200 p-1 rounded-lg w-fit">
        <button 
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'queue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <ListTodo size={16} />
            Task Queue
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
        </button>
        <button 
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'rules' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <Settings size={16} />
            Schedules & Ideas
        </button>
      </div>

      {activeTab === 'queue' ? (
        <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left Column: Task List */}
            <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">Pending Actions</h2>
                <p className="text-xs text-slate-500">Auto-generated from your schedules</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {tasks.map((task) => (
                    <div 
                    key={task.id}
                    onClick={() => handleGenerate(task, channel)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedTask?.id === task.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-100 hover:border-blue-300'
                    }`}
                    >
                    <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">
                            {task.ruleName}
                        </span>
                        <span className="text-xs text-slate-400">{task.dueDate}</span>
                    </div>
                    <h4 className="font-semibold text-slate-800">{task.customerName}</h4>
                    <p className="text-xs text-slate-500 truncate">{task.vehicleName}</p>
                    </div>
                ))}
                </div>
            </div>

            {/* Right Column: AI Workbench */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-8 flex flex-col">
                {!selectedTask ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Sparkles size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a task to generate a personalized message</p>
                </div>
                ) : (
                <>
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">
                                {selectedTask.ruleName}
                            </h2>
                            <p className="text-slate-500">
                                Goal: <span className="italic">{selectedTask.customPrompt}</span>
                            </p>
                        </div>
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                            <button 
                                onClick={() => handleGenerate(selectedTask, 'email')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${channel === 'email' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                            >
                                <Mail size={14} /> Email
                            </button>
                            <button 
                                onClick={() => handleGenerate(selectedTask, 'sms')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${channel === 'sms' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                            >
                                <Smartphone size={14} /> SMS
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            AI Generated Draft ({channel === 'sms' ? 'Short Text' : 'Email'})
                        </label>
                        <div className="w-full h-64 bg-slate-50 rounded-xl border border-slate-200 p-6 font-medium text-slate-700 text-lg leading-relaxed relative overflow-y-auto">
                            {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
                                <div className="flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                <span className="text-sm font-semibold text-blue-600">Gemini is writing...</span>
                                </div>
                            </div>
                            ) : (
                            generatedContent || "Click the task to generate content..."
                            )}
                        </div>
                        {channel === 'sms' && generatedContent && (
                            <div className={`text-xs mt-2 font-medium ${generatedContent.length > 160 ? 'text-red-500' : 'text-green-600'}`}>
                                {generatedContent.length} / 160 chars
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                    <div className="flex gap-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><CheckCircle size={14}/> Context Aware</span>
                        <span className="flex items-center gap-1"><CheckCircle size={14}/> Tone Adjusted</span>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleGenerate(selectedTask, channel)}
                            disabled={loading}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Regenerate
                        </button>
                        <button 
                            disabled={loading || !generatedContent}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => alert(`Simulating sending ${channel.toUpperCase()} to ${selectedTask.customerName}...`)}
                        >
                            {channel === 'sms' ? <Smartphone size={18} /> : <Mail size={18} />}
                            {channel === 'sms' ? 'Send Text' : 'Send Email'}
                        </button>
                    </div>
                    </div>
                </>
                )}
            </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Rule List */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Automation Schedules</h3>
                    <p className="text-slate-500">Define when tasks should be created.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {rules.map(rule => (
                        <div key={rule.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-start bg-slate-50/50 hover:bg-white transition-colors">
                            <div>
                                <h4 className="font-bold text-slate-800">{rule.name}</h4>
                                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                        <Calendar size={14} /> {rule.triggerDelay} days after sale
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-slate-500 italic">
                                    "AI Prompt: {rule.promptIdea}"
                                </p>
                            </div>
                            <button 
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-2"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Rule Form */}
            <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-blue-600"/>
                    Create New Automation
                </h3>
                <form onSubmit={handleAddRule} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Automation Name</label>
                        <input 
                            required
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="e.g. 6-Month Service Reminder"
                            value={newRuleName}
                            onChange={(e) => setNewRuleName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trigger Delay (Days after sale)</label>
                        <input 
                            required
                            type="number"
                            min="0"
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={newRuleDelay}
                            onChange={(e) => setNewRuleDelay(parseInt(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">AI Prompt / Idea</label>
                        <textarea 
                            required
                            rows={4}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="What should the AI talk about? e.g. 'Remind them to rotate their tires and ask how the car is driving.'"
                            value={newRulePrompt}
                            onChange={(e) => setNewRulePrompt(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                    >
                        Save Automation
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default TaskAutomation;