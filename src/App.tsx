import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  Award, 
  Shield, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  UserPlus,
  Settings,
  RefreshCw
} from 'lucide-react';
import './App.css';

// Error boundary to handle Chrome extension errors
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error but don't break the app
    console.log('Error caught by boundary:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to continue</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mock data for demonstration - in real app this would come from the smart contract
const mockMembers = [
  { wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', reputation: 1250, role: 'Admin', upvotes: 45, downvotes: 2 },
  { wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', reputation: 890, role: 'Moderator', upvotes: 32, downvotes: 1 },
  { wallet: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS', reputation: 567, role: 'Contributor', upvotes: 28, downvotes: 3 },
  { wallet: '2xNweLHLqrxmofygh3o3u6K3qh3D3VZqgqxE8VKVfN3', reputation: 234, role: 'Contributor', upvotes: 15, downvotes: 1 },
  { wallet: '8FE27prwqkhQcJhbQqDqM7KzJqKqKqKqKqKqKqKqKqKq', reputation: 89, role: 'Member', upvotes: 8, downvotes: 0 },
];

const mockScoreboard = {
  totalMembers: 156,
  totalReputation: 15420,
  minTokenAmount: 1000000,
  voteCooldown: 3600,
  reputationMultiplier: 2,
};

function App() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [voteAmount, setVoteAmount] = useState(10);
  const [voteType, setVoteType] = useState<'upvote' | 'downvote'>('upvote');
  const [isVoting, setIsVoting] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [initialReputation, setInitialReputation] = useState(50);

  // Global error handler to catch Chrome extension errors
  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent): void => {
      // Ignore errors from Chrome extensions
      if (event instanceof ErrorEvent && event.error && event.error.message && 
          (event.error.message.includes('chrome-extension') || 
           event.error.message.includes('Cannot read properties of null'))) {
        event.preventDefault();
        console.log('Ignored Chrome extension error:', event.error);
        return;
      }
      
      if (event instanceof PromiseRejectionEvent && event.reason && event.reason.message && 
          (event.reason.message.includes('chrome-extension') || 
           event.reason.message.includes('Cannot read properties of null'))) {
        event.preventDefault();
        console.log('Ignored Chrome extension rejection:', event.reason);
        return;
      }
    };

    window.addEventListener('error', handleError as EventListener);
    window.addEventListener('unhandledrejection', handleError as EventListener);

    return () => {
      window.removeEventListener('error', handleError as EventListener);
      window.removeEventListener('unhandledrejection', handleError as EventListener);
    };
  }, []);

  const handleVote = async () => {
    setIsVoting(true);
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsVoting(false);
    setShowVoteModal(false);
    // In real app, this would call the smart contract
  };

  const handleRegister = async () => {
    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowRegisterModal(false);
    // In real app, this would call the smart contract
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'text-red-500 bg-red-50';
      case 'Moderator': return 'text-purple-500 bg-purple-50';
      case 'Contributor': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Shield className="w-4 h-4" />;
      case 'Moderator': return <Star className="w-4 h-4" />;
      case 'Contributor': return <Award className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reputation DAO</h1>
                <p className="text-sm text-gray-500">Community-driven reputation system</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </button>
              <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">{mockScoreboard.totalMembers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reputation</p>
                <p className="text-3xl font-bold text-gray-900">{mockScoreboard.totalReputation.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Min Tokens</p>
                <p className="text-3xl font-bold text-gray-900">{(mockScoreboard.minTokenAmount / 1000000).toFixed(1)}M</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vote Cooldown</p>
                <p className="text-3xl font-bold text-gray-900">{mockScoreboard.voteCooldown / 3600}h</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
                { id: 'members', name: 'All Members', icon: Users },
                { id: 'analytics', name: 'Analytics', icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Contributors</h2>
                <div className="space-y-3">
                  {mockMembers.map((member, index) => (
                    <motion.div
                      key={member.wallet}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.wallet.slice(0, 8)}...{member.wallet.slice(-8)}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                              {getRoleIcon(member.role)}
                              <span className="ml-1">{member.role}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{member.reputation}</p>
                          <p className="text-sm text-gray-500">Reputation</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                              setVoteType('upvote');
                              setShowVoteModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                              setVoteType('downvote');
                              setShowVoteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">All Members</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockMembers.map((member, index) => (
                    <motion.div
                      key={member.wallet}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1">{member.role}</span>
                        </span>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      <p className="font-medium text-gray-900 mb-2">
                        {member.wallet.slice(0, 8)}...{member.wallet.slice(-8)}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Reputation: {member.reputation}</span>
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="w-3 h-3 text-green-500" />
                          <span className="text-green-600">{member.upvotes}</span>
                          <ThumbsDown className="w-3 h-3 text-red-500 ml-2" />
                          <span className="text-red-600">{member.downvotes}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Reputation Distribution</h3>
                    <div className="space-y-3">
                      {[
                        { role: 'Admin', count: 3, percentage: 2 },
                        { role: 'Moderator', count: 12, percentage: 8 },
                        { role: 'Contributor', count: 45, percentage: 29 },
                        { role: 'Member', count: 96, percentage: 61 },
                      ].map((item) => (
                        <div key={item.role} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.role}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Votes Today</span>
                        <span className="text-sm font-medium text-gray-900">1,234</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">New Members This Week</span>
                        <span className="text-sm font-medium text-gray-900">23</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Reputation</span>
                        <span className="text-sm font-medium text-gray-900">98.8</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Voters</span>
                        <span className="text-sm font-medium text-gray-900">89</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vote Modal */}
      <AnimatePresence>
        {showVoteModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowVoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vote on {selectedMember.wallet.slice(0, 8)}...{selectedMember.wallet.slice(-8)}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vote Type</label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setVoteType('upvote')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                        voteType === 'upvote'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Upvote</span>
                    </button>
                    <button
                      onClick={() => setVoteType('downvote')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                        voteType === 'downvote'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>Downvote</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vote Amount</label>
                  <input
                    type="number"
                    value={voteAmount}
                    onChange={(e) => setVoteAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="1"
                    max="100"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowVoteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVote}
                    disabled={isVoting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isVoting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Voting...</span>
                      </>
                    ) : (
                      <span>Submit Vote</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowRegisterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Register as Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Reputation</label>
                  <input
                    type="number"
                    value={initialReputation}
                    onChange={(e) => setInitialReputation(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    max="1000"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Register
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

export default App; 