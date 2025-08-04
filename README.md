# Reputation DAO - Codigo DevQuest #2

A comprehensive reputation scoreboard system built on Solana for DAOs and communities. This project implements an advanced reputation tracking system with token-gated voting, role management, and anti-abuse mechanisms.

## 🏆 Features

### Core Functionality
- **Token-Gated Voting**: Users must hold minimum tokens to participate in voting
- **Reputation Tracking**: Track wallet-based reputation points for DAO members
- **Role System**: Automatic role upgrades based on reputation thresholds
- **Anti-Abuse Mechanisms**: Cooldown periods and vote limits to prevent spam
- **Leaderboards**: Real-time reputation rankings and analytics

### Advanced Features
- **Multiplier System**: Configurable reputation multipliers for different actions
- **Admin Controls**: Ability to award bonuses and reset reputations
- **Event System**: Comprehensive event tracking for transparency
- **Parameter Management**: Dynamic configuration of voting parameters

### Role Hierarchy
- **Member** (0-99 reputation): Basic community member
- **Contributor** (100-499 reputation): Active community contributor
- **Moderator** (500-999 reputation): Community moderator with enhanced privileges
- **Admin** (1000+ reputation): Full administrative access

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Rust 1.70+
- Solana CLI
- Anchor Framework

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd codigo-reputation-dao
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the smart contract**
```bash
anchor build
```

4. **Run tests**
```bash
anchor test
```

5. **Start the frontend**
```bash
npm start
```

## 🏗️ Architecture

### Smart Contract Structure

```
programs/reputation_dao/
├── src/
│   └── lib.rs          # Main program logic
├── Cargo.toml          # Dependencies
└── target/             # Build artifacts
```

### Frontend Structure

```
src/
├── App.tsx             # Main application component
├── App.css             # Custom styles
├── index.tsx           # React entry point
└── index.css           # Base styles
```

## 📋 Smart Contract Functions

### Core Functions
- `initialize_scoreboard()` - Initialize the reputation system
- `register_member()` - Register a new community member
- `vote_member()` - Vote on a member's reputation
- `reset_reputation()` - Reset a member's reputation (admin only)
- `update_scoreboard_params()` - Update system parameters (admin only)
- `award_bonus()` - Award reputation bonus (admin only)

### Security Features
- **Token Verification**: Ensures voters hold sufficient tokens
- **Cooldown System**: Prevents rapid-fire voting
- **Role-Based Access**: Different permissions for different roles
- **Event Logging**: Transparent audit trail

## 🎨 Frontend Features

### Modern UI/UX
- **Responsive Design**: Works on all device sizes
- **Real-time Updates**: Live reputation tracking
- **Smooth Animations**: Framer Motion powered interactions
- **Beautiful Design**: Modern gradient and glass morphism effects

### Interactive Components
- **Leaderboard**: Real-time reputation rankings
- **Member Cards**: Detailed member information
- **Voting Interface**: Intuitive upvote/downvote system
- **Analytics Dashboard**: Community insights and metrics

## 🧪 Testing

### Smart Contract Tests
```bash
# Run all tests
anchor test

# Run specific test file
anchor test tests/reputation-dao.ts
```

### Frontend Tests
```bash
# Run React tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📊 Test Coverage

The project includes comprehensive tests covering:

- ✅ Smart contract initialization
- ✅ Member registration
- ✅ Voting functionality (upvote/downvote)
- ✅ Token-gated access control
- ✅ Cooldown enforcement
- ✅ Role upgrades
- ✅ Admin functions
- ✅ Error handling
- ✅ Edge cases

## 🔧 Configuration

### Smart Contract Parameters
- `min_token_amount`: Minimum tokens required to vote
- `vote_cooldown`: Time between votes (seconds)
- `reputation_multiplier`: Multiplier for reputation changes

### Role Thresholds
- Member: 0-99 reputation
- Contributor: 100-499 reputation
- Moderator: 500-999 reputation
- Admin: 1000+ reputation

## 🚀 Deployment

### Local Development
```bash
# Start local validator
solana-test-validator

# Deploy to localnet
anchor deploy

# Start frontend
npm start
```

### Production Deployment
```bash
# Build for production
npm run build-frontend

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## 📈 Performance

### Smart Contract Optimizations
- Efficient PDA usage for account management
- Minimal storage requirements
- Optimized instruction processing
- Event-driven architecture for scalability

### Frontend Optimizations
- React.memo for component optimization
- Lazy loading for better performance
- Efficient state management
- Optimized bundle size

## 🔒 Security Considerations

### Smart Contract Security
- **Input Validation**: All inputs are validated
- **Access Control**: Role-based permissions
- **Reentrancy Protection**: Safe from reentrancy attacks
- **Overflow Protection**: Safe math operations

### Frontend Security
- **Input Sanitization**: All user inputs are sanitized
- **XSS Protection**: React's built-in XSS protection
- **Secure Communication**: HTTPS for all API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Codigo.ai** for the amazing AI-powered development platform
- **Superteam Nigeria** for organizing the DevQuest
- **Solana Foundation** for the excellent blockchain infrastructure
- **Anchor Framework** for simplifying Solana development

## 📞 Support

For questions or support:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation

---

**Built with ❤️ for the Solana community**

*This project was created for Codigo DevQuest #2 - DAO/Governance Track* 